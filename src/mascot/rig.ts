// Réglages animables du hibou (version C « lisse stylisé », choisie le 25 octobre 2026).
// Une pose est un jeu de valeurs ; on passe d'une pose à l'autre en mélangeant les valeurs,
// ce qui donne des gestes continus plutôt que des changements de pose brusques.

export type OwlRig = {
  /** Rotation et inclinaison de la tête (radians). */
  headYaw: number;
  headTilt: number;
  /** Élévation des ailes (radians) : 0 = repliée le long du corps. +X = aile à droite de l'écran. */
  wingRight: number;
  wingLeft: number;
  /** Fermeture des paupières, 0 (grands ouverts) à 1 (fermés). */
  lids: number;
  /** Hauteur des sourcils (-1 froncés, 0 neutres, 1 très levés). */
  brows: number;
  /** Direction du regard, -1 à 1 (gauche/droite, bas/haut). */
  lookX: number;
  lookY: number;
};

export type OwlPoseName = 'idle' | 'wonder' | 'pointRight' | 'pointLeft' | 'wave';

export const POSES: Record<OwlPoseName, OwlRig> = {
  idle: {headYaw: 0, headTilt: 0, wingRight: 0.08, wingLeft: 0.08, lids: 0.15, brows: 0, lookX: 0, lookY: 0},
  // Intrigué : sourcils hauts, tête penchée, yeux grands ouverts.
  wonder: {headYaw: 0.05, headTilt: 0.16, wingRight: 0.25, wingLeft: 0.2, lids: 0, brows: 1, lookX: 0.1, lookY: 0.2},
  // Montre de l'aile vers la droite de l'écran, le regard suit le geste.
  pointRight: {headYaw: 0.35, headTilt: -0.06, wingRight: 1.9, wingLeft: 0.12, lids: 0.1, brows: 0.4, lookX: 0.8, lookY: 0.3},
  pointLeft: {headYaw: -0.35, headTilt: 0.06, wingRight: 0.12, wingLeft: 1.9, lids: 0.1, brows: 0.4, lookX: -0.8, lookY: -0.2},
  wave: {headYaw: 0, headTilt: 0.1, wingRight: 2.5, wingLeft: 0.15, lids: 0.25, brows: 0.6, lookX: 0, lookY: 0},
};

export const mixRig = (a: OwlRig, b: OwlRig, t: number): OwlRig => {
  const out = {} as OwlRig;
  for (const key of Object.keys(a) as (keyof OwlRig)[]) out[key] = a[key] + (b[key] - a[key]) * t;
  return out;
};
