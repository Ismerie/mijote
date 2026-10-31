-- Test des règles d'accès des plats et des ingrédients (#25) : un foyer ne voit et ne modifie que les siens.
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote');

-- Se faire passer pour un compte connecté, comme le fait Supabase pour chaque requête de l'app.
create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- A crée son foyer et un plat avec ses ingrédients
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);

select lives_ok(
  $$ select set_config('test.dish_a', public.save_dish(
       current_setting('test.household_a')::uuid, null, 'Lasagnes', 4::smallint, 'Four 40 min', 610, 34, 52, 28,
       '[{"name": "Bœuf haché", "aisle": "meat", "quantity": 500, "unit": "g"},
         {"name": "Oignon", "quantity": 1, "unit": "piece"},
         {"name": "Sel"}]'::jsonb
     )::text, true) $$,
  'should save a dish with its ingredient lines when the user is a member'
);
select is((select count(*) from public.dish), 1::bigint, 'should list the new dish when A reads its dishes');
select is((select count(*) from public.ingredient), 3::bigint, 'should create unknown ingredients when saving a dish');
select is(
  (select aisle::text from public.ingredient where name = 'Bœuf haché'),
  'meat',
  'should keep the aisle chosen when an ingredient is created from a dish'
);
select is(
  (select aisle::text from public.ingredient where name = 'Oignon'),
  'other',
  'should default the aisle to other when none is given'
);
select is(
  (select array_agg(i.name order by di.position) from public.dish_ingredient di join public.ingredient i on i.id = di.ingredient_id),
  array['Bœuf haché', 'Oignon', 'Sel'],
  'should keep the ingredient lines in the order they were typed'
);

-- Modifier le plat : « oignon » en minuscules retrouve l'ingrédient existant, les lignes sont remplacées.
select lives_ok(
  $$ select public.save_dish(
       current_setting('test.household_a')::uuid, current_setting('test.dish_a')::uuid,
       'Lasagnes maison', 6::smallint, '', null, null, null, null,
       '[{"name": "oignon", "quantity": 2, "unit": "piece"}]'::jsonb
     ) $$,
  'should update a dish when the user is a member'
);
select is((select name from public.dish), 'Lasagnes maison', 'should store the new name when a dish is updated');
select is((select count(*) from public.ingredient), 3::bigint, 'should reuse an ingredient when its name only differs by case');
select is((select count(*) from public.dish_ingredient), 1::bigint, 'should replace the ingredient lines when a dish is updated');

-- Un ingrédient utilisé dans un plat ne se supprime pas (#26).
select throws_ok(
  $$ delete from public.ingredient where name = 'Oignon' $$,
  '23503', null,
  'should refuse to delete an ingredient when a dish uses it'
);

-- Suppression douce : pas de suppression réelle, on archive.
delete from public.dish where id = current_setting('test.dish_a')::uuid;
select is((select count(*) from public.dish), 1::bigint, 'should not hard delete a dish when a member tries');
update public.dish set archived_at = now() where id = current_setting('test.dish_a')::uuid;
select isnt((select archived_at from public.dish), null, 'should archive a dish when a member soft deletes it');
select throws_ok(
  $$ select public.save_dish(
       current_setting('test.household_a')::uuid, current_setting('test.dish_a')::uuid,
       'Lasagnes', 4::smallint, '', null, null, null, null, '[]'::jsonb) $$,
  'dish_not_found',
  'should refuse to edit a dish when it is archived'
);

-- ---------------------------------------------------------------------------
-- B, d'un autre foyer, ne voit rien et ne peut rien écrire chez A
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select set_config('test.household_b', public.create_household('Foyer B', 2::smallint, 'Bob')::text, true);

select is((select count(*) from public.dish), 0::bigint, 'should hide the dishes of another household');
select is((select count(*) from public.ingredient), 0::bigint, 'should hide the ingredients of another household');
select is((select count(*) from public.dish_ingredient), 0::bigint, 'should hide the ingredient lines of another household');

select throws_ok(
  $$ select public.save_dish(current_setting('test.household_a')::uuid, null, 'Intrus', 2::smallint, '', null, null, null, null, '[]'::jsonb) $$,
  'access_denied',
  'should refuse to save a dish when the user is not a member of the household'
);
select throws_ok(
  $$ insert into public.dish (household_id, name, servings) values (current_setting('test.household_a')::uuid, 'Intrus', 2) $$,
  '42501', null,
  'should refuse a direct insert when the household is not the user''s'
);

update public.ingredient set name = 'Piraté';

-- B crée son plat, puis essaie d'y mettre un ingrédient de A : la clé étrangère composée refuse.
select set_config('test.dish_b', public.save_dish(
  current_setting('test.household_b')::uuid, null, 'Soupe', 2::smallint, '', null, null, null, null, '[]'::jsonb
)::text, true);
reset role;
select set_config('test.ingredient_a', (select id from public.ingredient where name = 'Oignon')::text, true);
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');

select throws_ok(
  $$ insert into public.dish_ingredient (household_id, dish_id, ingredient_id)
     values (current_setting('test.household_b')::uuid, current_setting('test.dish_b')::uuid, current_setting('test.ingredient_a')::uuid) $$,
  '23503', null,
  'should refuse an ingredient line when the ingredient belongs to another household'
);

-- ---------------------------------------------------------------------------
-- Côté A, rien n'a bougé
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');

select is(
  (select count(*) from public.ingredient where name = 'Piraté'),
  0::bigint,
  'should leave the ingredients unchanged when another household tries to update them'
);
select is((select count(*) from public.dish), 1::bigint, 'should not show the dishes of another household to A');

select * from finish();
rollback;
