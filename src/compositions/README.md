# src/compositions

Compositions Remotion enregistrées dans `src/Root.tsx`.

| Dossier | Contenu |
|---|---|
| `voxel-dessin/` | Rendu crayonné **global** : `DrawnVoxel.tsx` (`DrawnVoxelModel`, `edgesOf`, `InkOutline`) ; `FineStreet.tsx` (assemblage de la rue fine, ses plans et repères) ; `EssaiImmeubleFin.tsx` (une image par angle, contrôle d'une maquette). Détails : `docs/rendu.md` § 3. |
| `dessin/` | `Filters.tsx` (filtres SVG du crayonné et grain, **globaux**) ; le reste est l'essai 2D « dessiné à la main » (`EssaiDessin`), non retenu pour les épisodes. |
| `essai/` | Essai comparatif des styles A, B, D (`EssaiStyles.tsx`, `direction.ts` : grammaire de caméra par style, réutilisée par les épisodes). |

Les épisodes ne sont plus ici : une seule composition générique les fabrique tous (`src/engine`, `docs/moteur.md`).
