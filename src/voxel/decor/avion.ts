// Décor « avion de ligne des années 1950 » (signature du de Havilland Comet 1), voxels de 25 cm (UNIT) :
// fuselage de 28 m et 3 m de diamètre, nez arrondi et pare-brise, fenêtres presque carrées, deux fenêtres d'antenne
// (ADF) sur le toit, aile basse en flèche avec ses quatre réacteurs noyés à l'emplanture et ses réservoirs de bord
// d'attaque, dérive et empennage ; cabine en coupe (plancher, rangées de sièges) ; socle de maquette ; bassin d'essai ;
// fissure de fatigue ; deux panneaux de fuselage agrandis (ouverture à angles vifs, ouverture ronde).
// Propre à ce sujet : uniquement des rôles de couleur génériques des styles.
// Coordonnées plan (voir grid.ts) : x = profondeur (vers la caméra), y = le long du fuselage (nez vers +y), z = hauteur.
// Origine : axe du fuselage, au milieu de sa longueur.
import {VoxelGrid, type Material} from '../grid';

export const UNIT = 0.25;
/** Rayon du fuselage (6 voxels = 1,5 m) ; nez et queue (y) ; fuselage cylindrique entre TAIL_START et NOSE_START. */
export const R = 6;
export const NOSE = 56;
export const TAIL = -56;
const NOSE_START = 40;
const TAIL_START = -36;
/** Fenêtres de cabine : 2 × 2 voxels (50 cm), une par mètre. */
export const WINDOWS_Y = Array.from({length: 16}, (_, k) => -30 + 4 * k);
/** Fenêtres d'antenne ADF sur le toit, juste devant l'aile (début y, 2 voxels de long chacune). */
export const ADF_Y = [21, 16];
/** Cabine ouverte (coupe) côté caméra, de CUT_Y0 à CUT_Y1. */
export const CUT_Y0 = -28;
export const CUT_Y1 = -4;

const box = (g: VoxelGrid, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: Material) => {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) g.set(x, y, z, m);
};

/** Rayon et hauteur de l'axe du fuselage en y (nez arrondi, queue relevée qui s'affine). */
export const section = (y: number) => {
  if (y > NOSE_START) return {r: R * Math.sqrt(Math.max(0, 1 - ((y - NOSE_START) / (NOSE - NOSE_START)) ** 2)), zc: -((y - NOSE_START) / (NOSE - NOSE_START)) * 1.5};
  if (y < TAIL_START) {
    const t = (TAIL_START - y) / (TAIL_START - TAIL);
    return {r: R - (R - 1.5) * t, zc: t * 3};
  }
  return {r: R, zc: 0};
};

const inCut = (x: number, y: number, z: number) => x >= 1 && z >= -1 && y >= CUT_Y0 && y <= CUT_Y1;

