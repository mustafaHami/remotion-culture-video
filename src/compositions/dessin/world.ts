// Repères du décor en coupe (unités du monde = pixels à zoom 1, image 1080 × 1920).
// Échelle : 26 unités par mètre, donc une façade de 20 m mesure 520 unités.
export const M = 26;

/** Niveau de la chaussée. */
export const GROUND = 1200;
/** Façade de l'immeuble en coupe (à droite) et façade d'en face (à gauche). */
export const FACADE_X = 646;
export const OPPOSITE_X = 100;
export const BACK_X = 1046;
export const WALL = 14;
/** Haut de la façade (corniche) : 20 m au-dessus du sol. */
export const CORNICE_Y = GROUND - 20 * M;
/** Comble : pente de 45° depuis la corniche, puis terrasson plat. */
export const RIDGE_Y = 510;
export const SLOPE_END_X = FACADE_X + (CORNICE_Y - RIDGE_Y);
export const TERRACE_END_X = 960;
export const SIDEWALK = 90;

/** Niveaux du rez-de-chaussée au 5e étage : hauteur en unités (total 520). */
const HEIGHTS = [132, 80, 84, 76, 72, 76];

export type Level = {index: number; top: number; bottom: number; h: number};

export const LEVELS: Level[] = HEIGHTS.reduce<Level[]>((acc, h, index) => {
  const bottom = index === 0 ? GROUND : acc[index - 1].top;
  acc.push({index, top: bottom - h, bottom, h});
  return acc;
}, []);

/** Hauteur du toit au-dessus d'un point x (pente avant à 45°, terrasson, pente arrière). */
export const roofYAt = (x: number) => {
  if (x <= SLOPE_END_X) return CORNICE_Y - (x - FACADE_X);
  if (x <= TERRACE_END_X) return RIDGE_Y;
  return RIDGE_Y + ((x - TERRACE_END_X) * (CORNICE_Y - RIDGE_Y)) / (BACK_X - TERRACE_END_X);
};

/** Emplacements du hibou : sur la chaussée, puis sur le terrasson. */
export const OWL_STREET: [number, number] = [330, GROUND];
export const OWL_ROOF: [number, number] = [902, RIDGE_Y];
