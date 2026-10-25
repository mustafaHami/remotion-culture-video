// Effets 2D génériques posés sur la scène 3D, positionnés par projection de points 3D (ils restent collés au décor) :
// obscurité percée autour d'un point, ondes qui partent d'un point et s'éteignent sur un autre, faisceau en éventail.
// Couleurs : habillage d'annotation et rôles du style uniquement.
import React from 'react';
import {HEIGHT, WIDTH} from '../design/format';
import {mix, withAlpha} from '../design/color';
import type {Look, VoxelRole} from '../design/looks';

type P = [number, number];

/** Assombrit l'image (0 à 1), sauf dans un cercle autour de `hole` (projecteurs, lampe…) ; teinte : un rôle voxel du style. */
export const Darkness: React.FC<{look: Look; amount: number; hole: P; radius?: number; role?: VoxelRole}> = ({look, amount, hole, radius = 320, role = 'dark'}) =>
  amount <= 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle ${radius}px at ${hole[0]}px ${hole[1]}px, transparent 0%, transparent 35%, ${withAlpha(mix(look.voxel.m[role], look.text, 0.6), amount)} 100%)`,
      }}
    />
  );

/** Arcs qui partent de `from` et s'éteignent en arrivant sur `to`, où une ligne pointillée marque l'obstacle. */
export const Waves: React.FC<{look: Look; from: P; to: P; phase: number; count?: number; show: number}> = ({look, from, to, phase, count = 4, show}) => {
  if (show <= 0) return null;
  const a = look.annotation;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, opacity: show}}>
      {Array.from({length: count}, (_, k) => {
        const t = (phase + k / count) % 1;
        const x = from[0] + (to[0] - from[0]) * t;
        const y = from[1] + (to[1] - from[1]) * t;
        const r = 40 + t * 220;
        return <path key={k} d={`M${x - r} ${y - r * 0.25} Q${x} ${y + r * 0.3} ${x + r} ${y - r * 0.25}`} fill="none" stroke={a.hotBg} strokeWidth={6} strokeLinecap="round" opacity={(1 - t) * 0.9 + 0.1} />;
      })}
      <line x1={to[0] - 260} y1={to[1]} x2={to[0] + 260} y2={to[1]} stroke={a.hotBg} strokeWidth={8} strokeDasharray="4 14" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
};

/** Faisceau en éventail de `from` vers le segment `left`–`right`, avec une impulsion qui le parcourt. */
export const Beam: React.FC<{look: Look; from: P; left: P; right: P; phase: number; show: number}> = ({look, from, left, right, phase, show}) => {
  if (show <= 0) return null;
  const a = look.annotation;
  const at = (p: P, t: number) => `${from[0] + (p[0] - from[0]) * t} ${from[1] + (p[1] - from[1]) * t}`;
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, opacity: show}}>
      <path d={`M${from[0]} ${from[1]} L${left[0]} ${left[1]} L${right[0]} ${right[1]} Z`} fill={withAlpha(a.hotBg, 0.18)} stroke={a.hotBg} strokeWidth={3} />
      <path d={`M${at(left, phase)} L${at(right, phase)}`} stroke={a.hotBg} strokeWidth={6} strokeLinecap="round" opacity={1 - phase * 0.6} />
    </svg>
  );
};
