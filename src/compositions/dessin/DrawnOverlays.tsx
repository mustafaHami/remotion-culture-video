// Habillage de l'essai « dessiné » : bandeau, sous-titres et annotations au trait, avec un léger
// halo comme les lignes lumineuses de la référence. Mêmes règles que l'habillage global :
// sous-titres dans un encadré clair centré, mot clé surligné à l'instant où il est dit.
import React from 'react';
import {Easing, interpolate} from 'remotion';
import {SAFE, WIDTH} from '../../design/format';
import type {TimedCue} from '../../content/timeline';
import {chunkWords} from '../../overlays/chunks';
import type {Palette} from './palette';

export const FONTS = {title: "'Fraunces', serif", body: "'Atkinson Hyperlegible', sans-serif"};
const AMBER = '#FFC56B';
/** Bordure « tracée à la main » : rayons inégaux sur chaque coin. */
const HAND_RADIUS = '18px 255px 14px 225px / 225px 16px 255px 18px';

export type Vec = [number, number];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Arrow: React.FC<{color: string}> = ({color}) => (
  <svg width={32} height={24} viewBox="0 0 26 20" aria-hidden style={{flexShrink: 0}}>
    <path d="M2 10 C8 9 15 11 22 10 M15 3 L22 10 L15 17" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DrawnBanner: React.FC<{c: Palette; label: string; rule: [string, string]; enter: number; street: number; facade: number}> = ({c, label, rule, enter, street, facade}) => {
  if (enter <= 0) return null;
  const chip: React.CSSProperties = {
    background: c.cream,
    color: c.ink,
    border: `3.5px solid ${c.ink}`,
    borderRadius: HAND_RADIUS,
    boxShadow: `4px 6px 0 rgba(20, 12, 20, 0.35)`,
  };
  return (
    <div style={{position: 'absolute', left: 72, top: 226, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 16}}>
      <div style={{...chip, fontFamily: FONTS.title, fontWeight: 700, fontSize: 40, padding: '8px 26px 10px', opacity: enter, transform: `translateX(${(1 - enter) * -30}px) rotate(-1.5deg)`}}>
        {label}
      </div>
      {street > 0 ? (
        <div style={{...chip, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONTS.body, fontWeight: 700, fontSize: 30, padding: '8px 20px', opacity: street, transform: `translateX(${(1 - street) * -16}px) rotate(0.8deg)`}}>
          <span>{rule[0]}</span>
          {facade > 0 ? (
            <span style={{display: 'flex', alignItems: 'center', gap: 10, opacity: facade}}>
              <Arrow color="#C4553A" />
              {rule[1]}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const TOP = 1376;

export const DrawnSubtitles: React.FC<{c: Palette; cues: TimedCue[]; frame: number}> = ({c, cues, frame}) => {
  const cue = cues.find((q) => frame >= q.from - 2 && frame < q.to + q.pauseAfterFrames);
  if (!cue) return null;
  const chunks = chunkWords(cue.words);
  const index = chunks.reduce((found, chunk, i) => (frame >= chunk[0].from - 2 ? i : found), 0);
  const chunk = chunks[index];
  const shown = interpolate(frame, [chunk[0].from - 2, chunk[0].from + 3], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: TOP, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: WIDTH - 2 * SAFE.right,
          boxSizing: 'border-box',
          textAlign: 'center',
          color: c.ink,
          background: c.cream,
          border: `4px solid ${c.ink}`,
          borderRadius: HAND_RADIUS,
          boxShadow: '5px 8px 0 rgba(20, 12, 20, 0.35)',
          padding: '20px 32px',
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 54,
          lineHeight: 1.18,
          opacity: Math.min(1, shown),
          transform: `translateY(${(1 - shown) * 18}px) rotate(${index % 2 ? 0.8 : -0.8}deg)`,
        }}
      >
        <p style={{margin: 0, textWrap: 'balance'}}>
          {chunk.map((w, i) => {
            const spoken = frame >= w.from;
            const marker = w.keyword && spoken ? interpolate(frame, [w.from, w.from + 5], [0, 100], clamp) : 0;
            const style: React.CSSProperties = w.keyword && spoken
              ? {
                  backgroundImage: `linear-gradient(100deg, transparent 0%, ${AMBER} 2%, ${AMBER} 98%, transparent 100%)`,
                  backgroundSize: `${marker}% 70%`,
                  backgroundPosition: '0 70%',
                  backgroundRepeat: 'no-repeat',
                  padding: '0 6px',
                }
              : {color: spoken ? undefined : 'rgba(43, 27, 30, 0.35)'};
            return (
              <React.Fragment key={i}>
                {i > 0 ? ' ' : null}
                <span style={style}>{w.text}</span>
              </React.Fragment>
            );
          })}
        </p>
      </div>
    </div>
  );
};

/** Étiquette d'annotation posée à l'écran (coordonnées écran), qui apparaît avec un petit rebond. */
export const Label: React.FC<{c: Palette; at: Vec; text: string; p: number; hot?: boolean}> = ({c, at, text, p, hot = true}) => {
  if (p <= 0) return null;
  const pop = interpolate(p, [0, 1], [0.6, 1], {easing: Easing.out(Easing.back(2.4))});
  return (
    <div
      style={{
        position: 'absolute',
        left: at[0],
        top: at[1],
        transform: `translate(-50%, -50%) scale(${pop}) rotate(-2deg)`,
        opacity: Math.min(1, p * 2),
        background: hot ? AMBER : c.cream,
        color: c.ink,
        border: `3.5px solid ${c.ink}`,
        borderRadius: HAND_RADIUS,
        boxShadow: '3px 5px 0 rgba(20, 12, 20, 0.4)',
        padding: '4px 18px 6px',
        fontFamily: FONTS.body,
        fontWeight: 700,
        fontSize: 40,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/** Trait lumineux qui se dessine de a vers b (progression 0 à 1). */
export const GlowLine: React.FC<{a: Vec; b: Vec; p: number; color: string; ink: string; dash?: string; heads?: 0 | 1 | 2; ticks?: boolean}> = ({a, b, p, color, ink, dash, heads = 0, ticks}) => {
  if (p <= 0) return null;
  const e: Vec = [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const u: Vec = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const n: Vec = [-u[1], u[0]];
  const head = (tip: Vec, dir: 1 | -1) =>
    `M${tip[0] - dir * u[0] * 18 + n[0] * 10} ${tip[1] - dir * u[1] * 18 + n[1] * 10}L${tip[0]} ${tip[1]}L${tip[0] - dir * u[0] * 18 - n[0] * 10} ${tip[1] - dir * u[1] * 18 - n[1] * 10}`;
  const tick = (pt: Vec) => `M${pt[0] - n[0] * 16} ${pt[1] - n[1] * 16}L${pt[0] + n[0] * 16} ${pt[1] + n[1] * 16}`;
  let d = `M${a[0]} ${a[1]}L${e[0]} ${e[1]}`;
  if (heads >= 1 && p >= 1) d += head(b, 1);
  if (heads === 2) d += head(a, -1);
  if (ticks) d += tick(a) + (p >= 1 ? tick(b) : '');
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} filter="url(#dessin-glow)" strokeDasharray={dash} />
      {/* Liseré encré sous le trait clair : lisible sur un ciel de jour comme de nuit. */}
      <path d={d} fill="none" stroke={ink} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={0.85} />
      <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
    </g>
  );
};
