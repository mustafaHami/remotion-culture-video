// Premier plan fixé à l'écran : grandes feuilles et fleurs dans les coins bas, branche en haut à
// droite, lucioles. Il encadre l'image comme dans une illustration, en restant hors des textes.
import React from 'react';
import {random} from 'remotion';
import {mix} from '../../design/color';
import {HEIGHT, WIDTH} from '../../design/format';
import type {Atmosphere} from './palette';
import {roughEllipse, roughLine, segsPath, smoothClosed, type Pt, type Seg} from './rough';
import {Ink, Shape} from './Shape';

const leafPath = (length: number, width: number): string => {
  const L = length;
  const W = width;
  const pts: Pt[] = [[0, 0], [W * 0.5, -L * 0.28], [W * 0.42, -L * 0.66], [0, -L], [-W * 0.42, -L * 0.66], [-W * 0.5, -L * 0.28]];
  return smoothClosed(pts, 0.75);
};

const veins = (length: number, width: number): string => {
  const segs: Seg[] = [[0, -length * 0.02, 0, -length * 0.92]];
  for (let i = 1; i <= 5; i++) {
    const y = -length * (0.14 + i * 0.13);
    const reach = width * 0.42 * Math.sin((i / 6) * Math.PI);
    segs.push([0, y + 10, reach, y - length * 0.08], [0, y + 10, -reach, y - length * 0.08]);
  }
  return segsPath(segs);
};

type Leaf = {x: number; y: number; length: number; width: number; angle: number; phase: number};

const CORNER_LEAVES: Leaf[] = [
  {x: 40, y: HEIGHT + 30, length: 430, width: 150, angle: 24, phase: 0},
  {x: -10, y: HEIGHT - 60, length: 330, width: 130, angle: 58, phase: 1.3},
  {x: 120, y: HEIGHT + 40, length: 250, width: 100, angle: -6, phase: 2.1},
  {x: WIDTH - 40, y: HEIGHT + 30, length: 400, width: 145, angle: -22, phase: 0.7},
  {x: WIDTH + 10, y: HEIGHT - 80, length: 320, width: 125, angle: -60, phase: 2.6},
];

const LEAF_GEO = CORNER_LEAVES.map((l) => ({d: leafPath(l.length, l.width), v: veins(l.length, l.width)}));

