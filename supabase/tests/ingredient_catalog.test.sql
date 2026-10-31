-- Test du catalogue d'ingrédients (#26) : création, façon d'acheter, suppression, et isolation entre foyers.
-- Lancé par `npm run test:db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote');

create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);

select lives_ok(
  $$ insert into public.ingredient (household_id, name, aisle) values (current_setting('test.household_a')::uuid, 'Riz basmati', 'grocery') $$,
  'should create an ingredient when a member adds it from the Ingredients screen'
);
select throws_ok(
  $$ insert into public.ingredient (household_id, name) values (current_setting('test.household_a')::uuid, 'riz BASMATI') $$,
  '23505', null,
  'should refuse a second ingredient when the name only differs by case'
);
select lives_ok(
  $$ update public.ingredient set purchase_mode = 'pack', pack_name = 'paquet', pack_size = 1, pack_unit = 'kg' where name = 'Riz basmati' $$,
  'should store a pack when it has a name, a size and a unit'
);
select throws_ok(
  $$ update public.ingredient set purchase_mode = 'pack', pack_size = null where name = 'Riz basmati' $$,
  '23514', null,
  'should refuse a pack when its size is missing'
);
select lives_ok(
  $$ update public.ingredient set always_in_stock = true where name = 'Riz basmati' $$,
  'should mark an ingredient as always in stock'
);

-- B, d'un autre foyer, ne peut ni le voir ni le supprimer.
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select public.create_household('Foyer B', 2::smallint, 'Bob');
select is((select count(*) from public.ingredient), 0::bigint, 'should hide the ingredients of another household');
delete from public.ingredient;
select throws_ok(
  $$ insert into public.ingredient (household_id, name) values (current_setting('test.household_a')::uuid, 'Intrus') $$,
  '42501', null,
  'should refuse to add an ingredient when the household is not the user''s'
);

-- A le retrouve, puis le supprime : il n'est utilisé dans aucun plat.
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select is((select count(*) from public.ingredient), 1::bigint, 'should leave the ingredient when another household tries to delete it');
delete from public.ingredient where name = 'Riz basmati';
select is((select count(*) from public.ingredient), 0::bigint, 'should delete an ingredient when no dish uses it');

select * from finish();
rollback;
