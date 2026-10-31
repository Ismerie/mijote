-- #9 : le nombre de portions par défaut devient le nombre de personnes du foyer.
-- Sert à découper chaque recette en repas ; les règles d'accès (RLS) de household ne changent pas.
alter table public.household rename column default_servings to people_count;

-- Renommer le paramètre oblige à recréer la fonction (create or replace ne renomme pas un paramètre).
drop function public.create_household(text, smallint, text);

create function public.create_household(p_name text, p_people_count smallint, p_first_name text)
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

  insert into public.household (name, people_count)
  values (trim(p_name), p_people_count)
  returning id into v_household_id;

  insert into public.member (household_id, user_id, role, first_name)
  values (v_household_id, v_user_id, 'admin', trim(p_first_name));

  return v_household_id;
end;
$$;

-- Une nouvelle fonction reçoit les droits par défaut : on remet les mêmes restrictions qu'avant.
revoke execute on function public.create_household(text, smallint, text) from public, anon;
grant execute on function public.create_household(text, smallint, text) to authenticated;
