// Décor « rue haussmannienne », version fine : un voxel = 25 cm (UNIT), soit 4 fois plus fin que
// haussmann.ts. Assez fin pour dessiner la signature d'un immeuble haussmannien : refends du soubassement,
// boutiques et porte cochère, balcons filants (étage noble et 5e), garde-corps, frontons, bandeaux,
// corniche à modillons, comble à 45° en zinc, souches de cheminée et mitrons.
// Propre à ce sujet : il ne colore ses blocs qu'avec les rôles génériques des styles.
// Coordonnées plan (voir grid.ts) : x = profondeur (façade en x = FX, rue au-delà), y = le long de la rue, z = hauteur.
import type {VoxelTheme} from '../../design/looks';
import {VoxelGrid, type Material} from '../grid';

export const UNIT = 0.25;
/** Profondeur et largeur d'un immeuble (10 m × 16,5 m). */
const D = 40;
export const WIDTH_FINE = 66;
export const FX = D - 1;
/** Haut de la façade : 80 voxels = 20 m. */
export const FACADE_TOP = 80;
/** Hauteur du comble au-dessus de la corniche (4 m). */
const ROOF_RISE = 16;
const BAYS = 5;
const BAY_W = 12;
const MARGIN = 3;
/** Niveaux : début (z) et hauteur. Rez-de-chaussée, entresol, étage noble, 3e, 4e, 5e. */
const LEVELS = [
  {z0: 0, h: 16},
  {z0: 16, h: 10},
  {z0: 26, h: 14},
  {z0: 40, h: 12},
  {z0: 52, h: 11},
  {z0: 63, h: 11},
];
/** Fenêtres par niveau (bas et haut, inclus) ; le rez-de-chaussée est traité à part. */
const WINDOWS: Record<number, [number, number]> = {1: [18, 23], 2: [27, 37], 3: [41, 49], 4: [53, 60], 5: [64, 71]};
const BALCONIES = [26, 63];
export const STREET_FINE = {sidewalk: 16, road: 54};

const box = (g: VoxelGrid, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Material) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, m);
};
const clear = (g: VoxelGrid, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.delete(x, y, z);
};

/** Hauteur du toit au-dessus de x : pente à 45° depuis le bord de la corniche, terrasson plat, pente arrière. */
export const roofTop = (x: number) => FACADE_TOP + Math.max(0, Math.min(FX + 3 - x, x + 2, ROOF_RISE));

const bayCenter = (oy: number, i: number) => oy + MARGIN + i * BAY_W + BAY_W / 2;

type Options = {cut?: boolean; tone?: boolean; awnings?: string[]};

