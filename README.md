# Mijote

Les plats, le planning de la semaine et la liste de courses d'un foyer, dans une app web installable sur téléphone (PWA).

- Roadmap : https://claude.ai/code/artifact/99f84f3b-a1c7-4c0a-bfc7-5c074664b5b7
- Modèle de données : https://claude.ai/code/artifact/fd329e4a-41b7-4055-9063-a74046213c2a
- Journal du workflow IA : [docs/workflow-ia.md](docs/workflow-ia.md)

## La stack

| Brique | Rôle | Pourquoi |
| --- | --- | --- |
| [Next.js 16](https://nextjs.org) (App Router) | Framework : pages, code serveur, build | Un seul code pour le site et le mobile, mise en ligne simple sur Vercel |
| [React 19](https://react.dev) | Bibliothèque d'interface (composants) | Installée avec Next.js, qui est construit dessus |
| [TypeScript](https://www.typescriptlang.org) | Langage | Les erreurs de types apparaissent avant de lancer l'app |
| [Tailwind CSS 4](https://tailwindcss.com) | Style, via des classes dans le JSX | Pas de fichiers CSS à maintenir à côté des composants |
| [shadcn/ui](https://ui.shadcn.com) | Composants prêts à l'emploi | Le code est copié dans `src/components/ui`, donc lisible et modifiable |
| [Supabase](https://supabase.com) | Base PostgreSQL, comptes, photos | Une base hébergée avec comptes et règles d'accès intégrés (RLS), branchée en J1 |
| [Vercel](https://vercel.com) | Hébergement | Mise en ligne automatique à chaque push, prévue dans J0 |

## Lancer le projet en local

Prérequis : Node.js 24 (la version est notée dans `.nvmrc`) et npm.

```bash
npm install     # télécharge les dépendances listées dans package.json vers node_modules/
npm run dev     # lance le serveur de développement sur http://localhost:3000
```

En mode dev, la page se recharge toute seule à chaque fichier enregistré.

Pour tester sur ton téléphone, il doit être sur le même Wi-Fi que l'ordinateur. Ouvre alors l'adresse « Network » que `npm run dev` affiche, par exemple `http://192.168.1.12:3000`. L'installation sur l'écran d'accueil, elle, ne marche qu'en HTTPS, donc une fois le site en ligne.

## Base de données (Supabase)

L'app lit ses clés Supabase dans `.env.local`, un fichier qui n'est jamais commité :

```bash
cp .env.example .env.local   # puis remplis les deux valeurs (Supabase > Project Settings > API Keys)
```

Les tables sont décrites par des fichiers SQL dans `supabase/migrations/`, appliqués avec la CLI Supabase (installée dans le projet, d'où le `npx`) :

```bash
npx supabase login                         # une fois : ouvre le navigateur pour te connecter
npx supabase link --project-ref <ref>      # une fois : relie le dossier à ton projet en ligne
npm run db:push                            # applique à la base en ligne les migrations pas encore passées
npm run db:migration -- nom_explicite      # crée un nouveau fichier de migration vide
```

Le `<ref>` est l'identifiant du projet, visible dans son adresse : `https://<ref>.supabase.co`. On ne modifie jamais une table à la main dans l'interface Supabase : chaque changement passe par une migration, pour que le dépôt reste la source de vérité.

La page `/statut` affiche une valeur lue en base : c'est le test que tout est bien branché.

### Tester les règles d'accès

Les tests de la base sont des fichiers SQL dans `supabase/tests/`, écrits avec [pgTAP](https://pgtap.org). Ils vérifient par exemple qu'un compte ne lit pas le foyer d'un autre. Ils tournent dans une base Supabase locale et jetable, jamais sur la base en ligne, et demandent Docker (Docker Desktop lancé) :

```bash
npm run db:start    # démarre Supabase en local (base, API, comptes) et applique les migrations
npm run test:db     # lance les tests de supabase/tests/
npm run db:reset    # repart d'une base locale vide et rejoue toutes les migrations
npm run db:status   # affiche l'URL et les clés de la base locale (pour .env.local)
npm run db:stop     # arrête Supabase en local
```

GitHub les lance aussi automatiquement sur chaque pull request (`.github/workflows/database.yml`).

## Les autres commandes

```bash
npm run lint        # ESLint vérifie le code (erreurs fréquentes, règles React et Next.js)
npm run typecheck   # TypeScript vérifie les types, sans rien construire
npm test            # lance les tests Vitest (fichiers *.test.ts à côté du code)
npm run build       # construit la version de production, comme le fera Vercel
npm run start       # sert cette version de production en local (après un build)
```

Lance-les avant de pousser : GitHub les relance sur chaque pull request (`.github/workflows/app.yml`), et si le build échoue en local, il échouera aussi sur Vercel.

## Comment le projet a été créé

Chaque étape est à refaire telle quelle si tu repars de zéro.

**1. Créer le projet Next.js**

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --yes
```

- `npx` exécute un paquet npm sans l'installer globalement, ici le générateur `create-next-app`, dans sa dernière version (`@latest`).
- `.` crée le projet dans le dossier courant (le dépôt cloné) plutôt que dans un sous-dossier.
- `--ts` active TypeScript, `--tailwind` installe Tailwind et `--eslint` installe le vérificateur de code.
- `--app` utilise l'App Router, où chaque dossier de `src/app` devient une adresse.
- `--src-dir` range le code dans `src/`, séparé des fichiers de configuration.
- `--import-alias "@/*"` permet d'écrire `@/components/...` au lieu de `../../components/...`.
- `--use-npm` choisit npm comme gestionnaire de paquets et `--turbopack` le compilateur rapide de Next.js.
- `--yes` accepte les choix par défaut pour les questions restantes.

**2. Installer shadcn/ui**

```bash
npx shadcn@latest init -d     # configure shadcn (components.json, couleurs dans globals.css, src/lib/utils.ts)
npx shadcn@latest add button  # copie le composant Button dans src/components/ui/button.tsx
```

`-d` garde les réglages par défaut. Pour ajouter un autre composant, utilise la même commande, par exemple `npx shadcn@latest add input`.

**3. Rendre l'app installable (PWA)**

Ces fichiers ont été écrits à la main :

- `src/app/manifest.ts` donne le nom, les couleurs et les icônes de l'app. Next.js le sert à l'adresse `/manifest.webmanifest`, et c'est ce fichier que le téléphone lit pour proposer l'ajout à l'écran d'accueil.
- `public/icons/` contient l'icône en SVG (la source) et en PNG 192 et 512 px, les tailles demandées par Android.
- `src/app/icon.svg` et `src/app/apple-icon.png` sont l'icône de l'onglet et celle de l'iPhone. Next.js les repère grâce à leur nom de fichier.
- `src/app/layout.tsx` déclare le titre, la couleur de la barre du téléphone (`themeColor`) et les réglages iPhone (`appleWebApp`).

Il n'y a pas de service worker (le script qui fait marcher une app hors connexion), car le hors connexion n'est pas prévu en V1.

Les PNG ont été générés depuis le SVG avec `sips`, l'outil d'images intégré à macOS :

```bash
sips -s format png -z 512 512 public/icons/icon.svg --out public/icons/icon-512.png
```

`-s format png` convertit en PNG et `-z 512 512` redimensionne (hauteur puis largeur).

## Organisation des fichiers

```
src/
  app/              une page par dossier : app/page.tsx est l'accueil « / »
    layout.tsx      le cadre commun à toutes les pages (html, polices, métadonnées)
    page.tsx        la page d'accueil
    manifest.ts     le manifest PWA
    globals.css     Tailwind et les couleurs du thème shadcn
  components/ui/    composants shadcn (ils t'appartiennent, tu peux les modifier)
  lib/utils.ts      cn(), une fonction qui combine des classes Tailwind
public/             fichiers servis tels quels (icônes)
```

### Langue du code

Le code est en anglais : tables, colonnes, fonctions, variables, composants, dossiers. Les commentaires, les textes affichés dans l'app et les adresses des pages (`/statut`) restent en français. Le vocabulaire suit le modèle de données : foyer = `household`, membre = `member`, portions = `servings`.

### Règle de rangement : `app/` pour les adresses, `features/` pour le métier

Dans `src/app`, Next.js reconnaît les fichiers à leur nom (`page.tsx`, `layout.tsx`, `manifest.ts`, `icon.svg`…), et leur emplacement décide de l'adresse à laquelle ils répondent. On n'y met donc que ce qui sert au routage.

Le code métier va dans `src/features/`, avec un dossier par domaine, qui suit les jalons de la roadmap :

```
src/features/
  auth/             J1 : connexion, inscription
  household/        J1 : foyer
  invitation/       J1 : invitations dans le foyer
  dish/             J2 : plats, recherche
  ingredient/       J2 : ingrédients
  menu/             J3 : semaine, repas, restes
  groceries/        J4 : liste générée, rayons, coches
```

Chaque domaine contient ses composants, ses requêtes Supabase et ses types. Une `page.tsx` reste mince : elle récupère les données et assemble les composants de la feature. Seul ce qui sert à plusieurs domaines va dans `src/components/` ou `src/lib/`.

Pour regrouper des pages sans changer leur adresse, on utilise des dossiers entre parenthèses, par exemple `app/(signed-in)/` pour les pages qui demandent d'être connecté. Ils arriveront en J1. Ces dossiers seront créés au fil des jalons, pas avant.

## Notes

- `AGENTS.md` et `CLAUDE.md` ont été créés par `create-next-app`. `AGENTS.md` contient le bloc de Next.js (lire la documentation de Next.js 16 dans `node_modules/next/dist/docs/`), suivi des règles du projet pour les agents IA. `CLAUDE.md` l'importe.
- `npm audit` signale 5 failles « high ». Elles se trouvent dans les outils ESLint, qui ne servent qu'au développement et n'arrivent jamais dans l'app en ligne. Le correctif proposé (`npm audit fix --force`) rétrograderait `eslint-config-next` vers la version 14, donc on attend une mise à jour de Next.js.
