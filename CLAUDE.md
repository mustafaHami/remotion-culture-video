@AGENTS.md

## Propre à Claude Code

- Toutes les règles sont dans `AGENTS.md` (importé ci-dessus). Ne pas les recopier ni les reformuler ici : une règle commune se modifie dans `AGENTS.md`.
- `.claude/skills` est une copie générée de `.agents/skills`. Écrire ou modifier un skill dans `.agents/skills`, puis lancer `npm run skills:sync` ; `npm run verify` refuse toute divergence. Lire seulement le skill lié à la tâche.
- Pour vérifier une vidéo, Claude peut lire les images extraites (outil de lecture d'images) : c'est une inspection visuelle réelle. Claude ne peut pas écouter l'audio ; il ne doit donc jamais annoncer une écoute, seulement des mesures techniques (présence de voix, niveaux, silences).
- Lancer `npm run dev` (Remotion Studio) en arrière-plan ou via l'aperçu de l'application, jamais en commande bloquante.
