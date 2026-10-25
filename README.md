# Vidéos courtes de culture générale — univers voxel

Nom de travail du projet : `remotion-culture-video` (nom définitif à choisir).

Vidéos verticales de 40 s à 1 min 30, destinées à Instagram Reels, TikTok et YouTube Shorts. Chaque vidéo répond à **une** question de culture générale (pourquoi on appelle une chose ainsi, pourquoi une ville a cette forme, pourquoi un mot s'écrit comme ça…) dans un univers en voxels, guidée par une mascotte : le hibou explorateur. Le décor est vu en coupe, la caméra passe d'une pièce à l'autre et des annotations techniques apparaissent au rythme de la voix.

État actuel : moteur d'épisode générique (la mise en scène s'écrit en données dans le fichier d'épisode, [docs/moteur.md](docs/moteur.md)) et trois épisodes en style A crayonné : **ImmeublesParis** (« Pourquoi les immeubles parisiens se ressemblent-ils ? », 39 s), **FondsMarins** (« Pourquoi connaît-on si mal le fond des océans ? », 50 s) et **HublotsRonds** (« Pourquoi les hublots des avions sont-ils ronds ? », 46 s), plus les essais de style (voir [content/essais/README.md](content/essais/README.md)). Hibou version C. Aucun épisode n'est publié. Vision et direction artistique : [docs/vision.md](docs/vision.md). Produire une vidéo : skill [produire-episode](.agents/skills/produire-episode/SKILL.md).

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
cp .env.example .env    # puis renseigner ELEVENLABS_API_KEY (voix ElevenLabs), jamais versionné
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
| `npm run render -- --compositions=Id --out=output/...` | Rend des compositions en MP4 ; `--look=A`, `B` ou `D` rend dans un autre style |
| `npm run stills -- --compositions=Id --frames=0,120` | Rend des images fixes pour régler un cadrage (accepte aussi `--look`) |
| `npm run essai:render` | Rend les trois versions de l'essai de styles dans `output/essais` |

Préparation audio et contrôle vidéo (Python, dans `.venv`) :

```sh
.venv/Scripts/python scripts/prepare-audio.py --content content/essais/styles-paris.json
.venv/Scripts/python scripts/inspect-video.py --content content/essais/styles-paris.json --videos output/essais/EssaiStyleA.mp4 --board output/essais/planche.jpg
.venv/Scripts/python scripts/check-fonts.py
```

Aucun rendu n'est versionné.

## Organisation

| Chemin | Rôle |
|---|---|
| `src/index.ts`, `src/Root.tsx` | Point d'entrée Remotion et liste des compositions |
| `src/design` | Palette, typographie, easings, formats |
| `src/voxel` | Briques 3D voxel construites en code |
| `src/mascot` | Le hibou explorateur |
| `src/voxel/decor` | Décors propres à chaque sujet (maquettes détaillées) |
| `src/scenes` | Caméra (plans, projection des points 3D) |
| `src/overlays` | Accroche, sous-titres, bandeau de chapitre, annotations |
| `src/engine` | Moteur d'épisode : une composition pour toutes les vidéos, pilotée par `content/episodes/<id>.json` |
| `src/render` | Finition crayonnée globale (hachures, contours, filtres, grain) |
| `src/essais` | Compositions d'essai et de réglage (jamais une vidéo finale) |
| `videos/` | Vidéos finales validées, versionnées par Git LFS ([videos/README.md](videos/README.md)) |
| `content/episodes` | Un fichier JSON par vidéo |
| `content/essais` | Contenus d'essais (tests de style, jamais publiés) |
| `src/content` | Minutage de la narration (voix → images) |
| `public/audio` | Narrations WAV figées et versionnées |
| `public/fonts` | Polices OFL locales et leurs licences |
| `scripts` | Contrôles du dépôt, synchronisation des skills, futurs scripts de production |
| `tests` | Tests `node:test` |
| `docs` | Vision, système de design, rendu, maquettes, mise en scène ([docs/README.md](docs/README.md)) |
| `.agents/skills` | Skills partagés (source de vérité) |
| `.claude/skills` | Copie générée pour Claude Code |
| `output/` | Rendus locaux, exclus de Git |

## Pour les agents

Lire [AGENTS.md](AGENTS.md) (source de vérité). Claude Code charge aussi [CLAUDE.md](CLAUDE.md), qui importe `AGENTS.md`. Processus Git : [CONTRIBUTING.md](CONTRIBUTING.md).
