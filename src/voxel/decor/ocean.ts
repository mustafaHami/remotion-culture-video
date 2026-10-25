// Décor « l'océan en coupe » : plateau continental, talus, plaine abyssale et fosse, vus comme une maquette
// tranchée devant la caméra ; navire de recherche, submersible, satellite, Lune et quelques animaux.
// Propre à ce sujet : uniquement des rôles de couleur génériques des styles.
//
// Échelle verticale schématique (non linéaire) : une profondeur réelle d (m) est placée à Y = -√d (mètres
// de maquette). 200 m → -14, 1 000 m → -31,6, 4 000 m → -63, 10 900 m → -104. Les compteurs affichent
// toujours la profondeur réelle.
// Coordonnées plan (voir grid.ts) : x = profondeur de la tranche (vers la caméra), y = horizontale, z = hauteur.
import {VoxelGrid, type Material} from '../grid';

/** Profondeur réelle (m) → hauteur de maquette (Y Three.js). */
export const depthToY = (depth: number) => -Math.sqrt(Math.max(0, depth));
export const yToDepth = (y: number) => (y >= 0 ? 0 : y * y);

/** Largeur de la coupe (X Three.js, de -HALF à HALF) et épaisseur de la tranche (Z de 0 à SLAB). */
export const HALF = 30;
export const SLAB = 16;
export const TRENCH_DEPTH = 10900;
export const PLAIN_DEPTH = 4000;
export const SHELF_DEPTH = 150;
/** Bas du socle de la maquette. */
export const FLOOR_BASE = -112;

/** Taille d'un voxel du terrain (m de maquette) et des objets détaillés. */
export const TERRAIN_UNIT = 0.5;
export const OBJECT_UNIT = 0.25;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Petit bruit déterministe pour bosseler le fond.
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

/** Hauteur du fond (Y) en X : plateau, talus, plaine avec un mont sous-marin, fosse, remontée. */
export const seabedY = (X: number) => {
  const shelf = depthToY(SHELF_DEPTH);
  const plain = depthToY(PLAIN_DEPTH);
  const trench = depthToY(TRENCH_DEPTH);
  let y = shelf + (plain - shelf) * smoothstep(-21, -9, X);
  y += 9 * Math.exp(-(((X - 1) / 3.2) ** 2)); // mont sous-marin
  y += (trench - plain) * smoothstep(10, 16.5, X) * (1 - smoothstep(20.5, 26, X)); // fosse
  y += (plain + 4 - plain) * smoothstep(24, 28, X);
  return y;
};

/** Centre du fond de la fosse (X). */
export const TRENCH_X = 18.5;

export const oceanFloor = () => {
  const g = new VoxelGrid();
  const nx = (2 * HALF) / TERRAIN_UNIT;
  const nz = SLAB / TERRAIN_UNIT;
  const base = Math.round(FLOOR_BASE / TERRAIN_UNIT);
  for (let i = 0; i < nx; i++) {
    const X = -HALF + (i + 0.5) * TERRAIN_UNIT;
    for (let k = 0; k < nz; k++) {
      const bump = (hash(i, k) - 0.5) * 1.2 + Math.sin(i * 0.37 + k * 0.6) * 0.5;
      const top = Math.round((seabedY(X) + bump) / TERRAIN_UNIT);
      const shell = i === 0 || i === nx - 1 || k === nz - 1;
      for (let z = base; z <= top; z++) {
        const fromTop = top - z;
        if (!shell && fromTop > 2 && z > base) continue;
        let m: Material = 'base';
        if (fromTop === 0) m = hash(i * 7, k * 13) > 0.93 ? 'dark' : 'ground';
        else if (fromTop < 3) m = 'structureAlt';
        else if (shell) {
          // Tranche : couches de sédiments puis roche, de plus en plus sombres.
          const layer = Math.floor((z - base) / 14 + Math.sin(i * 0.12) * 0.6);
          m = z * TERRAIN_UNIT < -60 ? 'base' : layer % 2 ? 'structure' : 'structureAlt';
        }
        // Plan x = profondeur de la tranche (Z), y = horizontale (X), z = hauteur (Y).
        g.set(k, i, z, m);
      }
    }
  }
  return g;
};

