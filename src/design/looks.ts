// Les trois styles officiels du projet (docs/design-system.md), au choix de chaque vidéo :
// A « Atelier », B « Veillée », D « Zinc & craie ». Palettes reprises des planches Claude Design.
//
// RÈGLE : ce fichier ne contient que du design GLOBAL (couleurs par rôle, polices, habillage, hibou).
// Aucun nom ni réglage propre à un décor (immeuble, rue, objet…) : chaque décor de `src/voxel/decor`
// colore ses blocs avec les rôles ci-dessous, et fonctionne ainsi dans les trois styles.
import {mix} from './color';

export type LookId = 'A' | 'B' | 'D';
export const LOOK_IDS: LookId[] = ['A', 'B', 'D'];

/**
 * Rôles de couleur des blocs voxel, communs à tous les décors.
 * structure / structureAlt : volumes principaux · trim : arêtes, bordures et moulures claires ·
 * metal : couvertures et métal clair · dark : détails sombres (ferronneries, contours) ·
 * glass : vitrages · light : lumières allumées (émissif) · ground / groundEdge / path / marking : sol ·
 * base : socle de la maquette · interior / interiorAlt : murs intérieurs vus en coupe ·
 * focus : élément mis en valeur · floor : planchers · accent : touche colorée ·
 * accentLight : touche claire · soft : objets clairs · foliage / wood : végétation ·
 * water / waterDeep : eau, de la surface aux profondeurs (mer, rivière, bassin).
 */
export type VoxelRole =
  | 'structure' | 'structureAlt' | 'trim' | 'metal' | 'dark' | 'glass' | 'light'
  | 'ground' | 'groundEdge' | 'path' | 'marking' | 'base'
  | 'interior' | 'interiorAlt' | 'focus' | 'floor' | 'accent' | 'accentLight' | 'soft'
  | 'foliage' | 'wood'
  | 'water' | 'waterDeep';

/** Couleurs des rôles voxel et réglages de l'ombrage précalculé. */
export type VoxelTheme = {
  /** Couleur vers laquelle tirent les faces du dessus. */
  hi: string;
  topK: number;
  /** Couleur vers laquelle tirent les faces latérales à l'ombre. */
  ink: string;
  xK: number;
  yK: number;
  /** Ombre portée : couleur et intensité. */
  shadow: string;
  shK: number;
  /** Part des lumières allumées (0 à 1) quand un décor en propose plusieurs. */
  lit: number;
  /** Rôles lumineux, ni ombrés ni assombris. */
  emit: VoxelRole[];
  m: Record<VoxelRole, string>;
  /** Suite de couleurs d'accent pour varier des éléments répétés. */
  accents: string[];
  /** Variation de teinte d'un bloc à l'autre (texture voxel). */
  jitter: number;
};

/** Couleurs du hibou (version C « lisse stylisé ») dans le style. */
export type OwlColors = {
  plumage: string;
  plumageDark: string;
  mask: string;
  belly: string;
  eye: string;
  pupil: string;
  beak: string;
  strap: string;
  bag: string;
  rim: string;
  lens: string;
  scarf: string;
};

export type Look = {
  id: LookId;
  name: string;
  background: string;
  text: string;
  accent: string;
  /** Couleur du surlignage du mot clé et du texte posé dessus. */
  keyBg: string;
  keyText: string;
  fonts: {title: string; body: string};
  annotation: {line: string; text: string; bg: string; hotBg: string; hotText: string; radius: number; border: number; upper: boolean};
  /** Hibou : couleurs, écharpe, yeux et loupe lumineux (nuit). */
  owl: {colors: OwlColors; scarf: boolean; glow: boolean};
  voxel: VoxelTheme;
};

const atelier = (): Look => {
  const creme = '#F4EAD8', pierre = '#E3C9A0', bois = '#A9693D', encre = '#3A2619', zinc = '#6E7B85', terre = '#C4553A', ambre = '#EFA733';
  return {
    id: 'A',
    name: 'Atelier',
    background: creme,
    text: encre,
    accent: terre,
    keyBg: terre,
    keyText: '#FFF7E8',
    fonts: {title: "'Fraunces', serif", body: "'Atkinson Hyperlegible', sans-serif"},
    annotation: {line: encre, text: encre, bg: '#FFF7E8', hotBg: terre, hotText: '#FFF7E8', radius: 10, border: 3, upper: false},
    owl: {
      colors: {plumage: bois, plumageDark: mix(bois, encre, 0.45), mask: creme, belly: pierre, eye: ambre, pupil: encre, beak: terre, strap: encre, bag: terre, rim: encre, lens: mix(zinc, creme, 0.7), scarf: terre},
      scarf: false,
      glow: false,
    },
    voxel: {
      hi: '#FFF7E8', topK: 0.2, ink: encre, xK: 0, yK: 0.3, shadow: '#5A3A48', shK: 0.36, lit: 0, emit: ['light'], jitter: 0.025,
      accents: [terre, zinc, terre],
      m: {
        structure: pierre, structureAlt: mix(pierre, bois, 0.16), trim: creme, metal: zinc, dark: encre, glass: mix(zinc, encre, 0.4), light: ambre,
        ground: mix(creme, pierre, 0.45), groundEdge: creme, path: bois, marking: creme, base: mix(bois, encre, 0.4),
        interior: creme, interiorAlt: mix(creme, pierre, 0.55), focus: mix(terre, creme, 0.4), floor: bois,
        accent: terre, accentLight: creme, soft: creme, foliage: mix(ambre, terre, 0.35), wood: encre,
        water: mix(zinc, '#5FA2B0', 0.6), waterDeep: mix(zinc, encre, 0.6),
      },
    },
  };
};

