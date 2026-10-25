// Rue en coupe : sous-sol, chaussée pavée, trottoirs, platane et lampadaire.
import React from 'react';
import {random} from 'remotion';
import {mix} from '../../design/color';
import type {Atmosphere} from './palette';
import {hatch, roughEllipse, roughLine, roughPoly, roughRect, segsPath, smoothClosed, type Pt} from './rough';
import {Ink, Shape} from './Shape';
import {BACK_X, FACADE_X, GROUND, OPPOSITE_X, SIDEWALK} from './world';

const LEFT = -700;
const RIGHT = 1800;
const BOTTOM = 2700;
const CURB = 12;
const PAVING = 26;
const CELLAR = 150;

const STONES = Array.from({length: 46}, (_, i) => {
  const x = LEFT + random(`stone-x${i}`) * (RIGHT - LEFT);
  const y = GROUND + PAVING + 40 + random(`stone-y${i}`) * (BOTTOM - GROUND - 120);
  const r = 10 + random(`stone-r${i}`) * 22;
  return {x, y, d: roughEllipse(x, y, r * 1.5, r, `stone${i}`, 0.12)};
}).filter((s) => !(s.x > FACADE_X - 10 && s.x < BACK_X + 10 && s.y < GROUND + CELLAR + 30));

const GEO = {
  soil: roughRect(LEFT, GROUND + PAVING, RIGHT - LEFT, BOTTOM - GROUND, 'soil', 2),
  soilTex: segsPath(hatch({x: LEFT, y: GROUND + PAVING, w: RIGHT - LEFT, h: BOTTOM - GROUND}, 'soil-tex', {count: 900, length: 16, angle: 4, spread: 10})),
  road: roughRect(OPPOSITE_X + SIDEWALK, GROUND, FACADE_X - OPPOSITE_X - 2 * SIDEWALK, PAVING, 'road', 1),
  // Pavés : petites arches en rangées.
  cobbles: segsPath(
    Array.from({length: 26}, (_, i) => {
      const x = OPPOSITE_X + SIDEWALK + 6 + i * 13.5;
      return [x, GROUND + 9, x + 9, GROUND + 9] as [number, number, number, number];
    }).concat(
      Array.from({length: 25}, (_, i) => {
        const x = OPPOSITE_X + SIDEWALK + 12 + i * 13.5;
        return [x, GROUND + 19, x + 9, GROUND + 19] as [number, number, number, number];
      }),
    ),
  ),
  sidewalkLeft: roughRect(OPPOSITE_X - 20, GROUND - CURB, SIDEWALK + 20, PAVING + CURB, 'sw-left', 1),
  sidewalkRight: roughRect(FACADE_X - SIDEWALK, GROUND - CURB, SIDEWALK + 20, PAVING + CURB, 'sw-right', 1),
  cellar: roughRect(FACADE_X, GROUND + 5, BACK_X - FACADE_X, CELLAR, 'cellar', 1.2),
  cellarTex: segsPath(hatch({x: FACADE_X, y: GROUND, w: BACK_X - FACADE_X, h: CELLAR}, 'cellar-tex', {count: 60, length: 20, angle: 0, spread: 3})),
  cellarArch: roughPoly(
    Array.from({length: 13}, (_, i): Pt => {
      const a = Math.PI + (i / 12) * Math.PI;
      return [846 + Math.cos(a) * 120, GROUND + CELLAR + Math.sin(a) * 110];
    }),
    'arch',
    1,
    20,
    false,
  ),
  barrels: [760, 800, 940].map((x, i) => ({
    d: roughEllipse(x, GROUND + CELLAR - 22, 20, 20, `barrel${i}`, 0.05),
    hoops: roughLine(x - 20, GROUND + CELLAR - 22, x + 20, GROUND + CELLAR - 22, `hoop${i}`, 0.6),
  })),
  oppositeCellar: roughRect(-400, GROUND + 5, OPPOSITE_X + 400, CELLAR, 'opp-cellar', 1.2),
};

