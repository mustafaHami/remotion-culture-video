// Habillage chiffré générique, dans le dessin d'annotation du style : jauge verticale à deux compteurs,
// grand chiffre central, barre de bilan. Aucun contenu propre à un sujet : textes et valeurs viennent de l'épisode.
import React from 'react';
import {HEIGHT, WIDTH} from '../design/format';
import {mix, withAlpha} from '../design/color';
import type {Look} from '../design/looks';

/** Nombre entier avec espace des milliers (« 10 900 »). */
export const formatNumber = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const GAUGE = {x: 72, top: 360, bottom: 1240};

export type GaugeProps = {
  look: Look;
  show: number;
  value: number;
  max: number;
  scale: 'linear' | 'sqrt';
  unit: string;
  ticks: [number, string][];
  second?: {value: number; unit: string; hot: number};
  note?: {text: string; show: number};
};

/** Jauge verticale à gauche (zone sûre), curseur et compteurs qui suivent la valeur. */
export const Gauge: React.FC<GaugeProps> = ({look, show, value, max, scale, unit, ticks, second, note}) => {
  if (show <= 0) return null;
  const a = look.annotation;
  const f = (v: number) => (scale === 'sqrt' ? Math.sqrt(Math.max(0, v)) / Math.sqrt(max) : v / max);
  const yOf = (v: number) => GAUGE.top + Math.min(1, f(v)) * (GAUGE.bottom - GAUGE.top);
  const box: React.CSSProperties = {background: a.bg, color: a.text, border: `${a.border}px solid ${a.line}`, borderRadius: a.radius, padding: '6px 14px', fontFamily: look.fonts.body, fontWeight: 800, fontSize: 30, whiteSpace: 'nowrap'};
  const hot: React.CSSProperties = {background: a.hotBg, color: a.hotText, border: `${a.border}px solid ${a.hotBg}`};
  const y = yOf(value);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: show, transform: `translateX(${(1 - show) * -40}px)`}}>
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        <line x1={GAUGE.x} y1={GAUGE.top} x2={GAUGE.x} y2={GAUGE.bottom} stroke={a.line} strokeWidth={6} strokeLinecap="round" />
        <line x1={GAUGE.x} y1={GAUGE.top} x2={GAUGE.x} y2={y} stroke={a.hotBg} strokeWidth={6} strokeLinecap="round" />
        {ticks.map(([v]) => (
          <line key={v} x1={GAUGE.x - 12} y1={yOf(v)} x2={GAUGE.x + 12} y2={yOf(v)} stroke={a.line} strokeWidth={4} strokeLinecap="round" />
        ))}
        <circle cx={GAUGE.x} cy={y} r={13} fill={a.hotBg} stroke={a.line} strokeWidth={4} />
      </svg>
      {ticks.map(([v, text]) => (
        <div key={v} style={{position: 'absolute', left: GAUGE.x + 22, top: yOf(v), transform: 'translateY(-50%)', fontFamily: look.fonts.body, fontWeight: 700, fontSize: 24, color: a.text, background: withAlpha(a.bg, 0.75), padding: '0 6px', borderRadius: 6}}>
          {text}
        </div>
      ))}
      <div style={{position: 'absolute', left: GAUGE.x + 26, top: y, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start'}}>
        <div style={box}>
          {formatNumber(value)}
          {unit}
        </div>
        {second ? (
          <div style={{...box, ...(second.hot > 0.5 ? hot : {})}}>
            {formatNumber(second.value)}
            {second.unit}
          </div>
        ) : null}
        {note && note.show > 0 ? <div style={{...box, ...hot, opacity: note.show, fontSize: 26}}>{note.text}</div> : null}
      </div>
    </div>
  );
};

/** Grand chiffre central en haut de l'écran, sur fond d'accent. */
export const Badge: React.FC<{look: Look; text: string; show: number; top?: number}> = ({look, text, show, top = 300}) => {
  if (show <= 0) return null;
  const a = look.annotation;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: show, transform: `scale(${0.85 + 0.15 * show})`}}>
      <div style={{background: a.hotBg, color: a.hotText, borderRadius: a.radius, padding: '10px 26px', fontFamily: look.fonts.body, fontWeight: 900, fontSize: 56, textTransform: a.upper ? 'uppercase' : undefined}}>{text}</div>
    </div>
  );
};

/** Barre de bilan au-dessus des sous-titres : elle se remplit jusqu'à `value` (0 à 1), valeur en grand dessous. */
export const Bar: React.FC<{look: Look; text: string; value: number; show: number}> = ({look, text, value, show}) => {
  if (show <= 0) return null;
  const a = look.annotation;
  const share = value * Math.min(1, show * 1.2);
  return (
    <div style={{position: 'absolute', left: 140, right: 140, top: 1110, opacity: Math.min(1, show * 2), transform: `scale(${0.9 + 0.1 * show})`}}>
      <div style={{background: a.bg, border: `${a.border}px solid ${a.line}`, borderRadius: a.radius, padding: '14px 18px', fontFamily: look.fonts.body}}>
        <div style={{height: 34, background: mix(a.line, a.bg, 0.45), borderRadius: 8, overflow: 'hidden'}}>
          <div style={{width: `${share * 100}%`, height: '100%', background: a.hotBg}} />
        </div>
        <div style={{marginTop: 8, fontWeight: 900, fontSize: 40, color: a.text, textAlign: 'center'}}>{text}</div>
      </div>
    </div>
  );
};
