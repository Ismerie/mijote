-- Test des règles d'accès du foyer (#4) : un compte ne voit et ne modifie que son propre foyer.
-- Lancé par `npx supabase test db`, dans une transaction annulée à la fin : la base n'en garde aucune trace.
begin;

create extension if not exists pgtap with schema extensions;

select plan(26);

-- Cinq comptes de test : A crée un foyer, B en crée un autre, C, D et E testent les invitations.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.mijote'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.mijote'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.mijote'),
  ('00000000-0000-0000-0000-00000000000d', 'd@test.mijote'),
  ('00000000-0000-0000-0000-00000000000e', 'e@test.mijote');

-- Se faire passer pour un compte connecté, comme le fait Supabase pour chaque requête de l'app.
create function pg_temp.sign_in(p_user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
$$;

-- ---------------------------------------------------------------------------
-- A crée son foyer et une invitation
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');

select lives_ok(
  $$ select set_config('test.household_a', public.create_household('Foyer A', 2::smallint, 'Alice')::text, true) $$,
  'A crée son foyer'
);
select is((select count(*) from public.household), 1::bigint, 'A voit son foyer');
select is(
  (select role::text from public.member where user_id = auth.uid()),
  'admin',
  'A est administratrice de son foyer'
);
select throws_ok(
  $$ select public.create_household('Second foyer', 2::smallint, 'Alice') $$,
  'already_in_household',
  'A ne peut pas créer un second foyer'
);
select lives_ok(
  $$ select set_config('test.code_a', public.create_invitation(current_setting('test.household_a')::uuid)::text, true) $$,
  'A crée une invitation'
);
select is((select count(*) from public.invitation), 1::bigint, 'A voit son invitation');

-- ---------------------------------------------------------------------------
-- B, sans foyer, ne voit rien et ne peut rien modifier chez A
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000b');

select is((select count(*) from public.household), 0::bigint, 'B ne voit pas le foyer de A');
select is((select count(*) from public.member), 0::bigint, 'B ne voit pas les membres de A');
select is((select count(*) from public.invitation), 0::bigint, 'B ne voit pas les invitations de A');

-- Une modification sur une ligne invisible ne touche rien (vérifié plus bas, côté A).
update public.household set name = 'Piraté', default_servings = 9 where id = current_setting('test.household_a')::uuid;
delete from public.household where id = current_setting('test.household_a')::uuid;

select throws_ok(
  $$ insert into public.member (household_id, user_id, first_name)
     values (current_setting('test.household_a')::uuid, auth.uid(), 'Bob') $$,
  '42501', null,
  'B ne peut pas s''ajouter lui-même au foyer de A'
);
select throws_ok(
  $$ insert into public.household (name) values ('Foyer direct') $$,
  '42501', null,
  'On ne crée pas de foyer sans passer par create_household'
);
select throws_ok(
  $$ select public.create_invitation(current_setting('test.household_a')::uuid) $$,
  'access_denied',
  'B ne peut pas inviter dans le foyer de A'
);
select lives_ok(
  $$ select set_config('test.household_b', public.create_household('Foyer B', 4::smallint, 'Bob')::text, true) $$,
  'B crée son propre foyer'
);
select results_eq(
  $$ select id from public.household $$,
  $$ values (current_setting('test.household_b')::uuid) $$,
  'B ne voit que son propre foyer'
);
select throws_ok(
  $$ select public.accept_invitation(current_setting('test.code_a')::uuid, 'Bob') $$,
  'already_in_household',
  'B, déjà dans un foyer, ne peut pas rejoindre celui de A'
);

-- ---------------------------------------------------------------------------
-- Invitations : C rejoint A ; D arrive trop tard ; E a un lien expiré ou faux
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000c');

select is(
  public.accept_invitation(current_setting('test.code_a')::uuid, 'Chloé'),
  current_setting('test.household_a')::uuid,
  'C rejoint le foyer de A avec le lien'
);
select results_eq(
  $$ select name from public.household $$,
  $$ values ('Foyer A') $$,
  'C voit le foyer de A, et seulement lui'
);

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000d');

select throws_ok(
  $$ select public.accept_invitation(current_setting('test.code_a')::uuid, 'Dan') $$,
  'invitation_already_used',
  'Un lien ne sert qu''une fois'
);
select throws_ok(
  $$ select public.accept_invitation(gen_random_uuid(), 'Dan') $$,
  'invitation_not_found',
  'Un code inventé est refusé'
);

-- Une invitation créée il y a 8 jours, posée directement en base.
reset role;
insert into public.invitation (household_id, code, created_at, expires_at)
values (current_setting('test.household_a')::uuid, '00000000-0000-0000-0000-0000000e0000', now() - interval '8 days', now() - interval '1 day');

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000e');

select throws_ok(
  $$ select public.accept_invitation('00000000-0000-0000-0000-0000000e0000', 'Eve') $$,
  'invitation_expired',
  'Un lien de plus de 7 jours est refusé'
);
select is((select count(*) from public.household), 0::bigint, 'E, refusée, ne voit aucun foyer');

-- ---------------------------------------------------------------------------
-- Retour chez A : rien n'a bougé, et les membres peuvent régler le foyer
-- ---------------------------------------------------------------------------
select pg_temp.sign_in('00000000-0000-0000-0000-00000000000a');

select results_eq(
  $$ select name, default_servings from public.household $$,
  $$ values ('Foyer A', 2::smallint) $$,
  'Les tentatives de B n''ont ni modifié ni supprimé le foyer de A'
);
select results_eq(
  $$ select first_name from public.member order by first_name $$,
  $$ values ('Alice'), ('Chloé') $$,
  'A voit les membres de son foyer, pas ceux de B'
);

select pg_temp.sign_in('00000000-0000-0000-0000-00000000000c');
update public.household set default_servings = 3;
select is((select default_servings from public.household), 3::smallint, 'Un membre peut changer les portions par défaut');

-- ---------------------------------------------------------------------------
-- Sans être connecté : aucun accès
-- ---------------------------------------------------------------------------
reset role;
select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$ select * from public.household $$,
  '42501', null,
  'Un visiteur non connecté ne lit pas les foyers'
);
select throws_ok(
  $$ select public.create_household('Anonyme', 2::smallint, 'Anon') $$,
  '42501', null,
  'Un visiteur non connecté ne peut pas créer de foyer'
);

select * from finish();
rollback;
