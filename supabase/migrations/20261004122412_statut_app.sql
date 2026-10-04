-- Table de vérification de J1 (#3) : prouve que l'app lit bien la base en ligne.
-- Elle ne contient qu'un message public et pourra être supprimée une fois les vraies tables en place.
create table public.statut_app (
  cle text primary key,
  valeur text not null
);

alter table public.statut_app enable row level security;

-- Lecture ouverte à tous, y compris sans être connecté. Aucune écriture n'est autorisée depuis l'app.
create policy "statut_app lisible par tous"
  on public.statut_app
  for select
  to anon, authenticated
  using (true);

insert into public.statut_app (cle, valeur)
values ('message', 'Mijote est reliée à sa base de données.');
