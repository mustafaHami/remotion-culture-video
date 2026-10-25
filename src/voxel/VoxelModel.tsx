import React from 'react';
import * as THREE from 'three';

type Props = {
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  opacity?: number;
};

/** Affiche une géométrie voxel aux couleurs précalculées (aucun éclairage temps réel). */
export const VoxelModel: React.FC<Props> = ({geometry, position, rotation, scale, opacity = 1}) => (
  <mesh geometry={geometry} position={position} rotation={rotation} scale={scale}>
    <meshBasicMaterial vertexColors side={THREE.DoubleSide} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
  </mesh>
);
