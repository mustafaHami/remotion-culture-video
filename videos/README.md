# videos

Vidéos **finales validées** par l'utilisateur, prêtes à être partagées. Versionnées par **Git LFS** (`.gitattributes` : `videos/*.mp4`) : le dépôt ne garde qu'un pointeur, le fichier est stocké à part par GitHub. Après un clonage : `git lfs install` puis `git lfs pull`. Avec Git 2.45.1, le clonage affiche « active `post-checkout` hook found » : c'est un bogue connu de cette version avec Git LFS, sans perte (les fichiers sont bien là) ; mettre Git à jour (2.45.2 ou plus récent) le supprime.

Aucune n'est publiée tant que l'utilisateur ne l'a pas confirmé (`AGENTS.md`).

| Fichier | Question | Style | Voix | Durée | Rendue le |
|---|---|---|---|---|---|
| `immeubles-paris.mp4` | Pourquoi les immeubles parisiens se ressemblent-ils ? | A crayonné | Peter (ElevenLabs), débit −8 % | 40,3 s | 25 octobre 2026 |
| `fonds-marins.mp4` | Pourquoi connaît-on si mal le fond des océans ? | A crayonné | Peter (ElevenLabs) | 49,6 s | 25 octobre 2026 |
| `hublots-ronds.mp4` | Pourquoi les hublots des avions sont-ils ronds ? | A crayonné | Peter (ElevenLabs) | 45,9 s | 25 octobre 2026 |

Format : 1080 × 1920, 30 i/s, H.264 + AAC. Chaque vidéo se refait à l'identique depuis son épisode (`content/episodes/<id>.json`) : `npm run render -- --compositions=<Id> --out=output/<dossier>`.

Ajouter une vidéo : seulement après validation par l'utilisateur ; la copier ici sous le nom de son épisode, ajouter sa ligne, vérifier `git lfs ls-files` avant le commit.
