// Décor « rue haussmannienne » en voxels, porté depuis le moteur voxel des planches Claude Design.
// Propre à ce sujet : il colore ses blocs avec les rôles génériques du style (src/design/looks.ts),
// sans rien ajouter aux styles. Un autre sujet aura son propre fichier de décor.
// Coordonnées plan (voir grid.ts) : un immeuble occupe x 0..7 (façade en x = 7, rue au-delà),
// 10 blocs le long de la rue, 19 niveaux jusqu'à la corniche puis un comble à 45°.
import type {VoxelTheme} from '../../design/looks';
import {VoxelGrid, type Material} from '../grid';

const DEPTH = 8;
export const BAY = 10;
export const CORNICE = 19;

/** Trottoir, bordure et chaussée ; `nx` blocs vers la rue, `ny` le long de la rue. */
export const ground = (grid: VoxelGrid, nx: number, ny: number) => {
  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      let m = 'ground';
      if (x === 13) m = 'groundEdge';
      else if (x > 13) m = x === nx - 2 && y % 4 < 2 ? 'marking' : 'path';
      grid.set(x, y, -1, m);
      grid.set(x, y, -2, 'base');
    }
  }
};

type BuildingOptions = {
  /** Vue en coupe : intérieur vidé, mur côté +y absent, pièces visibles. */
  cut?: boolean;
  awning?: number;
  tone?: boolean;
};

// Pseudo-aléa stable pour décider quelles fenêtres sont allumées.
const windowLit = (theme: VoxelTheme, oy: number, bay: number, floor: string) => {
  const h = Math.sin(oy * 7.13 + bay * 3.71 + floor.charCodeAt(0) * 1.37) * 43758.5453;
  return h - Math.floor(h) < theme.lit;
};

export const building = (grid: VoxelGrid, theme: VoxelTheme, ox: number, oy: number, o: BuildingOptions = {}) => {
  const fx = ox + DEPTH - 1;
  const yl = oy + BAY - 1;
  const cut = Boolean(o.cut);
  const ymax = cut ? yl - 1 : yl;
  const bays = [1, 3, 6, 8];
  const windows: Record<number, string> = {4: 'e', 6: '2', 7: '2', 10: '3', 11: '3', 13: '4', 14: '4', 16: '5', 17: '5'};
  const slabs = [3, 5, 9, 12, 15, 18];
  const awning = theme.accents[(o.awning ?? 0) % theme.accents.length];
  const wall = o.tone ? 'structureAlt' : 'structure';
  const room = (back: boolean) => (back ? 'interiorAlt' : 'interior');

  for (let z = 0; z <= 18; z++) {
    for (let x = ox; x <= fx; x++) {
      for (let y = oy; y <= ymax; y++) {
        const isSlab = slabs.includes(z);
        if (cut && !(x === ox || x === fx || y === oy || isSlab)) continue;
        const by = y - oy;
        let m: Material = wall;
        if (x === fx && by === 0 && !cut) m = 'trim';
        else if (x === fx) {
          if (z <= 1 && ((by >= 1 && by <= 3) || (by >= 6 && by <= 8))) m = 'glass';
          else if (z <= 1 && (by === 4 || by === 5)) m = 'dark';
          else if (z === 3 || z === 9 || z === 18) m = 'trim';
          else if (windows[z] && bays.includes(by)) m = windowLit(theme, oy, by, windows[z]) ? 'light' : 'glass';
        } else if (cut) {
          if (isSlab && x > ox && y > oy) m = {t: 'floor', x: 'structure', y: 'trim'};
          else if (y === oy && x > ox) m = {t: 'structure', x: 'structure', y: isSlab ? 'trim' : room(false)};
          else if (x === ox) m = {t: 'structure', x: isSlab ? 'structure' : room(true), y: 'structure'};
        }
        grid.set(x, y, z, m);
      }
    }
  }

  // Saillies de la façade : stores, balcons filants (2e et 5e étages), corniche.
  for (let y = oy; y <= ymax; y++) {
    const by = y - oy;
    if ((by >= 1 && by <= 3) || (by >= 6 && by <= 8)) grid.set(fx + 1, y, 2, by % 2 ? awning : 'accentLight');
    grid.set(fx + 1, y, 5, 'dark');
    grid.set(fx + 1, y, 15, 'dark');
    grid.set(fx + 1, y, 18, 'trim');
  }

  // Comble brisé inscrit sous la diagonale à 45°.
  for (let i = 0; i <= 3; i++) {
    const z = 19 + i;
    for (let x = ox; x <= fx - i; x++) {
      for (let y = oy; y <= ymax; y++) {
        if (cut && !(x === fx - i || x === ox || y === oy || z === 22)) continue;
        let m: Material = !cut && y === oy && x < fx - i ? 'trim' : 'metal';
        if (cut && y === oy && x > ox && x < fx - i) m = {t: 'metal', x: 'metal', y: room(false)};
        if (cut && x === ox && z < 22) m = {t: 'metal', x: room(true), y: 'metal'};
        grid.set(x, y, z, m);
      }
    }
  }
  for (const b of bays) {
    if (oy + b > ymax) continue;
    grid.set(fx, oy + b, 19, windowLit(theme, oy, b, 'c') ? 'light' : 'glass');
    grid.set(fx, oy + b, 20, 'metal');
  }
  for (const cy of cut ? [oy] : [oy, yl]) {
    for (const cx of [ox + 1, ox + 2]) {
      grid.set(cx, cy, 23, 'accent');
      grid.set(cx, cy, 24, 'accent');
    }
  }
  if (cut) {
    // Quelques meubles pour habiter les pièces.
    grid.set(ox + 3, oy + 4, 0, 'dark');
    grid.set(ox + 4, oy + 4, 0, 'dark');
    grid.set(ox + 2, oy + 2, 6, awning);
    grid.set(ox + 3, oy + 2, 6, awning);
    grid.set(ox + 2, oy + 1, 7, awning);
    grid.set(ox + 3, oy + 1, 7, awning);
    grid.set(ox + 4, oy + 5, 8, 'light');
    grid.set(ox + 1, oy + 2, 19, 'soft');
    grid.set(ox + 2, oy + 2, 19, 'soft');
    grid.set(ox + 1, oy + 1, 19, awning);
    grid.set(ox + 2, oy + 6, 16, 'dark');
    grid.set(ox + 1, oy + 6, 16, 'dark');
  }
  return grid;
};

/** Le mur latéral (côté +y) d'un immeuble entier : c'est le « couvercle » qu'on soulève pour la coupe. */
export const sideWall = (theme: VoxelTheme, ox: number, oy: number, o: BuildingOptions = {}) => {
  const yl = oy + BAY - 1;
  return building(new VoxelGrid(), theme, ox, oy, {...o, cut: false}).filter((v) => v.y === yl);
};
