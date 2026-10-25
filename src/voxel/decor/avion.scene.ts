// Branchement de l'avion de ligne (avion.ts) sur le moteur d'épisode : pièces animables et repères (Three.js, mètres).
// Origine : axe du fuselage au milieu de sa longueur ; X le long du fuselage (nez vers +X), Y en haut, Z vers la caméra.
import type {DecorScene, Part, Piece} from '../../engine/types';
import type {Look} from '../../design/looks';
import {edgesOf} from '../edges';
import {buildVoxelGeometry, type BuildOptions} from '../geometry';
import {VoxelGrid} from '../grid';
import {ADF_Y, airliner, cabinLid, CRACK_STEPS, crackStep, HOLE, R, skinPanel, stand, tank, tankWater, UNIT} from './avion';

const BUILD: BuildOptions = {scale: UNIT, ao: 0.42, shadowTop: 40, shadowSteps: 120};

const build = (look: Look): Record<string, Part> => {
  const t = look.voxel;
  const full = airliner();
  const plane = airliner({cut: true});
  const occluders = new VoxelGrid().merge(full).merge(stand());
  const piece = (grid: VoxelGrid, extra: BuildOptions = {}): Piece => {
    const geometry = buildVoxelGeometry(grid, t, {...BUILD, occluders, ...extra});
    return {geometry, edges: edgesOf(geometry)};
  };
  return {
    plane: {piece: piece(plane)},
    lid: {piece: piece(cabinLid())},
    stand: {piece: piece(stand())},
    tank: {piece: piece(tank(full), {occluders: null}), onlyIfStaged: true},
    tankWater: {piece: piece(tankWater(full), {occluders: null, ao: 0}), onlyIfStaged: true, drawn: {joint: 0, hatchStrength: 0.15}},
    crack: {chunks: Array.from({length: CRACK_STEPS}, (_, k) => piece(crackStep(k), {occluders: null})), onlyIfStaged: true},
    panelSquare: {piece: piece(skinPanel('square'), {occluders: null}), onlyIfStaged: true},
    panelRound: {piece: piece(skinPanel('round'), {occluders: null}), onlyIfStaged: true},
  };
};

export const avionScene: DecorScene = {
  context: {
    UNIT,
    /** Rayon du fuselage et hauteur du toit (Y). */
    RADIUS: R * UNIT,
    ROOF: (R + 1) * UNIT,
    /** Fenêtre ADF arrière : début (X) ; la fissure part de son coin arrière, vers -X. */
    ADF_X: ADF_Y[1] * UNIT,
    /** Dessus de l'aile près du fuselage (Y), et bas du socle. */
    WING_TOP: -0.5,
    STAND_BOTTOM: -7.5,
    /** Demi-côté (ou rayon) de l'ouverture des panneaux agrandis, centrés sur leur origine. */
    HOLE_HALF: HOLE * UNIT,
    /** Fond du bassin d'essai (Y), pour le faire monter du sol. */
    TANK_FLOOR: -31 * UNIT,
  },
  build,
  drawn: {edgeWidth: 4, joint: 0.12, hatchDensity: 4.5, hatchStrength: 0.32},
};