const box = (g: VoxelGrid, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Material) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, m);
};

/**
 * Navire de recherche (voxels de 25 cm) : coque, pont, passerelle, mât, portique arrière et sondeur sous la coque.
 * Origine : milieu de la coque, au niveau de la ligne de flottaison.
 */
export const researchShip = () => {
  const g = new VoxelGrid();
  const L = 44;
  for (let y = -L / 2; y < L / 2; y++) {
    const t = (y + L / 2) / L;
    // Étrave effilée à l'avant (côté +y).
    const half = t > 0.78 ? Math.max(1, Math.round(6 * (1 - (t - 0.78) / 0.22))) : 6;
    for (let x = -half; x < half; x++) {
      for (let z = -4; z <= 3; z++) {
        if (z < -2 && (Math.abs(x) > half - 2 || t > 0.9)) continue;
        const m = z <= -1 ? 'dark' : z === 3 ? 'trim' : 'accent';
        g.set(x, y, z, m);
      }
    }
  }
  box(g, -5, 4, -14, 6, 4, 4, 'wood');
  // Passerelle et timonerie.
  box(g, -4, 3, 0, 8, 5, 10, 'soft');
  for (let y = 1; y <= 7; y += 2) box(g, 4, 4, y, y, 9, 9, 'glass');
  for (let y = 1; y <= 7; y += 2) box(g, -5, -5, y, y, 9, 9, 'glass');
  box(g, -4, 3, 7, 8, 8, 10, 'glass');
  box(g, -5, 4, -1, 9, 11, 11, 'trim');
  // Mât et antennes.
  box(g, -1, 0, 3, 4, 12, 22, 'dark');
  box(g, -3, 2, 3, 4, 19, 19, 'dark');
  g.set(-1, 3, 23, 'light');
  // Portique en A à l'arrière, pour mettre le submersible à l'eau.
  for (let z = 5; z <= 17; z++) {
    g.set(-5, -19 + Math.floor((z - 5) / 4), z, 'metal');
    g.set(4, -19 + Math.floor((z - 5) / 4), z, 'metal');
  }
  box(g, -5, 4, -16, -16, 17, 18, 'metal');
  // Sondeur multifaisceau sous la coque.
  box(g, -2, 1, -2, 1, -5, -5, 'metal');
  return g;
};

/** Submersible (voxels de 25 cm) : coque blanche arrondie, hublot, projecteurs, propulseurs. Origine : centre. */
export const submersible = () => {
  const g = new VoxelGrid();
  for (let x = -6; x < 6; x++) {
    for (let y = -9; y < 9; y++) {
      for (let z = -6; z < 6; z++) {
        const d = ((x + 0.5) / 6) ** 2 + ((y + 0.5) / 9) ** 2 + ((z + 0.5) / 6) ** 2;
        if (d > 1) continue;
        let m: Material = z >= 3 ? 'accentLight' : 'soft';
        if (Math.abs(z + 0.5) < 1.2) m = 'accent';
        // Hublot à l'avant (côté +y) et sur la face visible (côté +x).
        if ((y >= 5 && Math.abs(x + 0.5) < 2.2 && Math.abs(z - 1.5) < 2) || (x === 5 && Math.abs(y + 0.5) < 2 && Math.abs(z - 1.5) < 1.6)) m = 'glass';
        g.set(x, y, z, m);
      }
    }
  }
  // Tourelle et écoutille (le hibou s'y installe).
  box(g, -2, 1, -2, 1, 6, 7, 'accent');
  box(g, -3, 2, -3, 2, 8, 8, 'trim');
  // Projecteurs et propulseurs.
  box(g, -4, -3, 8, 9, -4, -3, 'light');
  box(g, 2, 3, 8, 9, -4, -3, 'light');
  box(g, -2, 1, -11, -9, -2, 1, 'dark');
  box(g, -4, 3, -10, -10, -4, 3, 'metal');
  return g;
};

