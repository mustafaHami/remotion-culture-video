# Mise en scène : caméra, hibou, annotations, rythme

Ce document dit **comment raconter** une notion à l'écran, avec les valeurs exactes des épisodes validés (`content/episodes/immeubles-paris.json`, `fonds-marins.json`, `hublots-ronds.json`, champ `staging`). Il sert à adapter la même qualité à n'importe quel nouveau sujet. Rendu : `docs/rendu.md` ; décors : `docs/maquettes.md` ; styles : `docs/design-system.md` ; fichier d'épisode : `content/episodes/README.md`.

## 1. Représenter une notion : la démarche

1. **Une question, une réponse.** Écrire d'abord la réponse en une phrase (`"answer"` de l'épisode). Tout ce qui ne sert pas cette réponse sort de la vidéo.
2. **Découper l'explication en 3 ou 4 étapes**, chacune devenant un chapitre (« Niveau 1 · 1859 », « Raison 2 · Le noir »). Une étape = une idée = une démonstration visuelle.
3. **Pour chaque étape, choisir ce qui se voit.** Une phrase de la voix sans changement à l'image est une phrase perdue. Chercher le geste physique qui prouve l'idée : une cote qui se trace, un compteur qui monte, un objet qui descend, une lumière qui s'éteint, une onde qui s'arrête, des bâtiments qui s'alignent.
4. **Choisir un lieu unique** qui porte toutes les étapes (une rue, une coupe d'océan) et le construire en maquette détaillée. La caméra voyage dans ce lieu au lieu de changer de décor.
5. **Ajouter un élément de comparaison** quand un chiffre seul ne parle pas (l'immeuble d'en face pour 22 m, la Lune entièrement cartographiée face à 28,7 % des fonds).
6. **Finir par une vue d'ensemble** qui montre la réponse d'un coup, puis le salut du hibou.

### Correspondances déjà éprouvées

| Ce que dit la voix | Ce que montre l'image | Exemple |
|---|---|---|
| une dimension, une hauteur, une largeur | cote qui se trace, avec compteur qui monte et repères | « 20 m » le long de la façade, avec un repère par plancher |
| un angle, une pente | angle tracé entre la pente et l'horizontale, prolongé au-dessus du toit | « 45° » du comble |
| un nombre d'éléments | pastilles numérotées une à une, puis accolade de total | étages 1 à 5, puis « 5 étages » |
| une règle commune à plusieurs objets | objets d'abord différents (hauteurs décalées) qui **s'alignent** au mot clé, lignes continues d'un bout à l'autre | « mêmes hauteurs », « mêmes lignes » |
| une grandeur qui augmente avec une autre | jauge latérale avec deux compteurs liés (profondeur → pression) et un objet qui descend | sous-marin vers la fosse, « ≈ 1 100 atm » |
| un seuil | ligne pointillée en couleur d'accent, étiquetée, à la bonne hauteur | lignes 200 m et 1 000 m |
| une absence (noir, silence, vide) | l'image elle-même change : obscurité qui gagne, sauf autour d'une source | les projecteurs du sous-marin |
| un obstacle | le phénomène part et **s'arrête** visiblement sur l'obstacle | ondes du satellite éteintes à la surface |
| un procédé lent | l'outil travaille sous nos yeux, le résultat apparaît morceau par morceau | sonar, bandes cartographiées tronçon par tronçon |
| un pourcentage, un bilan | jauge horizontale qui se remplit jusqu'à la valeur, valeur en grand | « 28,7 % » |
| une comparaison frappante | l'élément de comparaison, entier, avec son étiquette | la Lune quadrillée, « 100 m » |
| un mécanisme invisible (effort, flux, force) | une vue agrandie de la pièce, avec des lignes qui montrent le chemin du flux ; deux versions côte à côte pour comparer | panneaux à angle vif et arrondi, lignes d'effort |
| une répétition, une usure | l'action répétée à l'écran (pulsations) et un compteur qui défile | gonflages de la cabine, « ≈ 3 000 cycles » |
| une date | grand chiffre central au mot prononcé | « 1952 », « 1954 » |
| la réponse | vue d'ensemble large, tous les éléments à leur place | la rue entière ; de la Lune à la fosse |

Pour un type de sujet encore jamais traité (origine d'un mot, d'un nom), appliquer la même démarche : un lieu ou un objet d'époque en maquette, des étiquettes de mots posées sur le décor qui se transforment au fil des étapes (pastilles `tags` qui changent de texte au mot prononcé), une frise de dates en cote. C'est une proposition non encore essayée : la valider en images fixes avant de produire.

## 2. Minutage : tout s'accroche à la voix

- La voix est figée (`scripts/prepare-audio.py`) ; chaque passage a sa durée mesurée et ses mots minutés. `buildTimeline(content.narration, LEAD_FRAMES)` donne le début de chaque passage, avec `LEAD_FRAMES = 4` images de silence au départ et `pauseAfterFrames` après chaque passage (12 après la question, 8 ailleurs ; 10 à 14 avant un changement de chapitre).
- On ne place **jamais** une animation à un temps fixe. On calcule des « temps forts » (`beats`) depuis la voix : `cueById(t, 'sonar').from` (début d'un passage) ou `wordFrame(t, 'lumiere', '200')` (instant où le mot est prononcé), puis on décale de quelques images.
- Décalages usuels (images à 30 i/s) :

| Événement | Moment |
|---|---|
| annotation qui apparaît avec un mot | début au mot − 2 à − 4 ; pour un compteur qui doit arriver à sa valeur au mot : début au mot − 16 à − 18 |
| pastilles successives | une toutes les 3 à 4 images |
| caméra qui change de plan pour un passage | début au passage − 4 à − 8, durée 28 à 40 |
| bandeau de chapitre | passage + 8, durée 12 |
| hibou qui change de pose | au temps fort + 8 à + 30, fondu de 8 images |
| saut du hibou sur un mot clé | mot − 4, durée 10 |
| effacement d'une annotation | au début de l'étape suivante, en 10 à 14 images |

- Un nombre écrit en chiffres avec espace (« 1 000 ») est découpé par la voix en deux mots (« 1 » et « 000 ») : accrocher l'annotation à « 000 ». Le mot suivi d'une ponctuation garde sa ponctuation dans `words` (« sonar, ») : `wordFrame` normalise, mais `scripts/inspect-video.py` aussi ; vérifier avec `npm run verify`.
- Courbes : `Easing.inOut(Easing.cubic)` pour les mouvements (`ease`), `Easing.out(Easing.cubic)` pour les apparitions (`enter`), `Easing.out(Easing.back(1.6 à 2.4))` pour ce qui « pousse » ou se pose (bâtiment qui sort du sol, hibou qui apparaît), `Easing.in(Easing.back(2))` pour ce qui disparaît. Toujours `extrapolateLeft/Right: 'clamp'`.

## 3. Caméra (`src/scenes/camera.ts`)

Un plan est une valeur simple, interpolable :

```ts
type Shot = {target: Vec3; yaw: number; pitch: number; distance: number; fov: number; centerY: number};
```

- `target` : point visé (Three.js, mètres). `yaw` : degrés autour de la verticale (0 = de face, + = vers la droite). `pitch` : degrés au-dessus de l'horizontale. `distance` : mètres. `fov` : **26° toujours** (longue focale de maquette, peu de déformation). `centerY` : hauteur de l'écran (px) où tombe la cible, pour cadrer sans tourner la caméra.
- `CameraRig` applique le plan à chaque image ; `projectPoint(shot, p)` donne la position à l'écran d'un point 3D, pour tout ce qui est 2D (annotations, effets).
- **Enchaînement** : une fonction `cameraFor(frame, beats)` part du plan d'accroche et mélange successivement chaque plan avec `mixShots(précédent, suivant, ease(frame, début, durée))`. Le dernier mélange l'emporte : c'est une suite lisible de « à tel temps fort, aller vers tel plan ».
- **Rien de fixe** : pendant un plan tenu, ajouter un léger travelling (`yaw` + 2 à 8° sur la durée du passage, ou `Math.sin(frame / 60) × 2`). Un plan de suivi vise un objet mobile (`target` = position du sous-marin).
- `centerY` usuels : 1 000 pour l'accroche (décor centré derrière le titre), 940 à 1 010 pendant l'explication (laisse la place aux sous-titres en bas), jusqu'à 1 270 pour cadrer haut.
- Distances usuelles : plan d'ensemble 165 à 365, plan moyen 110 à 155, plan rapproché 72 à 96, gros plan sur le hibou ou un objet 26 à 32.
- Grammaire par style (`src/compositions/essai/direction.ts`, `cameraAt`) : **A** travelling latéral lent et glissés ; **B** dérive flottante permanente (`yaw ± 1,6°`, `pitch ± 0,9°`, cible ± 0,35) et rapprochements lents ; **D** plans fixes, coupes franches et zooms secs (`fov × 0,88` en 5 images sur le mot clé).

Plans de référence (immeubles) : accroche `{target: [37, 10, 10], yaw: 42, pitch: 24, distance: 175}` ; coupe `{[41, 11, 8], 56, 18, 134}` ; toit `{[CUT_FACE − 1, 20.5, 7], 84, 12, 84}` ; en travers de la rue `{yaw: 86, pitch: 9, distance: 172}` ; ensemble `{[26, 9, 13], 32, 20, 205}` ; hibou `{[41, 6, 12.6], 34, 9, 78}`.

## 4. Le hibou

### 4.1 Placement

- Il est **dans** le décor, posé sur un endroit qui a du sens pour l'étape (trottoir devant la coupe, toit pour la pente, pont du navire, sur le sous-marin pendant la plongée). Ces places sont des constantes de la mise en scène (`streetSpot`, `roofSpot`) ou suivent un objet (`[sub[0], sub[1] + 2.2, sub[2]]`).
- Taille (`height`, sans les aigrettes, en mètres de maquette) : assez grand pour lire ses yeux à l'écran, quitte à être hors d'échelle. Valeurs : 8 devant un immeuble de 20 m, 5 sur le toit, 2,4 sur le pont d'un navire de 11 m, 1,6 sur le sous-marin.
- Changement de place : il disparaît en 5 images (`Easing.in(Easing.back(2))`) puis réapparaît en 8 images (`Easing.out(Easing.back(2.2))`) à la nouvelle place, multiplié sur `height`.

### 4.2 Jeu (`src/mascot/rig.ts`)

- Poses : `idle`, `wonder` (intrigué), `pointRight`, `pointLeft` (montre de l'aile, le regard suit), `wave` (salut). Une liste de clés `[image, pose, côté]` : fondu de 8 images vers chaque pose ; `côté` (−1, 0, 1) tourne le corps de 0,25 rad vers ce qu'il montre.
- Orientation : face à la caméra (`yaw = cameraYaw × π / 180 + turn`).
- Vie permanente : tête `headYaw += sin(frame / 23) × 0,08`, `headTilt += sin(frame / 37 + 1) × 0,03` ; respiration `squash = 1 + sin(frame / 20) × 0,012` ; clignement en 5 images toutes les 3 à 6 secondes (liste `BLINKS`, irrégulière).
- Réactions : petit saut au début (image 6, 14 images, 0,15) puis à **chaque mot clé chiffré** (mot − 4, 10 images, 0,08 hauteur) ; écrasement de 10 % à la réception.
- Il montre la chose dont parle la voix (`pointLeft`/`pointRight` selon le côté de l'écran), s'étonne aux révélations (`wonder`), se repose pendant le bilan (`idle`), salue sur « abonne-toi » (`wave` + aile droite `sin((frame − début) / 2,6) × 0,35`) en gros plan.
- Toujours entouré du contour encré en finition crayonnée (`InkOutline`).

## 5. Annotations (`src/overlays/Annotations.tsx`)

Points en 3D, projetés à chaque image : elles restent collées au décor pendant les mouvements. Chaque annotation a `progress` (0 à 1) : tracé du trait, puis apparition de l'étiquette (petit rebond). Étiquette : police du texte du style, 32 px (40 en grand), graisse 800, cadre `look.annotation` ; `hot` = fond d'accent.

| `kind` | Usage | Champs |
|---|---|---|
| `cote` | dimension mesurée | `from`, `to`, `offset` (décalage px du trait), `label`, `count: {to, suffix}` (compteur qui monte avec le trait), `marks` (repères en fractions 0–1) |
| `angle` | pente, inclinaison | `corner`, `along` (bout de la pente), `level` (bout de l'horizontale), `label` |
| `clue` | indice de l'accroche (pastille « ? ») | `from`, `to`, `badgeAt`, `badge` |
| `line` | ligne de repère, seuil, alignement | `from`, `to`, `hot`, `dashed`, `label` (posé à 35 % de la ligne, 34 px au-dessus) |
| `tags` | pastilles posées sur le décor | `tags: [{at, text, progress, hot}]` |

Règles :

- Le texte de chaque étiquette vient de `content.annotations` (champ `label`), jamais écrit dans le code. Chaque annotation de l'épisode est accrochée à un mot prononcé (`cue`, `word`, `occurrence`), contrôlé par `npm run verify`.
- Les tracer **légèrement devant** le décor (0,3 à 1,1 m vers la caméra) pour qu'elles ne se confondent pas avec une arête ; prolonger une pente au-delà du toit plutôt que la superposer.
- Une annotation s'efface quand on passe à l'étape suivante ; à l'écran, pas plus de 2 ou 3 annotations à la fois.
- Couleur d'accent (`hot`) réservée à ce que la voix vient de nommer.

### Habillage propre au sujet

Une jauge, une carte de bilan ou un grand compteur central se codent dans la composition de l'épisode, avec **uniquement** `look.annotation`, `look.fonts` et les rôles du style. Emplacements validés : jauge verticale à gauche (`x = 72`, de `y = 360` à `1240`) ; grand chiffre central en haut (`top: 300`, 56 px, fond d'accent) ; carte de bilan au-dessus des sous-titres (`left/right: 140`, `top: 1110`). Respecter les zones sûres (`docs/design-system.md`).

## 6. Habillage commun

- **Accroche** : `HookTitle` (question centrée, `highlight` en couleur d'accent, italique en A) + `HookVeil` (voile couleur du fond, 0,62 ; 0,58 en B) + flou du canvas `hookBlur(exit)` = 6 px. Sortie (`titleExit`) du premier passage de contenu − 4 à + 12 images (`Easing.in(Easing.cubic)`). Pendant l'accroche : plan d'ensemble, hibou `wonder`, un indice (`clue`) ou un détail intrigant visible. La première image doit valoir une couverture.
- **Bandeau de chapitre** (`ChapterBanner`) : en haut à gauche (`left: 72, top: 228`), un repère par chapitre (rempli quand passé), apparition à passage + 8 sur 12 images ; `key={chapter.cue}` pour rejouer l'entrée. Libellés : « Niveau N · repère » (étapes historiques ou de construction) ou « Raison N · mot » (causes) et un dernier chapitre de bilan (« Niveau 3 · La rue », « Le bilan »). Facultatif : une règle en deux moitiés (`rule`), reliées par une flèche, dont chaque moitié apparaît au mot qui l'énonce (`ruleFirst`, `ruleSecond`).
- **Sous-titres** (`Subtitles`) : tous les passages sauf la question (déjà affichée en titre) ; encadré centré (`top: 1376`) ; les mots clés de chaque passage (`keywords`) sont surlignés à l'instant prononcé.
- **Grain** par-dessus tout en finition crayonnée.

## 7. Rythme et structure

- Quelque chose bouge ou change **toutes les 2 à 4 secondes** : plan de caméra, pose du hibou, annotation, objet du décor. Vérifier sur la planche des moments clés.
- Structure suivie par les deux épisodes : accroche (2 à 3 s) → chapitre 1 avec plongée dans le décor → chapitres 2 et 3 → bilan ou révélation en plan large → comparaison ou conclusion → « Abonne-toi » avec le salut du hibou. Durée obtenue : 41 s et 55 s.
- Narration : phrases courtes, un chiffre par phrase, le mot clé en fin de phrase ; un chiffre qui évolue est daté (« en avril 2026 »). Appel final : un passage `abonne` court (formulation définitive pas encore arrêtée, voir `docs/vision.md`).
- Éléments ambiants pour un décor vivant : poissons, méduse, satellite et Lune qui tournent lentement, navire qui tangue (sinusoïdes lentes du numéro d'image).

## 8. Où s'écrit la mise en scène

Toute la mise en scène s'écrit **en données**, dans le champ `staging` du fichier d'épisode, lu par le moteur générique (`src/engine/Episode.tsx`). Format complet, champ par champ : `docs/moteur.md`. Les valeurs de ce document (décalages, plans, places du hibou, fenêtres d'apparition) se traduisent directement en clés et repères de temps. Exemples : les trois épisodes de `content/episodes`.

Ordre conseillé pour écrire un `staging` : les objets animés du décor, puis les plans de caméra passage par passage, puis les places et poses du hibou, puis les annotations et l'habillage, mot clé par mot clé. Régler ensuite avec des images fixes aux temps forts (`npm run stills`).
