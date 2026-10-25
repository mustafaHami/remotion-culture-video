// Forme dessinée : aplat de couleur, texture crayonnée découpée dans la forme, contour encré.
import React from 'react';

type Props = {
  id: string;
  d: string;
  fill: string;
  ink?: string;
  /** Épaisseur du contour ; 0 = sans contour. */
  sw?: number;
  /** Tracé des traits de texture (voir rough.ts), découpé par la forme. */
  tex?: string;
  texColor?: string;
  texOpacity?: number;
  texWidth?: number;
  opacity?: number;
};

export const Shape: React.FC<Props> = ({id, d, fill, ink, sw = 4, tex, texColor, texOpacity = 0.5, texWidth = 2, opacity}) => (
  <g opacity={opacity}>
    <path d={d} fill={fill} />
    {tex && texColor ? (
      <>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
        <path d={tex} clipPath={`url(#${id})`} fill="none" stroke={texColor} strokeWidth={texWidth} strokeLinecap="round" opacity={texOpacity} />
      </>
    ) : null}
    {sw > 0 && ink ? <path d={d} fill="none" stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /> : null}
  </g>
);

/** Trait encré seul (lignes, ferronneries, détails). */
export const Ink: React.FC<{d: string; color: string; w?: number; opacity?: number; dash?: string}> = ({d, color, w = 3, opacity, dash}) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} strokeDasharray={dash} />
);