// Platane du trottoir de gauche : tronc et houppier en plusieurs masses.
const TREE_X = OPPOSITE_X + 54;
const blob = (cx: number, cy: number, r: number, seed: string): string => {
  const pts: Pt[] = Array.from({length: 14}, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const k = 1 + (random(`${seed}${i}`) * 2 - 1) * 0.1;
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * 0.86 * k];
  });
  return smoothClosed(pts);
};
const TREE = {
  trunk: roughPoly([[TREE_X - 9, GROUND - CURB], [TREE_X - 6, GROUND - 190], [TREE_X + 6, GROUND - 190], [TREE_X + 10, GROUND - CURB]], 'trunk', 0.8),
  branches: `${roughLine(TREE_X, GROUND - 150, TREE_X - 34, GROUND - 210, 'br1')}${roughLine(TREE_X, GROUND - 170, TREE_X + 30, GROUND - 226, 'br2')}`,
  back: blob(TREE_X + 6, GROUND - 268, 92, 'tree-back'),
  front: [blob(TREE_X - 40, GROUND - 236, 52, 'tree-a'), blob(TREE_X + 44, GROUND - 246, 50, 'tree-b'), blob(TREE_X, GROUND - 300, 56, 'tree-c')],
  tex: segsPath(hatch({x: TREE_X - 110, y: GROUND - 380, w: 230, h: 200}, 'tree-tex', {count: 120, length: 12, angle: 60, spread: 30})),
};

// Lampadaire parisien sur le trottoir de droite.
const LAMP_X = FACADE_X - SIDEWALK + 4;
const LAMP = {
  pole: roughPoly([[LAMP_X - 4, GROUND - CURB], [LAMP_X - 3, GROUND - 236], [LAMP_X + 3, GROUND - 236], [LAMP_X + 4, GROUND - CURB]], 'pole', 0.5),
  base: roughPoly([[LAMP_X - 12, GROUND - CURB], [LAMP_X - 8, GROUND - 40], [LAMP_X + 8, GROUND - 40], [LAMP_X + 12, GROUND - CURB]], 'lampbase', 0.5),
  lantern: roughPoly([[LAMP_X - 14, GROUND - 262], [LAMP_X + 14, GROUND - 262], [LAMP_X + 9, GROUND - 236], [LAMP_X - 9, GROUND - 236]], 'lantern', 0.5),
  cap: roughPoly([[LAMP_X - 18, GROUND - 262], [LAMP_X, GROUND - 278], [LAMP_X + 18, GROUND - 262]], 'lampcap', 0.5),
};
export const LAMP_LIGHT: [number, number] = [LAMP_X, GROUND - 250];

// Couches du sous-sol (bandes ondulées) et racines du platane.
const STRATA = [GROUND + 300, GROUND + 520, GROUND + 760].map((y, k) => {
  const top: Pt[] = Array.from({length: 26}, (_, i): Pt => [LEFT + i * 100, y + Math.sin(i * 0.9 + k) * 14]);
  const bottom = top.map(([x, yy]): Pt => [x, yy + 70 + k * 10]).reverse();
  return roughPoly([...top, ...bottom], `strata${k}`, 3, 60);
});
const ROOTS = [-60, -25, 15, 50].map((dx, i) =>
  roughPoly([[TREE_X, GROUND + PAVING], [TREE_X + dx * 0.6, GROUND + 80], [TREE_X + dx * 1.4, GROUND + 130 + i * 12], [TREE_X + dx * 2, GROUND + 170 + i * 8]], `root${i}`, 3, 18, false),
).join('');

