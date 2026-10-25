// Ciel et lointains : dégradé, soleil, lune, étoiles, nuages, toits de Paris et tour Eiffel au loin.
// Le ciel est fixé à l'écran ; les lointains bougent moins que le décor (parallaxe).
import React from 'react';
import {random} from 'remotion';
import {mix} from '../../design/color';
import {HEIGHT, WIDTH} from '../../design/format';
import type {Atmosphere} from './palette';
import {hatch, parallelHatch, roughEllipse, roughPoly, segsPath, smoothClosed, type Pt} from './rough';
import {Shape} from './Shape';
import {GROUND} from './world';

const STARS = Array.from({length: 90}, (_, i) => ({
  x: random(`star-x${i}`) * WIDTH,
  y: random(`star-y${i}`) * 1150,
  r: 1 + random(`star-r${i}`) * 2.2,
  phase: random(`star-p${i}`) * Math.PI * 2,
  sparkle: i % 9 === 0,
}));

const sparklePath = (x: number, y: number, r: number) =>
  `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

// Nuage : boules qui se chevauchent sur une base plate (une seule silhouette, sans contour).
const cloudPath = (w: number, h: number, seed: string) => {
  const bumps = 4;
  let d = `M${h * 0.4} 0H${w - h * 0.4}A${h * 0.4} ${h * 0.4} 0 0 1 ${w - h * 0.4} ${-h * 0.8}H${h * 0.4}A${h * 0.4} ${h * 0.4} 0 0 1 ${h * 0.4} 0Z`;
  for (let i = 0; i < bumps; i++) {
    const t = (i + 0.5) / bumps;
    const r = h * (0.45 + Math.sin(t * Math.PI) * 0.5 + random(`${seed}${i}`) * 0.2);
    const cx = w * (0.12 + t * 0.76);
    const cy = -h * 0.4 - r * 0.45;
    d += `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
  }
  return d;
};

const CLOUDS = [
  {x: 80, y: 250, w: 260, h: 70, speed: 0.22},
  {x: 640, y: 170, w: 300, h: 80, speed: 0.15},
  {x: 420, y: 470, w: 210, h: 56, speed: 0.3},
  {x: 860, y: 600, w: 240, h: 60, speed: 0.2},
  {x: -60, y: 720, w: 220, h: 50, speed: 0.26},
].map((cl, i) => ({...cl, d: cloudPath(cl.w, cl.h, `cloud${i}`)}));

// Soleil et lune à droite : le bandeau de chapitre occupe le haut à gauche.
const SUN_X = 860;
const MOON: [number, number] = [850, 330];
const MOON_CRATERS = [[-18, -12, 11], [16, 8, 8], [-6, 22, 6], [22, -18, 5]];

export const SkyLayer: React.FC<{a: Atmosphere; frame: number}> = ({a, frame}) => {
  const {c} = a;
  const sunY = 1080 - a.sun * 720;
  const sunColor = mix('#FF9F7A', '#FFC23D', Math.max(0, Math.min(1, a.sun)));
  return (
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.skyTop} />
          <stop offset="0.38" stopColor={c.skyMid} />
          <stop offset="0.66" stopColor={c.skyLow} />
          <stop offset="1" stopColor={c.skyLow} />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#sky)" />
      {a.stars > 0.01
        ? STARS.map((s, i) => {
            const tw = 0.55 + 0.45 * Math.sin(frame / 9 + s.phase);
            return s.sparkle ? (
              <path key={i} d={sparklePath(s.x, s.y, s.r * 4.5)} fill={c.sparkle} opacity={a.stars * tw} />
            ) : (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={c.sparkle} opacity={a.stars * tw * 0.85} />
            );
          })
        : null}
      {/* Rayons de soleil très doux, qui tournent lentement. */}
      {a.sun > 0.3 ? (
        <g opacity={Math.min(1, (a.sun - 0.3) / 0.4) * 0.14} filter="url(#dessin-soft)">
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = 100 + i * 26 + Math.sin(frame / 60 + i) * 3;
            const r1 = (angle * Math.PI) / 180;
            const r2 = ((angle + 9) * Math.PI) / 180;
            return <path key={i} d={`M${SUN_X} ${sunY}L${SUN_X + Math.cos(r1) * 1500} ${sunY + Math.sin(r1) * 1500}L${SUN_X + Math.cos(r2) * 1500} ${sunY + Math.sin(r2) * 1500}Z`} fill={c.sparkle} />;
          })}
        </g>
      ) : null}
      {a.sun > -0.3 ? (
        <g>
          <circle cx={SUN_X} cy={sunY} r={150} fill={sunColor} opacity={0.35} filter="url(#dessin-soft)" />
          <Shape id="sun" d={roughEllipse(SUN_X, sunY, 68, 68, 'sun', 0.03)} fill={sunColor} tex={segsPath(hatch({x: SUN_X - 70, y: sunY - 70, w: 140, h: 140}, 'sun-tex', {count: 50, length: 18, angle: -20, spread: 8}))} texColor="#FFE6A0" texOpacity={0.6} sw={0} />
        </g>
      ) : null}
      {a.moon > 0.01 ? (
        <g opacity={a.moon}>
          <circle cx={MOON[0]} cy={MOON[1]} r={110} fill="#F6EBC8" opacity={0.3} filter="url(#dessin-soft)" />
          <Shape id="moon" d={roughEllipse(MOON[0], MOON[1], 58, 58, 'moon', 0.025)} fill="#F3E9C6" ink={c.ink} sw={0} />
          {MOON_CRATERS.map(([x, y, r], i) => (
            <circle key={i} cx={MOON[0] + x} cy={MOON[1] + y} r={r} fill="#D9CDA6" />
          ))}
        </g>
      ) : null}
      {CLOUDS.map((cl, i) => {
        const x = ((cl.x + frame * cl.speed + 300) % (WIDTH + 600)) - 300;
        return (
          <g key={i} transform={`translate(${x} ${cl.y})`}>
            <path d={cl.d} fill={c.cloudShade} fillRule="nonzero" />
            <path d={cl.d} fill={c.cloud} fillRule="nonzero" transform={`translate(${cl.w * 0.03} ${-cl.h * 0.16}) scale(0.96)`} />
          </g>
        );
      })}
    </svg>
  );
};

