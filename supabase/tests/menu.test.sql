-- Test du menu (#28) : ajout de plats découpés en repas, case « cuisiné » à trois états, case « mangé »,
-- et règles d'accès (un foyer ne voit et ne modifie que son menu).
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote');

-- Se faire passer pour un compte connecté, comme le fait Supabase pour chaque requête de l'app.
create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- A : un foyer de 2 personnes, des lasagnes (4 portions) et une salade de lentilles (5 portions)
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);
select set_config('test.lasagnes', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Lasagnes', 4::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);
select set_config('test.lentilles', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Salade de lentilles', 5::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);

select is(
  (select (shopping_day, menu_length_days)::text from public.household),
  '(5,14)',
  'should default to Saturday and two weeks when a household is created'
);

-- Premier ajout : le menu est créé, Lasagnes × 2 et lentilles × 1 en une seule fois.
select lives_ok(
  $$ select set_config('test.menu', public.add_dishes_to_menu(
       current_setting('test.household_a')::uuid, null, '2026-10-24', 14::smallint,
       array[current_setting('test.lasagnes'), current_setting('test.lasagnes'), current_setting('test.lentilles')]::uuid[]
     )::text, true) $$,
  'should add several dishes at once when the user is a member'
);
select is((select count(*) from public.menu), 1::bigint, 'should create the first menu when dishes are first added');
select is(
  (select (start_date, length_days)::text from public.menu),
  '(2026-10-24,14)',
  'should start the first menu on the given shopping day'
);
select is((select count(*) from public.menu_dish), 3::bigint, 'should create one menu dish per time when a dish is added twice');
select is(
  (select array_agg(m.servings order by md.position, m.position)
   from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.dish_id = current_setting('test.lasagnes')::uuid),
  array[2, 2, 2, 2]::smallint[],
  'should split each 4-serving lasagna into 2 meals of 2 when the household has 2 people'
);
select is(
  (select array_agg(m.servings order by m.position)
   from public.meal m join public.menu_dish md on md.id = m.menu_dish_id
   where md.dish_id = current_setting('test.lentilles')::uuid),
  array[2, 2, 1]::smallint[],
  'should put the remainder in its own meal when servings do not divide evenly'
);
select is(
  (select count(*) from public.meal where date is null and slot is null and eaten_at is null),
  7::bigint,
  'should add meals without day, slot or eaten mark'
);

-- Un deuxième ajout va dans le même menu, après les plats déjà là.
select public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid, null, null,
  array[current_setting('test.lentilles')]::uuid[]
);
select is((select count(*) from public.menu), 1::bigint, 'should reuse the menu when one is given');
select is((select max(position) from public.menu_dish), 4, 'should place new dishes after the existing ones');

select set_config('test.lasagnes_1', (
  select id::text from public.menu_dish where dish_id = current_setting('test.lasagnes')::uuid order by position limit 1
), true);
select set_config('test.lasagnes_2', (
  select id::text from public.menu_dish where dish_id = current_setting('test.lasagnes')::uuid order by position desc limit 1
), true);

-- ---------------------------------------------------------------------------
-- Case à trois états : à cuisiner → cuisiné → tout mangé → à cuisiner
-- ---------------------------------------------------------------------------
select public.set_menu_dish_state(current_setting('test.lasagnes_1')::uuid, 'cooked');
select isnt(
  (select cooked_at from public.menu_dish where id = current_setting('test.lasagnes_1')::uuid),
  null,
  'should mark the dish as cooked when its box is tapped once'
);
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_1')::uuid and eaten_at is null),
  2::bigint,
  'should leave every meal to eat when the dish is only cooked'
);

select public.set_menu_dish_state(current_setting('test.lasagnes_1')::uuid, 'eaten');
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_1')::uuid and eaten_at is null),
  0::bigint,
  'should eat every meal when a cooked dish is tapped again'
);

select public.set_menu_dish_state(current_setting('test.lasagnes_1')::uuid, 'to_cook');
select is(
  (select cooked_at from public.menu_dish where id = current_setting('test.lasagnes_1')::uuid),
  null,
  'should go back to cook when an eaten dish is tapped again'
);
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_1')::uuid and eaten_at is not null),
  0::bigint,
  'should clear every eaten mark when the dish goes back to cook'
);

select throws_ok(
  $$ select public.set_menu_dish_state(current_setting('test.lasagnes_1')::uuid, 'burnt') $$,
  'invalid_state',
  'should refuse an unknown state'
);

-- ---------------------------------------------------------------------------
-- Case « mangé » d'un repas
-- ---------------------------------------------------------------------------
select public.set_meal_eaten(
  (select id from public.meal where menu_dish_id = current_setting('test.lasagnes_2')::uuid order by position limit 1),
  true
);
select isnt(
  (select cooked_at from public.menu_dish where id = current_setting('test.lasagnes_2')::uuid),
  null,
  'should mark the dish as cooked when one of its meals is eaten'
);
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_2')::uuid and eaten_at is null),
  1::bigint,
  'should leave the other meals to eat when one meal is eaten'
);

select public.set_meal_eaten(
  (select id from public.meal where menu_dish_id = current_setting('test.lasagnes_2')::uuid order by position limit 1),
  false
);
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_2')::uuid and eaten_at is not null),
  0::bigint,
  'should uncheck a meal when it is marked as not eaten'
);

-- ---------------------------------------------------------------------------
-- B, d'un autre foyer, ne voit rien et ne peut rien modifier chez A
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select public.create_household('Foyer B', 2::smallint, 'Bob');

select is(
  (select count(*) from public.menu) + (select count(*) from public.menu_dish) + (select count(*) from public.meal),
  0::bigint,
  'should hide the menu, its dishes and its meals from another household'
);
select throws_ok(
  $$ select public.add_dishes_to_menu(current_setting('test.household_a')::uuid, null, '2026-10-31', 7::smallint, '{}') $$,
  'access_denied',
  'should refuse to add dishes when the user is not a member of the household'
);
select throws_ok(
  $$ select public.set_menu_dish_state(current_setting('test.lasagnes_1')::uuid, 'cooked') $$,
  'menu_dish_not_found',
  'should refuse to cook a dish of another household'
);
select throws_ok(
  $$ select public.set_meal_eaten((select id from public.meal limit 1), true) $$,
  'meal_not_found',
  'should refuse to eat a meal it cannot see'
);
delete from public.menu_dish where id = current_setting('test.lasagnes_1')::uuid;

-- ---------------------------------------------------------------------------
-- Côté A : rien n'a bougé, puis A retire un plat du menu
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.menu_dish), 4::bigint, 'should keep the dishes when another household tries to delete them');

delete from public.menu_dish where id = current_setting('test.lasagnes_1')::uuid;
select is(
  (select count(*) from public.meal where menu_dish_id = current_setting('test.lasagnes_1')::uuid),
  0::bigint,
  'should remove its meals when a dish is removed from the menu'
);

-- Un plat archivé ne s'ajoute plus au menu.
update public.dish set archived_at = now() where id = current_setting('test.lentilles')::uuid;
select throws_ok(
  $$ select public.add_dishes_to_menu(
       current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid, null, null,
       array[current_setting('test.lentilles')]::uuid[]) $$,
  'dish_not_found',
  'should refuse to add a dish when it is archived'
);

select * from finish();
rollback;
