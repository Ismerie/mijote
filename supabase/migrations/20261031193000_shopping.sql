-- J4 (#32) : la liste de courses. Elle est calculée par l'app depuis le menu affiché
-- (modèle de données : liste calculée, états stockés à part). La base ne garde que :
-- - les lignes cochées (shopping_check), partagées entre les membres du foyer ;
-- - les fournées déjà achetées (menu_dish.bought_at), qui sortent de la liste après « Courses terminées ».

-- ---------------------------------------------------------------------------
-- Fournées achetées
-- ---------------------------------------------------------------------------

-- Vide tant que la fournée est à acheter. Une fournée reportée (carried_over) n'est jamais à acheter.
alter table public.menu_dish add column bought_at timestamptz;

-- ---------------------------------------------------------------------------
-- Lignes cochées
-- ---------------------------------------------------------------------------

-- Une ligne de la liste = un ingrédient et une « mesure » : les quantités en g et en kg s'additionnent
-- (mass), comme ml, cl et l (volume) ; cuillères et pièces restent à part.
create table public.shopping_check (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  menu_id uuid not null,
  ingredient_id uuid not null,
  measure text not null check (measure in ('mass', 'volume', 'tsp', 'tbsp', 'piece')),
  created_at timestamptz not null default now(),
  -- Cocher deux fois la même ligne (deux téléphones en même temps) ne crée qu'une coche.
  unique (menu_id, ingredient_id, measure),
  foreign key (menu_id, household_id) references public.menu (id, household_id) on delete cascade,
  foreign key (ingredient_id, household_id) references public.ingredient (id, household_id) on delete cascade
);

create index shopping_check_ingredient_id_idx on public.shopping_check (ingredient_id);

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------

alter table public.shopping_check enable row level security;

revoke all on public.shopping_check from anon;

-- Cocher = créer la ligne, décocher = la supprimer : pas de modification.
create policy "shopping checks readable by their household"
  on public.shopping_check for select to authenticated
  using ((select public.is_member(household_id)));

create policy "shopping checks insertable by their household"
  on public.shopping_check for insert to authenticated
  with check ((select public.is_member(household_id)));

create policy "shopping checks deletable by their household"
  on public.shopping_check for delete to authenticated
  using ((select public.is_member(household_id)));

-- ---------------------------------------------------------------------------
-- « Courses terminées »
-- ---------------------------------------------------------------------------

-- Les fournées à acheter du menu sont marquées achetées et les coches sont effacées : la liste se vide.
-- Un plat ajouté ensuite (nouvelle fournée, bought_at vide) fait apparaître seulement ses ingrédients.
-- security invoker, comme les autres fonctions : les règles d'accès s'appliquent.
create function public.finish_shopping(p_menu_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- La règle d'accès cache les menus des autres foyers : c'est comme introuvable.
  if not exists (select 1 from public.menu where id = p_menu_id) then
    raise exception 'menu_not_found';
  end if;

  update public.menu_dish
  set bought_at = now()
  where menu_id = p_menu_id and not carried_over and bought_at is null;

  delete from public.shopping_check where menu_id = p_menu_id;
end;
$$;

revoke execute on function public.finish_shopping(uuid) from public, anon;
grant execute on function public.finish_shopping(uuid) to authenticated;
