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
- **Palette** : courte (5 à 7 couleurs) et cohérente sur toute la série. Deux pistes ci-dessous, non tranchées.
- **Décor en coupe** : le lieu de l'histoire (immeuble, maison, atelier, ville en miniature…) est vu en coupe comme une maison de poupée. Chaque pièce ou étage correspond à une étape de l'explication ; la caméra passe d'une pièce à l'autre ou d'un étage à l'autre.
- **Annotations « mannequin technique »** : flèches, cotes, angles, dates, compteurs qui défilent et étiquettes apparaissent par-dessus la 3D, au moment exact où la voix les mentionne, puis s'effacent proprement.
- **Bandeau de chapitre** en haut de l'écran (ex. « Niveau 1 · 1853 ») pour montrer la progression.
- **Sous-titres mot à mot** synchronisés avec la voix, mot clé surligné. C'est la colonne vertébrale du rythme.
- **Rythme** : rien ne reste figé. Une scène change ou bouge toutes les 2 à 4 secondes environ (mouvement de caméra, geste du hibou, annotation, changement de pièce).
- **Lisibilité** : le texte important reste dans la zone sûre, hors des interfaces des plateformes (boutons à droite, légende en bas, en-tête en haut). Les marges exactes seront fixées dans `src/design` à partir des gabarits des plateformes.

### Pistes de palette (à choisir)

Valeurs indicatives, à tester en rendu réel avant de trancher (contraste des sous-titres, lisibilité des annotations, rendu des ombres).

**Piste A — Bois chaud et crème** : chaleureuse, diurne, « atelier de l'explorateur ».

| Rôle | Couleur |
|---|---|
| Fond, murs clairs | crème `#F6EBD9` |
| Bois clair (sols, meubles) | `#D9A066` |
| Bois foncé (structure, contours) | `#8A5A3B` |
| Accent brique / terre cuite | `#C8553D` |
| Accent végétal | sauge `#8FA98F` |
| Texte et annotations | encre `#2E2420` |
| Surlignage du mot clé, yeux du hibou | ambre `#F2A93B` |

**Piste B — Nuit violette et cosy** : nocturne, intime, « bibliothèque à la lampe ».

| Rôle | Couleur |
|---|---|
| Fond, ciel | nuit `#1E1633` |
| Murs, structure | violet `#4B3A7A` |
| Surfaces éclairées | lavande `#9C8ADE` |
| Lumière des lampes, surlignage | jaune chaud `#FFC56B` |
| Accent | rose poudré `#E58FA6` |
| Annotations techniques | cyan `#6FE3E1` |
| Texte | crème `#FFF4E0` |

Dans les deux cas, les yeux ambrés du hibou doivent ressortir sur tous les décors.

## Mascotte : le hibou explorateur

Symbole du savoir, il guide la personne dans l'histoire. Il n'est **pas encore construit** ; cette description sert de cahier des charges.

- **Construction** : entièrement en blocs, en code (Three.js), avec une silhouette lisible même en petit.
- **Signes distinctifs** : grands yeux ambrés très expressifs (paupières en blocs pour cligner, pupilles mobiles), aigrettes (petites plumes en pointe sur la tête), sacoche en bandoulière, petite loupe.
- **Répertoire de gestes** : guider (avancer, se retourner vers la caméra), montrer avec une aile, s'étonner (yeux grands ouverts, aigrettes dressées), réfléchir (tête penchée, loupe levée), saluer.
- **Mouvements** : rotation de la tête, clignement, battements et gestes d'ailes, marche, petits rebonds de réaction. Tout est calculé image par image depuis `useCurrentFrame()`, avec des easings doux et des poses tenues assez longtemps pour être lues.
- **Personnalité** : curieux, enthousiaste, un peu malicieux, jamais moqueur.
- **Originalité** : il ne doit ressembler à aucune mascotte existante, y compris celles des références étudiées.

## L'accroche : la partie la plus importante

Les 3 premières secondes décident si la personne reste.

- La question ou l'énigme s'affiche en grand titre **dès la première image** (ex. « Pourquoi les immeubles parisiens se ressemblent-ils ? »).
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

## Polices (proposition)

Uniquement des polices locales sous licence OFL, licences incluses dans `public/fonts`.

- **Baloo 2** (déjà présente) : titres et accroche ; ronde et chaleureuse, cohérente avec les blocs.
- **Nunito** (déjà présente) : sous-titres et textes courants ; très lisible sur téléphone.
- **À envisager pour les annotations techniques** : une police à chasse fixe ou technique sous OFL (par exemple JetBrains Mono, Space Mono ou IBM Plex Mono) pour les cotes, dates et compteurs. Non installée.

Avant de valider, contrôler en rendu les caractères français : accents majuscules (É, À, Ç), ligatures (œ, æ), guillemets « », apostrophe typographique ’ et espaces insécables.

## Ce qui reste à décider

- La palette (piste A, piste B ou une variante).
- Les polices définitives, dont celle des annotations.
- Le nom définitif du projet et de la chaîne.
- Le dessin précis du hibou (proportions, couleurs du plumage, de la sacoche et de la loupe).
- Le schéma JSON des épisodes et le flux de création (préparation audio, rendu, contrôle).
- Le débit de la voix et l'éventuelle ambiance sonore ou les bruitages (libres de droits, licence notée).
- La formulation de l'appel à suivre.
- Les premiers sujets.
- La fréquence et le calendrier de publication, ainsi que les comptes et l'outil de publication.
- Un dépôt distant et une intégration continue.
