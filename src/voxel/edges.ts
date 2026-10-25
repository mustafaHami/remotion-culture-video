import * as THREE from 'three';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

/** Arêtes vives (angle > 30°) d'une géométrie voxel, pour le contour encré du rendu crayonné. */
export const edgesOf = (geometry: THREE.BufferGeometry) => new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geometry, 30));
