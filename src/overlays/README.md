# src/overlays

Couches 2D globales posées par-dessus la 3D, dans le dessin de chaque style (aucun contenu propre à un sujet) :

- `HookTitle.tsx` : question de l'accroche centrée, voile et flou du décor ;
- `ChapterBanner.tsx` : bandeau de chapitre (« Niveau 1 · 1859 »), repères de progression, règle en deux moitiés ;
- `Subtitles.tsx` (+ `chunks.ts`, `text.ts`) : sous-titres mot à mot dans un encadré centré, mot clé surligné ;
- `Annotations.tsx` : annotations « mannequin technique » projetées depuis la 3D (`cote` avec compteur et repères, `angle`, `clue`, `line`, `tags`) ;
- `NightSky.tsx` : ciel étoilé du style B.

Usage et timings : `docs/mise-en-scene.md` § 5 et 6.
