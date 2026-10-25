// Rue haussmannienne fine (voxels de 25 cm) pour l'essai de 15 s et l'épisode complet : décor, mur amovible, cadrages,
// places du hibou et repères des annotations, en coordonnées Three.js (mètres).
import React, {useMemo} from 'react';
import type {Look} from '../../design/looks';
import {fineBuilding, fineOppositeEdge, fineSideWall, fineStreet, fineStreetScene, OPPOSITE_FACE, UNIT, WIDTH_FINE} from '../../voxel/decor/haussmann-fin';
import {VoxelGrid} from '../../voxel/grid';
import {buildVoxelGeometry} from '../../voxel/geometry';
import type {Layout} from '../essai/direction';
import {DrawnVoxelModel, edgesOf} from './DrawnVoxel';

/** Bord de la coupe (côté ouvert du dernier immeuble), haut de façade, nu de la façade, bord de corniche. */
export const CUT_FACE = WIDTH_FINE * 3 * UNIT + 0.05;
export const TOP = 20;
export const FACADE = 10;
export const CORNICE = 11;
/** Nu de la façade d'en face : 22 m plus loin. */
const OPPOSITE = OPPOSITE_FACE * UNIT;
/** L'angle est tracé un peu devant la coupe, pour ne pas se confondre avec l'arête du toit. */
const ANGLE_X = CUT_FACE + 0.8;

export const FINE_LAYOUT: Layout = {
  hook: {target: [37, 10, 10], yaw: 42, pitch: 24, distance: 175, fov: 26, centerY: 1270},
  cut: {target: [41, 11, 8], yaw: 56, pitch: 18, distance: 134, fov: 26, centerY: 960},
  roof: {target: [CUT_FACE - 1, 20.5, 7], yaw: 84, pitch: 12, distance: 84, fov: 26, centerY: 1160},
  // En travers de la rue, depuis le bout : notre coupe à droite, la tranche d'en face à gauche.
  street: {target: [CUT_FACE, 10, (FACADE + OPPOSITE) / 2 - 1.5], yaw: 86, pitch: 9, distance: 172, fov: 26, centerY: 980},
  streetSpot: [42, 0, 12.6],
  roofSpot: [44.5, 24, 5],
  streetHeight: 8,
  roofHeight: 5,
};

type V = [number, number, number];

export const FINE_ANCHORS: Record<'clueFrom' | 'clueTo' | 'clueBadge' | 'widthFrom' | 'widthTo' | 'coteFrom' | 'coteTo' | 'roofCorner' | 'roofSlope' | 'roofLevel', V> = {
  clueFrom: [0, TOP, CORNICE],
  clueTo: [CUT_FACE, TOP, CORNICE],
  clueBadge: [CUT_FACE / 2, TOP, CORNICE],
  // Largeur de la rue, de façade à façade, tracée à mi-hauteur sur le ciel, au-dessus du hibou.
  widthFrom: [CUT_FACE + 0.3, 11, FACADE],
  widthTo: [CUT_FACE + 0.3, 11, OPPOSITE],
  coteFrom: [CUT_FACE, 0, FACADE + 0.4],
  coteTo: [CUT_FACE, TOP, FACADE + 0.4],
  roofCorner: [ANGLE_X, TOP, CORNICE],
  // Prolongée au-dessus du toit : c'est l'enveloppe à 45° sous laquelle le comble doit rester.
  roofSlope: [ANGLE_X, TOP + 8, CORNICE - 8],
  roofLevel: [ANGLE_X, TOP, CORNICE - 6],
};

// Pied du mur amovible : au milieu de la profondeur, sur le côté ouvert.
const WALL_PIVOT = [CUT_FACE - 0.3, 0, 5] as const;
const BUILD = {scale: UNIT, ao: 0.42, shadowTop: 118, shadowSteps: 190};

// Chaque immeuble est une pièce séparée (pour pouvoir varier sa hauteur) ; ombres calculées sur la rue entière.
const buildFine = (look: Look) => {
  const t = look.voxel;
  const scene = fineStreetScene(t);
  const part = (grid: VoxelGrid, occluders: VoxelGrid | null = scene) => {
    const geometry = buildVoxelGeometry(grid, t, {...BUILD, occluders});
    return {geometry, edges: edgesOf(geometry)};
  };
  const street = new VoxelGrid();
  fineStreet(street, WIDTH_FINE * 3);
  return {
    street: part(street),
    buildings: [
      part(fineBuilding(new VoxelGrid(), t, 0, {tone: true})),
      part(fineBuilding(new VoxelGrid(), t, WIDTH_FINE, {})),
      part(fineBuilding(new VoxelGrid(), t, WIDTH_FINE * 2, {cut: true, tone: true})),
    ],
    wall: part(fineSideWall(t)),
    opposite: part(fineOppositeEdge(t), null),
  };
};

const MODEL = {edgeWidth: 4, joint: 0.12, hatchDensity: 4.5, hatchStrength: 0.32};

type Props = {
  look: Look;
  /** Soulèvement du mur latéral (0 à 1). */
  lift: number;
  /** Apparition (0 à 1) de l'immeuble d'en face, qui pousse du sol. */
  opposite: number;
  /** Hauteur relative de chacun des trois immeubles (1 = hauteur réelle). */
  heights?: [number, number, number];
};

export const DrawnFineStreet: React.FC<Props> = ({look, lift, opposite, heights = [1, 1, 1]}) => {
  const s = useMemo(() => buildFine(look), [look]);
  const opacity = lift < 0.75 ? 1 : 1 - (lift - 0.75) / 0.25;
  return (
    <>
      <DrawnVoxelModel geometry={s.street.geometry} edges={s.street.edges} ink={look.text} {...MODEL} />
      {s.buildings.map((b, i) => (
        <group key={i} scale={[1, heights[i], 1]}>
          <DrawnVoxelModel geometry={b.geometry} edges={b.edges} ink={look.text} {...MODEL} />
        </group>
      ))}
      {opposite > 0.01 ? (
        <group scale={[1, opposite, 1]}>
          <DrawnVoxelModel geometry={s.opposite.geometry} edges={s.opposite.edges} ink={look.text} {...MODEL} />
        </group>
      ) : null}
      {opacity > 0 ? (
        <group position={[WALL_PIVOT[0] + lift * 3, lift * 46, WALL_PIVOT[2]]} rotation={[0, 0, -lift * 0.22]}>
          <DrawnVoxelModel geometry={s.wall.geometry} edges={s.wall.edges} ink={look.text} position={[-WALL_PIVOT[0], 0, -WALL_PIVOT[2]]} opacity={opacity} {...MODEL} />
        </group>
      ) : null}
    </>
  );
};
