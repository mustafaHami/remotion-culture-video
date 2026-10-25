// Branchement de l'océan en coupe (ocean.ts) sur le moteur d'épisode : pièces, fond d'eau, constantes et fonctions
// utilisables dans la mise en scène (depthToY, yToDepth, seabedY…).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {DecorScene, Part, Piece} from '../../engine/types';
import {hexToRgb, mix} from '../../design/color';
import type {Look} from '../../design/looks';
import {edgesOf} from '../edges';
import {buildVoxelGeometry, type BuildOptions} from '../geometry';
import {VoxelGrid} from '../grid';
import {
  anglerfish, depthToY, fish, FLOOR_BASE, HALF, jellyfish, moon, OBJECT_UNIT, oceanFloor, PLAIN_DEPTH, researchShip, satellite, seabedY,
  SHELF_DEPTH, SLAB, submersible, TERRAIN_UNIT, TRENCH_DEPTH, TRENCH_X, yToDepth,
} from './ocean';

const piece = (look: Look, grid: VoxelGrid, scale: number, extra: BuildOptions = {}): Piece => {
  const geometry = buildVoxelGeometry(grid, look.voxel, {scale, ao: 0.35, occluders: null, ...extra});
  return {geometry, edges: edgesOf(geometry)};
};

/** Bande cartographiée (centre Z, largeur) posée sur le fond, en tronçons de 2 m qui apparaissent un à un. */
const STRIP_CHUNK = 2;
const stripChunks = (look: Look, zc: number, width: number) =>
  Array.from({length: (2 * HALF) / STRIP_CHUNK}, (_, c) => {
    const g = new VoxelGrid();
    const x0 = -HALF + c * STRIP_CHUNK;
    for (let x = x0; x < x0 + STRIP_CHUNK; x += TERRAIN_UNIT) {
      const i = Math.round((x + HALF) / TERRAIN_UNIT);
      const top = Math.round((seabedY(x + TERRAIN_UNIT / 2) + 0.9) / TERRAIN_UNIT);
      for (let z = zc - width / 2; z < zc + width / 2; z += TERRAIN_UNIT) g.set(Math.round(z / TERRAIN_UNIT), i, top, 'accent');
    }
    return piece(look, g, TERRAIN_UNIT);
  });

const build = (look: Look): Record<string, Part> => ({
  floor: {piece: piece(look, oceanFloor(), TERRAIN_UNIT, {ao: 0.4, occluders: undefined, shadowTop: 0, shadowSteps: 80}), position: [-HALF, 0, 0], drawn: {joint: 0}},
  strip1: {chunks: stripChunks(look, 11.2, 2.25), position: [-HALF, 0, 0], onlyIfStaged: true},
  strip2: {chunks: stripChunks(look, 4.8, 2.25), position: [-HALF, 0, 0], onlyIfStaged: true},
  ship: {piece: piece(look, researchShip(), OBJECT_UNIT)},
  sub: {piece: piece(look, submersible(), OBJECT_UNIT), onlyIfStaged: true},
  satellite: {piece: piece(look, satellite(), OBJECT_UNIT), onlyIfStaged: true},
  moon: {piece: piece(look, moon(), TERRAIN_UNIT), onlyIfStaged: true},
  fish: {piece: piece(look, fish(), OBJECT_UNIT), onlyIfStaged: true},
  jellyfish: {piece: piece(look, jellyfish(), OBJECT_UNIT), onlyIfStaged: true},
  anglerfish: {piece: piece(look, anglerfish(), OBJECT_UNIT), onlyIfStaged: true},
});

const color = (hex: string) => new THREE.Color().setRGB(...(hexToRgb(hex).map((v) => v / 255) as [number, number, number]), THREE.LinearSRGBColorSpace);

/** Fond d'eau : panneau au dos de la tranche, du bleu de surface au noir des abysses, et la surface translucide. */
const Water: React.FC<{look: Look}> = ({look}) => {
  const m = look.voxel.m;
  const geometry = useMemo(() => {
    const stops: [number, string][] = [
      [0, m.water],
      [depthToY(200), mix(m.water, m.waterDeep, 0.55)],
      [depthToY(1000), m.waterDeep],
      [FLOOR_BASE, mix(m.waterDeep, m.dark, 0.6)],
    ];
    const g = new THREE.BufferGeometry();
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    stops.forEach(([y, hex], i) => {
      const c = color(hex);
      pos.push(-HALF, y, 0, HALF, y, 0);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (i > 0) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }, [m]);
  return (
    <>
      <mesh geometry={geometry} position={[0, 0, -0.05]}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, SLAB / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * HALF, SLAB]} />
        <meshBasicMaterial color={color(m.water)} transparent opacity={0.45} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
  );
};

export const oceanScene: DecorScene = {
  context: {
    /** Coupe de X = -HALF à HALF, tranche de Z = 0 à SLAB ; Y = -√(profondeur réelle). */
    HALF,
    SLAB,
    MID_Z: SLAB / 2,
    TRENCH_X,
    TRENCH_DEPTH,
    PLAIN_DEPTH,
    SHELF_DEPTH,
    FLOOR_BASE,
    depthToY,
    yToDepth,
    seabedY,
  },
  build,
  drawn: {edgeWidth: 4, joint: 0, hatchDensity: 4.5, hatchStrength: 0.3},
  Backdrop: Water,
};
