# Moteur d'épisode : la mise en scène en données

Une seule composition (`src/engine/Episode.tsx`) fabrique **toutes** les vidéos. Elle lit `content/episodes/<id>.json` : la narration, les annotations, les chapitres et le champ **`staging`** (la mise en scène). Un fichier d'épisode doté d'un `staging` devient automatiquement une composition Remotion (`src/engine/episodes.ts`), sans toucher au code.

Pour une nouvelle vidéo, on écrit donc :

1. le fichier d'épisode (texte, sources, mise en scène) ;
2. le décor, s'il n'existe pas encore : `src/voxel/decor/<sujet>.ts` (voxels, `docs/maquettes.md`) + `src/voxel/decor/<sujet>.scene.ts(x)` (branchement) + une ligne dans `src/voxel/decor/scenes.ts`.

Aucun autre code. Modèles complets : `content/episodes/immeubles-paris.json`, `fonds-marins.json`, `hublots-ronds.json`. Le moteur a été validé le 25 octobre 2026 en refaisant les deux premiers épisodes : images identiques à leur ancienne version codée à la main (écart moyen ≈ 2/255, le niveau du grain).

`npm run verify` contrôle la mise en scène (`scripts/lib/staging.cjs`) : décor du registre, repères de temps sur des passages et des mots réellement prononcés, poses connues, chaque annotation de l'épisode affichée et chaque `id` cité existant.

## 1. Repères de temps

Tout moment est un repère tiré de la voix, jamais un temps fixe :

| Repère | Sens |
|---|---|
| `"start"`, `"end"` | début, fin de la vidéo |
| `"sonar"` | début du passage `sonar` |
| `"sonar.end"` | fin de la voix du passage |
| `"lumiere:200"` | instant où le mot « 200 » est prononcé dans `lumiere` (comparaison sans majuscules ni ponctuation) |
| `"regle:20#2"` | 2ᵉ occurrence du mot |
| `"fosse:000-4"`, `"pression+20"` | décalage en images, toujours à la fin |
| `"sonar+6..resultat+46@0.5"` | point à 50 % entre deux repères (mouvements découpés en phases) |

Nombre écrit « 3 000 » : la voix le découpe en « 3 » et « 000 » ; viser « 000 ». Un mot contenant un tiret suivi de chiffres s'écrit avec son occurrence (`"x:COVID-19#1"`).

## 2. Nombres et expressions

Partout où un nombre est attendu (coordonnées, distances, valeurs), on peut écrire une **expression** : `"CUT_FACE + 0.4"`, `"ship.x - 2.2"`, `"seabedY(ship.x - 3)"`, `"1 + v / 10"`. Opérateurs `+ - * /`, parenthèses ; fonctions `sqrt abs sin cos min max floor round clamp(x,a,b) step(x)` (1 si x > 0) `ramp(x,a,b,v0,v1)` (passage linéaire borné) et la constante `PI`.

Variables disponibles :

