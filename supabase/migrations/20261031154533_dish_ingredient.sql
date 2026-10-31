-- J2 (#25) : les plats du foyer, le catalogue d'ingrédients et les lignes d'ingrédients d'un plat.
-- Même principe que le foyer (#4) : on ne voit et ne modifie une ligne que si on est membre de son foyer.
-- Chaque table porte household_id, y compris dish_ingredient : les règles d'accès restent une seule
-- ligne (is_member), et des clés étrangères composées empêchent de mélanger deux foyers.

-- ---------------------------------------------------------------------------
-- Listes fermées
-- ---------------------------------------------------------------------------

-- Unités d'une ligne de recette, par dimension : masse, volume, pièce (modèle de données, décision 1).
-- Les noms affichés (« g », « c. à s. », « pièce »…) sont dans le code de l'app.
create type public.unit as enum ('g', 'kg', 'ml', 'cl', 'l', 'tsp', 'tbsp', 'piece');

-- Rayons du magasin, liste fixe en V1.
create type public.aisle as enum ('produce', 'meat', 'dairy', 'grocery', 'frozen', 'other');

-- Comment on achète un ingrédient : au poids ou au volume, à la pièce, ou en paquet (boîte de 400 g…).
create type public.purchase_mode as enum ('weight', 'piece', 'pack');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.dish (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  -- Portions que donne la recette, toujours les mêmes (décision 7).
  servings smallint not null check (servings between 1 and 50),
  recipe text not null default '' check (length(recipe) <= 10000),
  -- Macros par portion, facultatives.
  kcal numeric(6, 1) check (kcal >= 0),
  protein numeric(5, 1) check (protein >= 0),
  carbs numeric(5, 1) check (carbs >= 0),
  fat numeric(5, 1) check (fat >= 0),
  -- Suppression douce : le plat disparaît de Plats mais reste lisible dans les menus où il est déjà.
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  -- Cible des clés étrangères composées de dish_ingredient.
  unique (id, household_id)
);

create index dish_household_id_idx on public.dish (household_id);

create table public.ingredient (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  aisle public.aisle not null default 'other',
  purchase_mode public.purchase_mode not null default 'weight',
  -- Seulement pour un achat en paquet : nom (« boîte ») et contenance (400 g).
  pack_name text check (length(trim(pack_name)) between 1 and 30),
  pack_size numeric(8, 2) check (pack_size > 0),
  pack_unit public.unit,
  -- Jamais dans la liste de courses (#26, effet testé avec les courses en J4).
  always_in_stock boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, household_id),
  constraint ingredient_pack_complete check (
    purchase_mode <> 'pack' or (pack_name is not null and pack_size is not null and pack_unit is not null)
  )
);

-- Un seul « Tomates » par foyer, quelle que soit la casse : c'est ce qui permet de retrouver
-- un ingrédient par son nom quand on le tape dans un plat.
create unique index ingredient_household_name_idx on public.ingredient (household_id, lower(name));

create table public.dish_ingredient (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  dish_id uuid not null,
  ingredient_id uuid not null,
  -- Facultative : « sel, poivre » s'écrivent sans quantité.
  quantity numeric(8, 2) check (quantity > 0),
  unit public.unit not null default 'g',
  position smallint not null default 0,
  -- Le plat et l'ingrédient doivent appartenir au même foyer que la ligne.
  foreign key (dish_id, household_id) references public.dish (id, household_id) on delete cascade,
  -- restrict : on ne supprime pas un ingrédient utilisé dans un plat (#26).
  foreign key (ingredient_id, household_id) references public.ingredient (id, household_id) on delete restrict
);

create index dish_ingredient_dish_id_idx on public.dish_ingredient (dish_id, position);
create index dish_ingredient_ingredient_id_idx on public.dish_ingredient (ingredient_id);

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------

alter table public.dish enable row level security;
alter table public.ingredient enable row level security;
alter table public.dish_ingredient enable row level security;

revoke all on public.dish, public.ingredient, public.dish_ingredient from anon;

-- Plats : tout membre lit, crée et modifie. Pas de règle de suppression : un plat s'archive (archived_at).
create policy "dishes readable by their household"
  on public.dish for select to authenticated
  using ((select public.is_member(household_id)));

create policy "dishes insertable by their household"
  on public.dish for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "dishes updatable by their household"
  on public.dish for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

-- Ingrédients : tout membre lit, crée, modifie et supprime (la clé étrangère refuse s'il est utilisé).
create policy "ingredients readable by their household"
  on public.ingredient for select to authenticated
  using ((select public.is_member(household_id)));

create policy "ingredients insertable by their household"
  on public.ingredient for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "ingredients updatable by their household"
  on public.ingredient for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

create policy "ingredients deletable by their household"
  on public.ingredient for delete to authenticated
  using ((select public.is_member(household_id)));

-- Lignes d'ingrédients : réécrites à chaque enregistrement du plat, d'où la suppression.
create policy "dish ingredients readable by their household"
  on public.dish_ingredient for select to authenticated
  using ((select public.is_member(household_id)));

create policy "dish ingredients insertable by their household"
  on public.dish_ingredient for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "dish ingredients updatable by their household"
  on public.dish_ingredient for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

create policy "dish ingredients deletable by their household"
  on public.dish_ingredient for delete to authenticated
  using ((select public.is_member(household_id)));

-- ---------------------------------------------------------------------------
-- Enregistrer un plat avec ses ingrédients, en une seule opération
-- ---------------------------------------------------------------------------

-- Crée (p_dish_id null) ou modifie un plat, puis remplace toutes ses lignes d'ingrédients.
-- p_lines : [{ "name": "Tomates", "aisle": "produce", "quantity": 500, "unit": "g" }, …], dans l'ordre affiché.
-- Un nom inconnu du foyer crée l'ingrédient au fil de l'eau (rayon donné, sinon « other ») ;
-- un nom connu, quelle que soit la casse, réutilise l'ingrédient existant.
-- security invoker : la fonction tourne avec les droits de la personne connectée, donc les règles
-- d'accès ci-dessus s'appliquent à chaque lecture et écriture. Elle ne fait que regrouper les
-- écritures dans une transaction : si une ligne échoue, rien n'est enregistré.
create function public.save_dish(
  p_household_id uuid,
  p_dish_id uuid,
  p_name text,
  p_servings smallint,
  p_recipe text,
  p_kcal numeric,
  p_protein numeric,
  p_carbs numeric,
  p_fat numeric,
  p_lines jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_dish_id uuid;
  v_line jsonb;
  v_position smallint := 0;
  v_ingredient_id uuid;
begin
  if not public.is_member(p_household_id) then
    raise exception 'access_denied';
  end if;

  if p_dish_id is null then
    insert into public.dish (household_id, name, servings, recipe, kcal, protein, carbs, fat)
    values (p_household_id, trim(p_name), p_servings, coalesce(p_recipe, ''), p_kcal, p_protein, p_carbs, p_fat)
    returning id into v_dish_id;
  else
    update public.dish
    set name = trim(p_name), servings = p_servings, recipe = coalesce(p_recipe, ''),
        kcal = p_kcal, protein = p_protein, carbs = p_carbs, fat = p_fat
    where id = p_dish_id and household_id = p_household_id and archived_at is null
    returning id into v_dish_id;

    if v_dish_id is null then
      raise exception 'dish_not_found';
    end if;

    delete from public.dish_ingredient where dish_id = v_dish_id;
  end if;

  for v_line in select value from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb))
  loop
    -- « do update » sans rien changer : renvoie l'id que l'ingrédient soit nouveau ou déjà connu.
    insert into public.ingredient (household_id, name, aisle)
    values (
      p_household_id,
      trim(v_line ->> 'name'),
      coalesce((v_line ->> 'aisle')::public.aisle, 'other')
    )
    on conflict (household_id, lower(name)) do update set household_id = excluded.household_id
    returning id into v_ingredient_id;

    insert into public.dish_ingredient (household_id, dish_id, ingredient_id, quantity, unit, position)
    values (
      p_household_id,
      v_dish_id,
      v_ingredient_id,
      (v_line ->> 'quantity')::numeric,
      coalesce((v_line ->> 'unit')::public.unit, 'g'),
      v_position
    );

    v_position := v_position + 1;
  end loop;

  return v_dish_id;
end;
$$;

revoke execute on function
  public.save_dish(uuid, uuid, text, smallint, text, numeric, numeric, numeric, numeric, jsonb)
from public, anon;

grant execute on function
  public.save_dish(uuid, uuid, text, smallint, text, numeric, numeric, numeric, numeric, jsonb)
to authenticated;