/** Satellite (voxels de 25 cm) : corps doré, deux panneaux solaires, antenne parabolique tournée vers la Terre. */
export const satellite = () => {
  const g = new VoxelGrid();
  box(g, -3, 2, -3, 2, -3, 3, 'accentLight');
  box(g, -3, 2, -3, 2, -3, -3, 'dark');
  for (const side of [-1, 1]) {
    const y0 = side < 0 ? -18 : 4;
    box(g, -1, 0, y0, y0 + 13, -2, 2, 'glass');
    for (let y = y0; y <= y0 + 13; y += 3) box(g, -1, 0, y, y, -2, 2, 'metal');
    box(g, -1, 0, side < 0 ? -4 : 3, side < 0 ? -4 : 3, 0, 0, 'metal');
  }
  box(g, -4, 3, -4, 3, -5, -5, 'metal');
  box(g, -1, 0, -1, 0, -7, -6, 'dark');
  return g;
};

/** La Lune (voxels de 50 cm), couverte d'une grille fine : elle est entièrement cartographiée. */
export const moon = (radius = 8, unit = TERRAIN_UNIT) => {
  const g = new VoxelGrid();
  const r = Math.round(radius / unit);
  const craters = [[0.5, 0.6, 0.55, 0.32], [-0.6, 0.3, 0.75, 0.24], [0.2, -0.5, 0.85, 0.28], [-0.3, -0.8, 0.5, 0.2], [0.8, -0.1, 0.6, 0.18]];
  for (let x = -r; x <= r; x++) {
    for (let y = -r; y <= r; y++) {
      for (let z = -r; z <= r; z++) {
        const d = Math.sqrt(x * x + y * y + z * z) / r;
        if (d > 1 || d < 0.85) continue;
        const n = [x / (d * r), y / (d * r), z / (d * r)];
        let m: Material = 'soft';
        for (const [cx, cy, cz, cr] of craters) {
          const len = Math.hypot(cx, cy, cz);
          const dot = (n[0] * cx + n[1] * cy + n[2] * cz) / len;
          if (dot > 1 - cr * cr * 0.5) m = 'structureAlt';
        }
        // Méridiens et parallèles de la carte.
        const lat = Math.asin(n[2]);
        const lon = Math.atan2(n[1], n[0]);
        if (Math.abs(((lat / Math.PI) * 12) % 1) < 0.12 || Math.abs(((lon / Math.PI) * 12) % 1) < 0.09) m = 'accent';
        g.set(x, y, z, m);
      }
    }
  }
  return g;
};

/** Quelques animaux (voxels de 25 cm) : poisson, méduse, poisson-lanterne. Origine : centre de chacun. */
export const fish = () => {
  const g = new VoxelGrid();
  box(g, -1, 0, -3, 2, -1, 1, 'accent');
  box(g, -1, 0, 3, 3, 0, 0, 'accent');
  box(g, -1, 0, -5, -4, -2, 2, 'accentLight');
  g.set(0, 2, 0, 'dark');
  return g;
};

export const jellyfish = () => {
  const g = new VoxelGrid();
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) for (let z = 0; z <= 3; z++) if (x * x + y * y + (z * 1.4) ** 2 <= 10) g.set(x, y, z, 'soft');
  for (const [x, y] of [[-2, 0], [0, -2], [2, 0], [0, 2], [0, 0]]) for (let z = -1; z >= -6 + Math.abs(x + y); z--) g.set(x, y, z, 'accentLight');
  return g;
};

export const anglerfish = () => {
  const g = new VoxelGrid();
  for (let x = -2; x <= 1; x++) for (let y = -4; y <= 3; y++) for (let z = -3; z <= 2; z++) if ((x + 0.5) ** 2 / 4 + (y + 0.5) ** 2 / 16 + (z + 0.5) ** 2 / 9 <= 1) g.set(x, y, z, 'dark');
  box(g, -1, 0, 4, 4, -2, -1, 'soft');
  for (let k = 0; k < 4; k++) g.set(0, 2 + Math.floor(k / 2), 3 + k, 'dark');
  box(g, 0, 0, 4, 5, 7, 8, 'light');
  return g;
};