export const fineBuilding = (g: VoxelGrid, theme: VoxelTheme, oy: number, o: Options = {}) => {
  const cut = Boolean(o.cut);
  const yl = oy + WIDTH_FINE - 1;
  const wall = o.tone ? 'structureAlt' : 'structure';
  // En coupe, la face intérieure des murs prend la couleur des pièces ; la tranche reste en pierre.
  const lining = (inside: 'x' | 'y', room: string): Material =>
    cut ? {t: wall, x: inside === 'x' ? room : wall, y: inside === 'y' ? room : wall} : wall;

  // Façade (75 cm d'épaisseur), mur arrière, murs mitoyens montés jusqu'au toit (pignons).
  for (let y = oy; y <= yl; y++) {
    for (let z = 0; z < FACADE_TOP; z++) {
      g.set(FX, y, z, wall);
      g.set(FX - 1, y, z, wall);
      g.set(FX - 2, y, z, lining('x', 'interior'));
      g.set(0, y, z, wall);
      g.set(1, y, z, lining('x', 'interiorAlt'));
    }
  }
  const party = cut ? [oy] : [oy, yl];
  for (const py of party) {
    const inner = py === oy ? py + 1 : py - 1;
    for (let x = 0; x <= FX; x++) {
      for (let z = 0; z <= roofTop(x); z++) {
        g.set(x, py, z, wall);
        g.set(x, inner, z, py === oy ? lining('y', 'interiorAlt') : wall);
      }
    }
  }

  // Refends du soubassement (rez-de-chaussée et entresol) : un joint creux tous les mètres.
  for (let z = 4; z < 26; z += 4) for (let y = oy + 1; y < yl; y++) g.delete(FX, y, z);

  // Bandeaux : corniche du rez-de-chaussée et bandeau sous l'étage noble.
  box(g, FX + 1, FX + 1, oy, yl, 15, 15, 'trim');
  box(g, FX + 1, FX + 1, oy, yl, 25, 25, 'trim');

  // Rez-de-chaussée : quatre boutiques et une porte cochère au centre.
  const awnings = o.awnings ?? theme.accents;
  for (let i = 0; i < BAYS; i++) {
    const c = bayCenter(oy, i);
    if (i === 2) {
      clear(g, FX - 1, FX, c - 4, c + 4, 0, 12);
      clear(g, FX - 1, FX, c - 3, c + 3, 13, 13);
      clear(g, FX - 1, FX, c - 2, c + 2, 14, 14);
      for (let y = c - 4; y <= c + 4; y++) for (let z = 0; z <= 14; z++) if (!g.has(FX, y, z) || z <= 12) g.set(FX - 2, y, z, y === c ? 'dark' : 'wood');
      for (const [y, z] of [[c - 5, 12], [c + 5, 12], [c - 4, 13], [c + 4, 13], [c - 3, 14], [c + 3, 14], [c - 2, 15], [c + 2, 15]]) g.set(FX + 1, y, Math.min(z, 14), 'trim');
      box(g, FX + 1, FX + 1, c - 1, c + 1, 15, 16, 'trim');
      continue;
    }
    const accent = awnings[i % awnings.length];
    clear(g, FX - 1, FX, c - 4, c + 4, 1, 11);
    box(g, FX - 2, FX - 2, c - 4, c + 4, 1, 11, 'glass');
    box(g, FX - 2, FX - 2, c, c, 1, 11, accent);
    box(g, FX - 1, FX - 1, c - 4, c + 4, 1, 2, accent);
    box(g, FX + 1, FX + 1, c - 5, c + 5, 12, 13, accent);
    box(g, FX, FX, c - 5, c - 5, 0, 11, accent);
    box(g, FX, FX, c + 5, c + 5, 0, 11, accent);
    if (i === 0 || i === 4) {
      // Store en toile rayée, incliné vers la rue.
      for (let k = 0; k < 6; k++) {
        for (let y = c - 5; y <= c + 5; y++) g.set(FX + 2 + k, y, 11 - Math.floor(k / 2), (y - oy) % 4 < 2 ? accent : 'accentLight');
      }
    }
  }

  // Fenêtres des étages : embrasure de 50 cm, petits bois, encadrement, appuis, garde-corps, frontons.
  for (const [levelText, [zb, zt]] of Object.entries(WINDOWS)) {
    const level = Number(levelText);
    for (let i = 0; i < BAYS; i++) {
      const c = bayCenter(oy, i);
      clear(g, FX - 1, FX, c - 2, c + 2, zb, zt);
      for (let y = c - 2; y <= c + 2; y++) {
        for (let z = zb; z <= zt; z++) g.set(FX - 2, y, z, y === c || z === zt - 3 ? 'trim' : 'glass');
      }
      // Encadrement en pierre claire.
      for (let z = zb - 1; z <= zt + 1; z++) {
        g.set(FX, c - 3, z, 'trim');
        g.set(FX, c + 3, z, 'trim');
      }
      box(g, FX, FX, c - 3, c + 3, zt + 1, zt + 1, 'trim');
      if (level === 1) box(g, FX + 1, FX + 1, c - 3, c + 3, zb - 1, zb - 1, 'trim');
      if (level === 3 || level === 4) {
        // Garde-corps en fer forgé devant chaque porte-fenêtre.
        box(g, FX, FX, c - 2, c + 2, zb + 2, zb + 2, 'dark');
        for (let y = c - 2; y <= c + 2; y += 2) g.set(FX, y, zb + 1, 'dark');
        g.set(FX, c - 2, zb, 'dark');
        g.set(FX, c + 2, zb, 'dark');
        box(g, FX + 1, FX + 1, c - 3, c + 3, zt + 2, zt + 2, 'trim');
      }
      if (level === 2) {
        // Étage noble : fronton triangulaire une travée sur deux, entablement droit sinon.
        if (i % 2 === 1) {
          box(g, FX + 1, FX + 1, c - 4, c + 4, zt + 1, zt + 1, 'trim');
          box(g, FX + 1, FX + 1, c - 3, c + 3, zt + 2, zt + 2, 'trim');
          box(g, FX + 1, FX + 1, c - 1, c + 1, zt + 3, zt + 3, 'trim');
        } else {
          box(g, FX + 1, FX + 1, c - 4, c + 4, zt + 1, zt + 2, 'trim');
        }
      }
    }
  }

  // Balcons filants de l'étage noble et du 5e : dalle sur consoles, garde-corps continu.
  for (const zb of BALCONIES) {
    box(g, FX + 1, FX + 3, oy, yl, zb, zb, 'trim');
    for (let i = 0; i <= BAYS; i++) {
      const y = Math.min(yl, oy + MARGIN + i * BAY_W);
      box(g, FX + 1, FX + 2, y, y, zb - 1, zb - 1, 'trim');
      g.set(FX + 1, y, zb - 2, 'trim');
    }
    for (let y = oy; y <= yl; y++) {
      g.set(FX + 3, y, zb + 1, 'dark');
      g.set(FX + 3, y, zb + 4, 'dark');
      if ((y - oy) % 2 === 0) {
        g.set(FX + 3, y, zb + 2, 'dark');
        g.set(FX + 3, y, zb + 3, 'dark');
      }
    }
  }

  // Corniche à modillons, couronnée d'un chéneau en zinc.
  box(g, FX + 1, FX + 1, oy, yl, 74, 75, 'trim');
  for (let y = oy; y <= yl; y++) {
    if ((y - oy) % 3 === 0) box(g, FX + 2, FX + 2, y, y, 75, 76, 'trim');
  }
  box(g, FX + 1, FX + 2, oy, yl, 77, 77, 'trim');
  box(g, FX + 1, FX + 3, oy, yl, 78, 78, 'trim');
  box(g, FX + 1, FX + 4, oy, yl, 79, 79, 'metal');

  // Comble : couverture en zinc à 45°, quelques tabatières.
  for (let x = 0; x <= FX + 3; x++) {
    const top = roofTop(x);
    for (let y = oy; y <= yl; y++) {
      g.set(x, y, top, 'metal');
      if (top > FACADE_TOP) g.set(x, y, top - 1, cut ? {t: 'interior', x: 'metal', y: 'metal'} : 'metal');
    }
  }
  for (const i of [1, 3]) {
    const c = bayCenter(oy, i);
    for (let x = FX - 9; x <= FX - 6; x++) for (let y = c - 1; y <= c + 1; y++) g.set(x, y, roofTop(x), 'glass');
  }

  // Souches de cheminée sur les murs mitoyens, avec leurs mitrons.
  const stackTop = FACADE_TOP + ROOF_RISE + 7;
  for (const sy of cut ? [oy] : [oy, yl - 3]) {
    box(g, 10, 28, sy, sy + 3, FACADE_TOP, stackTop, 'accent');
    box(g, 9, 29, sy - (sy === oy ? 0 : 1), sy + 3 + (sy === oy ? 1 : 0), stackTop + 1, stackTop + 1, 'trim');
    for (let x = 11; x <= 27; x += 3) box(g, x, x, sy + 1, sy + 2, stackTop + 2, stackTop + 3, x % 2 ? 'accent' : 'metal');
  }

  if (cut) furnish(g, oy, yl, wall);
  return g;
};

