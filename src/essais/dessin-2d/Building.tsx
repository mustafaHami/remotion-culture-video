// Immeuble en coupe façon maison de poupée : un étage par niveau, façade à gauche, comble à 45°.
// La géométrie est calculée une fois (graines fixes) ; seules les couleurs et l'éclairage varient.
import React from 'react';
import {interpolate, random} from 'remotion';
import {mix} from '../../design/color';
import type {Atmosphere} from './palette';
import {hatch, parallelHatch, roughEllipse, roughLine, roughPoly, roughRect, segsPath} from './rough';
import {Ink, Shape} from './Shape';
import {BACK_X, CORNICE_Y, FACADE_X, GROUND, LEVELS, RIDGE_Y, SLOPE_END_X, TERRACE_END_X, WALL, roofYAt} from './world';

const IN_X = FACADE_X + WALL;
const IN_W = BACK_X - WALL - IN_X;
const ATTIC_Y = CORNICE_Y;

// Seuil d'allumage de chaque pièce : deux restent éteintes la nuit (seuil au-delà du maximum de lit).
const LIT_ORDER = [0.2, 0.93, 0.45, 0.3, 0.96, 0.6];

const geometry = (seed: string) => {
  const rooms = LEVELS.map((l) => ({
    level: l,
    d: roughRect(IN_X, l.top, IN_W, l.h, `${seed}-room${l.index}`, 1.2),
    tex: segsPath(hatch({x: IN_X, y: l.top, w: IN_W, h: l.h}, `${seed}-wall${l.index}`, {count: 70, length: 18, angle: 90, spread: 4})),
    threshold: LIT_ORDER[(l.index + seed.length) % LIT_ORDER.length],
  }));
  const attic = roughPoly(
    [[IN_X, ATTIC_Y], [SLOPE_END_X + 4, RIDGE_Y + 16], [TERRACE_END_X - 2, RIDGE_Y + 16], [BACK_X - WALL - 6, ATTIC_Y]],
    `${seed}-attic`,
    1.2,
  );
  const facade = roughRect(FACADE_X, CORNICE_Y, WALL, GROUND - CORNICE_Y, `${seed}-facade`, 1);
  const facadeTex = segsPath(
    LEVELS.flatMap((l) => [0.33, 0.66].map((t) => [FACADE_X, l.top + l.h * t, FACADE_X + WALL, l.top + l.h * t] as [number, number, number, number])),
  );
  const back = roughRect(BACK_X - WALL, CORNICE_Y, WALL, GROUND - CORNICE_Y, `${seed}-back`, 1);
  const slabs = [...LEVELS.map((l) => l.top), GROUND].map((y, i) => roughRect(FACADE_X - 2, y - 5, BACK_X - FACADE_X + 4, 10, `${seed}-slab${i}`, 0.8));
  // Fenêtres vues en coupe : ouverture vitrée dans l'épaisseur de la façade.
  const windows = LEVELS.map((l) => {
    const top = l.top + (l.index === 0 ? 12 : 16);
    const bottom = l.bottom - (l.index === 0 ? 8 : 14);
    return {level: l, d: roughRect(FACADE_X - 1, top, WALL + 2, bottom - top, `${seed}-win${l.index}`, 0.6), top, bottom};
  });
  const roofLine = roughPoly(
    [[FACADE_X - 16, CORNICE_Y + 4], [SLOPE_END_X, RIDGE_Y], [TERRACE_END_X, RIDGE_Y], [BACK_X + 10, CORNICE_Y + 4]],
    `${seed}-roof`,
    1.2,
    30,
    false,
  );
  const seams = parallelHatch({x: FACADE_X + 6, y: 0, w: BACK_X - FACADE_X - 12, h: 1}, `${seed}-seam`, 16, 90, 1).map(
    ([x]) => roughLine(x, roofYAt(x) - 7, x, roofYAt(x) + 7, `${seed}-sm${Math.round(x)}`, 0.5),
  );
  const cornice = roughPoly(
    [[FACADE_X - 20, CORNICE_Y - 4], [FACADE_X + WALL, CORNICE_Y - 4], [FACADE_X + WALL, CORNICE_Y + 12], [FACADE_X - 8, CORNICE_Y + 14], [FACADE_X - 20, CORNICE_Y + 6]],
    `${seed}-cornice`,
    0.8,
  );
  const balconies = [LEVELS[2], LEVELS[5]].map((l) => {
    const y = l.bottom - 2;
    const railing = segsPath(Array.from({length: 7}, (_, i) => [FACADE_X - 24 + i * 4, y - 30, FACADE_X - 24 + i * 4, y - 6] as [number, number, number, number]));
    return {
      slab: roughRect(FACADE_X - 26, y - 6, 26, 9, `${seed}-bal${l.index}`, 0.6),
      rail: roughPoly([[FACADE_X - 24, y - 6], [FACADE_X - 24, y - 32], [FACADE_X, y - 32]], `${seed}-rail${l.index}`, 0.8, 12, false),
      railing,
    };
  });
  // Store du café au rez-de-chaussée.
  const awningTop = LEVELS[0].top + 24;
  const awning = roughPoly([[FACADE_X, awningTop], [FACADE_X - 30, awningTop + 18], [FACADE_X - 30, awningTop + 30], [FACADE_X, awningTop + 14]], `${seed}-awning`, 0.8);
  const stripes = segsPath(Array.from({length: 2}, (_, i) => {
    const x = FACADE_X - 8 - i * 13;
    const y = awningTop + ((FACADE_X - x) * 18) / 30;
    return [x, y - 4, x, y + 20] as [number, number, number, number];
  }));
  // Cheminée sur la pente arrière.
  const chimX = 976;
  const chimney = roughRect(chimX, 444, 34, roofYAt(chimX + 34) - 444 + 6, `${seed}-chim`, 0.8);
  const chimTop = roughRect(chimX - 4, 438, 42, 10, `${seed}-chimtop`, 0.6);
  const pots = [roughRect(chimX + 4, 420, 9, 20, `${seed}-pot1`, 0.5), roughRect(chimX + 20, 424, 9, 16, `${seed}-pot2`, 0.5)];
  return {rooms, attic, facade, facadeTex, back, slabs, windows, roofLine, seams, cornice, balconies, awning, stripes, chimney, chimTop, pots};
};

