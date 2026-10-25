// Transforme une grille de voxels en une géométrie Three.js : seules les faces visibles sont créées,
// et leur couleur est précalculée (ombrage par orientation + ombres portées), comme dans les
// planches Claude Design. Le rendu affiche ces couleurs telles quelles : aucune lumière temps réel,
// donc des couleurs exactes, stables d'une image à l'autre.
import * as THREE from 'three';
import {hexToRgb, mix} from '../design/color';
import type {VoxelTheme} from '../design/looks';
import {VoxelGrid, type Material} from './grid';

type Face = {
  /** Décalage du voisin qui masquerait la face. */
  n: [number, number, number];
  /** Orientation utilisée pour choisir la matière d'un voxel à matières multiples. */
  side: 't' | 'x' | 'y';
  /** Quatre coins, relatifs au coin (x, y, z) du voxel. */
  corners: [number, number, number][];
  shade: (base: string, theme: VoxelTheme, emissive: boolean) => string;
  /** Les faces orientées vers la lumière peuvent recevoir une ombre portée. */
  receivesShadow: boolean;
};

const FACES: Face[] = [
  {n: [0, 0, 1], side: 't', corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], receivesShadow: true,
    shade: (b, t, e) => mix(b, t.hi, e ? 0.05 : t.topK)},
  {n: [1, 0, 0], side: 'x', corners: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], receivesShadow: true,
    shade: (b, t, e) => (t.xK && !e ? mix(b, t.ink, t.xK) : b)},
  {n: [0, 1, 0], side: 'y', corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], receivesShadow: false,
    shade: (b, t, e) => mix(b, t.ink, e ? 0.12 : t.yK)},
  {n: [0, -1, 0], side: 'y', corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], receivesShadow: true,
    shade: (b, t, e) => (e ? b : mix(b, t.hi, t.topK * 0.4))},
  {n: [-1, 0, 0], side: 'x', corners: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], receivesShadow: false,
    shade: (b, t, e) => mix(b, t.ink, e ? 0.12 : t.yK + 0.08)},
  {n: [0, 0, -1], side: 't', corners: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], receivesShadow: false,
    shade: (b, t) => mix(b, t.ink, 0.5)},
];

// Direction de la lumière (vers la source), reprise des planches.
const LIGHT: [number, number, number] = [0.35, -1, 1.5];

const inShadow = (occluders: VoxelGrid, x: number, y: number, z: number, top = 30, steps = 70) => {
  for (let i = 1; i < steps; i++) {
    const t = i * 0.45;
    const pz = z + LIGHT[2] * t;
    if (pz > top) return false;
    if (occluders.occupied(x + LIGHT[0] * t, y + LIGHT[1] * t, pz)) return true;
  }
  return false;
};

// Petite variation de teinte, stable, propre à chaque bloc.
const jitterOf = (x: number, y: number, z: number) => {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 4294967295) * 2 - 1;
};

const materialFor = (m: Material, side: Face['side']) => (typeof m === 'string' ? m : m[side]);

export type BuildOptions = {
  /** Grille servant aux ombres portées ; par défaut la grille elle-même. `null` : pas d'ombre. */
  occluders?: VoxelGrid | null;
  /** Échelle appliquée aux coordonnées (ex. hibou plus petit que le décor). */
  scale?: number;
  /** Hauteur (en voxels) au-delà de laquelle aucune ombre n'est cherchée, et nombre de pas du rayon (0,45 voxel chacun). */
  shadowTop?: number;
  shadowSteps?: number;
  /** Occlusion ambiante (0 = aucune) : assombrit les coins rentrants, le dessous des saillies, le fond des embrasures. */
  ao?: number;
};

/**
 * Occlusion d'un coin de face (0 à 3) : dans la couche devant la face, on regarde les deux voisins
 * qui touchent ce coin et le voisin en diagonale (méthode classique des jeux en voxels).
 */
const cornerOcclusion = (grid: VoxelGrid, v: {x: number; y: number; z: number}, n: [number, number, number], corner: [number, number, number]) => {
  const axes = [0, 1, 2].filter((a) => n[a] === 0);
  const base = [v.x + n[0], v.y + n[1], v.z + n[2]];
  const step = (a: number) => (corner[a] === 0 ? -1 : 1);
  const at = (da: number, db: number) => {
    const p = [...base];
    p[axes[0]] += da;
    p[axes[1]] += db;
    return grid.has(p[0], p[1], p[2]) ? 1 : 0;
  };
  const s1 = at(step(axes[0]), 0);
  const s2 = at(0, step(axes[1]));
  if (s1 && s2) return 3;
  return s1 + s2 + at(step(axes[0]), step(axes[1]));
};

/** Géométrie en coordonnées Three.js (X = y plan, Y = z plan, Z = x plan), couleurs par sommet. */
export const buildVoxelGeometry = (grid: VoxelGrid, theme: VoxelTheme, options: BuildOptions = {}) => {
  const occluders = options.occluders === undefined ? grid : options.occluders;
  const s = options.scale ?? 1;
  const ao = options.ao ?? 0;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (const v of grid.voxels()) {
    for (const face of FACES) {
      if (grid.has(v.x + face.n[0], v.y + face.n[1], v.z + face.n[2])) continue;
      const name = materialFor(v.m, face.side);
      const base = name.startsWith('#') ? name : (theme.m as Record<string, string>)[name] ?? '#FF00FF';
      const emissive = (theme.emit as string[]).includes(name);
      let color = face.shade(base, theme, emissive);
      if (!emissive && face.receivesShadow && occluders && v.z >= -1) {
        const cx = v.x + 0.5 + face.n[0] * 0.52;
        const cy = v.y + 0.5 + face.n[1] * 0.52;
        const cz = v.z + 0.5 + face.n[2] * 0.52;
        if (inShadow(occluders, cx, cy, cz, options.shadowTop, options.shadowSteps)) color = mix(color, theme.shadow, theme.shK);
      }
      if (theme.jitter && !emissive) {
        const j = jitterOf(v.x, v.y, v.z) * theme.jitter;
        color = mix(color, j > 0 ? '#FFFFFF' : '#000000', Math.abs(j));
      }
      const [r, g, b] = hexToRgb(color);
      const first = positions.length / 3;
      for (const corner of face.corners) {
        const [dx, dy, dz] = corner;
        positions.push((v.y + dy) * s, (v.z + dz) * s, (v.x + dx) * s);
        const k = ao && !emissive ? 1 - (ao * cornerOcclusion(grid, v, face.n, corner)) / 3 : 1;
        colors.push((r / 255) * k, (g / 255) * k, (b / 255) * k);
      }
      indices.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
};
