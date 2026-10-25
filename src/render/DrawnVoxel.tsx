// Finition « crayonné » (docs/rendu.md § 3) : les mêmes cubes, mais crayonnés. Trois ajouts, sans toucher au moteur voxel :
// - des hachures au crayon dans les faces, plus denses sur les faces sombres (shader, attachées à l'objet) ;
// - un contour encré sur les arêtes vives des volumes (EdgesGeometry + lignes épaisses) ;
// - un contour encré autour du hibou (coque inversée).
// Le tremblement du trait et le grain sont posés ensuite sur toute l'image (filtres SVG de l'essai dessiné).
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial.js';
import {LineSegments2} from 'three/examples/jsm/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import {hexToRgb} from '../design/color';
import {HEIGHT, WIDTH} from '../design/format';
import type {Look} from '../design/looks';
import {edgesOf} from '../voxel/edges';

/** Épaisseur du contour des volumes, en pixels. */
const EDGE_PX = 7;

const HATCH_VERTEX = /* glsl */ `
#include <begin_vertex>
vHatchPos = position;
`;

// Hachures en coordonnées de l'objet : elles suivent le mur quand il se soulève.
const HATCH_FRAGMENT = /* glsl */ `
#include <color_fragment>
{
  vec3 n = abs(normalize(cross(dFdx(vHatchPos), dFdy(vHatchPos))));
  vec2 uv = n.y > 0.5 ? vHatchPos.xz : (n.x > 0.5 ? vHatchPos.zy : vHatchPos.xy);
  float lum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
  float shade = clamp((0.9 - lum) * 1.5, 0.0, 1.0);
  float wob = sin(uv.x * 5.3 + uv.y * 2.1) * 0.1 + sin(uv.y * 11.0 + uv.x) * 0.05;
  float d1 = (uv.x + uv.y) * uDensity;
  float w = 0.05 + shade * 0.15;
  float l1 = 1.0 - smoothstep(w, w + 0.09, abs(fract(d1 + wob) - 0.5));
  // Traits interrompus, comme des coups de crayon.
  float cut = fract(sin(dot(floor(vec2(d1, (uv.x - uv.y) * 1.3)), vec2(12.9898, 78.233))) * 43758.5453);
  l1 *= step(0.28, cut) * (0.3 + shade);
  float d2 = (uv.x - uv.y) * uDensity;
  float l2 = (1.0 - smoothstep(w, w + 0.09, abs(fract(d2 - wob) - 0.5))) * smoothstep(0.45, 0.85, shade);
  // Joints des blocs, tracés finement.
  vec2 g = abs(fract(uv) - 0.5);
  float joint = smoothstep(0.455, 0.5, max(g.x, g.y));
  float ink = max(max(l1, l2 * 0.8) * uStrength, joint * uJoint);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * uTint, ink);
}
`;

const hatchMaterial = (ink: string, joint: number, density: number, strength: number) => {
  const [r, g, b] = hexToRgb(ink);
  const tint = new THREE.Vector3(0.45 + (r / 255) * 0.3, 0.42 + (g / 255) * 0.3, 0.42 + (b / 255) * 0.3);
  const material = new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.DoubleSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1});
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDensity = {value: density};
    shader.uniforms.uStrength = {value: strength};
    shader.uniforms.uJoint = {value: joint};
    shader.uniforms.uTint = {value: tint};
    shader.vertexShader = 'varying vec3 vHatchPos;\n' + shader.vertexShader.replace('#include <begin_vertex>', HATCH_VERTEX);
    shader.fragmentShader =
      'varying vec3 vHatchPos;\nuniform float uDensity;\nuniform float uStrength;\nuniform float uJoint;\nuniform vec3 uTint;\n' +
      shader.fragmentShader.replace('#include <color_fragment>', HATCH_FRAGMENT);
  };
  return material;
};

const edgeMaterial = (ink: string, width: number) =>
  new LineMaterial({color: new THREE.Color().setRGB(...(hexToRgb(ink).map((v) => v / 255) as [number, number, number]), THREE.LinearSRGBColorSpace), linewidth: width, resolution: new THREE.Vector2(WIDTH, HEIGHT), transparent: true});

export {edgesOf};

type ModelProps = {
  geometry: THREE.BufferGeometry;
  edges: LineSegmentsGeometry;
  ink: string;
  position?: [number, number, number];
  opacity?: number;
  /** Épaisseur du contour (px) et force des joints tracés tous les mètres. */
  edgeWidth?: number;
  joint?: number;
  /** Hachures : traits par mètre et intensité. */
  hatchDensity?: number;
  hatchStrength?: number;
};

export const DrawnVoxelModel: React.FC<ModelProps> = ({geometry, edges, ink, position, opacity = 1, edgeWidth = EDGE_PX, joint = 0.22, hatchDensity = 2.2, hatchStrength = 0.55}) => {
  const surface = useMemo(() => hatchMaterial(ink, joint, hatchDensity, hatchStrength), [ink, joint, hatchDensity, hatchStrength]);
  const line = useMemo(() => edgeMaterial(ink, edgeWidth), [ink, edgeWidth]);
  const lines = useMemo(() => new LineSegments2(edges, line), [edges, line]);
  surface.transparent = opacity < 1;
  surface.opacity = opacity;
  line.opacity = opacity;
  return (
    <group position={position}>
      <mesh geometry={geometry} material={surface} />
      <primitive object={lines} />
    </group>
  );
};

/** Contour encré autour des pièces opaques d'un modèle lisse (coque inversée, légèrement agrandie). */
export const InkOutline: React.FC<{ink: string; children: React.ReactNode}> = ({ink, children}) => {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const material = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color().setRGB(...(hexToRgb(ink).map((v) => v / 255) as [number, number, number]), THREE.LinearSRGBColorSpace), side: THREE.BackSide, toneMapped: false}), [ink]);
  useLayoutEffect(() => {
    const meshes: THREE.Mesh[] = [];
    ref.current?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || o.name === 'ink-outline' || o.parent?.name === 'ink-outline') return;
      const mat = m.material as THREE.Material;
      if (mat.transparent || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      if (m.children.some((c) => c.name === 'ink-outline')) return;
      meshes.push(m);
    });
    for (const m of meshes) {
      const hull = new THREE.Mesh(m.geometry, material);
      hull.name = 'ink-outline';
      hull.scale.setScalar(1.12);
      m.add(hull);
    }
    // Les coques sont ajoutées après le montage : redessiner l'image pour les inclure.
    if (meshes.length) invalidate();
  });
  return <group ref={ref}>{children}</group>;
};
