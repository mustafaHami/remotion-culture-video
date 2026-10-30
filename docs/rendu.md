# Rendu : lumière, ombrage des blocs, trait crayonné

Ce document décrit **comment l'image est fabriquée**, avec les valeurs exactes. Il vaut pour tous les sujets : le moteur d'épisode (`docs/moteur.md`) applique ces réglages à chaque vidéo ; ce document sert à les comprendre et à régler un décor. Les styles (couleurs, polices) sont dans `docs/design-system.md` ; la construction des décors dans `docs/maquettes.md` ; la mise en scène dans `docs/mise-en-scene.md`.

## 1. Principe : aucune lumière temps réel sur le décor

Le décor voxel n'est **pas** éclairé par Three.js. Chaque face de bloc reçoit une couleur **précalculée** (orientation, ombre portée, occlusion ambiante, variation de teinte), stockée dans les couleurs de sommets, puis affichée telle quelle (`MeshBasicMaterial`, `vertexColors`, `toneMapped: false`). Conséquences :

- les couleurs à l'écran sont exactement celles de la palette du style, d'une image à l'autre ;
- le rendu est déterministe et identique sur toutes les machines ;
- seul le hibou est éclairé (formes lisses, voir § 5).

Réglages du `ThreeCanvas` (obligatoires) :

