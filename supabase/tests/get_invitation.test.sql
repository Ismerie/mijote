-- Test de get_invitation (#8) : la personne invitée voit le nom du foyer et l'état du lien, rien de plus.
-- Lancé par `npx supabase test db`, dans une transaction annulée à la fin.
begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

-- A crée un foyer et invite ; B ouvre le lien ; C l'ouvre après coup.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.mijote');

create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');
select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true);
select set_config('test.code_a', public.create_invitation(current_setting('test.household_a')::uuid)::text, true);

-- B n'est pas membre : il lit quand même le nom du foyer et l'état du lien.
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');
select results_eq(
  $$ select household_name, status from public.get_invitation(current_setting('test.code_a')::uuid) $$,
  $$ values ('Foyer A', 'valid') $$,
  'Une personne invitée voit le nom du foyer et un lien valable'
);
select is((select count(*) from public.invitation), 0::bigint, 'Elle ne lit toujours pas la table invitation');
select is_empty(
  $$ select * from public.get_invitation(gen_random_uuid()) $$,
  'Un code inventé ne renvoie rien'
);

select public.accept_invitation(current_setting('test.code_a')::uuid, 'Bob');

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000c');
select results_eq(
  $$ select status from public.get_invitation(current_setting('test.code_a')::uuid) $$,
  $$ values ('used') $$,
  'Un lien déjà utilisé est signalé comme tel'
);

-- Une invitation de plus de 7 jours, posée directement en base.
reset role;
insert into public.invitation (household_id, code, created_at, expires_at)
values (current_setting('test.household_a')::uuid, '00000000-0000-0000-0000-0000000e0000', now() - interval '8 days', now() - interval '1 day');

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000c');
select results_eq(
  $$ select status from public.get_invitation('00000000-0000-0000-0000-0000000e0000') $$,
  $$ values ('expired') $$,
  'Un lien de plus de 7 jours est signalé comme expiré'
);
select results_eq(
  $$ select household_name from public.get_invitation('00000000-0000-0000-0000-0000000e0000') $$,
  $$ values ('Foyer A') $$,
  'Le nom du foyer reste affiché pour un lien expiré'
);

-- Sans être connecté : refusé.
reset role;
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok(
  $$ select * from public.get_invitation(gen_random_uuid()) $$,
  '42501', null,
  'Un visiteur non connecté ne peut pas lire une invitation'
);

select * from finish();
rollback;
