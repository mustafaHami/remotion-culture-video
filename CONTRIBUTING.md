# Contribution et processus Git

## Branche et dépôt

- Branche de travail par défaut : `main`.
- Aucun dépôt distant n'est configuré. On n'en crée pas et on ne pousse rien sans demande explicite de l'utilisateur. Le jour où un dépôt distant existe, ses protections (PR, contrôles obligatoires) s'appliquent et ne se contournent pas.

## Avant un commit

1. Lire `git status --short` et vérifier qu'on ne mélange pas le travail d'autres personnes ou d'autres tâches.
2. Lancer les contrôles : `npm run check`, `npm test`, `npm run verify`. Tous doivent réussir.
3. Après un changement visuel ou un nouvel épisode : rendre, contrôler le MP4 et inspecter les images (voir `AGENTS.md`, section « Vérifications »).
4. Relire `git diff --check` et la liste des fichiers ajoutés.
5. Ajouter les fichiers **par chemins explicites** (`git add AGENTS.md src/overlays/Subtitles.tsx`), jamais `git add -A` ou `git add .`.
6. Exclure secrets, `.env`, caches, `node_modules`, `.venv`, `output/`, MP4 et exports volumineux. Les WAV de narration figés sont versionnés.

## Messages de commit

Courts, descriptifs, en français, avec un préfixe :

- `feat: …` nouvelle capacité (composant, scène, script) ;
- `fix: …` correction ;
- `content: …` nouvel épisode ou correction d'un épisode ;
- `docs: …` documentation et règles ;
- `chore: …` configuration, dépendances, outillage.

Le corps du message explique le pourquoi quand ce n'est pas évident, et mentionne les vérifications réellement effectuées.

## Interdits

- Pas de force push, pas de réécriture ni de suppression d'historique (`rebase` sur des commits partagés, `reset --hard` sur du travail non sauvegardé, `push --force`).
- Pas de contournement des contrôles (`--no-verify`) ni des protections.
- Pas de modification des composants pour produire un épisode particulier.

## Dépendances

Versions figées (pas de `^` ni `~`), `remotion` et `@remotion/*` toujours à la même version. Une mise à jour est un commit `chore:` dédié, suivi des contrôles et d'un rendu de vérification dès qu'une composition existe.
