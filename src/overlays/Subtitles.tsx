// Sous-titres mot à mot : la phrase en cours s'affiche par morceaux courts ; les mots déjà
// prononcés sont pleins, les suivants atténués, et le mot clé est surligné à l'instant où il est dit.
import React from 'react';
import {Easing, interpolate} from 'remotion';
import type {Look} from '../design/looks';
import type {TimedCue} from '../content/timeline';
import {chunkWords} from './chunks';
import {SAFE, WIDTH} from '../design/format';

type Props = {look: Look; cues: TimedCue[]; frame: number};

// Encadré clair pour toutes les directions (validé le 25 octobre 2026 : plus lisible) ;
// seules les couleurs, la police et le dessin du cadre suivent la direction.
type Box = {style: React.CSSProperties; text: string; dim: string; keyRadius: number};
const BOX: Record<Look['id'], Box> = {
  A: {
    style: {background: '#FFF7E8', border: '3px solid #3A2619', borderRadius: 18, boxShadow: '0 8px 0 #3A2619', padding: '22px 30px', fontSize: 54, fontWeight: 700, lineHeight: 1.18},
    text: '#3A2619',
    dim: 'rgba(58, 38, 25, 0.35)',
    keyRadius: 8,
  },
  B: {
    style: {background: '#FBEBD0', border: '3px solid #46305F', borderRadius: 26, boxShadow: '0 8px 0 #46305F', padding: '20px 30px', fontSize: 56, fontWeight: 900, lineHeight: 1.16},
    text: '#1C1430',
    dim: 'rgba(28, 20, 48, 0.35)',
    keyRadius: 12,
  },
  D: {
    style: {background: '#F6F2EA', border: '4px solid #15171C', boxShadow: '10px 10px 0 #15171C', padding: '20px 26px', fontSize: 56, fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.02em'},
    text: '#15171C',
    dim: 'rgba(21, 23, 28, 0.32)',
    keyRadius: 0,
  },
};

// Encadré centré sur l'écran, sans déborder dans la zone des boutons à droite (SAFE.right).
const TOP = 1376;
const MAX_WIDTH = WIDTH - 2 * SAFE.right;

export const Subtitles: React.FC<Props> = ({look, cues, frame}) => {
  const cue = cues.find((c) => frame >= c.from - 2 && frame < c.to + c.pauseAfterFrames);
  if (!cue) return null;
  const chunks = chunkWords(cue.words);
  const index = chunks.reduce((found, chunk, i) => (frame >= chunk[0].from - 2 ? i : found), 0);
  const chunk = chunks[index];
  const shown = interpolate(frame, [chunk[0].from - 2, chunk[0].from + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const box = BOX[look.id];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: TOP, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          maxWidth: MAX_WIDTH,
          boxSizing: 'border-box',
          textAlign: 'center',
          color: box.text,
          fontFamily: look.fonts.body,
          opacity: shown,
          transform: `translateY(${(1 - shown) * 18}px) scale(${0.97 + shown * 0.03})`,
          transformOrigin: 'center bottom',
          ...box.style,
        }}
      >
        <p style={{margin: 0, textWrap: 'balance'}}>
          {chunk.map((w, i) => {
            const spoken = frame >= w.from;
            const style: React.CSSProperties =
              w.keyword && spoken
                ? {background: look.keyBg, color: look.keyText, padding: '0 10px', borderRadius: box.keyRadius, boxDecorationBreak: 'clone'}
                : {color: spoken ? undefined : box.dim};
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
