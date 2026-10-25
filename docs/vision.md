# Vision du projet

Document de référence sur le besoin et la direction artistique. Les règles opérationnelles sont dans `AGENTS.md`, qui prévaut en cas d'écart. Rédigé le 24 octobre 2026, à l'initialisation du projet.

## Besoin

Des vidéos verticales courtes, de 40 secondes à 1 minute 30, qui partagent chacune **une** information de culture générale :

- pourquoi on appelle une chose ainsi ;
- pourquoi une ville a été construite de cette façon ;
- pourquoi un mot s'écrit ou se prononce comme ça ;
- toute autre information qui apporte quelque chose à la personne qui regarde.

Plateformes : Instagram (Reels), TikTok, YouTube Shorts. La fréquence et le calendrier de publication seront décidés plus tard.

## Mission

Rendre la personne **curieuse puis satisfaite** : une question qui intrigue, une explication claire et vérifiée, une réponse nette. La vidéo doit être vivante et immersive : on a l'impression d'être à l'intérieur de l'histoire.

Ce qui compte en priorité :

1. le design ;
2. la manière de représenter les choses ;
3. les mouvements et la fluidité ;
4. la clarté de l'explication ;
5. le soin des détails.

## Public

Francophones curieux qui découvrent la vidéo en faisant défiler un fil : attention brève, son parfois coupé (d'où les sous-titres obligatoires), lecture sur téléphone. Le ton est accessible, jamais condescendant ; aucune connaissance préalable n'est supposée.

## Direction artistique : « univers voxel »

- **Matière** : tout est fait de blocs (voxels). Assez de détail pour être lisible et chaleureux, jamais de bruit visuel.
- **Lumière** : douce et enveloppante, avec des ombres nettes qui donnent du volume aux blocs.
- **Palette** : courte (5 à 7 couleurs) par style ; trois styles officiels (A, B, D), au choix de chaque vidéo.
- **Décor en coupe** : le lieu de l'histoire (immeuble, maison, atelier, ville en miniature…) est vu en coupe comme une maison de poupée. Chaque pièce ou étage correspond à une étape de l'explication ; la caméra passe d'une pièce à l'autre ou d'un étage à l'autre.
- **Annotations « mannequin technique »** : flèches, cotes, angles, dates, compteurs qui défilent et étiquettes apparaissent par-dessus la 3D, au moment exact où la voix les mentionne, puis s'effacent proprement.
- **Bandeau de chapitre** en haut de l'écran (ex. « Niveau 1 · 1853 ») pour montrer la progression.
- **Sous-titres mot à mot** synchronisés avec la voix, mot clé surligné, dans un encadré clair centré. C'est la colonne vertébrale du rythme.
- **Rythme** : rien ne reste figé. Une scène change ou bouge toutes les 2 à 4 secondes environ (mouvement de caméra, geste du hibou, annotation, changement de pièce).
- **Lisibilité** : le texte important reste dans la zone sûre, hors des interfaces des plateformes (boutons à droite, légende en bas, en-tête en haut). Les marges exactes seront fixées dans `src/design` à partir des gabarits des plateformes.

### Les trois styles officiels (25 octobre 2026)

Décision : les trois directions A, B et D sont **gardées toutes les trois** ; chaque vidéo choisit la sienne pour varier ce que voit le public. Spécification à jour : `docs/design-system.md` (elle prévaut sur le tableau historique ci-dessous).

#### Présélection d'origine

Claude Design a proposé quatre directions dans l'univers voxel, chacune avec une accroche, une démonstration, une révélation et une fiche de style (canevas : https://claude.ai/code/artifact/561adce7-fcb9-49f2-8364-3e174a4faccf). Trois ont été présélectionnées pour un essai vidéo comparatif (voir `content/essais/README.md`), puis toutes gardées.

| | **A · Atelier** | **B · Veillée** | **D · Zinc & craie** |
|---|---|---|---|
| Ambiance | Maquette d'ébéniste au soleil de fin d'après-midi, livre illustré | Paris quand les fenêtres s'allument, intime | Affiche d'un matin clair sur les toits de zinc, graphique |
| Palette | crème `#F4EAD8`, pierre `#E3C9A0`, bois `#A9693D`, encre `#3A2619`, zinc `#6E7B85`, terracotta `#C4553A`, ambre `#EFA733` | nuit `#1C1430`, prune `#46305F`, lavande `#9883C2`, lune `#FBEBD0`, ambre lampe `#FFB547`, rose `#EE7B8C` | craie `#F6F2EA`, ciel `#CADCE4`, pierre `#E8D8BC`, zinc `#74879A`, noir `#15171C`, tomate `#E8432D`, ambre `#F3A21E` |
| Polices (OFL) | Fraunces (titres) + Atkinson Hyperlegible (texte) | Baloo 2 (titres) + Nunito (texte) | Anton (titres en capitales) + Inter (texte) |
| Hibou | plumage bois, disque facial crème, sacoche terracotta | plumage prune, disque lavande, écharpe rose | plumage noir, masque craie, sacoche tomate |
| Caméra | travelling latéral lent, passage d'étage en glissé | dérive flottante, rapprochement vers une fenêtre allumée | plans fixes cadrés comme des affiches, coupes franches, zooms rapides |
| Point de vigilance | tons bois et pierre proches : les petits détails se fondent | grands aplats sombres sensibles à la compression vidéo | moins de profondeur ; capitales condensées criardes si on en abuse |

**Écartée : C · Bleu d'archi** (plan technique bleu). Jugée la moins lisible sur téléphone et la plus froide. À retenir quand même : ses annotations « plan d'architecte » et une police à chasse fixe (JetBrains Mono) pour les cotes et compteurs peuvent inspirer les autres directions.

Zones sûres reprises des planches : rien d'important dans les 200 px du haut, les 360 px du bas, les 140 px de droite ; marge gauche de 64 px.

### Retours sur l'essai (25 octobre 2026)

- **Validé** : la manière d'expliquer (coupe, mur qui se soulève, cote et angle au mot prononcé, petites animations).
- **Validé** : les sous-titres dans un encadré clair, plus lisibles ; ils sont désormais centrés et encadrés dans les trois directions (la version B sans encadré est abandonnée).
- **Validé** : l'accroche avec la question centrée sur le décor atténué, pour garder l'attention et servir de couverture.
- **À refaire** : le hibou provisoire, jugé trop rectangulaire (« un Lego »). Nouvelle demande à Claude Design : `docs/prompts/claude-design-hibou.md`.
- **Choisi** : le hibou **C « lisse stylisé »** (formes rondes, masque en cœur, ombrage doux), posé dans le décor voxel. Construit en code dans `src/mascot` et intégré à l'essai.
- **Écarté** : HyperFrames, essayé sur l'essai de styles ; le projet reste sur Remotion.
- Les trois styles sont gardés, au choix de chaque vidéo.

## Mascotte : le hibou explorateur

Symbole du savoir, il guide la personne dans l'histoire. Version retenue : **C « lisse stylisé »** des planches Claude Design (rondeurs, masque en cœur, ombrage doux), construite en code dans `src/mascot`.

- **Construction** : en code (Three.js), à partir de formes rondes simples, avec une silhouette lisible même en petit. Il contraste volontairement avec le décor en voxels.
- **Signes distinctifs** : grands yeux ambrés très expressifs (paupières en blocs pour cligner, pupilles mobiles), aigrettes (petites plumes en pointe sur la tête), sacoche en bandoulière, petite loupe.
- **Répertoire de gestes** : guider (avancer, se retourner vers la caméra), montrer avec une aile, s'étonner (yeux grands ouverts, aigrettes dressées), réfléchir (tête penchée, loupe levée), saluer.
- **Mouvements** : rotation de la tête, clignement, battements et gestes d'ailes, marche, petits rebonds de réaction. Tout est calculé image par image depuis `useCurrentFrame()`, avec des easings doux et des poses tenues assez longtemps pour être lues.
- **Personnalité** : curieux, enthousiaste, un peu malicieux, jamais moqueur.
- **Originalité** : il ne doit ressembler à aucune mascotte existante, y compris celles des références étudiées.

## L'accroche : la partie la plus importante

Les 3 premières secondes décident si la personne reste.

- La question ou l'énigme s'affiche en grand titre **dès la première image** (ex. « Pourquoi les immeubles parisiens se ressemblent-ils ? »).
- Elle est centrée à l'écran, devant le décor visible mais atténué (voile et léger flou) ; le décor se dévoile quand la réponse commence.
- Un visuel intrigant l'accompagne tout de suite : le hibou surpris devant un indice, un détail étrange du décor.
- Pas de logo, pas de générique, pas d'introduction lente.
- L'accroche promet une réponse claire et satisfaisante, que la vidéo tient.
- La première image fonctionne seule, comme une vignette.

## Structure type d'une vidéo (40 s à 1 min 30)

Base évolutive, à améliorer au fil des premières vidéos.

1. **Accroche** (0 à 3 s) : question en grand titre, hibou intrigué, indice visuel.
2. **Plongée** : la caméra entre dans le décor en coupe ; le premier chapitre s'affiche.
3. **Démonstration annotée** : une pièce ou un étage par étape ; annotations, dates et compteurs synchronisés avec la voix ; le hibou montre, réagit, se déplace.
4. **Révélation** : la caméra recule pour montrer l'ensemble ; la réponse apparaît clairement.
5. **Conclusion** : le hibou salue ; court appel à suivre la chaîne.

## Références étudiées

S'inspirer des codes, ne **jamais** copier leurs personnages, leur univers ou leur marque.

| Référence | Ce qu'on en retient |
|---|---|
| https://www.instagram.com/reel/De4X0AxJlhj/ | Motion design néon, sous-titres mot à mot |
| https://www.instagram.com/reel/DehQBjSIXTy/ | Mannequin 3D et annotations techniques |
| https://www.instagram.com/reel/De4gzUHknu1/ | Mascotte voxel dans un décor chaleureux |
| https://www.instagram.com/reel/Dezr2dJEVAF/ | Bâtiment en coupe, caméra d'étage en étage |
| https://www.instagram.com/reel/De4FT04DAdd/ | Mini-série, plans de cinéma |
| https://www.instagram.com/reel/DeqdMQAJbHy/ | Particules et modèles 3D annotés |

## Polices

Uniquement des polices locales sous licence OFL, licences incluses dans `public/fonts`. Chaque style a son couple de polices (tableau ci-dessus) ; toutes sont installées et gardées.

- **À envisager pour les annotations techniques** : une police à chasse fixe sous OFL (par exemple JetBrains Mono) pour les cotes, dates et compteurs. Non installée.

Avant de valider, contrôler en rendu les caractères français : accents majuscules (É, À, Ç), ligatures (œ, æ), guillemets « », apostrophe typographique ’ et espaces insécables.

## Ce qui reste à décider

- La police des annotations.
- Le nom définitif du projet et de la chaîne.
- Le débit de la voix et l'éventuelle ambiance sonore ou les bruitages (libres de droits, licence notée).
- La formulation de l'appel à suivre.
- Les premiers sujets.
- La fréquence et le calendrier de publication, ainsi que les comptes et l'outil de publication.
- Une intégration continue (le dépôt distant existe : GitHub, `origin`).
