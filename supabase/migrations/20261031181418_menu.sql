-- J3 (#28) : le menu du foyer. Un menu couvre une période qui commence le jour des courses ;
-- on y ajoute des plats (fournées, menu_dish), dont les portions sont découpées en repas (meal).
-- Modèle de données, décisions 6, 7 et 8 : une fournée est cuisinée une fois (cooked_at),
-- puis ses repas sont mangés un par un (eaten_at).
-- Même principe d'accès que les plats (#25) : chaque table porte household_id, on ne voit et ne modifie
-- une ligne que si on est membre de son foyer, et des clés étrangères composées empêchent de mélanger deux foyers.

-- ---------------------------------------------------------------------------
-- Réglages du foyer
-- ---------------------------------------------------------------------------

-- Jour des courses (0 = lundi … 6 = dimanche) : chaque menu commence ce jour-là.
-- Durée par défaut d'un menu, proposée quand on prépare le suivant (#30).
-- Valeurs par défaut : samedi et 2 semaines, comme sur la maquette.
alter table public.household
  add column shopping_day smallint not null default 5 check (shopping_day between 0 and 6),
  add column menu_length_days smallint not null default 14 check (menu_length_days in (7, 14));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Moments facultatifs d'un repas : petit-déj, midi, goûter, soir. Les noms affichés sont dans le code de l'app.
create type public.meal_slot as enum ('breakfast', 'lunch', 'snack', 'dinner');

create table public.menu (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  start_date date not null,
  length_days smallint not null check (length_days in (7, 14)),
  created_at timestamptz not null default now(),
  -- Deux menus du même foyer ne commencent pas le même jour.
  unique (household_id, start_date),
  unique (id, household_id)
);

-- Une fournée : un plat ajouté au menu, cuisiné une fois. Ajouter un plat × 2 crée deux fournées.
create table public.menu_dish (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  menu_id uuid not null,
  dish_id uuid not null,
  -- Ordre d'ajout dans le menu : donne l'ordre des cartes et les numéros « Lasagnes (1) », « Lasagnes (2) ».
  position integer not null default 0,
  -- Moment où le plat a été cuisiné, vide tant qu'il est « à cuisiner ».
  cooked_at timestamptz,
  -- Reporté depuis le menu précédent (#30) : ne compte pas dans les courses.
  carried_over boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, household_id),
  foreign key (menu_id, household_id) references public.menu (id, household_id) on delete cascade,
  -- restrict : un plat n'est jamais vraiment supprimé (archived_at), il reste lisible dans les menus.
  foreign key (dish_id, household_id) references public.dish (id, household_id) on delete restrict
);

create index menu_dish_menu_id_idx on public.menu_dish (menu_id, position);
create index menu_dish_dish_id_idx on public.menu_dish (dish_id);

-- Un repas découpé dans une fournée : ses portions, son jour et son moment facultatifs, et la case « mangé ».
create table public.meal (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  menu_dish_id uuid not null,
  servings smallint not null check (servings between 1 and 50),
  -- Jour du menu où le repas est placé (#29), vide = « À placer ».
  date date,
  slot public.meal_slot,
  eaten_at timestamptz,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (menu_dish_id, household_id) references public.menu_dish (id, household_id) on delete cascade
);

create index meal_menu_dish_id_idx on public.meal (menu_dish_id, position);

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------

alter table public.menu enable row level security;
alter table public.menu_dish enable row level security;
alter table public.meal enable row level security;

revoke all on public.menu, public.menu_dish, public.meal from anon;

create policy "menus readable by their household"
  on public.menu for select to authenticated
  using ((select public.is_member(household_id)));

create policy "menus insertable by their household"
  on public.menu for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "menus updatable by their household"
  on public.menu for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

-- Pas de suppression de menu : les anciens menus restent consultables (#30).

create policy "menu dishes readable by their household"
  on public.menu_dish for select to authenticated
  using ((select public.is_member(household_id)));

create policy "menu dishes insertable by their household"
  on public.menu_dish for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "menu dishes updatable by their household"
  on public.menu_dish for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

-- « Retirer ce plat du menu » supprime la fournée et ses repas.
create policy "menu dishes deletable by their household"
  on public.menu_dish for delete to authenticated
  using ((select public.is_member(household_id)));

create policy "meals readable by their household"
  on public.meal for select to authenticated
  using ((select public.is_member(household_id)));

create policy "meals insertable by their household"
  on public.meal for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "meals updatable by their household"
  on public.meal for update to authenticated
  using ((select public.is_member(household_id)))
  with check ((select public.is_member(household_id)));

create policy "meals deletable by their household"
  on public.meal for delete to authenticated
  using ((select public.is_member(household_id)));

-- ---------------------------------------------------------------------------
-- Fonctions métier
-- ---------------------------------------------------------------------------
-- Toutes en security invoker, comme save_dish (#25) : elles tournent avec les droits de la personne
-- connectée, donc les règles d'accès ci-dessus s'appliquent ; elles regroupent les écritures
-- dans une transaction et portent les règles métier.

-- Ajoute des plats au menu, en une seule fois (#28).
-- p_dish_ids : un id par fournée, dans l'ordre ; Lasagnes × 2 = l'id des lasagnes deux fois.
-- p_menu_id null : premier menu du foyer, créé ici avec p_start_date et p_length_days
-- (l'app calcule le dernier jour des courses passé).
-- Chaque fournée est découpée en repas de « nombre de personnes » portions, le reste fait un repas à part :
-- 5 portions à 2 → 2 + 2 + 1. Renvoie l'id du menu.
create function public.add_dishes_to_menu(
  p_household_id uuid,
  p_menu_id uuid,
  p_start_date date,
  p_length_days smallint,
  p_dish_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_menu_id uuid := p_menu_id;
  v_people smallint;
  v_position integer;
  v_dish_id uuid;
  v_servings smallint;
  v_menu_dish_id uuid;
  v_left integer;
  v_meal_position smallint;
begin
  if not public.is_member(p_household_id) then
    raise exception 'access_denied';
  end if;

  select people_count into v_people from public.household where id = p_household_id;

  if v_menu_id is null then
    -- Deux ajouts simultanés créent le même menu une seule fois (unique household_id, start_date).
    insert into public.menu (household_id, start_date, length_days)
    values (p_household_id, p_start_date, p_length_days)
    on conflict (household_id, start_date) do nothing;

    select id into v_menu_id from public.menu
    where household_id = p_household_id and start_date = p_start_date;
  elsif not exists (select 1 from public.menu where id = v_menu_id and household_id = p_household_id) then
    raise exception 'menu_not_found';
  end if;

  select coalesce(max(position), 0) into v_position from public.menu_dish where menu_id = v_menu_id;

  foreach v_dish_id in array coalesce(p_dish_ids, '{}')
  loop
    select servings into v_servings from public.dish
    where id = v_dish_id and household_id = p_household_id and archived_at is null;

    if v_servings is null then
      raise exception 'dish_not_found';
    end if;

    v_position := v_position + 1;
    insert into public.menu_dish (household_id, menu_id, dish_id, position)
    values (p_household_id, v_menu_id, v_dish_id, v_position)
    returning id into v_menu_dish_id;

    v_left := v_servings;
    v_meal_position := 0;
    while v_left > 0 loop
      insert into public.meal (household_id, menu_dish_id, servings, position)
      values (p_household_id, v_menu_dish_id, least(v_left, v_people), v_meal_position);
      v_left := v_left - v_people;
      v_meal_position := v_meal_position + 1;
    end loop;
  end loop;

  return v_menu_id;
end;
$$;

-- La case ronde d'une fournée, à trois états (#28) :
-- 'to_cook' : pas cuisiné, aucun repas mangé ;
-- 'cooked' : cuisiné maintenant (ou garde sa date s'il l'était déjà) ;
-- 'eaten' : cuisiné et tous ses repas mangés.
create function public.set_menu_dish_state(p_menu_dish_id uuid, p_state text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_state not in ('to_cook', 'cooked', 'eaten') then
    raise exception 'invalid_state';
  end if;

  update public.menu_dish
  set cooked_at = case when p_state = 'to_cook' then null else coalesce(cooked_at, now()) end
  where id = p_menu_dish_id;

  -- La règle d'accès cache les fournées des autres foyers : rien n'est modifié, c'est comme introuvable.
  if not found then
    raise exception 'menu_dish_not_found';
  end if;

  if p_state = 'to_cook' then
    update public.meal set eaten_at = null where menu_dish_id = p_menu_dish_id;
  elsif p_state = 'eaten' then
    update public.meal set eaten_at = coalesce(eaten_at, now()) where menu_dish_id = p_menu_dish_id;
  end if;
end;
$$;

-- La case carrée « mangé » d'un repas (#28, #29). Manger un repas d'un plat pas encore cuisiné
-- marque aussi le plat comme cuisiné.
create function public.set_meal_eaten(p_meal_id uuid, p_eaten boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_menu_dish_id uuid;
begin
  update public.meal
  set eaten_at = case when p_eaten then coalesce(eaten_at, now()) else null end
  where id = p_meal_id
  returning menu_dish_id into v_menu_dish_id;

  if v_menu_dish_id is null then
    raise exception 'meal_not_found';
  end if;

  if p_eaten then
    update public.menu_dish set cooked_at = now() where id = v_menu_dish_id and cooked_at is null;
  end if;
end;
$$;

revoke execute on function
  public.add_dishes_to_menu(uuid, uuid, date, smallint, uuid[]),
  public.set_menu_dish_state(uuid, text),
  public.set_meal_eaten(uuid, boolean)
from public, anon;

grant execute on function
  public.add_dishes_to_menu(uuid, uuid, date, smallint, uuid[]),
  public.set_menu_dish_state(uuid, text),
  public.set_meal_eaten(uuid, boolean)
to authenticated;
