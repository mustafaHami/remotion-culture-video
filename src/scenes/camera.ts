// Caméra en orbite autour d'une cible, décrite par des valeurs simples à interpoler.
// La même description sert à la scène 3D et aux annotations 2D, qui restent ainsi collées au décor.
import * as THREE from 'three';
import {HEIGHT, WIDTH} from '../design/format';

export type Vec3 = [number, number, number];

export type Shot = {
  /** Point visé, en coordonnées Three.js. */
  target: Vec3;
  /** Angle autour de la verticale, en degrés (0 = de face, positif = vers la droite). */
  yaw: number;
  /** Angle au-dessus de l'horizontale, en degrés. */
  pitch: number;
  distance: number;
  /** Champ vertical, en degrés. */
  fov: number;
  /** Hauteur de l'écran (en px) où apparaît la cible : décale le cadrage sans tourner la caméra. */
  centerY: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const mixShots = (a: Shot, b: Shot, t: number): Shot => ({
  target: [lerp(a.target[0], b.target[0], t), lerp(a.target[1], b.target[1], t), lerp(a.target[2], b.target[2], t)],
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  distance: lerp(a.distance, b.distance, t),
  fov: lerp(a.fov, b.fov, t),
  centerY: lerp(a.centerY, b.centerY, t),
});

export const shotPosition = (shot: Shot): Vec3 => {
  const yaw = THREE.MathUtils.degToRad(shot.yaw);
  const pitch = THREE.MathUtils.degToRad(shot.pitch);
  return [
    shot.target[0] + shot.distance * Math.sin(yaw) * Math.cos(pitch),
    shot.target[1] + shot.distance * Math.sin(pitch),
    shot.target[2] + shot.distance * Math.cos(yaw) * Math.cos(pitch),
  ];
};

/** Règle une caméra Three.js d'après un plan. */
export const applyShot = (camera: THREE.PerspectiveCamera, shot: Shot) => {
  camera.fov = shot.fov;
  camera.aspect = WIDTH / HEIGHT;
  camera.near = 1;
  camera.far = 2000;
  camera.position.set(...shotPosition(shot));
  camera.up.set(0, 1, 0);
  camera.lookAt(...shot.target);
  camera.setViewOffset(WIDTH, HEIGHT, 0, HEIGHT / 2 - shot.centerY, WIDTH, HEIGHT);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
};

/** Position à l'écran (px) d'un point 3D vu depuis ce plan. */
export const projectPoint = (shot: Shot, point: Vec3): [number, number] => {
  const camera = new THREE.PerspectiveCamera();
  applyShot(camera, shot);
  const v = new THREE.Vector3(...point).project(camera);
  return [((v.x + 1) / 2) * WIDTH, ((1 - v.y) / 2) * HEIGHT];
};
