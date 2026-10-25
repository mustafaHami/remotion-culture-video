# src/design

Design **global**, commun à toutes les vidéos (spécification : `docs/design-system.md`) :

- `looks.ts` : les trois styles officiels A, B, D (palettes, rôles de couleur des blocs voxel, polices, habillage, couleurs du hibou) ;
- `fonts.ts` : chargement des polices locales de chaque style ;
- `format.ts` : 1080 × 1920, 30 i/s, zones sûres ;
- `color.ts` : mélanges de couleurs.

Règle : rien ici n'est propre à un décor (immeuble, rue…). Les décors utilisent les rôles génériques.
