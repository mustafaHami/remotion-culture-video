// Grand titre de l'accroche, centré sur le décor atténué : la première image sert de couverture.
// Le titre est complet dès l'image 0 ; chaque mot sautille légèrement quand la voix le prononce.
import React from 'react';
import type {Look} from '../design/looks';
import {SAFE} from '../design/format';
import type {TimedWord} from '../content/timeline';
import {splitWords} from './text';

type Props = {
  look: Look;
  title: string;
  /** Passage du titre à mettre en valeur (ex. « se ressemblent »). */
  highlight: string;
  words: TimedWord[];
  frame: number;
  /** Sortie de 0 (visible) à 1 (sorti). */
  exit: number;
};

const STYLES: Record<Look['id'], React.CSSProperties> = {
  A: {fontWeight: 900, fontSize: 104, lineHeight: 0.98, letterSpacing: '-0.02em'},
  B: {fontWeight: 800, fontSize: 100, lineHeight: 0.98, letterSpacing: '-0.01em'},
  D: {fontWeight: 400, fontSize: 108, lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: '0.005em'},
};

const highlightStyle = (look: Look): React.CSSProperties =>
  look.id === 'A' ? {color: look.accent, fontStyle: 'italic', fontWeight: 700} : {color: look.accent};

/** Voile de la couleur du fond posé sur le décor pendant l'accroche ; il se lève à la sortie du titre. */
export const HookVeil: React.FC<{look: Look; exit: number}> = ({look, exit}) =>
  exit >= 1 ? null : (
    <div style={{position: 'absolute', inset: 0, background: look.background, opacity: (look.id === 'B' ? 0.58 : 0.62) * (1 - exit)}} />
  );

/** Flou du décor pendant l'accroche, en pixels. */
export const hookBlur = (exit: number) => 6 * (1 - exit);

export const HookTitle: React.FC<Props> = ({look, title, highlight, words, frame, exit}) => {
  if (exit >= 1) return null;
  const tokens = splitWords(title);
  const start = title.indexOf(highlight);
  const end = start + highlight.length;
  let offset = 0;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        paddingTop: SAFE.top,
        paddingBottom: SAFE.bottom,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <h1
        style={{
          width: 880,
          margin: 0,
          textAlign: 'center',
          color: look.text,
          fontFamily: look.fonts.title,
          textWrap: 'balance',
          opacity: 1 - exit,
          transform: `translateY(${-exit * 60}px) scale(${1 - exit * 0.08})`,
          ...STYLES[look.id],
        }}
      >
        {tokens.map((token, i) => {
          const from = offset;
          offset += token.length + 1;
          const w = words[i];
          const t = w && frame >= w.from && frame < w.to ? (frame - w.from) / Math.max(1, w.to - w.from) : 0;
          // Partie surlignée du mot, s'il croise le passage mis en valeur.
          const a = Math.max(0, Math.min(token.length, start - from));
          const b = Math.max(0, Math.min(token.length, end - from));
          return (
            <React.Fragment key={i}>
              {i > 0 ? ' ' : null}
              <span style={{display: 'inline-block', transform: `translateY(${-Math.sin(t * Math.PI) * 10}px)`}}>
                {token.slice(0, a)}
                {b > a ? <span style={highlightStyle(look)}>{token.slice(a, b)}</span> : null}
                {token.slice(b)}
              </span>
            </React.Fragment>
          );
        })}
      </h1>
    </div>
  );
};
