# src/engine

Moteur d'épisode générique (format : `docs/moteur.md`).

| Fichier | Rôle |
|---|---|
| `Episode.tsx` | La composition unique : lit l'épisode, construit le décor, calcule la scène à chaque image, assemble les calques (`docs/rendu.md` § 6). |
| `episodes.ts` | Registre automatique : chaque `content/episodes/*.json` doté d'un `staging` devient une composition. |
| `scene.ts` | État d'une image : objets, caméra, hibou, annotations. |
| `time.ts` | Repères de temps tirés de la voix (`"lumiere:200-4"`). |
| `expr.ts` | Expressions numériques (`"ship.x - 2.2"`), sans eval. |
| `anim.ts` | Clés, courbes, fenêtres d'apparition. |
| `types.ts` | Types du format `staging` et contrat d'un décor (`DecorScene`). |

Tout est une fonction pure du numéro d'image et du minutage de la voix.