/** Planchers et mobilier de l'immeuble en coupe (le côté y = yl est ouvert). */
const furnish = (g: VoxelGrid, oy: number, yl: number, wall: string) => {
  const slab: Material = {t: 'floor', x: wall, y: 'trim'};
  for (const z of [...LEVELS.map((l) => l.z0), FACADE_TOP]) box(g, 2, FX - 3, oy + 2, yl, z, z, slab);
  const near = yl - 2;
  // Boutique : comptoir et étagères.
  box(g, 20, 30, near - 12, near - 2, 1, 4, 'dark');
  box(g, 20, 30, near - 12, near - 2, 5, 5, 'accentLight');
  box(g, 2, 3, near - 22, near, 1, 12, 'wood');
  for (let z = 3; z <= 12; z += 3) box(g, 2, 3, near - 21, near - 1, z, z, z % 2 ? 'accent' : 'accentLight');
  // Entresol : bureau et chaise.
  box(g, 6, 12, near - 10, near - 4, 19, 19, 'wood');
  box(g, 6, 6, near - 10, near - 4, 17, 18, 'wood');
  box(g, 12, 12, near - 10, near - 4, 17, 18, 'wood');
  box(g, 14, 15, near - 8, near - 6, 17, 20, 'accent');
  // Étage noble : tapis, canapé, guéridon, lustre.
  box(g, 10, 26, near - 18, near - 2, 27, 27, 'accentLight');
  box(g, 4, 8, near - 16, near - 6, 27, 29, 'accent');
  box(g, 4, 5, near - 16, near - 6, 30, 32, 'accent');
  box(g, 16, 19, near - 11, near - 8, 28, 30, 'wood');
  box(g, 16, 18, near - 11, near - 9, 39, 39, 'dark');
  box(g, 15, 19, near - 12, near - 8, 36, 37, 'light');
  // 3e : lit, tête de lit, couverture.
  box(g, 4, 14, near - 12, near - 4, 41, 42, 'soft');
  box(g, 3, 3, near - 12, near - 4, 41, 46, 'wood');
  box(g, 8, 14, near - 12, near - 4, 43, 43, 'accent');
  box(g, 4, 6, near - 11, near - 5, 43, 43, 'soft');
  // 4e : table et chaises.
  box(g, 14, 22, near - 12, near - 6, 56, 56, 'wood');
  for (const [x, y] of [[14, near - 12], [22, near - 12], [14, near - 6], [22, near - 6]]) box(g, x, x, y, y, 53, 55, 'wood');
  box(g, 11, 12, near - 10, near - 8, 53, 57, 'accent');
  box(g, 24, 25, near - 10, near - 8, 53, 57, 'accent');
  // 5e : bibliothèque contre le mur du fond.
  box(g, 2, 3, near - 18, near - 2, 64, 72, 'wood');
  for (let y = near - 17; y <= near - 3; y++) for (const z of [65, 68, 71]) g.set(3, y, z, y % 3 ? 'accent' : 'accentLight');
  // Chambre sous le comble.
  box(g, 10, 16, near - 10, near - 5, 81, 82, 'soft');
  box(g, 10, 12, near - 10, near - 5, 83, 83, 'accent');
};