// Toits lointains : silhouettes de combles et de cheminées, hachures verticales comme sur une gravure.
const skyline = (() => {
  const top: Pt[] = [];
  let x = -700;
  let i = 0;
  while (x < 1800) {
    const w = 70 + random(`roof-w${i}`) * 90;
    const h = 110 + random(`roof-h${i}`) * 120;
    const y = GROUND - h;
    top.push([x, y + 26], [x + 16, y]);
    if (random(`chim${i}`) > 0.4) {
      const cx = x + 22 + random(`chim-x${i}`) * (w - 50);
      top.push([cx, y], [cx, y - 22], [cx + 12, y - 22], [cx + 12, y]);
    }
    top.push([x + w - 16, y], [x + w, y + 26]);
    x += w;
    i++;
  }
  return [...top, [1800, GROUND + 900], [-700, GROUND + 900]] as Pt[];
})();

const EIFFEL_X = 330;
const EIFFEL_BASE = GROUND - 60;
const eiffel = (): string => {
  const p = (x: number, y: number): Pt => [EIFFEL_X + x, EIFFEL_BASE + y];
  return roughPoly(
    [p(-80, 0), p(-52, -90), p(-32, -170), p(-15, -290), p(-6, -380), p(-2, -420), p(2, -420), p(6, -380), p(15, -290), p(32, -170), p(52, -90), p(80, 0), p(42, 0), p(22, -48), p(0, -60), p(-22, -48), p(-42, 0)],
    'eiffel',
    1,
    24,
  );
};
const EIFFEL = {
  d: eiffel(),
  decks: segsPath([
    [EIFFEL_X - 62, EIFFEL_BASE - 92, EIFFEL_X + 62, EIFFEL_BASE - 92],
    [EIFFEL_X - 38, EIFFEL_BASE - 172, EIFFEL_X + 38, EIFFEL_BASE - 172],
    [EIFFEL_X - 18, EIFFEL_BASE - 300, EIFFEL_X + 18, EIFFEL_BASE - 300],
  ]),
  lattice: segsPath(parallelHatch({x: EIFFEL_X - 80, y: EIFFEL_BASE - 300, w: 160, h: 250}, 'lattice', 9, 60, 26)),
};

const SKYLINE = {
  d: roughPoly(skyline, 'skyline', 1.2, 40),
  tex: segsPath(parallelHatch({x: -700, y: GROUND - 240, w: 2500, h: 200}, 'skyline-tex', 7, 95, 60)),
};

const SMALL_TREES = Array.from({length: 38}, (_, i) => {
  const x = -600 + i * 62 + random(`st-x${i}`) * 30;
  const r = 15 + random(`st-r${i}`) * 12;
  return {x, r, d: roughEllipse(x, GROUND - 26 - r, r, r * 0.9, `st${i}`, 0.08)};
});

export const FarCity: React.FC<{a: Atmosphere}> = ({a}) => {
  const {c} = a;
  const tower = mix(c.haze, c.ink, 0.12);
  return (
    <g>
      <Shape id="eiffel" d={EIFFEL.d} fill={tower} tex={EIFFEL.lattice} texColor={c.hazeHatch} texOpacity={0.6} sw={0} />
      <path d={EIFFEL.decks} stroke={mix(tower, c.ink, 0.2)} strokeWidth={5} strokeLinecap="round" />
      <Shape id="skyline" d={SKYLINE.d} fill={c.haze} tex={SKYLINE.tex} texColor={c.hazeHatch} texOpacity={0.55} sw={0} />
    </g>
  );
};

export const NearTrees: React.FC<{a: Atmosphere}> = ({a}) => {
  const {c} = a;
  return (
    <g>
      <rect x={-800} y={GROUND - 30} width={2800} height={900} fill={mix(c.treesDark, c.haze, 0.35)} />
      {SMALL_TREES.map((t, i) => (
        <g key={i}>
          <rect x={t.x - 2} y={GROUND - 30} width={4} height={10} fill={c.ink} opacity={0.6} />
          <Shape id={`st${i}`} d={t.d} fill={mix(c.trees, c.haze, 0.25)} ink={mix(c.ink, c.haze, 0.4)} sw={2} />
        </g>
      ))}
    </g>
  );
};
