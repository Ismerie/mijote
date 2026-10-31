-- Test du menu suivant (#30) : report des plats pas cuisinés et des restes, ancien menu inchangé,
-- et règles d'accès.
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote');

create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- A : menu du sam. 17 oct. (2 semaines) avec un curry pas cuisiné et des lasagnes cuisinées,
-- dont un repas sur deux est mangé.
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);
select set_config('test.curry', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Curry', 4::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);
select set_config('test.lasagnes', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Lasagnes', 4::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);
select set_config('test.menu', public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, null, '2026-10-17', 14::smallint,
  array[current_setting('test.curry'), current_setting('test.lasagnes')]::uuid[]
)::text, true);
select set_config('test.lasagnes_md', (select id::text from public.menu_dish where dish_id = current_setting('test.lasagnes')::uuid), true);
select public.set_menu_dish_state(current_setting('test.lasagnes_md')::uuid, 'cooked');
select public.set_meal_eaten(
  (select id from public.meal where menu_dish_id = current_setting('test.lasagnes_md')::uuid order by position limit 1), true
);
select public.place_meal(
  (select id from public.meal where menu_dish_id = current_setting('test.lasagnes_md')::uuid order by position desc limit 1),
  '2026-10-22', 'lunch'
);

-- Tous les repas pas mangés sont proposés ; on les reporte tous, sur une seule semaine.
select set_config('test.next', public.prepare_next_menu(
  current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid, '2026-10-31', 7::smallint,
  (select array_agg(id) from public.meal where eaten_at is null)
)::text, true);

select is(
  (select (start_date, length_days)::text from public.menu where id = current_setting('test.next')::uuid),
  '(2026-10-31,7)',
  'should create the next menu with the length chosen for it'
);
select is((select menu_length_days from public.household), 14::smallint, 'should keep the household default length');
select is(
  (select count(*) from public.menu_dish where menu_id = current_setting('test.next')::uuid and carried_over),
  2::bigint,
  'should carry the uncooked dish and the leftovers as carried over dishes'
);
select is(
  (select array_agg(m.servings order by m.position) from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.menu_id = current_setting('test.next')::uuid and md.dish_id = current_setting('test.curry')::uuid and md.cooked_at is null),
  array[2, 2]::smallint[],
  'should carry an uncooked dish whole with its meals'
);
select is(
  (select array_agg((m.servings, m.date, m.slot)::text) from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.menu_id = current_setting('test.next')::uuid and md.dish_id = current_setting('test.lasagnes')::uuid),
  array['(2,,)'],
  'should carry only the uneaten meal of a cooked dish, without day nor slot'
);
select isnt(
  (select cooked_at from public.menu_dish where menu_id = current_setting('test.next')::uuid and dish_id = current_setting('test.lasagnes')::uuid),
  null,
  'should keep a leftover marked as cooked'
);
select is(
  (select count(*) from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.menu_id = current_setting('test.menu')::uuid),
  4::bigint,
  'should leave the previous menu as it was'
);
select is(
  (select (date, slot)::text from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.menu_id = current_setting('test.menu')::uuid and m.eaten_at is null and md.dish_id = current_setting('test.lasagnes')::uuid),
  '(2026-10-22,lunch)',
  'should keep the day of the meal in the previous menu'
);

select throws_ok(
  $$ select public.prepare_next_menu(
       current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid, '2026-11-07', 7::smallint, '{}') $$,
  'menu_already_prepared',
  'should refuse to prepare from a menu that is not the last one'
);
select throws_ok(
  $$ select public.prepare_next_menu(
       current_setting('test.household_a')::uuid, current_setting('test.next')::uuid, '2026-11-01', 7::smallint, '{}') $$,
  'menu_already_prepared',
  'should refuse a next menu that starts before the end of the last one'
);

-- Décocher : rien n'est reporté, le menu est créé vide.
select set_config('test.empty', public.prepare_next_menu(
  current_setting('test.household_a')::uuid, current_setting('test.next')::uuid, '2026-11-07', 14::smallint, '{}'
)::text, true);
select is(
  (select count(*) from public.menu_dish where menu_id = current_setting('test.empty')::uuid),
  0::bigint,
  'should carry nothing when every line is unchecked'
);

-- ---------------------------------------------------------------------------
-- B, d'un autre foyer
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select set_config('test.household_b', public.create_household('Foyer B', 2::smallint, 'Bob')::text, true);
select throws_ok(
  $$ select public.prepare_next_menu(
       current_setting('test.household_a')::uuid, current_setting('test.empty')::uuid, '2026-11-21', 7::smallint, '{}') $$,
  'access_denied',
  'should refuse to prepare a menu of another household'
);
select throws_ok(
  $$ select public.prepare_next_menu(
       current_setting('test.household_b')::uuid, current_setting('test.empty')::uuid, '2026-11-21', 7::smallint, '{}') $$,
  'menu_not_found',
  'should refuse to carry from a menu of another household'
);

select * from finish();
rollback;
