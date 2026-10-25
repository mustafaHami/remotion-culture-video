// Le hibou explorateur, version C « lisse stylisé » (planches Claude Design, choisie le 25 octobre 2026).
// Construit en code à partir de formes simples, d'après les proportions des planches
// (H = hauteur sans les aigrettes) : tête ellipsoïde plus large que le corps, masque en cœur,
// grands yeux ambrés, aigrettes coniques, ailes sur pivot d'épaule, sacoche, loupe.
// Le hibou regarde vers +Z ; tout son jeu vient de `rig` (aucune horloge, aucun useFrame).
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {hexToRgb} from '../design/color';
import type {Look} from '../design/looks';
import type {OwlRig} from './rig';

export type OwlState = {
  rig: OwlRig;
  /** Orientation du corps entier (radians, 0 = face à +Z). */
  yaw: number;
  /** Saut (en hauteurs de hibou) et écrasement (1 = aucun) pour les réactions. */
  hop: number;
  squash: number;
};

type Props = {
  look: Look;
  state: OwlState;
  /** Position au sol (centre des pieds), en coordonnées Three.js. */
  position: [number, number, number];
  /** Hauteur du hibou sans les aigrettes, en blocs. */
  height: number;
};

// Couleurs envoyées telles quelles (le Canvas est en mode linear) : pas de conversion sRGB.
const rawColor = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.LinearSRGBColorSpace);
};

const useMaterials = (look: Look) =>
  useMemo(() => {
    const c = look.owl.colors;
    const glow = look.owl.glow;
    const mat = (hex: string, emissive = false) =>
      new THREE.MeshStandardMaterial({
        color: rawColor(hex),
        roughness: 0.8,
        metalness: 0,
        emissive: emissive ? rawColor(hex) : undefined,
        emissiveIntensity: emissive ? 0.45 : 0,
      });
    return {
      plumage: mat(c.plumage),
      dark: mat(c.plumageDark),
      mask: mat(c.mask),
      belly: mat(c.belly),
      eye: mat(c.eye, glow),
      pupil: mat(c.pupil),
      highlight: new THREE.MeshBasicMaterial({color: rawColor('#FFFFFF'), toneMapped: false}),
      beak: mat(c.beak),
      strap: mat(c.strap),
      bag: mat(c.bag),
      rim: mat(c.rim),
      lens: new THREE.MeshStandardMaterial({color: rawColor(c.lens), roughness: 0.2, transparent: true, opacity: 0.55, emissive: glow ? rawColor(c.lens) : undefined, emissiveIntensity: glow ? 0.4 : 0}),
      scarf: mat(c.scarf),
    };
  }, [look]);

// Géométries unitaires partagées, mises à l'échelle par pièce.
const SPHERE = new THREE.SphereGeometry(0.5, 40, 28);
const LID = new THREE.SphereGeometry(0.5, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
const CONE = new THREE.ConeGeometry(0.5, 1, 28);
const BROW = new THREE.CapsuleGeometry(0.018, 0.09, 6, 12);
const BAG = new THREE.BoxGeometry(0.25, 0.2, 0.1);
const RING = new THREE.TorusGeometry(0.065, 0.013, 12, 40);
const LENS = new THREE.CircleGeometry(0.062, 32);
const HANDLE = new THREE.CylinderGeometry(0.012, 0.014, 0.12, 12);
const STRAP = new THREE.TubeGeometry(
  new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.24, 0.56, 0.08),
    new THREE.Vector3(-0.1, 0.48, 0.25),
    new THREE.Vector3(0.08, 0.37, 0.29),
    new THREE.Vector3(0.22, 0.27, 0.22),
    new THREE.Vector3(0.27, 0.26, 0.13),
  ]),
  48,
  0.016,
  10,
);
const SCARF = new THREE.TorusGeometry(0.25, 0.045, 14, 48);

// Mouchetures du ventre (sept, comme sur la planche).
const SPECKLES: [number, number][] = [[-0.1, 0.32], [0.02, 0.35], [0.12, 0.3], [-0.06, 0.24], [0.07, 0.22], [-0.12, 0.16], [0.01, 0.14]];

const Eye: React.FC<{x: number; rig: OwlRig; mats: ReturnType<typeof useMaterials>; side: 1 | -1}> = ({x, rig, mats, side}) => {
  const r = 0.105;
  const ax = rig.lookX * 0.38;
  const ay = rig.lookY * 0.3;
  const dir = new THREE.Vector3(Math.sin(ax), Math.sin(ay), Math.cos(ax) * Math.cos(ay));
  const pupil = dir.clone().multiplyScalar(r * 0.72);
  // La paupière supérieure est une calotte qui bascule vers l'avant pour fermer l'œil.
  const lid = -1.6 + rig.lids * 3.05;
  const brow = 0.075 + rig.brows * 0.035;
  return (
    <group position={[x, 0.22, 0.27]}>
      <mesh geometry={SPHERE} material={mats.eye} scale={r * 2} />
      <mesh geometry={SPHERE} material={mats.pupil} position={pupil.toArray()} scale={[0.11, 0.11, 0.06]} />
      <mesh geometry={SPHERE} material={mats.highlight} position={[pupil.x - 0.022, pupil.y + 0.026, pupil.z + 0.035]} scale={0.04} />
      <mesh geometry={LID} material={mats.plumage} rotation={[lid, 0, 0]} scale={r * 2.12} />
      <mesh geometry={BROW} material={mats.dark} position={[side * 0.01, brow + 0.035, 0.06]} rotation={[0, 0, Math.PI / 2 + side * (0.18 - rig.brows * 0.22)]} />
    </group>
  );
};

