# Maquette des écrans

Copie dans le dépôt de la maquette faite avec Isme (originale sur claude.ai : https://claude.ai/artifact/KnNGsHws6VtZVzQXVnD1v9), pour que les agents qui codent depuis un ticket puissent la consulter.

C'est un prototype mobile (390 × 844 px) cliquable. Les données affichées (plats, dates, Isme et Alex) sont fictives.

## Ce qu'il y a ici

- `ecrans/*.png` : une capture par écran, en pleine hauteur (tout le contenu, y compris ce qui défile). C'est la référence visuelle.
- `maquette.dc.html` : la source du prototype, à lire pour les textes exacts, les états (vide, coché, reporté…) et les styles (marges, tailles, couleurs). Elle ne s'ouvre pas seule dans un navigateur : elle a besoin du moteur de claude.ai. Pour cliquer dans le prototype, ouvrir le lien ci-dessus.

Si la maquette change sur claude.ai, il faut refaire la copie et les captures dans ce dossier.

## Comment s'en servir

- Toute interface suit la maquette : disposition, textes affichés, ordre des éléments, états.
- Le ticket fait foi sur le comportement et le périmètre. Si la maquette montre quelque chose de hors périmètre du ticket, on ne le fait pas. Si les deux se contredisent, on le signale dans la PR.
- On construit avec les composants shadcn/ui (`src/components/ui`) et Tailwind, pas en recopiant les styles en ligne de la source. Les couleurs passent par les variables du thème (`src/app/globals.css`), pas par des codes couleur dans les composants.

## Écrans

| Capture | Écran | Tickets |
|---|---|---|
| [01-menu-liste](ecrans/01-menu-liste.png) | Accueil : menu en cours, vue « En liste » : une carte par plat ajouté, case à trois états (à cuisiner, cuisiné, tout mangé), portions restantes, badges « Reporté » et « Reste » | #28, #30 |
| [02-menu-par-jour](ecrans/02-menu-par-jour.png) | Accueil, vue « Par jour » : les repas, case « mangé », badge « À cuisiner », « À placer » puis tous les jours du menu | #29 |
| [03-menu-deplacer-repas](ecrans/03-menu-deplacer-repas.png) | Vue « Par jour » après la poignée ⋮⋮ : boutons « Placer ici » | #29 |
| [04-preparer-menu-suivant](ecrans/04-preparer-menu-suivant.png) | Préparer le menu suivant : durée, repas à reporter en deux groupes (« Pas cuisinés », « Restes ») | #30 |
| [05-ajouter-choisir-plats](ecrans/05-ajouter-choisir-plats.png) | Ajouter au menu, étape 1 : choisir plusieurs plats | #28 |
| [06-ajouter-recap](ecrans/06-ajouter-recap.png) | Ajouter au menu, étape 2 : × N par recette (N cartes à cuisiner) et découpe en repas | #28 |
| [07-repas](ecrans/07-repas.png) | Fiche repas : « Plat cuisiné », « Séparer ce repas », jour et moment facultatifs, retirer le repas | #29 |
| [08-plats](ecrans/08-plats.png) | Onglet Plats : liste, recherche, badge « Au menu » | #25 |
| [09-fiche-plat](ecrans/09-fiche-plat.png) | Fiche du plat : portions, ingrédients, recette, macros | #25 (bouton « Ajouter au menu » : #28) |
| [10-modifier-plat](ecrans/10-modifier-plat.png) | Modifier un plat (et le supprimer, en bas) | #25 |
| [11-nouveau-plat](ecrans/11-nouveau-plat.png) | Nouveau plat | #25 |
| [12-ingredients](ecrans/12-ingredients.png) | Plats > Ingrédients : catalogue groupé par rayon | #26 |
| [13-fiche-ingredient](ecrans/13-fiche-ingredient.png) | Fiche ingrédient : rayon, façon d'acheter, toujours en stock | #26 |
| [14-courses](ecrans/14-courses.png) | Onglet Courses : lignes par rayon, paquets, « Courses terminées » | #32 |
| [15-foyer](ecrans/15-foyer.png) | Mon foyer : membres, nombre de personnes, jour des courses, durée du menu | #9, #28 |
| [16-inviter](ecrans/16-inviter.png) | Inviter dans le foyer | #8 (fait) |

Barre du bas commune à tous les écrans : Menu, Plats, Courses, Foyer.

## Repères visuels

Relevés dans la source, à reprendre dans le thème (ticket #17) :

- Police : Geist.
- Fond `#FAF8F4`, cartes `#FFFFFF` avec bordure `#E6E1D8`, texte `#1E1C19`, texte secondaire `#6B655C`.
- Couleur principale (boutons, onglet actif, cases cochées) : vert `#2E6A4C`, plus foncé au survol `#1F4D36`.
- Danger (supprimer) : `#A3341F`. Badges « Reporté » et « Reste » : fond `#F6E7D6`, texte `#5E3410`. Badge « À cuisiner » : fond `#ECE8E0`, texte `#4A453E`.
- Coins arrondis de 10 à 14 px. Zones touchables d'au moins 44 px de haut.