// Rue de 22 m de façade à façade (plus de 20 m, comme l'exige la règle de 1859 pour monter à 20 m) :
// trottoir de 4 m, bordure, chaussée de 13,5 m, bordure, trottoir d'en face.
const SIDEWALK_END = FX + STREET_FINE.sidewalk;
const ROAD_START = SIDEWALK_END + 2;
const ROAD_END = ROAD_START + STREET_FINE.road - 1;
const FAR_SIDEWALK_END = ROAD_END + 1 + STREET_FINE.sidewalk;
/** Face de l'immeuble d'en face (coordonnée x de son nu de façade). */
export const OPPOSITE_FACE = FAR_SIDEWALK_END + 1;

/** Trottoirs, bordures, chaussée et socle ; un platane et un lampadaire. */
export const fineStreet = (g: VoxelGrid, length: number) => {
  const sidewalkEnd = SIDEWALK_END;
  for (let y = 0; y < length; y++) {
    for (let x = 0; x <= FAR_SIDEWALK_END; x++) {
      const road = x >= ROAD_START && x <= ROAD_END;
      const curb = x === ROAD_START - 1 || x === ROAD_END + 1;
      if (!road) g.set(x, y, -1, curb ? 'groundEdge' : 'ground');
      g.set(x, y, -2, road ? 'path' : 'ground');
      g.set(x, y, -3, 'base');
      g.set(x, y, -4, 'base');
    }
  }
  // Lampadaire.
  const ly = Math.round(length * 0.3);
  const lx = sidewalkEnd - 2;
  box(g, lx - 1, lx + 1, ly - 1, ly + 1, 0, 2, 'dark');
  box(g, lx, lx, ly, ly, 3, 22, 'dark');
  box(g, lx - 1, lx + 1, ly - 1, ly + 1, 23, 25, 'light');
  box(g, lx - 2, lx + 2, ly - 2, ly + 2, 26, 26, 'dark');
  g.set(lx, ly, 27, 'dark');
  // Platane : tronc et houppier arrondi.
  const ty = Math.round(length * 0.55);
  const tx = sidewalkEnd - 4;
  box(g, tx, tx + 1, ty, ty + 1, 0, 18, 'wood');
  // Houppier en plusieurs masses qui se chevauchent, bord irrégulier.
  const masses = [[0, 0, 27, 9], [-6, 3, 23, 6], [6, -4, 24, 6], [3, 6, 31, 6], [-4, -6, 31, 5]];
  for (let x = tx - 14; x <= tx + 15; x++) {
    for (let y = ty - 14; y <= ty + 15; y++) {
      for (let z = 16; z <= 38; z++) {
        const ragged = Math.sin(x * 1.7 + y * 2.3 + z * 1.1) * 0.12;
        const inside = masses.some(([dx, dy, dz, r]) => ((x - tx - dx) ** 2 + (y - ty - dy) ** 2 + ((z - dz) * 1.15) ** 2) / (r * r) <= 1 + ragged);
        if (inside) g.set(x, y, z, 'foliage');
      }
    }
  }
};

