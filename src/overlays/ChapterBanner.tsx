// Bandeau de chapitre en haut de l'écran (« Niveau 1 · 1859 »), et la règle résumée en pastille
// sur une seconde ligne. Trois habillages, repris des planches de chaque direction.
import React from 'react';
import type {Look} from '../design/looks';

type Props = {
  look: Look;
  label: string;
  /** Les deux moitiés de la règle, reliées par une flèche dessinée (le glyphe → manque dans certaines polices). */
  rule: [string, string];
  level: number;
  levels: number;
  enter: number;
  /** Apparition (0 à 1) de la première puis de la seconde moitié de la règle. */
  ruleFirst: number;
  ruleSecond: number;
};

const Arrow: React.FC<{color: string; size: number}> = ({color, size}) => (
  <svg width={size * 1.3} height={size} viewBox="0 0 26 20" aria-hidden="true" style={{flexShrink: 0}}>
    <path d="M2 10 H22 M15 3 L22 10 L15 17" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const appear = (p: number, dx = -24): React.CSSProperties => ({
  opacity: p,
  transform: `translateX(${(1 - p) * dx}px)`,
});

// Habillage propre à chaque direction : étiquette du chapitre, repères de progression, pastille de règle.
const SKIN: Record<Look['id'], {label: React.CSSProperties; step: (done: boolean) => React.CSSProperties; chip: React.CSSProperties; gap: number}> = {
  A: {
    label: {background: '#A9693D', color: '#FFF7E8', fontWeight: 700, fontSize: 30, letterSpacing: '0.08em', padding: '12px 24px', borderRadius: 8, boxShadow: '0 6px 0 #6A4127', textTransform: 'uppercase'},
    step: (done) => ({width: 22, height: 22, boxSizing: 'border-box', background: done ? '#C4553A' : 'transparent', border: done ? 'none' : '3px solid #A9693D'}),
    chip: {fontSize: 30, fontWeight: 700, padding: '10px 20px', border: '3px solid #3A2619', borderRadius: 10, background: '#FFF7E8', color: '#3A2619'},
    gap: 20,
  },
  B: {
    label: {display: 'flex', alignItems: 'center', gap: 14, background: '#46305F', color: '#FBEBD0', padding: '12px 26px 12px 20px', borderRadius: 999, fontWeight: 900, fontSize: 30, letterSpacing: '0.04em'},
    step: (done) => ({width: 18, height: 18, borderRadius: '50%', boxSizing: 'border-box', background: done ? '#FFB547' : 'transparent', border: done ? 'none' : '3px solid #9883C2'}),
    chip: {fontSize: 30, fontWeight: 800, padding: '10px 22px', border: '3px solid #FFB547', borderRadius: 999, background: '#1C1430', color: '#FBEBD0'},
    gap: 18,
  },
  D: {
    label: {background: '#15171C', color: '#F6F2EA', fontSize: 40, lineHeight: 1, padding: '12px 22px', textTransform: 'uppercase', letterSpacing: '0.02em', borderLeft: '22px solid #E8432D'},
    step: (done) => ({width: 22, height: 22, boxSizing: 'border-box', background: done ? '#15171C' : 'transparent', border: '4px solid #15171C'}),
    chip: {fontSize: 28, fontWeight: 900, padding: '10px 18px', border: '4px solid #15171C', background: '#F6F2EA', color: '#15171C', textTransform: 'uppercase', boxShadow: '6px 6px 0 #15171C'},
    gap: 18,
  },
};

export const ChapterBanner: React.FC<Props> = ({look, label, rule, level, levels, enter, ruleFirst, ruleSecond}) => {
  if (enter <= 0) return null;
  const skin = SKIN[look.id];
  return (
    <div style={{position: 'absolute', left: 72, top: 228, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18, fontFamily: look.fonts.body}}>
      <div style={{display: 'flex', alignItems: 'center', gap: skin.gap, ...appear(enter, look.id === 'D' ? -40 : -24)}}>
        <div style={{...skin.label, fontFamily: look.id === 'D' ? look.fonts.title : look.fonts.body}}>
          {look.id === 'B' ? <div style={{width: 16, height: 16, borderRadius: '50%', background: look.accent, boxShadow: '0 0 0 6px rgba(255, 181, 71, 0.25)'}} /> : null}
          {look.id === 'D' ? label.replace('·', '—') : label}
        </div>
        <div style={{display: 'flex', gap: 8}}>
          {Array.from({length: levels}, (_, i) => (
            <div key={i} style={skin.step(i < level)} />
          ))}
        </div>
      </div>
      {ruleFirst > 0 ? (
        <div style={{display: 'flex', alignItems: 'center', gap: 12, ...skin.chip, ...appear(ruleFirst, -16)}}>
          <span>{rule[0]}</span>
          {/* La seconde moitié n'occupe de place qu'à son apparition : la pastille s'allonge alors. */}
          {ruleSecond > 0 ? (
            <span style={{display: 'flex', alignItems: 'center', gap: 10, ...appear(ruleSecond, -12)}}>
              <Arrow color={look.accent} size={24} />
              {rule[1]}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
