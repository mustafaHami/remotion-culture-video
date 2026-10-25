import {useThree} from '@react-three/fiber';
import type React from 'react';
import {useLayoutEffect} from 'react';
import type * as THREE from 'three';
import {applyShot, type Shot} from './camera';

/** Place la caméra de la scène 3D avant chaque rendu d'image (à utiliser dans un ThreeCanvas). */
export const CameraRig: React.FC<{shot: Shot}> = ({shot}) => {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    applyShot(camera, shot);
  }, [camera, shot]);
  return null;
};
