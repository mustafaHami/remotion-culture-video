# Maquettes : construire le décor d'un sujet en voxels

Règle validée le 25 octobre 2026 : **chaque décor est une maquette détaillée en voxels fins, qui reproduit la signature réelle de son sujet**. Modèles de référence : `src/voxel/decor/haussmann-fin.ts` (immeuble haussmannien et sa rue), `src/voxel/decor/ocean.ts` (l'océan en coupe) et `src/voxel/decor/avion.ts` (avion de ligne des années 1950, bassin d'essai, panneaux agrandis). Ce document dit comment en construire un nouveau, pour n'importe quelle notion. Le rendu (ombres, AO, trait) est dans `docs/rendu.md`.

## 1. Où vit quoi

| Fichier | Contenu | Règle |
|---|---|---|
| `src/voxel/grid.ts` | `VoxelGrid` : `set`, `delete`, `has`, `occupied`, `voxels`, `filter`, `merge` ; `toThree` | global, ne pas spécialiser |
| `src/voxel/geometry.ts` | `buildVoxelGeometry` (faces visibles, ombrage, AO) | global |
| `src/voxel/decor/<sujet>.ts` | les fonctions qui remplissent une grille pour ce sujet, ses constantes (dimensions réelles), ses fonctions de passage (ex. `depthToY`) | propre au sujet ; **uniquement des rôles de couleur** |
| `src/voxel/decor/<sujet>.scene.ts(x)` | branchement sur le moteur : pièces construites par style, constantes et fonctions exposées à la mise en scène, réglages du trait, fond non voxel | propre au sujet (`docs/moteur.md` § 5) |
| `src/voxel/decor/scenes.ts` | registre des décors (une ligne par décor) | |
| `src/design/looks.ts` | les rôles de couleur des trois styles | global ; un rôle nouveau s'ajoute aux trois styles à la fois, avec un nom générique |

Un décor ne contient ni caméra, ni texte, ni minutage : seulement de la géométrie et, si utile, des constantes de repère exportées (hauteurs, positions) que la mise en scène réutilise pour placer la caméra, le hibou et les annotations.

## 2. Coordonnées et unités

- **Plan** (dans la grille) : `x` = profondeur, vers la caméra (la rue, le spectateur) ; `y` = le long du sujet (horizontale à l'écran) ; `z` = hauteur. Indices entiers, de −1024 à 1023 par axe.
- **Three.js** (scène, caméra, annotations) : `X = y plan`, `Y = z plan`, `Z = x plan` (`toThree`). Mètres de maquette après application de `scale`.
- **Taille d'un voxel** : `UNIT = 0.25` (25 cm) pour tout ce qui porte des détails (bâtiments, machines, véhicules, objets, animaux). `0.5` admis pour un **terrain** très grand (relief, fond marin) ou un astre lointain. Ne jamais revenir aux voxels de 1 m (`haussmann.ts`, gardé pour l'essai historique).
- Toutes les dimensions sont des **constantes nommées**, exprimées en voxels avec leur valeur réelle en commentaire (`/** Haut de la façade : 80 voxels = 20 m. */`). Les vraies proportions du sujet viennent des sources de l'épisode.
- **Échelle schématique** : autorisée quand l'échelle réelle rendrait une étape illisible (ex. 200 m et 11 km sur le même écran). Elle doit être une fonction simple, documentée en tête du décor, avec sa réciproque (`depthToY(d) = −√d`, `yToDepth`), et **les nombres affichés restent les valeurs réelles** (compteurs, jauges). Ne jamais présenter une échelle déformée comme exacte.

## 3. Méthode de construction

### 3.1 Trouver la signature du sujet

Avant d'écrire du code, lister ce qui fait qu'on **reconnaît** le sujet au premier regard, puis ce qui sert l'explication. Exemple de l'immeuble haussmannien :

- proportions : 20 m de façade, rez-de-chaussée + entresol + étage noble + 3 étages, comble à 45° ;
- saillies : balcons filants au 2e et au 5e sur consoles, corniche à modillons, bandeaux ;
- creux : fenêtres en embrasure de 50 cm, refends du soubassement (un joint creux tous les mètres) ;
- ornements : encadrements en pierre claire, frontons une travée sur deux à l'étage noble, garde-corps en fer forgé ;
- matériaux : pierre (`structure`), zinc (`metal`), ferronnerie (`dark`), vitrages (`glass`) ;
- vie : boutiques avec stores rayés, porte cochère, lampadaire, platane, souches de cheminée et mitrons ;
- coupe : planchers et mobilier différent à chaque étage (comptoir, bureau, salon à lustre, chambre, salle à manger, bibliothèque, chambre de bonne).

Exemple de l'océan : plateau continental, talus, plaine abyssale, mont sous-marin, fosse ; tranche en couches de sédiments puis roche ; navire de recherche avec passerelle, mât, portique en A et sondeur sous la coque ; submersible à hublot et projecteurs ; satellite à panneaux solaires ; Lune quadrillée (cartographiée) ; poisson, méduse, poisson-lanterne aux bonnes profondeurs.

