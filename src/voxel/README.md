# src/voxel

Briques 3D réutilisables construites **en code** avec Three.js via `@remotion/three` : cube voxel, assemblages (murs, toits, meubles, objets), éclairage doux et ombres nettes, matériaux de la palette.

Aucun modèle importé depuis une source externe sous droits. Une ressource externe éventuelle doit être libre ou achetée, avec sa licence notée à côté du fichier.

Toute animation est calculée depuis `useCurrentFrame()` (jamais `useFrame` de react-three-fiber).

## Décors

`decor/<sujet>.ts` contient le décor d'un sujet : `haussmann-fin.ts` (rue haussmannienne, voxels de 25 cm, modèle de référence), `ocean.ts` (l'océan en coupe), `haussmann.ts` (version grossière de l'essai de styles). Méthode : `docs/maquettes.md`. Un décor ne colore ses blocs qu'avec les rôles génériques des styles (`src/design/looks.ts`, `docs/design-system.md`) et doit fonctionner dans les trois styles. Il n'ajoute rien aux fichiers de style.
