# Skills partagés (source de vérité)

Chaque skill est un dossier `<nom>/SKILL.md` (en-tête YAML avec `name` identique au dossier et `description`), éventuellement accompagné de fichiers de référence.

On écrit et on modifie les skills **ici uniquement**, puis `npm run skills:sync` les copie dans `.claude/skills`. `npm run verify` échoue si les deux dossiers divergent.

| Skill | Rôle |
|---|---|
| `produire-episode` | Produire une vidéo complète sur une notion : sources, narration, voix, maquette, mise en scène, rendu, contrôles |