/**
 * Le mur latéral (côté rue ouverte) du dernier immeuble, avec la tranche de façade, de balcons et de toit :
 * c'est le « couvercle » qu'on soulève pour montrer la coupe.
 */
export const fineSideWall = (theme: VoxelTheme) => {
  const oy = WIDTH_FINE * 2;
  const yl = oy + WIDTH_FINE - 1;
  return fineBuilding(new VoxelGrid(), theme, oy, {tone: true}).filter((v) => v.y >= yl - 1);
};

/**
 * Le bord de l'immeuble d'en face : une tranche de `width` voxels, en coupe du même côté que le nôtre,
 * retournée pour faire face à la rue.
 */
export const fineOppositeEdge = (theme: VoxelTheme, width = 26) => {
  const oy = WIDTH_FINE * 2;
  const yl = oy + WIDTH_FINE - 1;
  const slice = fineBuilding(new VoxelGrid(), theme, oy, {cut: true}).filter((v) => v.y > yl - width);
  // Miroir en x : notre nu de façade (face avant du voxel FX) vient sur OPPOSITE_FACE.
  const mirror = OPPOSITE_FACE + FX;
  const out = new VoxelGrid();
  for (const v of slice.voxels()) out.set(mirror - v.x, v.y, v.z, v.m);
  return out;
};

/** Trois immeubles alignés sur la rue ; le dernier en coupe. */
export const fineStreetScene = (theme: VoxelTheme) => {
  const g = new VoxelGrid();
  const length = WIDTH_FINE * 3;
  fineStreet(g, length);
  fineBuilding(g, theme, 0, {tone: true});
  fineBuilding(g, theme, WIDTH_FINE, {});
  fineBuilding(g, theme, WIDTH_FINE * 2, {cut: true, tone: true});
  return g;
};
