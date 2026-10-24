# scripts

| Script | Rôle |
|---|---|
| `check-project.cjs` | Contrôle statique du dépôt (`npm run verify`) : versions figées, réglage OpenGL, polices et licences, déterminisme du code `src/`, fichiers interdits dans Git. |
| `sync-skills.cjs` | Copie `.agents/skills` vers `.claude/skills` (`npm run skills:sync`) ; `--check` échoue en cas d'écart. |
| `lib/` | Fonctions testées par `tests/`. |

À venir avec le premier flux de création : préparation audio (edge-tts → WAV figés), rendu d'un épisode et contrôle technique du MP4 (décodage, format, voix présentes, planche de captures). Les scripts Python s'exécutent avec `.venv`.
