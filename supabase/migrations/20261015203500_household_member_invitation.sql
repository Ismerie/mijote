-- J1 (#4) : le foyer, ses membres et les invitations, avec les règles d'accès (RLS).
-- Principe : on ne voit une ligne que si on est membre du foyer auquel elle appartient.
-- Les écritures sensibles (créer un foyer, inviter, rejoindre) passent par des fonctions,
-- qui vérifient les règles métier ; l'app n'écrit directement que ce qui est sans risque.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.household (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  default_servings smallint not null default 2 check (default_servings between 1 and 20),
  created_at timestamptz not null default now()
);

create type public.member_role as enum ('admin', 'member');

-- Plusieurs-à-plusieurs pour pouvoir ouvrir le multi-foyer plus tard ;
-- la règle « un seul foyer par compte » de la V1 est vérifiée dans les fonctions.
create table public.member (
  household_id uuid not null references public.household (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  first_name text not null check (length(trim(first_name)) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index member_user_id_idx on public.member (user_id);

-- Le code est le secret contenu dans le lien partagé : un UUID aléatoire, impossible à deviner.
create table public.invitation (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household (id) on delete cascade,
  code uuid not null unique default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null
);

create index invitation_household_id_idx on public.invitation (household_id);

-- ---------------------------------------------------------------------------
-- La fonction de base des règles d'accès
-- ---------------------------------------------------------------------------

-- « Est-ce que le compte connecté est membre de ce foyer ? »
-- security definer : elle lit membre sans repasser par les règles de membre,
-- sinon la règle de membre s'appellerait elle-même à l'infini.
create function public.is_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.member m
    where m.household_id = p_household_id
      and m.user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Règles d'accès (RLS)
-- ---------------------------------------------------------------------------

alter table public.household enable row level security;
alter table public.member enable row level security;
alter table public.invitation enable row level security;

-- Un visiteur non connecté n'a rien à faire sur ces tables.
revoke all on public.household, public.member, public.invitation from anon;

create policy "household readable by its members"
  on public.household for select to authenticated
  using ((select public.is_member(id)));

-- Tout membre peut régler le foyer (portions par défaut, #9).
create policy "household updatable by its members"
  on public.household for update to authenticated
  using ((select public.is_member(id)))
  with check ((select public.is_member(id)));

create policy "members visible to their household"
  on public.member for select to authenticated
  using ((select public.is_member(household_id)));

create policy "invitations visible to their household"
  on public.invitation for select to authenticated
  using ((select public.is_member(household_id)));

-- Aucune règle d'insertion ni de suppression : ces écritures passent par les fonctions ci-dessous.

-- ---------------------------------------------------------------------------
-- Fonctions métier
-- ---------------------------------------------------------------------------

-- Crée le foyer et en fait la personne connectée administratrice, en une seule opération (#7).
create function public.create_household(p_name text, p_default_servings smallint, p_first_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Empêche deux créations simultanées pour le même compte.
  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  if exists (select 1 from public.member where user_id = v_user_id) then
    raise exception 'already_in_household';
  end if;

  insert into public.household (name, default_servings)
  values (trim(p_name), p_default_servings)
  returning id into v_household_id;

  insert into public.member (household_id, user_id, role, first_name)
  values (v_household_id, v_user_id, 'admin', trim(p_first_name));

  return v_household_id;
end;
$$;

-- Crée une invitation valable 7 jours et renvoie son code, à mettre dans le lien (#8).
create function public.create_invitation(p_household_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code uuid;
begin
  if not public.is_member(p_household_id) then
    raise exception 'access_denied';
  end if;

  insert into public.invitation (household_id, created_by)
  values (p_household_id, auth.uid())
  returning code into v_code;

  return v_code;
end;
$$;

-- Fait entrer la personne connectée dans le foyer de l'invitation et renvoie l'id du foyer (#8).
-- Elle n'est pas encore membre, donc ne peut pas lire l'invitation : la fonction le fait pour elle.
create function public.accept_invitation(p_code uuid, p_first_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_invitation public.invitation;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- for update : deux personnes qui ouvrent le même lien en même temps ne peuvent pas l'utiliser toutes les deux.
  select * into v_invitation
  from public.invitation
  where code = p_code
  for update;

  if not found then
    raise exception 'invitation_not_found';
  end if;
  if v_invitation.used_at is not null then
    raise exception 'invitation_already_used';
  end if;
  if v_invitation.expires_at < now() then
    raise exception 'invitation_expired';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  if exists (select 1 from public.member where user_id = v_user_id) then
    raise exception 'already_in_household';
  end if;

  insert into public.member (household_id, user_id, role, first_name)
  values (v_invitation.household_id, v_user_id, 'member', trim(p_first_name));

  update public.invitation
  set used_at = now(), used_by = v_user_id
  where id = v_invitation.id;

  return v_invitation.household_id;
end;
$$;

-- Par défaut, Postgres laisse tout le monde appeler une fonction : on réserve celles-ci aux comptes connectés.
revoke execute on function
  public.is_member(uuid),
  public.create_household(text, smallint, text),
  public.create_invitation(uuid),
  public.accept_invitation(uuid, text)
from public, anon;

grant execute on function
  public.is_member(uuid),
  public.create_household(text, smallint, text),
  public.create_invitation(uuid),
  public.accept_invitation(uuid, text)
to authenticated;
