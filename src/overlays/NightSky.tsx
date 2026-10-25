// Ornement global du style B « Veillée » : lune et étoiles en pixels, qui scintillent doucement.
import React from 'react';

const STARS: [number, number, number, string][] = [
  [140, 260, 10, '#FBEBD0'],
  [380, 330, 8, '#9883C2'],
  [620, 250, 10, '#FFB547'],
  [250, 430, 8, '#FBEBD0'],
  [960, 470, 8, '#9883C2'],
  [520, 180, 6, '#FBEBD0'],
  [860, 400, 8, '#FBEBD0'],
  [120, 520, 6, '#9883C2'],
];

export const NightSky: React.FC<{frame: number}> = ({frame}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 780,
        top: 236,
        width: 132,
        height: 132,
        borderRadius: '50%',
        background: '#FBEBD0',
        boxShadow: '0 0 0 22px rgba(251, 235, 208, 0.08), 0 0 0 48px rgba(251, 235, 208, 0.04)',
      }}
    />
    {STARS.map(([x, y, size, color], i) => (
      <div
        key={i}
        style={{position: 'absolute', left: x, top: y, width: size, height: size, background: color, opacity: 0.55 + 0.45 * Math.sin(frame / 17 + i * 1.9) ** 2}}
      />
    ))}
  </>
);