/** Lumières douces du hibou (le décor voxel, à couleurs précalculées, n'en dépend pas).
 * Three.js divise la diffusion par π : les intensités sont multipliées par π pour garder les teintes. */
export const OwlLights: React.FC<{look: Look}> = ({look}) => {
  const night = look.owl.glow;
  return (
    <>
      <hemisphereLight args={[rawColor(night ? '#C9B8F0' : '#FFFFFF'), rawColor(night ? '#2A1F45' : '#B89A78'), (night ? 0.7 : 0.85) * Math.PI]} />
      <directionalLight position={[-14, 30, 12]} intensity={(night ? 0.55 : 0.6) * Math.PI} color={rawColor(night ? '#FFD9A0' : '#FFF4E2')} />
    </>
  );
};

export const Owl: React.FC<Props> = ({look, state, position, height}) => {
  const mats = useMaterials(look);
  const {rig} = state;
  const stretch = 1 / Math.sqrt(state.squash);
  return (
    <group position={[position[0], position[1] + state.hop * height, position[2]]}>
      {/* Ombre au sol : un disque sombre qui pâlit quand le hibou saute. */}
      <mesh position={[0, 0.03 - state.hop * height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38 * height, 32]} />
        <meshBasicMaterial color={rawColor(look.voxel.shadow)} transparent opacity={0.3 / (1 + state.hop * 3)} toneMapped={false} />
      </mesh>
      <group rotation={[0, state.yaw, 0]} scale={[height * stretch, height * state.squash, height * stretch]}>
        {/* Corps, ventre moucheté, pattes */}
        <mesh geometry={SPHERE} material={mats.plumage} position={[0, 0.33, 0]} scale={[0.6, 0.6, 0.52]} />
        <mesh geometry={SPHERE} material={mats.belly} position={[0, 0.27, 0.11]} scale={[0.44, 0.42, 0.32]} />
        {SPECKLES.map(([x, y], i) => (
          <mesh key={i} geometry={SPHERE} material={mats.dark} position={[x, y, 0.255 + 0.02 * Math.cos(x * 6)]} scale={[0.034, 0.024, 0.014]} />
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={SPHERE} material={mats.beak} position={[s * 0.1, 0.025, 0.13]} scale={[0.09, 0.05, 0.13]} />
        ))}
        {/* Bandoulière, sacoche et loupe sur la hanche droite de l'écran */}
        <mesh geometry={STRAP} material={mats.strap} />
        <mesh geometry={BAG} material={mats.bag} position={[0.27, 0.2, 0.11]} rotation={[0, 0.5, 0]} />
        <group position={[0.37, 0.36, 0.1]} rotation={[0, 0.45, -0.25]}>
          <mesh geometry={RING} material={mats.rim} />
          <mesh geometry={LENS} material={mats.lens} />
          <mesh geometry={HANDLE} material={mats.rim} position={[0, -0.12, 0]} />
        </group>
        {look.owl.scarf ? <mesh geometry={SCARF} material={mats.scarf} position={[0, 0.53, 0.02]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1, 1, 0.8]} /> : null}
        {/* Ailes sur pivot d'épaule : +X est à droite de l'écran quand le hibou fait face à la caméra. */}
        {([1, -1] as const).map((s) => (
          <group key={s} position={[s * 0.29, 0.47, 0]} rotation={[0, 0, s * (s === 1 ? rig.wingRight : rig.wingLeft)]}>
            <mesh geometry={SPHERE} material={mats.dark} position={[s * 0.03, -0.2, -0.02]} scale={[0.15, 0.49, 0.34]} />
          </group>
        ))}
        {/* Tête sur pivot de cou */}
        <group position={[0, 0.52, 0]} rotation={[0, rig.headYaw, rig.headTilt]}>
          <mesh geometry={SPHERE} material={mats.plumage} position={[0, 0.2, 0]} scale={[0.72, 0.56, 0.6]} />
          {/* Masque en cœur : deux ellipsoïdes qui se chevauchent */}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={SPHERE} material={mats.mask} position={[s * 0.12, 0.2, 0.17]} scale={[0.33, 0.37, 0.24]} />
          ))}
          <Eye x={-0.13} rig={rig} mats={mats} side={-1} />
          <Eye x={0.13} rig={rig} mats={mats} side={1} />
          <mesh geometry={CONE} material={mats.beak} position={[0, 0.12, 0.31]} rotation={[Math.PI - 0.35, 0, 0]} scale={[0.1, 0.12, 0.1]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={CONE} material={mats.plumage} position={[s * 0.24, 0.47, -0.02]} rotation={[0, 0, -s * 0.44]} scale={[0.15, 0.24, 0.13]} />
          ))}
        </group>
      </group>
    </group>
  );
};
