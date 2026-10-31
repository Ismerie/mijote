-- J3 (#30) : préparer le menu suivant en reportant ce qui n'a pas été mangé.
-- Le menu précédent reste tel quel, consultable avec les flèches : les repas reportés y sont copiés,
-- pas déplacés. Dans le nouveau menu, chaque plat reporté est une nouvelle fournée marquée carried_over
-- (« Reporté » s'il n'était pas cuisiné, « Reste » s'il l'était : elle garde cooked_at), qui ne compte
-- pas dans les courses (#32).

-- Crée le menu qui suit p_from_menu_id (le dernier menu du foyer) et y reporte les repas p_meal_ids,
-- sans jour ni moment. Seuls les repas pas mangés de p_from_menu_id sont pris. Renvoie l'id du nouveau menu.
create function public.prepare_next_menu(
  p_household_id uuid,
  p_from_menu_id uuid,
  p_start_date date,
  p_length_days smallint,
  p_meal_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_from public.menu;
  v_menu_id uuid;
  v_source record;
  v_menu_dish_id uuid;
  v_position integer := 0;
begin
  if not public.is_member(p_household_id) then
    raise exception 'access_denied';
  end if;

  select * into v_from from public.menu where id = p_from_menu_id and household_id = p_household_id;
  if not found then
    raise exception 'menu_not_found';
  end if;
  -- On ne prépare que la suite du dernier menu, et le nouveau commence après la fin du précédent.
  if exists (select 1 from public.menu where household_id = p_household_id and start_date > v_from.start_date)
     or p_start_date < v_from.start_date + v_from.length_days then
    raise exception 'menu_already_prepared';
  end if;

  insert into public.menu (household_id, start_date, length_days)
  values (p_household_id, p_start_date, p_length_days)
  returning id into v_menu_id;

  -- Une nouvelle fournée par fournée d'origine qui a au moins un repas reporté, dans l'ordre du menu.
  for v_source in
    select md.id, md.dish_id, md.cooked_at
    from public.menu_dish md
    where md.menu_id = p_from_menu_id
      and exists (
        select 1 from public.meal m
        where m.menu_dish_id = md.id and m.id = any (p_meal_ids) and m.eaten_at is null
      )
    order by md.position
  loop
    v_position := v_position + 1;
    insert into public.menu_dish (household_id, menu_id, dish_id, position, cooked_at, carried_over)
    values (p_household_id, v_menu_id, v_source.dish_id, v_position, v_source.cooked_at, true)
    returning id into v_menu_dish_id;

    insert into public.meal (household_id, menu_dish_id, servings, position)
    select p_household_id, v_menu_dish_id, m.servings, m.position
    from public.meal m
    where m.menu_dish_id = v_source.id and m.id = any (p_meal_ids) and m.eaten_at is null;
  end loop;

  return v_menu_id;
end;
$$;

revoke execute on function public.prepare_next_menu(uuid, uuid, date, smallint, uuid[]) from public, anon;
grant execute on function public.prepare_next_menu(uuid, uuid, date, smallint, uuid[]) to authenticated;
