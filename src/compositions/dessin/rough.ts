// Tracés « dessinés à la main » : contours irréguliers et hachures, tous tirés de random(seed)
// de Remotion. Une même graine donne toujours le même dessin ; le tremblement animé du trait
// vient du filtre de Filters.tsx, pas d'ici.
import {random} from 'remotion';

export type Pt = [number, number];
export type Seg = [number, number, number, number];
export type Box = {x: number; y: number; w: number; h: number};

const jit = (seed: string, i: number, amp: number) => (random(`${seed}:${i}`) * 2 - 1) * amp;

const fmt = (v: number) => Math.round(v * 10) / 10;

const linePath = (pts: Pt[], closed: boolean) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${fmt(x)} ${fmt(y)}`).join('') + (closed ? 'Z' : '');

/** Polygone ou polyligne au trait irrégulier : chaque côté est découpé puis légèrement décalé. */
export const roughPoly = (pts: Pt[], seed: string, amp = 1.6, step = 34, closed = true): string => {
  const out: Pt[] = [];
  const sides = closed ? pts.length : pts.length - 1;
  let k = 0;
  for (let i = 0; i < sides; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    const parts = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let j = 0; j < parts; j++) {
      const t = j / parts;
      out.push([x1 + (x2 - x1) * t + jit(seed, k++, amp), y1 + (y2 - y1) * t + jit(seed, k++, amp)]);
    }
  }
  if (!closed) {
    const [x, y] = pts[pts.length - 1];
    out.push([x + jit(seed, k++, amp), y + jit(seed, k++, amp)]);
  }
  return linePath(out, closed);
};

export const roughRect = (x: number, y: number, w: number, h: number, seed: string, amp = 1.6) =>
  roughPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, amp);

/** Courbe fermée lissée (Catmull-Rom) passant par les points. */
export const smoothClosed = (pts: Pt[], tension = 1): string => {
  const n = pts.length;
  let d = `M${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return d + 'Z';
};

/** Ellipse au contour légèrement bosselé. */
export const roughEllipse = (cx: number, cy: number, rx: number, ry: number, seed: string, amp = 0.04, n = 18) => {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 1 + jit(seed, i, amp);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
  }
  return smoothClosed(pts);
};

/** Ligne simple au trait irrégulier. */
export const roughLine = (x1: number, y1: number, x2: number, y2: number, seed: string, amp = 1.2, step = 30) =>
  roughPoly([[x1, y1], [x2, y2]], seed, amp, step, false);

type HatchOptions = {
  /** Nombre de traits. */
  count: number;
  /** Longueur moyenne d'un trait. */
  length: number;
  /** Angle moyen en degrés (0 = horizontal). */
  angle?: number;
  /** Variation d'angle en degrés. */
  spread?: number;
};

/** Traits courts posés au hasard dans une boîte : texture crayonnée, à découper par un clipPath. */
export const hatch = (box: Box, seed: string, {count, length, angle = 0, spread = 6}: HatchOptions): Seg[] => {
  const segs: Seg[] = [];
  for (let i = 0; i < count; i++) {
    const x = box.x + random(`${seed}:x${i}`) * box.w;
    const y = box.y + random(`${seed}:y${i}`) * box.h;
    const l = length * (0.5 + random(`${seed}:l${i}`));
    const a = ((angle + jit(seed, i, spread)) * Math.PI) / 180;
    segs.push([x, y, x + Math.cos(a) * l, y + Math.sin(a) * l]);
  }
  return segs;
};

/** Hachures parallèles régulières (ombres, pentes), légèrement irrégulières. */
export const parallelHatch = (box: Box, seed: string, spacing: number, angle: number, length: number): Seg[] => {
  const segs: Seg[] = [];
  const a = (angle * Math.PI) / 180;
  const n = Math.ceil(box.w / spacing);
  for (let i = 0; i <= n; i++) {
    const x = box.x + i * spacing + jit(seed, i, spacing * 0.3);
    const y = box.y + random(`${seed}:p${i}`) * box.h;
    const l = length * (0.6 + random(`${seed}:q${i}`) * 0.8);
    segs.push([x, y, x + Math.cos(a) * l, y + Math.sin(a) * l]);
  }
  return segs;
};

export const segsPath = (segs: Seg[]) => segs.map(([a, b, c, d]) => `M${fmt(a)} ${fmt(b)}L${fmt(c)} ${fmt(d)}`).join('');
