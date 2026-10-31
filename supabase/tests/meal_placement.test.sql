-- Test du placement des repas (#29) : placer sur un jour du menu, séparer sans changer le total, retirer,
-- et règles d'accès (un autre foyer ne peut rien faire sur ces repas).
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote');

create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- A : Lasagnes (4 portions) au menu du sam. 24 oct., 2 semaines, pour 2 personnes → 2 repas de 2.
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);
select set_config('test.lasagnes', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Lasagnes', 4::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);
select public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, null, '2026-10-24', 14::smallint,
  array[current_setting('test.lasagnes')]::uuid[]
);
select set_config('test.meal', (select id::text from public.meal order by position limit 1), true);

-- ---------------------------------------------------------------------------
-- Placer
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select public.place_meal(current_setting('test.meal')::uuid, '2026-10-27', 'dinner') $$,
  'should place a meal on a day of the menu'
);
select is(
  (select (date, slot)::text from public.meal where id = current_setting('test.meal')::uuid),
  '(2026-10-27,dinner)',
  'should store the day and the slot when a meal is placed'
);
select throws_ok(
  $$ select public.place_meal(current_setting('test.meal')::uuid, '2026-11-07', null) $$,
  'date_outside_menu',
  'should refuse a day after the end of the menu'
);
select throws_ok(
  $$ select public.place_meal(current_setting('test.meal')::uuid, '2026-10-23', null) $$,
  'date_outside_menu',
  'should refuse a day before the start of the menu'
);
select public.place_meal(current_setting('test.meal')::uuid, null, null);
select is(
  (select date from public.meal where id = current_setting('test.meal')::uuid),
  null,
  'should put the meal back to place when its day is removed'
);

-- ---------------------------------------------------------------------------
-- Séparer : 2 → 1 + 1, puis placer l'un mardi et l'autre mercredi
-- ---------------------------------------------------------------------------
select public.place_meal(current_setting('test.meal')::uuid, '2026-10-27', 'lunch');
select set_config('test.new_meal', public.split_meal(current_setting('test.meal')::uuid, 1::smallint)::text, true);
select is(
  (select servings from public.meal where id = current_setting('test.meal')::uuid),
  1::smallint,
  'should take the split servings out of the meal'
);
select is(
  (select (servings, date, slot)::text from public.meal where id = current_setting('test.new_meal')::uuid),
  '(1,,)',
  'should create a meal of the split servings without day nor slot'
);
select is((select sum(servings) from public.meal), 4::bigint, 'should keep the total servings of the dish when a meal is split');
select is(
  (select count(distinct menu_dish_id) from public.meal),
  1::bigint,
  'should keep the new meal in the same menu dish'
);
select throws_ok(
  $$ select public.split_meal(current_setting('test.meal')::uuid, 1::smallint) $$,
  'invalid_split',
  'should refuse to split a meal of 1 serving'
);

-- ---------------------------------------------------------------------------
-- B, d'un autre foyer, ne peut ni placer, ni séparer, ni retirer
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select public.create_household('Foyer B', 2::smallint, 'Bob');
select throws_ok(
  $$ select public.place_meal(current_setting('test.new_meal')::uuid, '2026-10-28', null) $$,
  'meal_not_found',
  'should refuse to place a meal of another household'
);
select throws_ok(
  $$ select public.remove_meal(current_setting('test.new_meal')::uuid) $$,
  'meal_not_found',
  'should refuse to remove a meal of another household'
);

-- ---------------------------------------------------------------------------
-- Retirer : la fournée part avec son dernier repas
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select public.remove_meal(current_setting('test.new_meal')::uuid);
select is((select count(*) from public.menu_dish), 1::bigint, 'should keep the dish in the menu while it has meals');
delete from public.meal where id <> current_setting('test.meal')::uuid;
select public.remove_meal(current_setting('test.meal')::uuid);
select is((select count(*) from public.menu_dish), 0::bigint, 'should remove the dish from the menu with its last meal');

select * from finish();
rollback;
