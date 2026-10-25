# scripts

| Script | Rôle |
|---|---|
| `check-project.cjs` | Contrôle statique du dépôt (`npm run verify`) : versions figées, réglage OpenGL, polices et licences, déterminisme du code `src/`, contenus (voix figée conforme au texte, annotations, sources), fichiers interdits dans Git. |
| `sync-skills.cjs` | Copie `.agents/skills` vers `.claude/skills` (`npm run skills:sync`) ; `--check` échoue en cas d'écart. |
| `prepare-audio.py` | Fige la narration d'un contenu : WAV dans `public/audio` (ElevenLabs avec la clé de `.env`, ou edge-tts selon le champ `voice`), durée mesurée et minutage mot à mot (alignement caractère par caractère d'ElevenLabs) écrits dans le JSON. Plus de crédits ElevenLabs : tout l'épisode passe sur la voix de secours `fr-FR-DeniseNeural` (avertissement affiché) ; toute autre panne arrête tout. |
| `render.cjs` | Rend des compositions en MP4 (`npm run render -- --compositions=Id --out=output/...`), moteur OpenGL `angle`. `--look=A`, `B` ou `D` rend dans un autre style (fichier `<Id>-<style>.mp4`). |
| `render-stills.cjs` | Rend des images fixes pour régler un cadrage (`npm run stills -- --compositions=Id --frames=0,120`, `--look` accepté). |
| `inspect-video.py` | Contrôle technique des MP4 (format, décodage, voix, silences, saturation) et planche des moments clés. |
| `check-fonts.py` | Vérifie la présence des caractères français dans les polices. |
| `lib/` | Fonctions testées par `tests/`. |

Les scripts Python s'exécutent avec `.venv` (`.venv/Scripts/python` sous Windows, `.venv/bin/python` ailleurs). FFmpeg : celui du système s'il existe, sinon celui fourni par Remotion (version minimale, sans filtre `select` ni sortie `null`).