const GEOMETRY = new Map<string, ReturnType<typeof geometry>>();
const geometryOf = (seed: string) => {
  if (!GEOMETRY.has(seed)) GEOMETRY.set(seed, geometry(seed));
  return GEOMETRY.get(seed)!;
};

const WARM = '#F7BC6A';

/** Mobilier des pièces, dessiné au trait (coordonnées de l'immeuble de droite). */
const Furniture: React.FC<{seed: string; ink: string; fill: string; accent: string; glow: number; light: string}> = ({seed, ink, fill, accent, glow, light}) => {
  const [l0, l1, l2, l3, l4, l5] = LEVELS;
  const f = (l: typeof l0) => l.bottom - 5;
  const s = (name: string) => `${seed}-${name}`;
  return (
    <g>
      {/* Rez-de-chaussée : café, comptoir et guéridon. */}
      <Shape id={s('counter')} d={roughRect(880, f(l0) - 48, 120, 48, s('counter'), 1)} fill={fill} ink={ink} sw={3} />
      <Ink d={roughLine(880, f(l0) - 40, 1000, f(l0) - 40, s('cl'))} color={ink} w={2} />
      <Shape id={s('cup')} d={roughRect(905, f(l0) - 60, 14, 12, s('cup'), 0.5)} fill={accent} ink={ink} sw={2} />
      <Shape id={s('table')} d={roughEllipse(760, f(l0) - 44, 30, 6, s('table'))} fill={accent} ink={ink} sw={3} />
      <Ink d={`${roughLine(760, f(l0) - 40, 760, f(l0) - 2, s('tl'))}${roughLine(745, f(l0) - 1, 775, f(l0) - 1, s('tf'))}`} color={ink} w={3} />
      <Ink d={roughPoly([[700, f(l0) - 60], [706, f(l0) - 30], [726, f(l0) - 30], [726, f(l0)]], s('chair'), 0.8, 14, false)} color={ink} w={3} />
      <Ink d={roughLine(800, l0.top + 5, 800, l0.top + 34, s('cord'))} color={ink} w={2} />
      <Shape id={s('bulb')} d={roughEllipse(800, l0.top + 40, 8, 8, s('bulb'))} fill={light} ink={ink} sw={2} />
      {/* 1er : bibliothèque et fauteuil. */}
      <Shape id={s('shelf')} d={roughRect(970, f(l1) - 62, 46, 62, s('shelf'), 0.8)} fill={fill} ink={ink} sw={3} />
      <Ink d={`${roughLine(970, f(l1) - 42, 1016, f(l1) - 42, s('sh1'))}${roughLine(970, f(l1) - 22, 1016, f(l1) - 22, s('sh2'))}`} color={ink} w={2} />
      <Ink d={segsPath([0, 1, 2, 3, 4].map((i) => [976 + i * 8, f(l1) - 58, 976 + i * 8, f(l1) - 45]))} color={accent} w={5} />
      <Shape id={s('arm')} d={roughPoly([[712, f(l1)], [712, f(l1) - 46], [732, f(l1) - 46], [736, f(l1) - 24], [782, f(l1) - 24], [784, f(l1)]], s('arm'), 0.8)} fill={accent} ink={ink} sw={3} />
      {/* 2e (étage noble) : lustre, table, tableau. */}
      <Ink d={roughLine(830, l2.top + 5, 830, l2.top + 18, s('ch'))} color={ink} w={2} />
      <Shape id={s('lustre')} d={roughPoly([[810, l2.top + 18], [850, l2.top + 18], [842, l2.top + 30], [818, l2.top + 30]], s('lustre'), 0.6)} fill={light} ink={ink} sw={2} />
      <Shape id={s('table2')} d={roughRect(780, f(l2) - 30, 110, 8, s('table2'), 0.6)} fill={fill} ink={ink} sw={3} />
      <Ink d={`${roughLine(790, f(l2) - 22, 790, f(l2), s('t2a'))}${roughLine(880, f(l2) - 22, 880, f(l2), s('t2b'))}`} color={ink} w={3} />
      <Shape id={s('frame')} d={roughRect(950, l2.top + 18, 44, 30, s('frame'), 0.6)} fill={accent} ink={ink} sw={3} />
      {/* 3e : lit et lampe de chevet. */}
      <Shape id={s('bed')} d={roughPoly([[880, f(l3)], [880, f(l3) - 40], [892, f(l3) - 40], [892, f(l3) - 24], [1020, f(l3) - 24], [1020, f(l3)]], s('bed'), 0.8)} fill={fill} ink={ink} sw={3} />
      <Shape id={s('pillow')} d={roughEllipse(910, f(l3) - 28, 14, 6, s('pillow'))} fill={'#FFF4E6'} ink={ink} sw={2} />
      <Shape id={s('blanket')} d={roughRect(930, f(l3) - 27, 88, 10, s('blanket'), 0.6)} fill={accent} ink={ink} sw={2} />
      <Ink d={roughLine(850, f(l3), 850, f(l3) - 36, s('lamp'))} color={ink} w={3} />
      <Shape id={s('shade')} d={roughPoly([[838, f(l3) - 36], [862, f(l3) - 36], [856, f(l3) - 52], [844, f(l3) - 52]], s('shade'), 0.5)} fill={light} ink={ink} sw={2} />
      {/* 4e : bureau et plante. */}
      <Shape id={s('desk')} d={roughRect(716, f(l4) - 32, 84, 8, s('desk'), 0.6)} fill={fill} ink={ink} sw={3} />
      <Ink d={`${roughLine(722, f(l4) - 24, 722, f(l4), s('d1'))}${roughLine(794, f(l4) - 24, 794, f(l4), s('d2'))}`} color={ink} w={3} />
      <Shape id={s('pot')} d={roughPoly([[980, f(l4)], [976, f(l4) - 20], [1004, f(l4) - 20], [1000, f(l4)]], s('pot'), 0.5)} fill={accent} ink={ink} sw={2} />
      <Shape id={s('plant')} d={roughEllipse(990, f(l4) - 38, 18, 20, s('plant'), 0.12)} fill={'#6DA35A'} ink={ink} sw={2} />
      {/* 5e : canapé et tableau. */}
      <Shape id={s('sofa')} d={roughPoly([[880, f(l5)], [880, f(l5) - 34], [894, f(l5) - 34], [894, f(l5) - 20], [976, f(l5) - 20], [976, f(l5) - 34], [990, f(l5) - 34], [990, f(l5)]], s('sofa'), 0.8)} fill={accent} ink={ink} sw={3} />
      <Shape id={s('frame5')} d={roughRect(760, l5.top + 18, 34, 26, s('frame5'), 0.5)} fill={fill} ink={ink} sw={2} />
      {/* Comble : petit lit sous la pente. */}
      <Shape id={s('atticbed')} d={roughRect(860, CORNICE_Y - 22, 70, 17, s('atticbed'), 0.6)} fill={accent} ink={ink} sw={3} />
      {glow > 0.01 ? (
        <g filter="url(#dessin-glow)" opacity={glow}>
          <circle cx={800} cy={l0.top + 40} r={9} fill={light} />
          <circle cx={830} cy={l2.top + 26} r={10} fill={light} />
          <circle cx={850} cy={f(l3) - 44} r={9} fill={light} />
        </g>
      ) : null}
    </g>
  );
};