const fern = (x: number, y: number, length: number, angle: number, seed: string) => {
  const segs: Seg[] = [];
  const a = (angle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  for (let i = 2; i < 22; i++) {
    const t = i / 22;
    const px = x + dx * length * t;
    const py = y + dy * length * t;
    const leaflet = 46 * (1 - t) + 8;
    segs.push([px, py, px + dy * leaflet + dx * leaflet * 0.5, py - dx * leaflet + dy * leaflet * 0.5]);
    segs.push([px, py, px - dy * leaflet + dx * leaflet * 0.5, py + dx * leaflet + dy * leaflet * 0.5]);
  }
  return {stem: roughLine(x, y, x + dx * length, y + dy * length, seed, 1.5), leaflets: segsPath(segs)};
};

const FERNS = [fern(10, HEIGHT - 10, 330, 72, 'fern-l'), fern(WIDTH - 20, HEIGHT - 6, 300, -70, 'fern-r')];

const DAISIES = [
  {x: 220, y: 1858, r: 1}, {x: 300, y: 1890, r: 0.8}, {x: 760, y: 1872, r: 0.9}, {x: 850, y: 1900, r: 0.75}, {x: 190, y: 1790, r: 0.7},
];
const TULIPS = [{x: 262, y: 1900, h: 150}, {x: 812, y: 1910, h: 170}];

const daisy = (x: number, y: number, r: number, key: string, petal: string, heart: string, ink: string) => (
  <g key={key} transform={`translate(${x} ${y}) scale(${r})`}>
    {Array.from({length: 9}, (_, i) => (
      <ellipse key={i} cx={0} cy={-15} rx={6} ry={14} fill={petal} stroke={ink} strokeWidth={2} transform={`rotate(${i * 40})`} />
    ))}
    <circle r={8} fill={heart} stroke={ink} strokeWidth={2} />
  </g>
);

// Branche suspendue en haut à droite.
const BRANCH: Pt[] = [[1110, 26], [990, 50], [880, 70], [770, 92], [700, 116]];
const BRANCH_GEO = {
  d: smoothClosed([...BRANCH, ...BRANCH.slice().reverse().map(([x, y]): Pt => [x, y + 9])], 0.6),
  leaves: Array.from({length: 7}, (_, i) => {
    const t = 0.08 + i * 0.13;
    const k = Math.min(BRANCH.length - 2, Math.floor(t * (BRANCH.length - 1)));
    const f = t * (BRANCH.length - 1) - k;
    const [x1, y1] = BRANCH[k];
    const [x2, y2] = BRANCH[k + 1];
    return {x: x1 + (x2 - x1) * f, y: y1 + (y2 - y1) * f + 6, angle: 180 + (i % 2 ? 22 : -18), length: 74 + random(`bl${i}`) * 20, phase: i * 0.9};
  }),
};
const BRANCH_LEAF = {d: leafPath(80, 34), v: veins(80, 34)};

const FIREFLIES = Array.from({length: 26}, (_, i) => ({
  x: 60 + random(`ff-x${i}`) * 960,
  y: 500 + random(`ff-y${i}`) * 1200,
  phase: random(`ff-p${i}`) * Math.PI * 2,
  speed: 0.6 + random(`ff-s${i}`) * 0.8,
}));

export const Fireflies: React.FC<{a: Atmosphere; frame: number}> = ({a, frame}) => (
  <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
    <g filter="url(#dessin-glow)">
      {FIREFLIES.map((f, i) => {
        const x = f.x + Math.sin(frame / 47 * f.speed + f.phase) * 34;
        const y = f.y + Math.cos(frame / 39 * f.speed + f.phase) * 22 - ((frame * f.speed * 0.4) % 60);
        const blink = 0.5 + 0.5 * Math.sin(frame / 7 * f.speed + f.phase);
        const color = mix(a.c.sparkle, '#D8FF8A', a.night);
        return <circle key={i} cx={x} cy={y} r={2.2 + a.night * 1.6} fill={color} opacity={(0.35 + a.night * 0.6) * blink} />;
      })}
    </g>
  </svg>
);

export const Foreground: React.FC<{a: Atmosphere; frame: number}> = ({a, frame}) => {
  const {c} = a;
  const leafFill = (i: number) => (i % 2 ? mix(c.leaf, c.ink, 0.12) : c.leaf);
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      {FERNS.map((f, i) => (
        <g key={i}>
          <Ink d={f.stem} color={c.ink} w={4} />
          <Ink d={f.leaflets} color={mix(c.leaf, c.ink, 0.25)} w={4} />
        </g>
      ))}
      {TULIPS.map((t, i) => (
        <g key={i} transform={`rotate(${Math.sin(frame / 31 + i) * 2} ${t.x} ${t.y})`}>
          <Ink d={roughLine(t.x, t.y, t.x + 4, t.y - t.h, `tulip${i}`)} color={mix(c.leaf, c.ink, 0.2)} w={5} />
          <Shape id={`tulip${i}`} d={smoothClosed([[t.x - 16, t.y - t.h - 4], [t.x - 14, t.y - t.h - 34], [t.x - 4, t.y - t.h - 24], [t.x + 6, t.y - t.h - 38], [t.x + 18, t.y - t.h - 30], [t.x + 18, t.y - t.h - 2], [t.x + 2, t.y - t.h + 8]], 0.7)} fill={mix('#EE8FA8', c.ink, a.night * 0.25)} ink={c.ink} sw={3} />
        </g>
      ))}
      {CORNER_LEAVES.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle + Math.sin(frame / 43 + l.phase) * 1.4})`}>
          <Shape id={`corner-leaf${i}`} d={LEAF_GEO[i].d} fill={leafFill(i)} ink={c.ink} sw={4} />
          <Ink d={LEAF_GEO[i].v} color={c.leafVein} w={3} opacity={0.85} />
        </g>
      ))}
      {DAISIES.map((d, i) => daisy(d.x, d.y, d.r, `daisy${i}`, mix('#FFFFFF', c.skyMid, a.night * 0.3), '#F2B632', c.ink))}
      <Shape id="branch" d={BRANCH_GEO.d} fill={c.floor} ink={c.ink} sw={3} />
      {BRANCH_GEO.leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle + Math.sin(frame / 37 + l.phase) * 4}) scale(${l.length / 80})`}>
          <Shape id={`branch-leaf${i}`} d={BRANCH_LEAF.d} fill={leafFill(i)} ink={c.ink} sw={3} />
          <Ink d={BRANCH_LEAF.v} color={c.leafVein} w={2} opacity={0.85} />
        </g>
      ))}
      <Shape id="pebble" d={roughEllipse(560, 1904, 34, 14, 'pebble', 0.08)} fill={mix(c.curb, c.ink, 0.1)} ink={c.ink} sw={3} />
    </svg>
  );
};