/** Fuselage, ailes, réacteurs, empennage. `cut` : retire le flanc de la cabine côté caméra (rendu par `cabinLid`). */
export const airliner = (o: {cut?: boolean; lid?: boolean} = {}) => {
  const g = new VoxelGrid();
  const keep = (x: number, y: number, z: number) => (o.lid ? inCut(x, y, z) : !(o.cut && inCut(x, y, z)));
  const set = (x: number, y: number, z: number, m: Material) => {
    if (keep(x, y, z)) g.set(x, y, z, m);
  };

  // Fuselage : coque d'environ 1,5 voxel d'épaisseur. Dessus blanc, filet coloré sous les fenêtres, dessous métal.
  for (let y = TAIL; y <= NOSE; y++) {
    const {r, zc} = section(y);
    const n = Math.ceil(r) + 1;
    for (let x = -n; x <= n; x++) {
      for (let z = Math.floor(zc) - n; z <= Math.ceil(zc) + n; z++) {
        const d = Math.hypot(x, z - zc);
        if (d > r + 0.5 || (r > 3 && d <= r - 1)) continue;
        const h = z - zc;
        let m: Material = h > 0.5 ? 'soft' : h > -1.5 ? 'accent' : 'metal';
        if (h >= 1 && h <= 2 && Math.abs(x) >= 3 && WINDOWS_Y.some((wy) => y >= wy && y <= wy + 1)) m = 'glass';
        if (y >= 44 && y <= 47 && h >= 1 && h <= 3 && Math.abs(x) <= 4) m = 'glass';
        if (h >= 5 && Math.abs(x + 0.5) <= 1 && ADF_Y.some((ay) => y >= ay && y <= ay + 1)) m = 'glass';
        set(x, y, z, m);
      }
    }
  }
  // Porte avant (côté caméra) : encadrement sombre.
  for (let z = -3; z <= 3; z++) for (const y of [33, 38]) set(Math.round(Math.sqrt(Math.max(0, R * R - z * z))), y, z, 'dark');

  // Cabine : plancher et rangées de sièges face au nez, alignées sur les fenêtres ; cloison du poste de pilotage.
  if (!o.lid) {
    for (let y = -34; y <= 38; y++) for (let x = -(R - 2); x <= R - 2; x++) g.set(x, y, -2, 'floor');
    for (const wy of WINDOWS_Y) {
      for (const [x0, x1] of [[-4, -3], [2, 3]]) {
        box(g, x0, x1, wy, wy + 1, -1, -1, 'accent');
        box(g, x0, x1, wy - 1, wy - 1, -1, 1, 'accent');
      }
    }
    for (let x = -4; x <= 4; x++) for (let z = -1; z <= 4; z++) if (Math.hypot(x, z) < R - 1 && !(Math.abs(x) <= 1 && z <= 2)) g.set(x, 39, z, 'interiorAlt');
  }
  if (o.lid) return g;

  // Aile basse en flèche (envergure 35 m), dièdre léger ; quatre réacteurs noyés à l'emplanture, réservoirs de bord d'attaque.
  const lead = (s: number) => 12 - (s - 4) * 0.42;
  const chord = (s: number) => 16 - (s - 4) * 0.13;
  for (const side of [-1, 1]) {
    for (let s = 4; s <= 70; s++) {
      const le = Math.round(lead(s));
      const te = Math.round(lead(s) - chord(s));
      const dz = Math.floor((s - 4) / 22);
      const engine = s >= 5 && s <= 15;
      const z0 = engine ? -5 : s < 30 ? -4 : -3;
      const z1 = engine ? -2 : -3;
      for (let y = te; y <= le; y++) for (let z = z0; z <= z1; z++) g.set(side * s, y, z + dz, z === z1 ? 'soft' : 'metal');
      // Entrées d'air au bord d'attaque, tuyères au bord de fuite.
      if ((s >= 6 && s <= 9) || (s >= 11 && s <= 14)) {
        for (let z = -4; z <= -3; z++) {
          g.set(side * s, le, z + dz, 'dark');
          g.set(side * s, te, z + dz, 'dark');
        }
      }
      // Réservoir de bord d'attaque (« pinion tank ») à mi-envergure.
      if (s >= 46 && s <= 49) box(g, side * s, side * s, le - 1, le + 3, -4 + dz, -2 + dz, 'soft');
    }
  }

  // Dérive en flèche et empennage horizontal.
  for (let h = 0; h <= 22; h++) {
    const y0 = Math.round(-55 + h * 0.45);
    const y1 = Math.round(-40 - h * 0.25);
    for (let y = y0; y <= y1; y++) g.set(0, y, 4 + h, h >= 18 ? 'accent' : 'soft');
  }
  for (const side of [-1, 1]) {
    for (let s = 1; s <= 22; s++) {
      const le = Math.round(-46 - s * 0.35);
      for (let y = Math.round(le - (8 - s * 0.18)); y <= le; y++) g.set(side * s, y, 3, 'soft');
    }
  }
  return g;
};

/** Flanc de cabine retiré pour la coupe (à soulever pour la révéler). */
export const cabinLid = () => airliner({lid: true});

/** Socle de maquette : disque et mât sous le fuselage. */
export const stand = () => {
  const g = new VoxelGrid();
  for (let x = -14; x <= 14; x++) for (let y = -14; y <= 14; y++) if (Math.hypot(x, y) <= 14) {
    g.set(x, y, -30, 'base');
    g.set(x, y, -29, Math.hypot(x, y) > 12.5 ? 'trim' : 'base');
  }
  box(g, -1, 0, -1, 0, -28, -7, 'dark');
  return g;
};

