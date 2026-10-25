// Repères de temps de la mise en scène, tous tirés de la voix figée (jamais un temps fixe) :
//   "start", "end"                  début et fin de la vidéo
//   "sonar"  /  "sonar.end"         début / fin du passage « sonar »
//   "lumiere:200"                   instant où le mot « 200 » est prononcé dans « lumiere »
//   "regle:20#2"                    seconde occurrence du mot
//   "fosse:000-4", "pression+20"    décalage en images (toujours en fin de repère)
//   "sonar+6..resultat+46@0.5"      point situé à 50 % entre deux repères
//   un nombre                       image absolue (à éviter)
// Même syntaxe contrôlée par scripts/lib/staging.cjs (npm run verify).
import {cueById, wordFrame, type Timeline} from '../content/timeline';

export type Time = string | number;

const single = (src: string, tl: Timeline): number => {
  let base = src.trim();
  let offset = 0;
  const m = /^(.*[^+-])([+-]\d+(?:\.\d+)?)$/.exec(base);
  if (m && !m[1].endsWith(':')) {
    base = m[1];
    offset = Number(m[2]);
  }
  if (base === 'start') return offset;
  if (base === 'end') return tl.durationInFrames + offset;
  const colon = base.indexOf(':');
  if (colon < 0) {
    if (base.endsWith('.end')) return cueById(tl, base.slice(0, -4)).to + offset;
    return cueById(tl, base).from + offset;
  }
  const cue = base.slice(0, colon);
  let word = base.slice(colon + 1);
  let occurrence = 1;
  const occ = /^(.*)#(\d+)$/.exec(word);
  if (occ) {
    word = occ[1];
    occurrence = Number(occ[2]);
  }
  return wordFrame(tl, cue, word, occurrence) + offset;
};

const caches = new WeakMap<Timeline, Map<string, number>>();

export const timeOf = (t: Time, tl: Timeline): number => {
  if (typeof t === 'number') return t;
  let cache = caches.get(tl);
  if (!cache) {
    cache = new Map();
    caches.set(tl, cache);
  }
  const hit = cache.get(t);
  if (hit !== undefined) return hit;
  let value: number;
  const between = /^(.+)\.\.(.+)@(\d+(?:\.\d+)?)$/.exec(t);
  if (between) {
    const a = single(between[1], tl);
    const b = single(between[2], tl);
    value = a + (b - a) * Number(between[3]);
  } else value = single(t, tl);
  cache.set(t, value);
  return value;
};
