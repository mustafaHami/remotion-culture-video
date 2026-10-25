# Polices locales

Uniquement des fichiers locaux sous licence libre (SIL Open Font License 1.1), chacun accompagné de sa licence nommée `<Famille>-OFL.txt`. `npm run verify` refuse une police sans licence ; `scripts/check-fonts.py` vérifie les caractères français.

| Fichier | Style | Licence | Source |
|---|---|---|---|
| `Baloo2-Variable.ttf` | B (titres) | `Baloo2-OFL.txt` | repris d'Englizy, google/fonts `ofl/baloo2` |
| `Nunito-Variable.ttf` | B (texte) | `Nunito-OFL.txt` | repris d'Englizy, google/fonts `ofl/nunito` |
| `Fraunces-Variable.ttf`, `Fraunces-VariableItalic.ttf` | A (titres) | `Fraunces-OFL.txt` | google/fonts `ofl/fraunces` |
| `AtkinsonHyperlegible-Regular.ttf`, `-Bold.ttf` | A (texte) | `AtkinsonHyperlegible-OFL.txt` | google/fonts `ofl/atkinsonhyperlegible` |
| `Anton-Regular.ttf` | D (titres) | `Anton-OFL.txt` | google/fonts `ofl/anton` |
| `Inter-Variable.ttf` | D (texte) | `Inter-OFL.txt` | google/fonts `ofl/inter` |

Les fichiers de google/fonts proviennent du commit `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0` (téléchargés le 25 octobre 2026) ; les fichiers variables ont été renommés sans crochets.

Caractères : toutes les polices contiennent les lettres accentuées, œ/æ, « », ’ et l'espace insécable. L'espace fine insécable (U+202F) manque presque partout et la flèche → manque dans Fraunces, Atkinson Hyperlegible et Nunito : utiliser l'espace insécable ordinaire et dessiner les flèches en SVG.

Les trois styles étant gardés, toutes ces polices sont utilisées.
