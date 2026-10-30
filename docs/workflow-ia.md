# Journal du workflow IA

Mijote est aussi mon projet portfolio pour me former à l'AI engineering. Ce journal raconte comment je fais travailler des agents IA (Claude) sur le dépôt : ce que j'ai mis en place, pourquoi, et ce que j'en retiens.

## Objectif

Confier à des agents des tickets entiers (code, tests, PR) sans perdre la main sur la qualité. Deux idées guident le parcours :

- un agent ne vaut que par le **contexte** qu'on lui donne : les règles du projet doivent être écrites dans le dépôt, pas dans ma tête ;
- il lui faut des **filets** qui l'arrêtent quand il se trompe : types, tests et CI obligatoire avant toute fusion.


## Le parcours

1. **#34 Dépôt prêt pour les agents** : règles du projet dans `AGENTS.md`, CI de l'app, tests Vitest, modèle de PR.
2. **#35 Claude sur les tickets et les PR** : un agent prend un ticket, ouvre la PR, répond aux revues.
3. **#36 Routines** : des tâches récurrentes confiées à des agents planifiés.
4. **#37 / #38 Une fonction IA dans l'app**, après la V1.

## Entrées

### 2026-10-24 · #34 Dépôt prêt pour les agents

**Ce qu'on a mis en place**

- `AGENTS.md` : à la suite du bloc géré par Next.js, les règles du projet (stack, rangement `app/` / `features/`, langue, Supabase côté serveur, migration + RLS + pgTAP, Git, commandes, définition de « fini »). `CLAUDE.md` l'importe, donc Claude Code le lit à chaque session.
- `npm run typecheck` (`tsc --noEmit`) : les erreurs de types sortent sans lancer le build.
- Vitest et `npm test`, avec un premier test sur `src/features/auth/next-path.ts` (la protection contre les redirections vers un autre site).
- `.github/workflows/app.yml` : lint, types, tests et build sur chaque PR et sur `main`, à côté de `database.yml` qui teste déjà les règles d'accès.
- `.github/pull_request_template.md` : ticket lié, ce qui change, comment vérifier.

**Pourquoi**

Jusqu'ici, les règles du projet n'existaient que dans le README et dans nos conversations : un agent qui arrivait sans contexte ne savait pas où ranger un domaine ni en quelle langue écrire. Et rien ne vérifiait le code TypeScript automatiquement, alors que J3 et J4 contiennent de la logique facile à rater (portions, calcul des courses, arrondi aux paquets). Avec la CI obligatoire sur `main`, une PR d'agent qui casse les types ou un test ne peut plus être fusionnée.

**Comment c'est fait**

Le ticket a été réalisé par Claude Code sur mon ordinateur, piloté depuis une conversation de projet : il expliquait chaque étape et me demandait mon accord avant chaque commit et push.
