// Palette de l'essai « dessiné » : trois moments de la journée (crépuscule, jour, nuit) que l'on
// mélange image par image. Essai seulement : si ce rendu est retenu, ces couleurs deviendront
// un style officiel dans src/design, avec des rôles génériques.
import {Easing, interpolate} from 'remotion';
import {mix} from '../../design/color';

const COLOR_KEYS = [
  'skyTop', 'skyMid', 'skyLow', 'cloud', 'cloudShade', 'haze', 'hazeHatch', 'trees', 'treesDark',
  'stone', 'stoneShade', 'stoneHatch', 'interior', 'interiorShade', 'floor', 'roof', 'roofHatch',
  'road', 'roadHatch', 'curb', 'soil', 'soilDark', 'leaf', 'leafVein', 'ink', 'glass', 'light', 'sparkle', 'cream',
] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];
export type Palette = Record<ColorKey, string>;

const DUSK: Palette = {
  skyTop: '#6F6BAA', skyMid: '#B794C2', skyLow: '#F2B4A8', cloud: '#F6C9D2', cloudShade: '#D99DB6',
  haze: '#A48FBF', hazeHatch: '#C9B5D9', trees: '#7E9C78', treesDark: '#5E7D63',
  stone: '#EBC9B4', stoneShade: '#C99C93', stoneHatch: '#F8E0D0', interior: '#F0CDB8', interiorShade: '#D2A79E',
  floor: '#A86E5A', roof: '#8F86B0', roofHatch: '#B5AAD0', road: '#8A7A98', roadHatch: '#A897B4', curb: '#D6B8C0',
  soil: '#8C6A6E', soilDark: '#6E4F5A', leaf: '#6F9E6A', leafVein: '#D5ECC0', ink: '#2B1B1E',
  glass: '#F7D7C8', light: '#FFC777', sparkle: '#FFF1D6', cream: '#FFF4E6',
};

const DAY: Palette = {
  skyTop: '#4F93D2', skyMid: '#8EC1E8', skyLow: '#D7ECF2', cloud: '#FBFCFD', cloudShade: '#D3E1EE',
  haze: '#93A9C6', hazeHatch: '#B9CADF', trees: '#6DB14F', treesDark: '#4C8B3D',
  stone: '#EFDFBF', stoneShade: '#CDB48F', stoneHatch: '#FBF1DD', interior: '#F6E6C8', interiorShade: '#D9C29C',
  floor: '#B07A4E', roof: '#7F95A8', roofHatch: '#A8BACA', road: '#8E8F96', roadHatch: '#A9AAB1', curb: '#DCD5C6',
  soil: '#9A7352', soilDark: '#77573F', leaf: '#5FA554', leafVein: '#DDF3C4', ink: '#241A14',
  glass: '#CFE8F2', light: '#FFD27A', sparkle: '#FFFFFF', cream: '#FFF8EA',
};

const NIGHT: Palette = {
  skyTop: '#121433', skyMid: '#262556', skyLow: '#4B3A73', cloud: '#3D3D6E', cloudShade: '#2D2D58',
  haze: '#3F3A68', hazeHatch: '#5A5488', trees: '#2F5450', treesDark: '#1F3B3E',
  stone: '#5F5683', stoneShade: '#463F66', stoneHatch: '#756D9A', interior: '#5B4D78', interiorShade: '#463B62',
  floor: '#4A3A5C', roof: '#3F4470', roofHatch: '#5D6396', road: '#34345A', roadHatch: '#47477A', curb: '#5A5786',
  soil: '#3A2E48', soilDark: '#2A2138', leaf: '#2E5B58', leafVein: '#8FE3D0', ink: '#0F0C1A',
  glass: '#6C6FA8', light: '#FFB65C', sparkle: '#FFF4C8', cream: '#F3E6D8',
};

const mixPalette = (a: Palette, b: Palette, t: number): Palette => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const out = {} as Palette;
  for (const key of COLOR_KEYS) out[key] = mix(a[key], b[key], t);
  return out;
};

export type Atmosphere = {
  c: Palette;
  /** Part des fenêtres allumées (0 à 1). */
  lit: number;
  stars: number;
  /** Hauteur du soleil : 1 haut dans le ciel, 0 à l'horizon, négatif = couché. */
  sun: number;
  moon: number;
  /** Teinte nocturne appliquée au hibou (0 à 1). */
  night: number;
  /** Lumière dorée de fin de journée (0 à 1). */
  golden: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = Easing.inOut(Easing.cubic);

/** Moments clés : crépuscule pendant l'accroche, jour pour la règle, puis tombée de la nuit sur le toit. */
export const atmosphereAt = (frame: number, dive: number, roof: number): Atmosphere => {
  const toDay = interpolate(frame, [dive, dive + 40], [0, 1], {...clamp, easing: smooth});
  const toDusk = interpolate(frame, [roof - 6, roof + 34], [0, 1], {...clamp, easing: smooth});
  const toNight = interpolate(frame, [roof + 30, roof + 84], [0, 1], {...clamp, easing: smooth});
  let c = mixPalette(DUSK, DAY, toDay);
  c = mixPalette(c, DUSK, toDusk);
  c = mixPalette(c, NIGHT, toNight);
  const dusk = (1 - toDay) + toDusk * (1 - toNight);
  return {
    c,
    lit: Math.min(0.86, 0.4 * (1 - toDay) + 0.35 * toDusk + 0.55 * toNight),
    stars: Math.max(0.25 * (1 - toDay), toNight),
    sun: 0.08 * (1 - toDay) + toDay * (1 - toDusk) + toDusk * 0.08 - toNight * 0.6,
    moon: toNight,
    night: toNight,
    golden: Math.min(1, dusk),
  };
};