Le niveau visé est celui-là : **chaque élément réel qui se verrait à 25 cm près est représenté**. On reste une maquette stylisée : ni photoréalisme, ni texture, ni dégradé dans un bloc.

### 3.2 Outils de remplissage

Chaque décor définit ses petits outils (voir les deux modèles) :

```ts
const box = (g, x0, x1, y0, y1, z0, z1, m) => { for (x…) for (y…) for (z…) g.set(x, y, z, m); };
const clear = (g, x0, x1, y0, y1, z0, z1) => { …g.delete(x, y, z); };
```

On procède comme un maquettiste : volumes pleins d'abord, puis on **creuse** (`clear` pour les embrasures, joints, portes), puis on **ajoute** les saillies (`box` devant la façade), puis le mobilier. Une forme courbe (houppier, coque, Lune) se fait par équation (distance au centre, `Math.round`), avec un bord irrégulier stable (hachage des coordonnées, jamais `Math.random`).

### 3.3 Matières

- Un voxel a un rôle (`'structure'`) ou un rôle par orientation de face (`{t: 'structure', x: 'interior', y: 'structure'}`) : c'est ainsi qu'un mur coupé montre la couleur de la pièce côté intérieur et la pierre sur sa tranche.
- Alterner `structure` / `structureAlt` (option `tone`) pour distinguer des volumes voisins identiques.
- Éléments répétés (stores, bandes) : `theme.accents[i % theme.accents.length]`.
- Mise en valeur pendant l'explication : rôle `focus` ou `accent` (ex. bandes cartographiées en `accent`).
- Rôles disponibles et usage : `docs/design-system.md`. Jamais de code `#` dans un décor.

### 3.4 Coupe « maison de poupée »

- Le côté ouvert de la coupe fait face à la caméra (côté +y ou +x selon le sujet).
- Un **mur amovible** (`fineSideWall`) recouvre la coupe au début et se soulève quand l'explication entre dans le bâtiment : grille séparée, ombres calculées avec la scène (`occluders`).
- Chaque étage ou pièce de la coupe correspond à une étape de l'explication et porte son mobilier.
- Pour un sujet sans intérieur (relief, océan, ciel) : une **tranche** (`SLAB`) dont la face avant montre les couches (strates, roche), et le reste en coque.

### 3.5 Découper en pièces animables

Tout ce qui bouge indépendamment est une grille séparée, transformée en géométrie à part : chaque immeuble (pour varier sa hauteur), le mur amovible, l'immeuble d'en face (qui pousse du sol), le navire, le sous-marin, les bandes cartographiées (en tronçons qui apparaissent un à un). Les pièces fixes partagent l'ombre de la scène complète ; les objets mobiles n'ont pas d'ombre portée (`occluders: null`). Chaque objet a une **origine documentée** (« milieu de la coque, au niveau de la ligne de flottaison ») pour être placé facilement.

### 3.6 Contexte qui sert la mesure

Ajouter les éléments qui permettent de **montrer** un chiffre : l'immeuble d'en face pour mesurer 22 m de rue, la Lune pour comparer la cartographie, le navire pour donner l'échelle de la surface. Ils peuvent apparaître et disparaître (voir `docs/mise-en-scene.md`).

### 3.7 Performance

- Ne remplir que ce qui se voit : une coque et la tranche visible (`oceanFloor` ne garde que les 3 couches du dessus à l'intérieur).
- Construire les grilles et géométries une seule fois par style (`useMemo(() => build(look), [look])`).
- Ajuster `shadowTop` / `shadowSteps` à la hauteur réelle du décor (en voxels).

## 4. Contrôle d'un décor

Avant de l'utiliser dans un épisode :

1. Composition d'essai à une image par angle (modèle : `EssaiImmeubleFin`, `FINE_SHOTS`), rendue avec `npm run stills`.
2. Vérifier en images : la signature est reconnaissable, les détails tiennent à la taille téléphone, les ombres et l'AO donnent du volume, rien n'est magenta (`#FF00FF` = rôle inconnu).
3. Vérifier dans les trois styles (au moins une image chacun), et dans la finition choisie.
4. Pas de face parasite ni de trou dans la coque, aux angles de caméra prévus.

## 5. Défauts connus à éviter

- Gros plans sur des parois de terrain en voxels de 50 cm : l'escalier se voit beaucoup. Garder la caméra assez loin ou affiner localement.
- Échelle trop déformée : les objets (sous-marin) se retrouvent dans le relief ; tracer les trajets d'après la fonction du fond (`seabedY`) avec une marge.
- Contexte qui masque le sujet (immeuble d'en face devant la façade) : le faire disparaître avant les plans qui ont besoin de la vue.
