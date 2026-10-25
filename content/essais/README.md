# content/essais

Contenus d'**essais** : des vidéos de test (style, technique), jamais publiées. Ils suivent les mêmes règles qu'un épisode : voix figée, texte affiché identique à la voix, faits sourcés deux fois.

## styles-paris.json : essai comparatif des directions A, B et D

Même scène, même voix (15,6 s), trois habillages : rendre puis comparer, avant de choisir la direction finale (docs/vision.md).

- Accroche : « Pourquoi les immeubles parisiens se ressemblent-ils ? », rangée de trois immeubles, corniches alignées, hibou intrigué.
- Plongée : le mur latéral du dernier immeuble se soulève et révèle la coupe ; chapitre « Niveau 1 · 1859 ».
- Démonstration : règle de 1859 (rue > 20 m → façade ≤ 20 m), cote « 20 m » au mot prononcé.
- Comble : le hibou se perche sur le toit, angle « 45° » au mot prononcé.

Ce n'est pas un épisode : pas de révélation ni de conclusion.

```sh
.venv/Scripts/python scripts/prepare-audio.py --content content/essais/styles-paris.json   # seulement si le texte change
npm run essai:render
.venv/Scripts/python scripts/inspect-video.py --content content/essais/styles-paris.json --videos output/essais/EssaiStyleA.mp4,output/essais/EssaiStyleB.mp4,output/essais/EssaiStyleD.mp4 --board output/essais/planche-comparative.jpg
```

Les compositions s'appellent `EssaiStyleA`, `EssaiStyleB` et `EssaiStyleD` dans Remotion Studio (dossier « Essais »). La mise en scène propre à chaque direction (caméra, rythme) est dans `src/essais/styles/direction.ts`.
