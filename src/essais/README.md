# src/essais

Compositions d'**essai et de réglage**, enregistrées dans le dossier « Essais » de Remotion Studio. Aucune n'est une vidéo finale : les vidéos viennent toutes du moteur (`src/engine`, `docs/moteur.md`).

| Dossier | Contenu |
|---|---|
| `styles/` | Essai comparatif des styles A, B, D (`EssaiStyles.tsx`, compositions `EssaiStyleA/B/D`, `EssaiVoxelDessin`) ; `direction.ts` : grammaire de caméra historique de chaque style |
| `voxel-dessin/` | `EssaiImmeubleFin.tsx` (une image par angle, contrôle d'une maquette, brut et crayonné) ; `FineStreet.tsx` (assemblage de la rue fine pour ces essais) |
| `dessin-2d/` | Essai de rendu « dessiné à la main » en 2D (`EssaiDessin`), non retenu pour les épisodes |
| `paris/` | Rue en voxels de 1 m de l'essai de styles (historique) |

Le rendu crayonné utilisé par les vidéos est global : `src/render`.
