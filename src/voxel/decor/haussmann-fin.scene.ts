// Branchement de la rue haussmannienne fine (haussmann-fin.ts) sur le moteur d'épisode : pièces animables,
// constantes utilisables dans la mise en scène (coordonnées Three.js, mètres).
import type {DecorScene, Part} from '../../engine/types';
import type {Look} from '../../design/looks';
import {edgesOf} from '../edges';
import {buildVoxelGeometry} from '../geometry';
import {VoxelGrid} from '../grid';
import {fineBuilding, fineOppositeEdge, fineSideWall, fineStreet, fineStreetScene, OPPOSITE_FACE, UNIT, WIDTH_FINE} from './haussmann-fin';

const CUT_FACE = WIDTH_FINE * 3 * UNIT + 0.05;
const BUILD = {scale: UNIT, ao: 0.42, shadowTop: 118, shadowSteps: 190};

const build = (look: Look): Record<string, Part> => {
  const t = look.voxel;
  const scene = fineStreetScene(t);
  const part = (grid: VoxelGrid, occluders: VoxelGrid | null = scene): Part => {
    const geometry = buildVoxelGeometry(grid, t, {...BUILD, occluders});
    return {piece: {geometry, edges: edgesOf(geometry)}};
  };
  const street = new VoxelGrid();
  fineStreet(street, WIDTH_FINE * 3);
  return {
    street: part(street),
    building1: part(fineBuilding(new VoxelGrid(), t, 0, {tone: true})),
    building2: part(fineBuilding(new VoxelGrid(), t, WIDTH_FINE, {})),
    building3: part(fineBuilding(new VoxelGrid(), t, WIDTH_FINE * 2, {cut: true, tone: true})),
    // Mur latéral qui couvre la coupe du troisième immeuble ; à soulever pour la révéler.
    wall: part(fineSideWall(t)),
    // Tranche de l'immeuble d'en face (22 m de façade à façade) : seulement si la mise en scène l'utilise.
    opposite: {...part(fineOppositeEdge(t), null), onlyIfStaged: true},
  };
};

export const haussmannFinScene: DecorScene = {
  context: {
    UNIT,
    /** Bord de la coupe (côté ouvert du dernier immeuble), le long de la rue (X). */
    CUT_FACE,
    /** Haut de la façade (Y), nu de la façade et bord de la corniche (Z). */
    TOP: 20,
    FACADE: 10,
    CORNICE: 11,
    /** Nu de la façade d'en face (Z). */
    OPPOSITE: OPPOSITE_FACE * UNIT,
    /** Longueur d'un immeuble le long de la rue. */
    BUILDING: WIDTH_FINE * UNIT,
  },
  build,
  drawn: {edgeWidth: 4, joint: 0.12, hatchDensity: 4.5, hatchStrength: 0.32},
};