const veillee = (): Look => {
  const nuit = '#1C1430', prune = '#46305F', lav = '#9883C2', ambre = '#FFB547', rose = '#EE7B8C', lune = '#FBEBD0';
  return {
    id: 'B',
    name: 'Veillée',
    background: nuit,
    text: lune,
    accent: ambre,
    keyBg: ambre,
    keyText: nuit,
    fonts: {title: "'Baloo 2', 'Nunito', sans-serif", body: "'Nunito', sans-serif"},
    annotation: {line: ambre, text: lune, bg: nuit, hotBg: ambre, hotText: nuit, radius: 999, border: 3, upper: false},
    owl: {
      colors: {plumage: mix(prune, lav, 0.35), plumageDark: prune, mask: mix(lune, lav, 0.25), belly: mix(lav, lune, 0.45), eye: ambre, pupil: nuit, beak: rose, strap: nuit, bag: mix(ambre, rose, 0.5), rim: lune, lens: mix(lav, lune, 0.55), scarf: rose},
      scarf: true,
      glow: true,
    },
    voxel: {
      hi: lune, topK: 0.14, ink: nuit, xK: 0.06, yK: 0.42, shadow: nuit, shK: 0.42, lit: 0.55,
      emit: ['light', 'interior', 'interiorAlt', 'focus'], jitter: 0.02,
      accents: [rose, ambre, rose],
      m: {
        structure: lav, structureAlt: mix(lav, prune, 0.18), trim: mix(lav, lune, 0.35), metal: prune, dark: nuit, glass: mix(nuit, prune, 0.35), light: ambre,
        ground: mix(prune, lav, 0.3), groundEdge: mix(lav, lune, 0.2), path: mix(nuit, prune, 0.45), marking: lune, base: nuit,
        interior: mix(ambre, lune, 0.45), interiorAlt: mix(ambre, rose, 0.35), focus: ambre, floor: mix(rose, prune, 0.45),
        accent: mix(rose, prune, 0.35), accentLight: lune, soft: lune, foliage: mix(prune, lav, 0.25), wood: nuit,
        water: mix(prune, lav, 0.45), waterDeep: nuit,
      },
    },
  };
};

const zincCraie = (): Look => {
  const craie = '#F6F2EA', ciel = '#CADCE4', pierre = '#E8D8BC', zinc = '#74879A', noir = '#15171C', tomate = '#E8432D', ambre = '#F3A21E';
  return {
    id: 'D',
    name: 'Zinc & craie',
    background: ciel,
    text: noir,
    accent: tomate,
    keyBg: tomate,
    keyText: craie,
    fonts: {title: "'Anton', Impact, sans-serif", body: "'Inter', sans-serif"},
    annotation: {line: noir, text: noir, bg: craie, hotBg: tomate, hotText: craie, radius: 4, border: 3, upper: true},
    owl: {
      colors: {plumage: noir, plumageDark: mix(noir, zinc, 0.45), mask: craie, belly: pierre, eye: ambre, pupil: noir, beak: ambre, strap: tomate, bag: tomate, rim: noir, lens: ciel, scarf: tomate},
      scarf: false,
      glow: false,
    },
    voxel: {
      hi: '#FFFFFF', topK: 0.28, ink: noir, xK: 0, yK: 0.34, shadow: '#2B3550', shK: 0.34, lit: 0, emit: ['light'], jitter: 0.012,
      accents: [tomate, noir, tomate],
      m: {
        structure: pierre, structureAlt: mix(pierre, zinc, 0.14), trim: craie, metal: zinc, dark: noir, glass: mix(zinc, noir, 0.5), light: ambre,
        ground: mix(craie, pierre, 0.5), groundEdge: craie, path: mix(zinc, noir, 0.35), marking: craie, base: noir,
        interior: craie, interiorAlt: ciel, focus: mix(tomate, craie, 0.35), floor: mix(pierre, zinc, 0.35),
        accent: tomate, accentLight: craie, soft: craie, foliage: mix(ambre, zinc, 0.55), wood: noir,
        water: mix(ciel, zinc, 0.45), waterDeep: mix(noir, zinc, 0.2),
      },
    },
  };
};

export const LOOKS: Record<LookId, Look> = {A: atelier(), B: veillee(), D: zincCraie()};