/** Bassin d'essai : sol, murs (le mur côté caméra reste bas), cadre métallique ; fentes pour les ailes. */
export const tank = (plane: VoxelGrid) => {
  const g = new VoxelGrid();
  const X = 15, Y = 62, Z0 = -31, Z1 = 10;
  const slot = (x: number, y: number, z: number) => [-1, 0, 1].some((d) => plane.has(x, y, z + d) || plane.has(x - Math.sign(x), y, z + d));
  box(g, -X, X, -Y, Y, Z0, Z0, 'structure');
  for (let y = -Y; y <= Y; y++) for (let z = Z0; z <= Z1; z++) {
    if (!slot(-X, y, z)) g.set(-X, y, z, (y + Y) % 16 === 0 ? 'metal' : 'structure');
    if (z <= Z0 + 5 && !slot(X, y, z)) g.set(X, y, z, 'structureAlt');
  }
  for (const y of [-Y, Y]) for (let x = -X; x <= X; x++) for (let z = Z0; z <= Z1; z++) g.set(x, y, z, x === X || z === Z1 ? 'metal' : 'structure');
  box(g, -X, -X, -Y, Y, Z1, Z1, 'metal');
  return g;
};

/** Eau du bassin : surface et face avant seulement (vue à travers). */
export const tankWater = (plane: VoxelGrid) => {
  const g = new VoxelGrid();
  for (let y = -61; y <= 61; y++) {
    for (let x = -14; x <= 14; x++) if (!plane.has(x, y, 8)) g.set(x, y, 8, 'water');
    for (let z = -30; z <= 8; z++) if (!plane.has(14, y, z)) g.set(14, y, z, 'water');
  }
  return g;
};

/** Fissure de fatigue : part du coin arrière de la fenêtre ADF arrière et descend vers l'arrière sur le flanc, côté caméra. */
export const CRACK_STEPS = 18;
export const crackStep = (k: number) => {
  const g = new VoxelGrid();
  const jag = [0, 4, -3, 5, -2, 6, -4, 3, -1, 5, -3, 4, 0, 6, -2, 3, -4, 5];
  const angle = ((90 - k * 4 + jag[k % jag.length]) * Math.PI) / 180;
  const y = ADF_Y[1] - 1 - k;
  // Trait sombre en relief sur la peau du fuselage (à distinguer du filet coloré de la livrée).
  g.set(Math.round((R + 0.6) * Math.cos(angle)), y, Math.round((R + 0.6) * Math.sin(angle)), 'dark');
  g.set(Math.round((R + 0.6) * Math.cos(angle - 0.06)), y, Math.round((R + 0.6) * Math.sin(angle - 0.06)), 'dark');
  return g;
};

/**
 * Panneau de fuselage agrandi (5 m × 4 m, tôle de 50 cm) avec une ouverture de 2 m : `square` à angles vifs ou `round`.
 * Vitre en retrait, encadrement et rangée de rivets autour. Origine : centre de l'ouverture, face avant de la tôle.
 */
export const HOLE = 4;
export const skinPanel = (shape: 'square' | 'round') => {
  const g = new VoxelGrid();
  const inHole = (y: number, z: number) =>
    shape === 'square' ? y >= -HOLE && y < HOLE && z >= -HOLE && z < HOLE : Math.hypot(y + 0.5, z + 0.5) <= HOLE + 0.5;
  const ring = (y: number, z: number, d: number) =>
    shape === 'square' ? Math.max(Math.abs(y + 0.5), Math.abs(z + 0.5)) <= HOLE + d && !(Math.max(Math.abs(y + 0.5), Math.abs(z + 0.5)) <= HOLE + d - 1) : Math.abs(Math.hypot(y + 0.5, z + 0.5) - (HOLE + d - 0.5)) <= 0.5;
  for (let y = -10; y < 10; y++) {
    for (let z = -8; z < 8; z++) {
      if (inHole(y, z)) {
        g.set(-2, y, z, 'glass');
        continue;
      }
      g.set(-2, y, z, 'metal');
      g.set(-1, y, z, 'metal');
      if (ring(y, z, 1)) g.set(0, y, z, 'trim');
      if (ring(y, z, 3) && (y + z) % 2 === 0) g.set(0, y, z, 'dark');
    }
  }
  return g;
};