export const Underground: React.FC<{a: Atmosphere}> = ({a}) => {
  const {c} = a;
  return (
    <g>
      <Shape id="soil" d={GEO.soil} fill={c.soil} ink={c.ink} sw={4} tex={GEO.soilTex} texColor={c.soilDark} texOpacity={0.6} />
      {STRATA.map((d, i) => (
        <path key={i} d={d} fill={i % 2 ? mix(c.soil, c.curb, 0.18) : c.soilDark} opacity={0.55} />
      ))}
      <Ink d={ROOTS} color={mix(c.floor, c.soilDark, 0.3)} w={5} />
      {STONES.map((s, i) => (
        <Shape key={i} id={`stone${i}`} d={s.d} fill={mix(c.soil, c.curb, 0.45)} ink={c.ink} sw={2.5} />
      ))}
      <Shape id="cellar" d={GEO.cellar} fill={mix(c.interiorShade, c.soilDark, 0.35)} ink={c.ink} sw={3} tex={GEO.cellarTex} texColor={c.soilDark} texOpacity={0.5} />
      <Ink d={GEO.cellarArch} color={c.ink} w={3} opacity={0.7} />
      {GEO.barrels.map((b, i) => (
        <g key={i}>
          <Shape id={`barrel${i}`} d={b.d} fill={c.floor} ink={c.ink} sw={3} />
          <Ink d={b.hoops} color={c.ink} w={2} />
        </g>
      ))}
      <Shape id="opp-cellar" d={GEO.oppositeCellar} fill={mix(c.interiorShade, c.soilDark, 0.35)} ink={c.ink} sw={3} />
    </g>
  );
};

export const Pavement: React.FC<{a: Atmosphere}> = ({a}) => {
  const {c} = a;
  return (
    <g>
      <Shape id="road" d={GEO.road} fill={c.road} ink={c.ink} sw={3.5} />
      <Ink d={GEO.cobbles} color={c.roadHatch} w={3} />
      <Shape id="sw-left" d={GEO.sidewalkLeft} fill={c.curb} ink={c.ink} sw={3.5} />
      <Shape id="sw-right" d={GEO.sidewalkRight} fill={c.curb} ink={c.ink} sw={3.5} />
    </g>
  );
};

export const Tree: React.FC<{a: Atmosphere; frame: number}> = ({a, frame}) => {
  const {c} = a;
  const sway = Math.sin(frame / 34) * 1.6;
  return (
    <g>
      <Shape id="trunk" d={TREE.trunk} fill={c.floor} ink={c.ink} sw={3.5} />
      <Ink d={TREE.branches} color={c.ink} w={4} />
      <g transform={`rotate(${sway} ${TREE_X} ${GROUND - 160})`}>
        <Shape id="tree-back" d={TREE.back} fill={c.treesDark} ink={c.ink} sw={4} tex={TREE.tex} texColor={c.trees} texOpacity={0.7} />
        {TREE.front.map((d, i) => (
          <Shape key={i} id={`tree-front${i}`} d={d} fill={c.trees} ink={c.ink} sw={3.5} tex={TREE.tex} texColor={c.leafVein} texOpacity={0.35} />
        ))}
      </g>
    </g>
  );
};

export const Lamp: React.FC<{a: Atmosphere}> = ({a}) => {
  const {c} = a;
  const on = Math.min(1, a.lit * 1.4);
  const metal = mix('#2F3D3A', c.ink, 0.3);
  return (
    <g>
      {on > 0.02 ? <circle cx={LAMP_LIGHT[0]} cy={LAMP_LIGHT[1]} r={70} fill={c.light} opacity={0.35 * on} filter="url(#dessin-soft)" /> : null}
      <Shape id="pole" d={LAMP.pole} fill={metal} ink={c.ink} sw={2} />
      <Shape id="lampbase" d={LAMP.base} fill={metal} ink={c.ink} sw={2.5} />
      <Shape id="lantern" d={LAMP.lantern} fill={mix(c.glass, c.light, on)} ink={c.ink} sw={3} />
      <Shape id="lampcap" d={LAMP.cap} fill={metal} ink={c.ink} sw={3} />
      {on > 0.02 ? <circle cx={LAMP_LIGHT[0]} cy={LAMP_LIGHT[1]} r={9} fill="#FFF6D8" opacity={on} filter="url(#dessin-glow)" /> : null}
    </g>
  );
};
