# src/scenes

Caméra commune à toutes les vidéos :

- `camera.ts` : le plan (`Shot` : cible, `yaw`, `pitch`, distance, `fov`, `centerY`), `mixShots` pour passer d'un plan à l'autre, `projectPoint` pour placer les annotations 2D sur la 3D ;
- `CameraRig.tsx` : applique le plan à la caméra du `ThreeCanvas` à chaque image ;

Usage : `docs/mise-en-scene.md` § 3.