```tsx
<ThreeCanvas width={WIDTH} height={HEIGHT} linear flat gl={{antialias: true, preserveDrawingBuffer: true}} style={{position: 'absolute', filter: `url(#dessin-wobble) blur(${hookBlur(titleExit)}px)`}}>
```

- `linear` + `flat` : pas de conversion sRGB ni de tone mapping ; les codes hexadécimaux passent tels quels. Toute couleur Three.js se crée avec `new THREE.Color().setRGB(r/255, g/255, b/255, THREE.LinearSRGBColorSpace)`.
- Moteur OpenGL `angle` (CLI et Studio via `remotion.config.ts` ; rendu programmatique : `chromiumOptions: {gl: 'angle'}`).

## 2. Ombrage des blocs (`src/voxel/geometry.ts`)

`buildVoxelGeometry(grid, look.voxel, options)` ne crée que les faces visibles (une face touchant un voisin plein est supprimée) et calcule la couleur de chacune.

### 2.1 Orientation des faces

Notations : `b` couleur de base du rôle, `hi`, `ink`, `topK`, `xK`, `yK` réglages du style (`look.voxel`), `mix(a, c, k)` mélange linéaire.

| Face (plan) | Couleur | Reçoit l'ombre portée |
|---|---|---|
| Dessus (+z) | `mix(b, hi, topK)` (émissif : 0,05) | oui |
| Côté +x (vers la caméra, la rue) | `xK ? mix(b, ink, xK) : b` | oui |
| Côté +y | `mix(b, ink, yK)` (émissif : 0,12) | non |
| Côté −y | `mix(b, hi, topK × 0,4)` | oui |
| Côté −x | `mix(b, ink, yK + 0,08)` (émissif : 0,12) | non |
| Dessous (−z) | `mix(b, ink, 0,5)` | non |

Réglages par style :

| | `hi` | `topK` | `ink` | `xK` | `yK` | ombre `shadow` | `shK` | `jitter` | rôles émissifs |
|---|---|---|---|---|---|---|---|---|---|
| A | `#FFF7E8` | 0,20 | encre `#3A2619` | 0 | 0,30 | `#5A3A48` | 0,36 | 0,025 | `light` |
| B | lune `#FBEBD0` | 0,14 | nuit `#1C1430` | 0,06 | 0,42 | nuit | 0,42 | 0,02 | `light`, `interior`, `interiorAlt`, `focus` |
| D | `#FFFFFF` | 0,28 | noir `#15171C` | 0 | 0,34 | `#2B3550` | 0,34 | 0,012 | `light` |

Un rôle émissif n'est ni ombré, ni assombri par l'occlusion, ni bruité : c'est ce qui fait « briller » les fenêtres en B.

### 2.2 Ombre portée

- Direction de la lumière (vers la source), en coordonnées plan : `LIGHT = [0.35, -1, 1.5]`. La lumière vient d'en haut, un peu de face et du côté −y : c'est la même dans tous les sujets, ne pas la changer.
- Pour chaque face qui peut la recevoir, un rayon part du centre de la face (décalé de 0,52 voxel vers l'extérieur) vers la lumière, par pas de 0,45 voxel. S'il touche un voxel de `occluders`, la face prend `mix(couleur, shadow, shK)`.
- `shadowTop` (défaut 30) : hauteur en voxels au-delà de laquelle on arrête de chercher ; `shadowSteps` (défaut 70) : nombre de pas. **À adapter à la taille du décor** : avec des voxels de 25 cm, un immeuble de 20 m fait 80 voxels de haut. Valeurs utilisées : rue fine `shadowTop: 118, shadowSteps: 190` ; fond océanique `shadowTop: 0, shadowSteps: 80`.
- `occluders` : par défaut la grille elle-même. Pour un décor découpé en pièces séparées (pour les animer), passer la **scène complète** en `occluders` de chaque pièce, afin que les ombres tombent d'une pièce sur l'autre. `null` = aucune ombre (objets qui bougent : navire, satellite, poissons).
- Les blocs sous `z = -1` ne reçoivent pas d'ombre portée.

### 2.3 Occlusion ambiante (AO)

Option `ao` (0 à 1). Pour chaque coin de face, on regarde dans la couche devant la face les deux voisins qui touchent ce coin et le voisin en diagonale (méthode classique des jeux en voxels) : 0 à 3 voisins pleins. Le coin est multiplié par `1 − ao × occ / 3`. Effet : coins rentrants, dessous des saillies (balcons, corniches) et fond des embrasures assombris en douceur. C'est elle qui donne le « volume » des maquettes fines.

Valeurs utilisées : rue fine `0.42` ; terrain océanique `0.4` ; objets (navire, sous-marin…) `0.35`. Plage conseillée : 0,35 à 0,45. Jamais d'AO sur les rôles émissifs.

### 2.4 Variation de teinte (`jitter`)

Chaque bloc tire vers le blanc ou le noir d'une petite quantité stable (hachage de ses coordonnées), jusqu'à `jitter` (tableau ci-dessus). Cela casse l'aplat sans bruit visible.

### 2.5 Échelle

Les coordonnées de la grille sont des indices entiers ; `scale` les convertit en mètres Three.js. Décors fins : `scale: 0.25` (un voxel = 25 cm). Terrain à grande échelle : `0.5`. Voir `docs/maquettes.md`.

## 3. Finition « crayonné » (voxels dessinés)

Validée le 25 octobre 2026 en style A sur les deux épisodes (`"finish": "crayonné"` dans l'épisode). Elle garde les couleurs précalculées et ajoute, dans l'ordre : des hachures dans les faces, un contour encré des volumes, un contour encré du hibou, puis sur toute l'image un trait qui tremble, du papier, du grain et une vignette. Essayée en B et D le 25 octobre 2026 (images fixes de HublotsRonds) : rendu correct et lisible ; validation définitive sur une vidéo complète à faire par l'utilisateur.

Code : `src/render/DrawnVoxel.tsx` (modèle dessiné, contour du hibou) et `src/render/Filters.tsx` (filtres SVG, grain). Rendu **global**, utilisé par le moteur pour tout sujet.

### 3.1 Modèle dessiné : `DrawnVoxelModel`

```tsx
const part = (grid) => { const geometry = buildVoxelGeometry(grid, look.voxel, BUILD); return {geometry, edges: edgesOf(geometry)}; };
<DrawnVoxelModel geometry={p.geometry} edges={p.edges} ink={look.text} {...MODEL} />
```

- `edgesOf(geometry)` = `LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geometry, 30))` : seules les arêtes dont l'angle dépasse 30° (arêtes vives des volumes, pas les joints coplanaires). À calculer une fois (`useMemo`), jamais par image.
- L'encre est **toujours** `look.text` (encre du style : `#3A2619` en A).

Réglages validés (`MODEL`) :

| Paramètre | Rôle | Maquette fine (25 cm) | Terrain / objets océan | Défaut (voxels de 1 m) |
|---|---|---|---|---|
| `edgeWidth` | épaisseur du contour, en px (`LineMaterial`, résolution 1080 × 1920) | **4** | 4 | 7 |
| `joint` | force des joints tracés tous les voxels | **0,12** | 0 (pas de quadrillage sur le terrain) | 0,22 |
| `hatchDensity` | traits de hachure par unité Three.js | **4,5** | 4,5 | 2,2 |
| `hatchStrength` | intensité des hachures | **0,32** | 0,30 | 0,55 |

Règle : plus les voxels sont fins, plus le contour est fin et les hachures serrées et légères. Les joints n'ont de sens que si les blocs sont assez gros à l'écran.

### 3.2 Hachures (shader)

`MeshBasicMaterial` modifié par `onBeforeCompile` (`polygonOffset` 1/1 pour laisser passer les contours) :

- coordonnées des hachures = position **dans l'objet** (`vHatchPos`), donc les hachures suivent une pièce qui bouge ; plan choisi selon la normale de la face (dessus : `xz`, côté : `zy` ou `xy`) ;
- `lum` = luminance de la couleur ; `shade = clamp((0.9 − lum) × 1.5, 0, 1)` : les faces sombres sont plus hachurées ;
- premier réseau à 45° (`(u + v) × densité`), légèrement ondulé (`wob`), largeur de trait `0,05 + shade × 0,15`, interrompu au hasard (≈ 28 % des segments coupés) comme des coups de crayon, intensité `0,3 + shade` ;
- second réseau croisé (`(u − v) × densité`) seulement sur les faces sombres (`smoothstep(0.45, 0.85, shade)`), à 80 % ;
- joints des blocs : `smoothstep(0.455, 0.5, max(|fract(u) − 0,5|, |fract(v) − 0,5|)) × joint` ;
- la couleur est multipliée par une teinte d'encre `uTint = 0,45 + encre × 0,3` (par canal), proportionnellement au trait.

### 3.3 Contour du hibou : `InkOutline`

Coque inversée : chaque maillage opaque standard du hibou reçoit un enfant de même géométrie, matériau `MeshBasicMaterial` couleur encre, `side: BackSide`, agrandi **× 1,12**. On appelle `invalidate()` après l'ajout pour que la première image les contienne.

```tsx
<InkOutline ink={look.text}><Owl look={look} state={owl} position={p} height={h} /></InkOutline>
```

### 3.4 Filtres d'image (`DrawnFilters`, `GrainOverlay`)

`<DrawnFilters frame={frame} />` est posé une fois en haut de la composition ; le `ThreeCanvas` reçoit `filter: url(#dessin-wobble)`.

| Filtre | Réglage | Effet |
|---|---|---|
| `dessin-wobble` | `feTurbulence fractalNoise`, `baseFrequency 0.016`, 2 octaves, graine `1 + floor(frame / 4) % 7` ; `feDisplacementMap scale 5` | le trait « bouillonne » : la graine change toutes les **4 images** (dessin refait à la main), cycle de 7 |
| `dessin-paper` | `baseFrequency 0.0045 0.009`, 3 octaves, graine fixe 11, désaturé ; calque `soft-light` à 0,75 | taches lentes de papier |
| `dessin-grain` | `baseFrequency 0.8`, 2 octaves, graine `floor(frame / 4) % 97`, désaturé ; calque `overlay` à 0,3 | grain fin renouvelé avec le tremblé, toutes les **4 images** (un grain changé à chaque image coûte cher à l'encodage et se dégrade sur les plateformes ; changé le 27 octobre 2026) |
| vignette | `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, withAlpha(look.text, 0.18) 100%)` | bords légèrement assombris |
| `dessin-glow`, `dessin-soft` | flou 9 px (fusionné deux fois) et 22 px | halo de lumières, au besoin |

`<GrainOverlay vignette={withAlpha(look.text, 0.18)} />` se pose **au-dessus de tout** (habillage compris), juste avant l'audio.

### 3.5 Finition « brute »

Sans finition crayonnée : `VoxelModel` (`src/voxel/VoxelModel.tsx`), mêmes géométries, pas de filtres. Utilisée par l'essai des styles et `EssaiImmeubleFinBrut`. Un épisode qui ne précise pas `finish` est en finition brute.

## 4. Éléments non voxel du décor

Certains éléments ne sont pas des blocs (eau, ciel, faisceaux) :

- **Panneaux en dégradé** : `BufferGeometry` à couleurs de sommets, une rangée de sommets par palier de couleur, `MeshBasicMaterial vertexColors toneMapped={false}` (ex. le fond d'eau de `FondsMarins.tsx` : `water` → `mix(water, waterDeep, 0.55)` à 200 m → `waterDeep` à 1 000 m → `mix(waterDeep, dark, 0.6)` au socle).
- **Surfaces translucides** : un plan couleur de rôle, `transparent`, opacité 0,45, `depthWrite={false}`.
- **Effets 2D** (obscurité, ondes, faisceau de sonar) : SVG ou dégradés CSS posés sur le canvas, positionnés avec `projectPoint(shot, point3D)` pour rester collés au décor, couleurs prises dans `look.annotation` ou les rôles du style.

Toujours des couleurs de rôle ou d'habillage du style, jamais de code en dur.

## 5. Le hibou (`src/mascot`)

Formes lisses (`MeshStandardMaterial`), éclairées par `OwlLights` uniquement :

| | A et D (jour) | B (nuit, `glow`) |
|---|---|---|
| `hemisphereLight` | ciel `#FFFFFF`, sol `#B89A78`, 0,85 × π | `#C9B8F0` / `#2A1F45`, 0,7 × π |
| `directionalLight` | `#FFF4E2`, 0,6 × π, position `[-14, 30, 12]` | `#FFD9A0`, 0,55 × π |

Les intensités sont multipliées par π (Three.js divise la diffusion par π). Une ombre douce en disque (rayon 0,38 × hauteur) est posée au sol sous ses pattes. Couleurs : `look.owl.colors`, jamais celles du décor. Gestes : `docs/mise-en-scene.md` § 4.

## 6. Ordre des calques d'une composition

Du fond vers l'avant (assemblé par le moteur, `src/engine/Episode.tsx`) :

1. `AbsoluteFill` couleur `look.background` ;
2. `DrawnFilters` (définitions SVG, invisibles) ;
3. `ThreeCanvas` (filtre wobble + flou de l'accroche) : `CameraRig`, décor, `OwlLights`, hibou dans `InkOutline` ;
4. effets 2D projetés (obscurité, ondes, faisceaux) ;
5. `Annotations` ;
6. habillage propre au sujet (jauge, carte, compteur central) ;
7. `HookVeil` puis `HookTitle` ;
8. `ChapterBanner` ;
9. `Subtitles` ;
10. `GrainOverlay` ;
11. une `Sequence` + `Html5Audio` par passage de narration.

## 7. Pièges connus

- Ne jamais recalculer une géométrie ou des arêtes dans le rendu d'une image : `useMemo` sur le style.
- Un maillage ajouté après le montage (coques du hibou) exige `invalidate()`.
- `VoxelGrid` accepte des indices de −1024 à 1023 par axe : au-delà, les clés se chevauchent.
- Un décor très grand en voxels fins devient lent : ne remplir que la coque visible (voir `oceanFloor` : intérieur vide sauf la tranche et les 3 couches du dessus).
- Le glyphe « → » manque dans certaines polices : dessiner les flèches en SVG.