type Props = {a: Atmosphere; seed: string; furniture?: boolean};

export const Building: React.FC<Props> = ({a, seed, furniture = true}) => {
  const g = geometryOf(seed);
  const {c} = a;
  const roomLit = (threshold: number) => interpolate(a.lit, [threshold, threshold + 0.18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const atticLit = roomLit(0.5);
  return (
    <g>
      {/* Pièces, de la cave au comble. */}
      {g.rooms.map((r) => {
        const lit = roomLit(r.threshold);
        return (
          <Shape
            key={r.level.index}
            id={`${seed}-roomc${r.level.index}`}
            d={r.d}
            fill={mix(c.interior, WARM, lit * 0.8)}
            tex={r.tex}
            texColor={mix(c.interiorShade, '#E89A4E', lit * 0.6)}
            texOpacity={0.5}
            sw={0}
          />
        );
      })}
      <Shape id={`${seed}-atticc`} d={g.attic} fill={mix(c.interior, WARM, atticLit * 0.8)} sw={0} />
      {furniture ? <Furniture seed={seed} ink={c.ink} fill={mix(c.floor, c.interior, 0.35)} accent={mix('#C4553A', c.interiorShade, 0.25 + a.night * 0.35)} glow={a.lit} light={mix(c.light, '#FFF2C8', 0.3)} /> : null}
      {/* Planchers. */}
      {g.slabs.map((d, i) => (
        <Shape key={i} id={`${seed}-slabc${i}`} d={d} fill={c.floor} ink={c.ink} sw={3} />
      ))}
      {/* Façade et mur arrière, avec les fenêtres vues dans l'épaisseur. */}
      <Shape id={`${seed}-facadec`} d={g.facade} fill={c.stone} ink={c.ink} sw={4} tex={g.facadeTex} texColor={c.stoneShade} texOpacity={0.9} />
      {g.windows.map((w) => {
        const lit = roomLit(g.rooms[w.level.index].threshold);
        return <Shape key={w.level.index} id={`${seed}-winc${w.level.index}`} d={w.d} fill={mix(c.glass, c.light, lit)} ink={c.ink} sw={2.5} />;
      })}
      <Shape id={`${seed}-backc`} d={g.back} fill={c.stoneShade} ink={c.ink} sw={4} />
      {/* Balcons filants des 2e et 5e étages. */}
      {g.balconies.map((b, i) => (
        <g key={i}>
          <Shape id={`${seed}-balc${i}`} d={b.slab} fill={c.stone} ink={c.ink} sw={3} />
          <Ink d={b.rail} color={c.ink} w={3} />
          <Ink d={b.railing} color={c.ink} w={2} />
        </g>
      ))}
      <Shape id={`${seed}-awningc`} d={g.awning} fill={mix('#C4553A', c.roof, a.night * 0.5)} ink={c.ink} sw={3} tex={g.stripes} texColor={c.cream} texOpacity={0.85} texWidth={6} />
      {/* Comble : cheminée, toit en zinc à 45°, lucarne. */}
      <Shape id={`${seed}-chimc`} d={g.chimney} fill={mix('#C9714F', c.stoneShade, 0.35)} ink={c.ink} sw={3.5} />
      <Shape id={`${seed}-chimtopc`} d={g.chimTop} fill={c.stone} ink={c.ink} sw={3} />
      {g.pots.map((d, i) => (
        <Shape key={i} id={`${seed}-potc${i}`} d={d} fill={mix('#C9714F', c.roof, 0.3)} ink={c.ink} sw={2.5} />
      ))}
      <path d={g.roofLine} fill="none" stroke={c.ink} strokeWidth={20} strokeLinejoin="round" strokeLinecap="round" />
      <path d={g.roofLine} fill="none" stroke={c.roof} strokeWidth={13} strokeLinejoin="round" strokeLinecap="round" />
      <Ink d={g.seams.join('')} color={c.roofHatch} w={2} />
      <Shape id={`${seed}-cornicec`} d={g.cornice} fill={c.stone} ink={c.ink} sw={3} />
    </g>
  );
};
