# Système de design

Spécification du design **global** des vidéos, validée le 25 octobre 2026. Elle vaut pour tous les sujets.

## Principe : global d'un côté, décor de l'autre

| Global (ce document, `src/design`, `src/mascot`, `src/overlays`) | Propre au sujet (`src/voxel/decor`, épisode) |
|---|---|
| Les trois styles et leurs palettes | Le décor : immeuble, rue, atelier, port, machine, organe… |
| Les rôles de couleur des blocs voxel | Quels blocs, où, et quel rôle de couleur porte chaque bloc |
| Les polices | Les plans de caméra de la scène |
| Le hibou explorateur, ses poses et ses couleurs | Les annotations (cotes, angles, dates) accrochées au décor |
| L'habillage : titre d'accroche, voile, bandeau de chapitre, sous-titres, étiquettes d'annotation | Les textes, la voix, les sources |
| Les règles de rythme, de zones sûres et de lisibilité | |

**Règle** : les fichiers de style ne contiennent aucun nom, aucune couleur et aucun réglage propres à un décor. Aujourd'hui le décor est un immeuble haussmannien ; demain ce sera autre chose, et les trois styles doivent fonctionner sans modification. Un nouveau décor :

- se construit en voxels dans `src/voxel/decor/<sujet>.ts`, en voxels fins de 25 cm avec occlusion ambiante, au niveau de détail de `haussmann-fin.ts` (signature réelle du sujet, mobilier dans les coupes) ;
- colore ses blocs **uniquement** avec les rôles de couleur ci-dessous (jamais un code couleur en dur) ;
- est vérifié dans les trois styles avant d'être utilisé.

Si un décor semble exiger une nouvelle couleur, on ajoute un **rôle générique** (utile à d'autres sujets) dans les trois styles à la fois, jamais une couleur « immeuble » ou « bateau ».

## Les trois styles

Les trois sont officiels et sont des **options** : **chaque vidéo choisit le sien** (`"look"` dans son fichier d'épisode), pour varier ce que voit le public. Aucun n'est prioritaire. Une vidéo peut aussi être rendue dans un autre style sans modifier son fichier : `npm run render -- --compositions=<Id> --look=B` (propriété `look` dans Remotion Studio) ; décor, mise en scène et voix ne changent pas.

| | **A · Atelier** | **B · Veillée** | **D · Zinc & craie** |
|---|---|---|---|
| Ambiance | maquette au soleil de fin d'après-midi | nuit, lumières allumées, intime | affiche d'un matin clair, graphique |
| Fond | crème `#F4EAD8` | nuit `#1C1430` | ciel `#CADCE4` |
| Palette | crème, pierre `#E3C9A0`, bois `#A9693D`, encre `#3A2619`, zinc `#6E7B85`, terracotta `#C4553A`, ambre `#EFA733` | nuit, prune `#46305F`, lavande `#9883C2`, lune `#FBEBD0`, ambre `#FFB547`, rose `#EE7B8C` | craie `#F6F2EA`, ciel, pierre `#E8D8BC`, zinc `#74879A`, noir `#15171C`, tomate `#E8432D`, ambre `#F3A21E` |
| Titres | Fraunces (accent en italique) | Baloo 2 | Anton, en capitales |
| Texte | Atkinson Hyperlegible | Nunito | Inter |
| Caméra | travelling lent, glissés | dérive flottante, rapprochements | plans fixes, coupes franches, zooms secs |
| Hibou | plumage bois, masque crème | plumage prune, écharpe rose, yeux et loupe lumineux | plumage noir, masque craie |

Valeurs exactes : `src/design/looks.ts`. Polices : `public/fonts` (licences OFL incluses).

## Rôles de couleur des blocs voxel

Chaque style donne une couleur à chaque rôle ; un décor n'utilise que ces noms.

| Rôle | Usage générique |
|---|---|
| `structure`, `structureAlt` | volumes principaux (murs, coques, troncs de machines…) |
| `trim` | arêtes, bordures, moulures claires |
| `metal` | couvertures, métal clair |
| `dark` | détails sombres, ferronneries, contours |
| `glass` | vitrages, surfaces transparentes |
| `light` | lumières allumées (émissif) |
| `ground`, `groundEdge`, `path`, `marking` | sol, bordures, chemins, marquages |
| `base` | socle de la maquette |
| `interior`, `interiorAlt` | parois intérieures vues en coupe |
| `focus` | élément mis en valeur pendant une explication |
| `floor` | planchers, sols intérieurs |
| `accent`, `accentLight` | touches colorées ou claires ; `accents` donne une suite pour varier des éléments répétés |
| `soft` | petits objets clairs |
| `foliage`, `wood` | végétation |
| `water`, `waterDeep` | eau, de la surface aux profondeurs (mer, rivière, bassin) |

L'ombrage des blocs (dessus éclairé, côtés à l'ombre, ombres portées) est précalculé par le moteur avec les réglages du style : les couleurs à l'écran restent celles de la palette.

## Rendu et finition

L'ombrage des blocs, la lumière fixe, l'occlusion ambiante et la finition **crayonné** (hachures, contours encrés, trait qui tremble, papier, grain) sont globaux et décrits avec leurs valeurs exactes dans `docs/rendu.md`. La finition est un choix de l'épisode (`"finish"`), indépendant du style ; validée en A, à vérifier en B et D avant usage. Construction des décors : `docs/maquettes.md`. Mise en scène : `docs/mise-en-scene.md`.

## Le hibou explorateur

Toujours présent, quel que soit le sujet. Version C « lisse stylisé » : formes rondes, ombrage doux, posé dans le décor voxel dont il se détache volontairement. Code : `src/mascot` (pièces animables, poses `wonder`, `pointRight`, `pointLeft`, `wave`, `idle`). Ses couleurs viennent du style, jamais du décor.

## Habillage commun

- **Accroche** : question centrée à l'écran, sur le décor visible mais atténué (voile de la couleur du fond, léger flou) ; voile et flou se lèvent quand la réponse commence ; la première image sert de couverture.
- **Bandeau de chapitre** en haut à gauche, puis la règle ou le repère du chapitre sur une seconde ligne.
- **Sous-titres** mot à mot dans un encadré clair centré ; mots à venir atténués, mot clé surligné à l'instant où il est dit.
- **Annotations** posées sur la 3D, au mot prononcé, dans le dessin d'étiquette du style.
- **Zones sûres** : rien d'important dans les 200 px du haut, les 360 px du bas, les 140 px de droite ; marge gauche 64 px.
