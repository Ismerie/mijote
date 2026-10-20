-- Lecture d'une invitation par la personne invitée (#8).
-- Elle n'est pas encore membre du foyer, donc les règles RLS l'empêchent de lire l'invitation :
-- cette fonction lui renvoie seulement le nom du foyer et l'état du lien, rien d'autre.
create function public.get_invitation(p_code uuid)
returns table (household_name text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    h.name,
    case
      when i.used_at is not null then 'used'
      when i.expires_at < now() then 'expired'
      else 'valid'
    end
  from public.invitation i
  join public.household h on h.id = i.household_id
  where i.code = p_code;
$$;

-- Réservée aux comptes connectés, comme les autres fonctions du foyer.
revoke execute on function public.get_invitation(uuid) from public, anon;
grant execute on function public.get_invitation(uuid) to authenticated;
