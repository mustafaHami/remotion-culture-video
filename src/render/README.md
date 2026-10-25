# src/render

Finition « crayonné » **globale** (valeurs et méthode : `docs/rendu.md` § 3), utilisée par le moteur pour toute vidéo dont l'épisode déclare `"finish": "crayonné"` :

- `DrawnVoxel.tsx` : `DrawnVoxelModel` (hachures dans les faces, contour encré des volumes, `edgesOf`) et `InkOutline` (contour encré du hibou) ;
- `Filters.tsx` : `DrawnFilters` (trait qui tremble toutes les 4 images, halo, grain, papier) et `GrainOverlay` (papier, grain, vignette).

Rien ici n'est propre à un sujet.
