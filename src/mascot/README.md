# src/mascot

Le hibou explorateur, **version C « lisse stylisé »**, choisie le 25 octobre 2026 parmi les trois propositions Claude Design (canevas : https://claude.ai/artifact/Bdh5gQ6JugMnUDrNRGswy8).

- `Owl.tsx` : le hibou construit en code (ellipsoïdes, sphères, cônes, tore, tube) d'après les proportions de la planche (H = hauteur sans aigrettes) ; ombrage doux par deux lumières (`OwlLights`), le décor voxel gardant ses couleurs précalculées.
- `rig.ts` : les réglages animables (tête, ailes, paupières, sourcils, regard) et les poses (`idle`, `wonder`, `pointRight`, `pointLeft`, `wave`), mélangées pour des gestes continus.

Le hibou regarde vers +Z ; on l'oriente vers la caméra par `yaw`. Tout son jeu est calculé depuis le numéro d'image (clignements, respiration, sauts, fondus de pose).

Pas encore fait : marche, loupe levée (« réfléchit »), écrasement-étirement plus marqué, paupières inférieures.
