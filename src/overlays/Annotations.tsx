// Annotations « mannequin technique » posées sur la 3D : cotes, angles, lignes de repère.
// Les points sont donnés en 3D et projetés avec la caméra de l'image courante,
// si bien que les traits restent collés au décor pendant les mouvements.
import React from 'react';
import type {Look} from '../design/looks';
import {projectPoint, type Shot, type Vec3} from '../scenes/camera';

type Label = {x: number; y: number; text: string; hot?: boolean; big?: boolean; progress: number; anchor?: 'center' | 'left' | 'right'};

const LabelBox: React.FC<{look: Look; label: Label}> = ({look, label}) => {
  const a = look.annotation;
  const shift = label.anchor === 'left' ? '0%' : label.anchor === 'right' ? '-100%' : '-50%';
  const pop = label.progress < 1 ? 0.6 + 0.4 * label.progress + Math.sin(label.progress * Math.PI) * 0.12 : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: label.x,
        top: label.y,
        transform: `translate(${shift}, -50%) scale(${pop})`,
        opacity: Math.min(1, label.progress * 2),
        background: label.hot ? a.hotBg : a.bg,
        color: label.hot ? a.hotText : a.text,
        border: `${a.border}px solid ${label.hot ? a.hotBg : a.line}`,
        borderRadius: a.radius,
        padding: label.big ? '10px 20px' : '8px 16px',
        fontFamily: look.fonts.body,
        fontWeight: 800,
        fontSize: label.big ? 40 : 32,
        lineHeight: 1.05,
        whiteSpace: 'nowrap',
        textTransform: a.upper ? 'uppercase' : undefined,
      }}
    >
      {label.text}
    </div>
  );
};

export type AnnotationSpec =
  | {
      kind: 'cote';
      from: Vec3;
      to: Vec3;
      offset: number;
      label: string;
      progress: number;
      /** Compteur qui monte avec le trait (ex. 0 → 20 m) ; le libellé final s'affiche une fois le trait tracé. */
      count?: {to: number; suffix: string};
      /** Petits repères le long du trait (fractions de 0 à 1), qui apparaissent quand le trait les atteint. */
      marks?: number[];
    }
  | {kind: 'angle'; corner: Vec3; along: Vec3; level: Vec3; label: string; progress: number}
  | {kind: 'clue'; from: Vec3; to: Vec3; badgeAt: Vec3; badge: string; progress: number}
  /** Ligne qui se trace de `from` vers `to` ; `hot` la met en couleur d'accent ; étiquette facultative au départ. */
  | {kind: 'line'; from: Vec3; to: Vec3; progress: number; hot?: boolean; dashed?: boolean; label?: string}
  /** Trajet en plusieurs points (ex. lignes d'effort qui contournent une ouverture), tracé progressivement. */
  | {kind: 'path'; points: Vec3[]; progress: number; hot?: boolean; dashed?: boolean; label?: string}
  /** Pastilles posées sur le décor, chacune avec sa propre apparition (ex. numéros d'étage). */
  | {kind: 'tags'; tags: {at: Vec3; text: string; progress: number; hot?: boolean}[]};

type Props = {look: Look; shot: Shot; items: AnnotationSpec[]};

const point = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

