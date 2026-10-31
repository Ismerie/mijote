-- J3 (#29) : placer les repas sur les jours du menu, les séparer et les retirer.
-- Fonctions en security invoker, comme celles du menu (#28) : les règles d'accès du foyer s'appliquent.

-- Place un repas sur un jour et un moment, tous deux facultatifs (null = « À placer », « Aucun »).
-- Le jour doit faire partie de la période du menu.
create function public.place_meal(p_meal_id uuid, p_date date, p_slot public.meal_slot)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_start date;
  v_length smallint;
begin
  select mn.start_date, mn.length_days into v_start, v_length
  from public.meal m
  join public.menu_dish md on md.id = m.menu_dish_id
  join public.menu mn on mn.id = md.menu_id
  where m.id = p_meal_id;

  if v_start is null then
    raise exception 'meal_not_found';
  end if;
  if p_date is not null and (p_date < v_start or p_date >= v_start + v_length) then
    raise exception 'date_outside_menu';
  end if;

  update public.meal set date = p_date, slot = p_slot where id = p_meal_id;
end;
$$;

-- « Séparer ce repas » : p_servings portions partent dans un nouveau repas de la même fournée,
-- sans jour ni moment ; le total des portions ne change pas. Renvoie l'id du nouveau repas.
create function public.split_meal(p_meal_id uuid, p_servings smallint)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_meal public.meal;
  v_new_id uuid;
begin
  -- for update : deux séparations simultanées du même repas ne peuvent pas créer des portions en trop.
  select * into v_meal from public.meal where id = p_meal_id for update;

  if not found then
    raise exception 'meal_not_found';
  end if;
  if p_servings is null or p_servings < 1 or p_servings >= v_meal.servings then
    raise exception 'invalid_split';
  end if;

  update public.meal set servings = servings - p_servings where id = p_meal_id;

  insert into public.meal (household_id, menu_dish_id, servings, eaten_at, position)
  values (
    v_meal.household_id,
    v_meal.menu_dish_id,
    p_servings,
    v_meal.eaten_at,
    (select max(position) + 1 from public.meal where menu_dish_id = v_meal.menu_dish_id)
  )
  returning id into v_new_id;

  return v_new_id;
end;
$$;

-- « Retirer ce repas du menu ». Une fournée sans repas n'a plus de sens : elle part avec son dernier repas.
create function public.remove_meal(p_meal_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_menu_dish_id uuid;
begin
  delete from public.meal where id = p_meal_id returning menu_dish_id into v_menu_dish_id;

  if v_menu_dish_id is null then
    raise exception 'meal_not_found';
  end if;

  delete from public.menu_dish md
  where md.id = v_menu_dish_id
    and not exists (select 1 from public.meal m where m.menu_dish_id = v_menu_dish_id);
end;
$$;

revoke execute on function
  public.place_meal(uuid, date, public.meal_slot),
  public.split_meal(uuid, smallint),
  public.remove_meal(uuid)
from public, anon;

grant execute on function
  public.place_meal(uuid, date, public.meal_slot),
  public.split_meal(uuid, smallint),
  public.remove_meal(uuid)
to authenticated;
