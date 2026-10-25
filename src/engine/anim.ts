// Valeurs animées de la mise en scène : clés (repère de temps, valeur, courbe) et fenêtres d'apparition.
// Tout est une fonction pure du numéro d'image.
import {Easing, interpolate} from 'remotion';
import type {Timeline} from '../content/timeline';
import {num, type Ctx, type Num} from './expr';
import {timeOf, type Time} from './time';

/**
 * Courbes : "smooth" (douce, par défaut des mouvements), "linear", "out" (apparition), "in" (départ),
 * "quad" (douce, plus légère), "back" ou "back:2.2" (dépasse puis se pose), "backIn" ou "backIn:2" (prend de l'élan).
 */
export type EaseName = string;

export const easing = (name: EaseName = 'smooth') => {
  const [kind, arg] = name.split(':');
  const k = arg === undefined ? undefined : Number(arg);
  switch (kind) {
    case 'linear':
      return (x: number) => x;
    case 'out':
      return Easing.out(Easing.cubic);
    case 'in':
      return Easing.in(Easing.cubic);
    case 'quad':
      return Easing.inOut(Easing.quad);
    case 'back':
      return Easing.out(Easing.back(k ?? 2.2));
    case 'backIn':
      return Easing.in(Easing.back(k ?? 2));
    case 'smooth':
      return Easing.inOut(Easing.cubic);
    default:
      throw new Error(`Courbe inconnue : ${name}`);
  }
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Avancement 0 → 1 entre `at` et `at + length`. */
export const progress = (frame: number, at: number, length: number, ease?: EaseName) =>
  length <= 0 ? (frame >= at ? 1 : 0) : interpolate(frame, [at, at + length], [0, 1], {...clamp, easing: easing(ease)});

/** Clé : la valeur est atteinte au repère `at`, en arrivant avec la courbe `ease` depuis la clé précédente. */
export type Key<T> = {at: Time; v: T; ease?: EaseName};

export const scalarAt = (keys: Key<Num>[], frame: number, tl: Timeline, ctx: Ctx): number => {
  let value = num(keys[0].v, ctx);
  let prevAt = timeOf(keys[0].at, tl);
  for (let i = 1; i < keys.length; i++) {
    const at = timeOf(keys[i].at, tl);
    if (frame <= prevAt) break;
    const target = num(keys[i].v, ctx);
    const t = progress(frame, prevAt, at - prevAt, keys[i].ease);
    value = value + (target - value) * t;
    prevAt = at;
  }
  return value;
};

/** Clés de vecteurs ; `null` sur un axe = cet axe n'est pas réglé par cette clé (il garde sa valeur). */
export type VecKey = Key<[Num | null, Num | null, Num | null]>;

export const vecAt = (keys: VecKey[], frame: number, tl: Timeline, ctx: Ctx, base: [number, number, number]): [number, number, number] =>
  [0, 1, 2].map((axis) => {
    const own = keys.filter((k) => k.v[axis] !== null).map((k) => ({at: k.at, v: k.v[axis] as Num, ease: k.ease}));
    return own.length ? scalarAt(own, frame, tl, ctx) : base[axis];
  }) as [number, number, number];

/**
 * Fenêtre d'apparition : monte de 0 à 1 à partir de `in` (durée `inFor`), redescend à partir de `out` (durée `outFor`).
 * Sans `in`, visible dès le début ; sans `out`, jusqu'à la fin.
 */
export type Window = {in?: Time; inFor?: number; out?: Time; outFor?: number; ease?: EaseName; outEase?: EaseName};

export const windowAt = (w: Window, frame: number, tl: Timeline, defaults: {inFor: number; ease: EaseName} = {inFor: 14, ease: 'out'}) => {
  const enter = w.in === undefined ? 1 : progress(frame, timeOf(w.in, tl), w.inFor ?? defaults.inFor, w.ease ?? defaults.ease);
  const exit = w.out === undefined ? 0 : progress(frame, timeOf(w.out, tl), w.outFor ?? 10, w.outEase ?? 'linear');
  return enter * (1 - exit);
};
