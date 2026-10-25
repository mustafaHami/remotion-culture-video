// Registre automatique des épisodes : tout fichier content/episodes/<id>.json qui contient une mise en scène
// ("staging") devient une composition, sans toucher au code.
import type {EpisodeContent} from './Episode';

type Context = {keys: () => string[]; (key: string): unknown};
// require.context est fourni par webpack (bundler de Remotion) : il inclut les fichiers au moment du bundle.
const files = (require as unknown as {context: (dir: string, deep: boolean, pattern: RegExp) => Context}).context('../../content/episodes', false, /\.json$/);

export const EPISODES: EpisodeContent[] = files
  .keys()
  .filter((key) => key.startsWith('./'))
  .map((key) => files(key) as EpisodeContent)
  .filter((episode) => Boolean(episode.staging));

export const episodeById = (id: string) => {
  const found = EPISODES.find((e) => e.id === id);
  if (!found) throw new Error(`Épisode introuvable : ${id}`);
  return found;
};
