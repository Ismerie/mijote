<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Règles du projet Mijote

App de foyer : plats, planning de la semaine, liste de courses. PWA, V1 sans hors connexion.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (`src/components/ui`), Supabase (PostgreSQL, comptes, RLS).

## Rangement

- `src/app` : routage uniquement (`page.tsx`, `layout.tsx`…). Une page reste mince : elle charge les données et assemble les composants d'une feature.
- `src/features/<domaine>` : le métier (composants, Server Actions, requêtes, types, logique). Domaines : `auth`, `household`, `invitation`, puis `dish`, `ingredient`, `menu`, `groceries`. Nouveau domaine = nouveau dossier ici.
- `src/lib` : clients Supabase (`src/lib/supabase`) et utilitaires partagés entre domaines.

## Interface

- Tout écran ou composant visible suit la maquette : `docs/maquette/` (une capture par écran dans `ecrans/`, tableau écran → ticket dans le `README.md`). La lire avant de coder une interface.
- Le ticket fait foi sur le comportement et le périmètre ; la maquette, sur la disposition et les textes. En cas de contradiction, le signaler dans la PR.
- Composants shadcn/ui et couleurs du thème, pas de styles recopiés de la source de la maquette.

## Langue

- Code en anglais : tables, colonnes, fonctions, variables, composants, dossiers.
- En français : commentaires, textes affichés, adresses des pages (`/connexion`, `/foyer/inviter`).
- Vocabulaire : Foyer = `household`, membre = `member`, portions = `servings`.

## Supabase

- Appelé côté serveur uniquement : Server Components et Server Actions, via `src/lib/supabase/server.ts`.
- Toute table ou modification de schéma = une migration (`npm run db:migration -- nom_explicite`), jamais de modification à la main dans l'interface Supabase.
- Chaque table a des règles RLS qui limitent l'accès au foyer, et un test pgTAP dans `supabase/tests/`.

## Tests

- Logique métier pure (calculs, découpes, arrondis…) : test Vitest dans un fichier `*.test.ts` à côté du code.
- Règles d'accès de la base : pgTAP (`npm run test:db`, demande Docker et `npm run db:start`).

## Git

- Une branche par ticket : `feature/<n°>-<mot>` (ex. `feature/34-agents`).
- Commits Conventional Commits, en anglais, une ligne : `feat: …`, `fix: …`, `chore: …`.
- PR vers `main`, suivant `.github/pull_request_template.md`, avec `Closes #<n°>`.

## Commandes

```bash
npm run dev         # serveur de développement
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest
npm run build       # build de production
npm run db:start    # Supabase local (aussi db:stop, db:reset, db:status)
npm run test:db     # tests pgTAP
npm run db:migration -- nom   # nouvelle migration ; db:push l'applique en ligne
```

## Fini, c'est

- lint, typecheck, test et build passent en local ;
- CI verte sur la PR (workflows « App » et « Base de données ») ;
- critères d'acceptation du ticket cochés.