export const Annotations: React.FC<Props> = ({look, shot, items}) => {
  const a = look.annotation;
  const lw = look.id === 'D' ? 5 : 4;
  const paths: React.ReactNode[] = [];
  const labels: Label[] = [];
  items.forEach((item, i) => {
    const P = (v: Vec3) => projectPoint(shot, v);
    if (item.kind === 'tags') {
      for (const tag of item.tags) {
        if (tag.progress <= 0) continue;
        const p = P(tag.at);
        labels.push({x: p[0], y: p[1], text: tag.text, hot: tag.hot, progress: tag.progress});
      }
      return;
    }
    if (item.progress <= 0) return;
    if (item.kind === 'line') {
      const p1 = P(item.from);
      const p2 = P(item.to);
      const end: [number, number] = [p1[0] + (p2[0] - p1[0]) * item.progress, p1[1] + (p2[1] - p1[1]) * item.progress];
      paths.push(
        <line
          key={i}
          x1={p1[0]}
          y1={p1[1]}
          x2={end[0]}
          y2={end[1]}
          stroke={item.hot ? a.hotBg : a.line}
          strokeWidth={item.hot ? lw * 1.5 : lw}
          strokeDasharray={item.dashed ? '16 12' : undefined}
          strokeLinecap="round"
        />,
      );
      // Étiquette posée au-dessus du trait, au tiers de sa longueur (reste dans l'image si le départ en sort).
      if (item.label) {
        const t = Math.min(item.progress, 0.35);
        labels.push({x: p1[0] + (p2[0] - p1[0]) * t, y: p1[1] + (p2[1] - p1[1]) * t - 34, text: item.label, hot: item.hot, progress: Math.min(1, item.progress * 3)});
      }
      return;
    }
    if (item.kind === 'path') {
      const pts = item.points.map(P);
      const lengths = pts.slice(1).map((q, k) => Math.hypot(q[0] - pts[k][0], q[1] - pts[k][1]));
      let left = lengths.reduce((s, l) => s + l, 0) * item.progress;
      const drawn: [number, number][] = [pts[0]];
      for (let k = 0; k < lengths.length && left > 0; k++) {
        const f = Math.min(1, left / Math.max(lengths[k], 0.001));
        drawn.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]);
        left -= lengths[k];
      }
      paths.push(
        <polyline
          key={i}
          points={drawn.map(point).join(' ')}
          fill="none"
          stroke={item.hot ? a.hotBg : a.line}
          strokeWidth={item.hot ? lw * 1.5 : lw}
          strokeDasharray={item.dashed ? '16 12' : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />,
      );
      if (item.label) labels.push({x: pts[0][0], y: pts[0][1] - 34, text: item.label, hot: item.hot, progress: Math.min(1, item.progress * 3)});
      return;
    }
    if (item.kind === 'cote') {
      // Ligne de cote parallèle à l'arête, décalée à l'écran, avec traits de rappel et barbules.
      const p1 = P(item.from);
      const p2 = P(item.to);
      const q1: [number, number] = [p1[0] + item.offset, p1[1]];
      const top = p1[1] + (p2[1] - p1[1]) * item.progress;
      const q2: [number, number] = [p1[0] + item.offset + (p2[0] - p1[0]) * item.progress, top];
      paths.push(
        <g key={i} stroke={a.line} strokeWidth={lw} strokeLinecap="round" fill="none">
          <line x1={p1[0] + 8} y1={p1[1]} x2={q1[0] + 14} y2={q1[1]} strokeWidth={lw * 0.6} />
          {item.progress > 0.95 ? <line x1={p2[0] + 8} y1={p2[1]} x2={q2[0] + 14} y2={q2[1]} strokeWidth={lw * 0.6} /> : null}
          <line x1={q1[0]} y1={q1[1]} x2={q2[0]} y2={q2[1]} />
          <line x1={q1[0] - 14} y1={q1[1] + 8} x2={q1[0] + 14} y2={q1[1] - 8} />
          {item.progress > 0.95 ? <line x1={q2[0] - 14} y1={q2[1] + 8} x2={q2[0] + 14} y2={q2[1] - 8} /> : null}
          {(item.marks ?? [])
            .filter((m) => m <= item.progress)
            .map((m, k) => {
              const mx = q1[0] + (p2[0] - p1[0]) * m;
              const my = p1[1] + (p2[1] - p1[1]) * m;
              return <line key={k} x1={mx - 9} y1={my} x2={mx + 9} y2={my} strokeWidth={lw * 0.7} />;
            })}
        </g>,
      );
      const text = item.count && item.progress < 1 ? `${Math.round(item.count.to * item.progress)}${item.count.suffix}` : item.label;
      labels.push({x: (q1[0] + q2[0]) / 2, y: (q1[1] + q2[1]) / 2, text, hot: true, big: true, progress: item.progress});
    } else if (item.kind === 'angle') {
      // Pente du toit : trait le long du comble, horizontale de référence et arc d'angle.
      const c = P(item.corner);
      const s = P(item.along);
      const h = P(item.level);
      const t = item.progress;
      const end: [number, number] = [c[0] + (s[0] - c[0]) * t, c[1] + (s[1] - c[1]) * t];
      const r = 70;
      const angleOf = (p: [number, number]) => Math.atan2(p[1] - c[1], p[0] - c[0]);
      const a0 = angleOf(h);
      const a1 = angleOf(s);
      const arc: [number, number][] = Array.from({length: 13}, (_, k) => {
        const ang = a0 + ((a1 - a0) * k * t) / 12;
        return [c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r];
      });
      paths.push(
        <g key={i} stroke={a.line} strokeWidth={lw} strokeLinecap="round" fill="none">
          <line x1={c[0]} y1={c[1]} x2={end[0]} y2={end[1]} strokeDasharray="14 10" />
          <line x1={c[0]} y1={c[1]} x2={c[0] + (h[0] - c[0]) * t} y2={c[1] + (h[1] - c[1]) * t} strokeWidth={lw * 0.6} />
          <polyline points={arc.map(point).join(' ')} />
        </g>,
      );
      const mid = (a0 + a1) / 2;
      labels.push({x: c[0] + Math.cos(mid) * (r + 70), y: c[1] + Math.sin(mid) * (r + 70), text: item.label, hot: true, big: true, progress: t});
    } else {
      // Indice de l'accroche : ligne pointillée sur les corniches alignées, pastille « ? ».
      const p1 = P(item.from);
      const p2 = P(item.to);
      const b = P(item.badgeAt);
      paths.push(
        <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={a.line} strokeWidth={lw} strokeDasharray="16 12" strokeLinecap="round" opacity={item.progress} />,
      );
      labels.push({x: b[0], y: b[1], text: item.badge, hot: true, big: true, progress: item.progress});
    }
  });
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}} aria-hidden="true">
        {paths}
      </svg>
      {labels.map((label, i) => (
        <LabelBox key={i} look={look} label={label} />
      ))}
    </>
  );
};
