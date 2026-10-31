-- Test des courses (#32) : lignes cochées partagées dans le foyer, « Courses terminées »
-- (fournées achetées, coches effacées, reportés jamais touchés) et règles d'accès.
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.mijote');

create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- A (avec C comme deuxième membre) : un menu avec Lasagnes × 2 et un curry reporté
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);
select set_config('test.code_a', public.create_invitation(current_setting('test.household_a')::uuid)::text, true);
select set_config('test.lasagnes', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Lasagnes', 4::smallint, '', null, null, null, null,
  '[{"name": "Bœuf haché", "aisle": "meat", "quantity": 500, "unit": "g"}]'::jsonb
)::text, true);
select set_config('test.curry', public.save_dish(
  current_setting('test.household_a')::uuid, null, 'Curry', 4::smallint, '', null, null, null, null,
  '[{"name": "Riz", "aisle": "grocery", "quantity": 300, "unit": "g"}]'::jsonb
)::text, true);
select set_config('test.menu', public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, null, '2026-10-31', 14::smallint,
  array[current_setting('test.lasagnes'), current_setting('test.lasagnes')]::uuid[]
)::text, true);
-- Un plat reporté du menu précédent, comme le crée prepare_next_menu (#30).
insert into public.menu_dish (household_id, menu_id, dish_id, position, carried_over)
values (
  current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid,
  current_setting('test.curry')::uuid, 3, true
);
select set_config('test.beef', (select id from public.ingredient where name = 'Bœuf haché')::text, true);

select lives_ok(
  $$ insert into public.shopping_check (household_id, menu_id, ingredient_id, measure)
     values (current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid,
             current_setting('test.beef')::uuid, 'mass') $$,
  'should check a line when the user is a member'
);
select throws_ok(
  $$ insert into public.shopping_check (household_id, menu_id, ingredient_id, measure)
     values (current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid,
             current_setting('test.beef')::uuid, 'mass') $$,
  '23505', null,
  'should keep a single check when the same line is checked twice'
);
select throws_ok(
  $$ insert into public.shopping_check (household_id, menu_id, ingredient_id, measure)
     values (current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid,
             current_setting('test.beef')::uuid, 'box') $$,
  '23514', null,
  'should refuse a check when the measure is unknown'
);
select is(
  (select bought_at from public.menu_dish where not carried_over limit 1),
  null,
  'should add menu dishes not bought yet'
);

-- C rejoint le foyer A : il voit la ligne cochée par A (« cochée sur l'autre téléphone »).
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000c');
select public.accept_invitation(current_setting('test.code_a')::uuid, 'Camille');
select is((select count(*) from public.shopping_check), 1::bigint, 'should share a checked line with the other members');

-- ---------------------------------------------------------------------------
-- B, d'un autre foyer, ne voit ni ne touche les courses de A
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select public.create_household('Foyer B', 2::smallint, 'Bob');

select is((select count(*) from public.shopping_check), 0::bigint, 'should hide checked lines when the user is not a member');
select throws_ok(
  $$ insert into public.shopping_check (household_id, menu_id, ingredient_id, measure)
     values (current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid,
             current_setting('test.beef')::uuid, 'piece') $$,
  '42501', null,
  'should refuse a check when the user is not a member'
);
delete from public.shopping_check;
select throws_ok(
  $$ select public.finish_shopping(current_setting('test.menu')::uuid) $$,
  'P0001', 'menu_not_found',
  'should refuse to finish the shopping when the user is not a member'
);

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.shopping_check), 1::bigint, 'should not delete a check when the user is not a member');

-- ---------------------------------------------------------------------------
-- « Courses terminées »
-- ---------------------------------------------------------------------------
select lives_ok(
  $$ select public.finish_shopping(current_setting('test.menu')::uuid) $$,
  'should finish the shopping when the user is a member'
);
select is(
  (select count(*) from public.menu_dish where not carried_over and bought_at is not null),
  2::bigint,
  'should mark every menu dish to buy as bought when the shopping is finished'
);
select is(
  (select bought_at from public.menu_dish where carried_over),
  null,
  'should leave carried-over dishes alone when the shopping is finished'
);
select is((select count(*) from public.shopping_check), 0::bigint, 'should clear the checked lines when the shopping is finished');

-- Un plat ajouté ensuite est à acheter : seuls ses ingrédients reviennent dans la liste.
select public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, current_setting('test.menu')::uuid, null, null,
  array[current_setting('test.curry')]::uuid[]
);
select is(
  (select count(*) from public.menu_dish where not carried_over and bought_at is null),
  1::bigint,
  'should keep a dish added after the shopping to buy'
);

-- Effacer les coches d'un menu ne touche pas celles d'un autre.
select set_config('test.menu_next', public.add_dishes_to_menu(
  current_setting('test.household_a')::uuid, null, '2026-11-14', 14::smallint,
  array[current_setting('test.lasagnes')]::uuid[]
)::text, true);
insert into public.shopping_check (household_id, menu_id, ingredient_id, measure)
values (current_setting('test.household_a')::uuid, current_setting('test.menu_next')::uuid,
        current_setting('test.beef')::uuid, 'mass');
select public.finish_shopping(current_setting('test.menu')::uuid);
select is((select count(*) from public.shopping_check), 1::bigint, 'should keep the checks of other menus when the shopping is finished');

-- Décocher = supprimer la ligne.
delete from public.shopping_check;
select is((select count(*) from public.shopping_check), 0::bigint, 'should uncheck a line when a member deletes it');

select * from finish();
rollback;
