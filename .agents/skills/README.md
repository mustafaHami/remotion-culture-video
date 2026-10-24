# Skills partagés (source de vérité)

Chaque skill est un dossier `<nom>/SKILL.md` (en-tête YAML avec `name` identique au dossier et `description`), éventuellement accompagné de fichiers de référence.

On écrit et on modifie les skills **ici uniquement**, puis `npm run skills:sync` les copie dans `.claude/skills`. `npm run verify` échoue si les deux dossiers divergent.

Aucun skill de production n'existe encore : ils seront rédigés quand le premier flux de création sera en place.
