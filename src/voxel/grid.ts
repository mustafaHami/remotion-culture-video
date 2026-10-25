// Grille de voxels en coordonnées « plan » (celles des planches Claude Design) :
// x = profondeur vers la rue, y = le long de la rue, z = hauteur. Un voxel = 1 m environ.

/** Matière d'un voxel : un nom, ou un nom par orientation de face (t = dessus, x et y = côtés). */
export type Material = string | {t: string; x: string; y: string};

export type Voxel = {x: number; y: number; z: number; m: Material};

// Clé numérique unique ; chaque axe accepte -1024 à 1023 (décors fins et profonds, comme une fosse océanique).
const key = (x: number, y: number, z: number) => ((x + 1024) * 2048 + (y + 1024)) * 2048 + (z + 1024);

export class VoxelGrid {
  private cells = new Map<number, Voxel>();

  set(x: number, y: number, z: number, m: Material) {
    this.cells.set(key(x, y, z), {x, y, z, m});
  }

  delete(x: number, y: number, z: number) {
    this.cells.delete(key(x, y, z));
  }

  has(x: number, y: number, z: number) {
    return this.cells.has(key(x, y, z));
  }

  /** Occupation en un point quelconque de l'espace (pour le lancer de rayons des ombres). */
  occupied(x: number, y: number, z: number) {
    return this.cells.has(key(Math.floor(x), Math.floor(y), Math.floor(z)));
  }

  voxels() {
    return [...this.cells.values()];
  }

  /** Nouvelle grille contenant les voxels qui vérifient le prédicat. */
  filter(keep: (v: Voxel) => boolean) {
    const out = new VoxelGrid();
    for (const v of this.cells.values()) if (keep(v)) out.set(v.x, v.y, v.z, v.m);
    return out;
  }

  merge(other: VoxelGrid) {
    for (const v of other.voxels()) this.set(v.x, v.y, v.z, v.m);
    return this;
  }
}

/** Passage des coordonnées plan aux coordonnées Three.js (X le long de la rue, Y vers le haut, Z vers la rue). */
export const toThree = ([x, y, z]: [number, number, number]): [number, number, number] => [y, z, x];
