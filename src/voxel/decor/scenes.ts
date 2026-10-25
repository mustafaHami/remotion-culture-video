// Registre des décors utilisables par le moteur d'épisode (champ "staging.decor" d'un épisode).
// Un nouveau décor : src/voxel/decor/<sujet>.ts (voxels) + <sujet>.scene.ts(x) (branchement), puis une ligne ici.
import type {DecorScene} from '../../engine/types';
import {avionScene} from './avion.scene';
import {haussmannFinScene} from './haussmann-fin.scene';
import {oceanScene} from './ocean.scene';

export const DECORS: Record<string, DecorScene> = {
  'rue-haussmannienne': haussmannFinScene,
  ocean: oceanScene,
  avion: avionScene,
};
