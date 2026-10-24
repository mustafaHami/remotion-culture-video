# Vidéos courtes de culture générale — univers voxel

Nom de travail du projet : `remotion-culture-video` (nom définitif à choisir).

Vidéos verticales de 40 s à 1 min 30, destinées à Instagram Reels, TikTok et YouTube Shorts. Chaque vidéo répond à **une** question de culture générale (pourquoi on appelle une chose ainsi, pourquoi une ville a cette forme, pourquoi un mot s'écrit comme ça…) dans un univers en voxels, guidée par une mascotte : le hibou explorateur. Le décor est vu en coupe, la caméra passe d'une pièce à l'autre et des annotations techniques apparaissent au rythme de la voix.

État actuel : **projet initialisé, aucune vidéo, scène ni mascotte construite.** Vision et direction artistique : [docs/vision.md](docs/vision.md).

## Prérequis

| Outil | Version | Remarque |
|---|---|---|
| Node.js | 22 ou plus récent | `.nvmrc` indique 22 |
| Python | 3.11 ou plus récent | dans un environnement virtuel `.venv` |
| FFmpeg | — | celui embarqué par Remotion (`node_modules/@remotion/compositor-*`) suffit si aucun FFmpeg n'est installé sur le système |
| Navigateur Remotion | — | installé par `npm run browser` |

Le rendu Three.js utilise le moteur OpenGL `angle` de Chromium (`remotion.config.ts`).

## Installation

```sh
npm ci
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
.venv/bin/python -m pip install -r requirements.txt       # Linux / macOS
npm run browser
```

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Remotion Studio sur http://localhost:3000 |
| `npm run check` | Vérification TypeScript (`tsc --noEmit`) |
| `npm test` | Tests `node:test` des scripts du dépôt |
| `npm run verify` | Contrôle statique du dépôt et synchronisation des skills |
| `npm run browser` | Installe ou vérifie le navigateur de Remotion |
| `npm run skills:sync` | Copie `.agents/skills` vers `.claude/skills` |

Les commandes de préparation audio, de rendu et de contrôle vidéo seront ajoutées avec le premier flux de création. Aucun rendu n'est versionné.

## Organisation

| Chemin | Rôle |
|---|---|
| `src/index.ts`, `src/Root.tsx` | Point d'entrée Remotion (aucune composition pour l'instant) |
| `src/design` | Palette, typographie, easings, formats |
| `src/voxel` | Briques 3D voxel construites en code |
| `src/mascot` | Le hibou explorateur |
| `src/scenes` | Types de scènes pilotés par les données |
| `src/overlays` | Sous-titres, bandeau de chapitre, annotations |
| `src/compositions` | Compositions Remotion génériques |
| `content/episodes` | Un fichier JSON par vidéo |
| `public/audio` | Narrations WAV figées et versionnées |
| `public/fonts` | Polices OFL locales et leurs licences |
| `scripts` | Contrôles du dépôt, synchronisation des skills, futurs scripts de production |
| `tests` | Tests `node:test` |
| `docs` | Vision et documentation |
| `.agents/skills` | Skills partagés (source de vérité) |
| `.claude/skills` | Copie générée pour Claude Code |
| `output/` | Rendus locaux, exclus de Git |

## Pour les agents

Lire [AGENTS.md](AGENTS.md) (source de vérité). Claude Code charge aussi [CLAUDE.md](CLAUDE.md), qui importe `AGENTS.md`. Processus Git : [CONTRIBUTING.md](CONTRIBUTING.md).
