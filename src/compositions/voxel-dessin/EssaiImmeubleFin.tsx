// Essai « immeuble plus réaliste » : la rue en voxels de 25 cm (src/voxel/decor/haussmann-fin.ts),
// avec occlusion ambiante, vue sous quatre angles (une image par angle). Images fixes de réglage,
// sans voix : on juge le décor, pas la mise en scène.
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {withAlpha} from '../../design/color';
import {HEIGHT, WIDTH} from '../../design/format';
import {LOOKS} from '../../design/looks';
import {CameraRig} from '../../scenes/CameraRig';
import type {Shot} from '../../scenes/camera';
import {fineStreetScene, UNIT} from '../../voxel/decor/haussmann-fin';
import {buildVoxelGeometry} from '../../voxel/geometry';
import {VoxelModel} from '../../voxel/VoxelModel';
import {DrawnFilters, GrainOverlay} from '../dessin/Filters';
import {DrawnVoxelModel, edgesOf} from './DrawnVoxel';

/** Vue d'ensemble, façade, corniche et comble, coupe. */
export const FINE_SHOTS: Shot[] = [
  {target: [25, 11, 9], yaw: 34, pitch: 14, distance: 128, fov: 30, centerY: 960},
  {target: [24.75, 12, 10], yaw: 10, pitch: 5, distance: 44, fov: 32, centerY: 960},
  {target: [22, 20.5, 9], yaw: 28, pitch: 20, distance: 24, fov: 32, centerY: 960},
  {target: [44, 12, 5], yaw: 78, pitch: 8, distance: 50, fov: 32, centerY: 960},
];

export const EssaiImmeubleFin: React.FC<{drawn: boolean}> = ({drawn}) => {
  const look = LOOKS.A;
  const frame = useCurrentFrame();
  const shot = FINE_SHOTS[Math.min(frame, FINE_SHOTS.length - 1)];
  const scene = useMemo(() => {
    const geometry = buildVoxelGeometry(fineStreetScene(look.voxel), look.voxel, {scale: UNIT, ao: 0.42, shadowTop: 118, shadowSteps: 190});
    return {geometry, edges: drawn ? edgesOf(geometry) : null};
  }, [look, drawn]);
  return (
    <AbsoluteFill style={{background: look.background}}>
      {drawn ? <DrawnFilters frame={frame} /> : null}
      <ThreeCanvas width={WIDTH} height={HEIGHT} linear flat gl={{antialias: true, preserveDrawingBuffer: true}} style={{position: 'absolute', filter: drawn ? 'url(#dessin-wobble)' : undefined}}>
        <CameraRig shot={shot} />
        {scene.edges ? <DrawnVoxelModel geometry={scene.geometry} edges={scene.edges} ink={look.text} edgeWidth={4} joint={0.12} hatchDensity={4.5} hatchStrength={0.32} /> : <VoxelModel geometry={scene.geometry} />}
      </ThreeCanvas>
      {drawn ? <GrainOverlay vignette={withAlpha(look.text, 0.18)} /> : null}
    </AbsoluteFill>
  );
};