- les **constantes et fonctions du décor** (`context` de son fichier `.scene`) : ex. `CUT_FACE`, `TOP`, `FACADE`, `OPPOSITE` (rue), `HALF`, `SLAB`, `MID_Z`, `TRENCH_X`, `depthToY`, `yToDepth`, `seabedY` (océan), `RADIUS`, `ROOF`, `ADF_X`, `WING_TOP`, `TANK_FLOOR` (avion) ;
- la position de chaque **objet** déjà calculé : `ship.x`, `sub.y`… (dans l'ordre de `objects`) ;
- le hibou : `owl.x`, `owl.y`, `owl.z` (pour la caméra et les effets) ;
- la caméra : `cam.x`, `cam.y`, `cam.z` (point visé), `cam.distance` (pour les effets).

Coordonnées : Three.js, en mètres de maquette (X horizontal le long du sujet, Y en haut, Z vers la caméra).

## 3. Valeurs animées

Une **clé** : `{"at": repère, "v": valeur, "ease": courbe}`. La valeur est atteinte au repère, en arrivant depuis la clé précédente avec la courbe ; avant la première clé, première valeur ; après la dernière, dernière valeur. Pour un vecteur, `null` sur un axe = axe non réglé par cette clé (`{"at": "…@0.56", "v": [null, null, 4.8]}`).

Courbes : `smooth` (défaut des mouvements), `linear`, `out` (apparitions), `in` (départs), `quad`, `back` / `back:1.8` (dépasse puis se pose : ce qui pousse, ce qui arrive), `backIn` / `backIn:1.4` (prend de l'élan : ce qui disparaît).

**Fenêtre d'apparition** (annotations, habillage, effets) : `"in"` (repère), `"inFor"` (images, défaut 14 ou 12), `"ease"`, `"out"`, `"outFor"` (défaut 10), `"outEase"` (défaut `linear`). Sans `in` : visible dès le début ; sans `out` : jusqu'à la fin. Une annotation peut aussi avoir `"windows": [ {in, out…}, … ]` (la plus visible l'emporte), multipliée par sa propre fenêtre.

## 4. `staging` : la référence

```jsonc
"staging": {
  "composition": "FondsMarins",        // identifiant Remotion (lettres et chiffres)
  "decor": "ocean",                    // clé du registre src/voxel/decor/scenes.ts
  "hookExit": "pression",              // facultatif : fin de l'accroche (défaut : début du 2e passage)
  "objects": [ … ],                    // pièces du décor animées
  "camera": [ … ],                     // plans enchaînés
  "owl": { … },                        // places, poses, sauts
  "annotations": [ … ],                // traits posés sur la 3D
  "widgets": [ … ],                    // habillage chiffré
  "effects": [ … ]                     // effets 2D projetés
}
```

Les chapitres de l'épisode acceptent `"ruleAt": [repère, repère]` : instants d'apparition des deux moitiés de leur `rule`.

### 4.1 `objects` — animer les pièces du décor

Chaque pièce du décor (`build` du fichier `.scene`) s'affiche d'office à sa place, sauf celles marquées `onlyIfStaged` (bassin, sous-marin, panneaux…), qui n'apparaissent que citées ici. Un objet :

| Champ | Effet |
|---|---|
| `id` | nom dans les expressions (`ship.x`) ; `part` = pièce affichée (défaut : `id`) — une même pièce peut servir plusieurs fois (`fish1`, `fish2`) |
| `from`, `until` | visible entre ces repères |
| `position` | position de base (défaut : celle de la pièce) |
| `move` | clés de position absolue |
| `path` | trajet `{points: [[a, b]…], axes: "xy", progress: [clés 0→1]}` sur une ligne brisée |
| `waves` | oscillations `[{axis, amp, period, phase}]` (tangage, nage, flottement) |
| `loop` | défilement `{axis, speed, length}` (poisson qui passe) |
| `rotation`, `rotate`, `spin` | rotation de base, clés, rotation continue `{axis, period}` |
| `scale`, `scaleY` | clés d'échelle uniforme, de hauteur (bâtiment qui pousse, gonflage) |
| `pivot` | point fixe des rotations et échelles (bas d'un mur, fond d'un bassin) |
| `opacity` | clés (mur qui s'efface, eau translucide à 0,4) |
| `reveal` | pièces en tronçons : part visible 0→1 (bande cartographiée, fissure qui avance) |

### 4.2 `camera` — plans enchaînés

```jsonc
{"at": "lumiere-4", "duration": 34, "ease": "smooth",
 "shot": {"target": [-2, -52, "MID_Z"], "yaw": 10, "pitch": 2, "distance": 252, "fov": 26, "centerY": 980},
 "travel": {"from": "lumiere+30", "to": "radio", "yaw": 6},   // glissé pendant le plan tenu
 "sway": {"yaw": 2, "period": 60},                           // balancement
 "drift": 1,                                                  // dérive flottante (style B)
 "punch": {"at": ["regle:20#2"], "zoom": 0.88}}               // zooms secs (style D)
```

Le premier plan vaut dès l'image 0 ; chaque plan suivant s'y mélange à partir de son repère, sur `duration` images (0 = coupe franche). Le point visé peut suivre un objet (`["sub.x", "sub.y + 1", "sub.z"]`) ou le hibou (`["owl.x", "owl.y + 1", "owl.z"]`). Valeurs usuelles : `docs/mise-en-scene.md` § 3.

### 4.3 `owl`

```jsonc
"owl": {
  "spots": [{"at": "start", "position": ["ship.x - 2.2", 1.25, "ship.z + 0.4"], "height": 2.4}, …],
  "poses": [["start", "wonder", 0], ["pression+14", "pointLeft", -1], …, ["abonne", "wave", 0]],
  "hops": ["pression:atmosphère", "fosse:000", …]
}
```

Places : il disparaît 6 images avant chaque changement et réapparaît en 8 ; une place peut suivre un objet. Poses : `idle`, `wonder`, `pointLeft`, `pointRight`, `wave` ; le côté (−1, 0, 1) le tourne vers ce qu'il montre ; `wave` agite l'aile. Sauts : petits bonds sur les mots chiffrés. Clignements, respiration et mouvements de tête sont automatiques.

### 4.4 `annotations`

Texte : `"id"` d'une annotation de l'épisode (son `label`) ou `"text"` court (chiffres, « ? »). Tous les points sont des expressions.

| `kind` | Champs propres |
|---|---|
| `cote` | `from`, `to`, `offset` (px), `count: {to, suffix}`, `marks` (fractions) |
| `angle` | `corner`, `along`, `level` |
| `clue` | `from`, `to`, `badgeAt`, `badge` |
| `line` | `from`, `to`, `hot`, `dashed` |
| `path` | `points` (ligne brisée tracée progressivement), `hot`, `dashed` — lignes d'effort, contours, fissures |
| `tags` | `tags: [{at, id ou text, hot, in, out…}]`, chacune avec sa fenêtre, multipliée par celle du groupe |

### 4.5 `widgets` (habillage chiffré, `src/overlays/Widgets.tsx`)

| `kind` | Champs |
|---|---|
| `gauge` | jauge verticale à gauche : `value` (expression), `max`, `scale` (`linear`/`sqrt`), `unit`, `ticks: [[valeur, texte]]`, `second: {value (variable v), unit, hotAt}`, `note: {id, in, out}` |
| `badge` | grand chiffre central (`id`, `top`) ; `count: {from, to, suffix, until}` le fait défiler jusqu'à `until`, puis affiche l'étiquette |
| `bar` | barre de bilan (`id`, `value` 0 à 1) au-dessus des sous-titres |

### 4.6 `effects` (effets 2D, `src/overlays/Effects.tsx`)

| `kind` | Champs |
|---|---|
| `darkness` | obscurité `amount` (expression, ex. selon `cam.y`), percée autour de `hole` (point 3D), `radius`, teinte `role` (rôle voxel) |
| `waves` | ondes de `from` vers `to` (obstacle marqué en pointillé), `count`, `period` |
| `beam` | faisceau en éventail de `from` vers le segment `left`–`right`, impulsion de période `period` |

## 5. Contrat d'un décor (`<sujet>.scene.ts`)

```ts
export const monDecor: DecorScene = {
  context: {CONSTANTE: 12, fonction},           // utilisables dans les expressions
  build: (look) => ({                            // une fois par style
    piece1: {piece: {geometry, edges}},          // buildVoxelGeometry + edgesOf
    tronçons: {chunks: [...], onlyIfStaged: true},
    objet: {piece, position: [x, y, z], onlyIfStaged: true, drawn: {joint: 0}},
  }),
  drawn: {edgeWidth: 4, joint: 0.12, hatchDensity: 4.5, hatchStrength: 0.32},  // docs/rendu.md § 3.1
  Backdrop: Composant3D,                         // facultatif : eau, ciel… aux couleurs du style
};
```

Exporter dans `context` tous les repères utiles à la mise en scène (hauteurs, bords, fonctions de relief), avec un commentaire : c'est le vocabulaire que l'épisode utilisera.

## 6. Étendre le moteur

Un besoin que le format ne couvre pas (nouveau type d'annotation, d'effet, de geste) est un travail **global** : l'ajouter dans `src/engine` ou `src/overlays` de façon générique (aucun nom de sujet), le documenter ici et dans `scripts/lib/staging.cjs` si un champ de temps apparaît, et vérifier que les épisodes existants rendent toujours pareil. Exemple : `path` et le `count` des `badge` ont été ajoutés pour l'épisode des hublots, et servent à tout sujet.
