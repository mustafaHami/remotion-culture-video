// Le hibou explorateur dessiné à la main, pour l'essai « dessiné » : mêmes réglages (rig) que le
// hibou 3D (src/mascot/rig.ts), mêmes couleurs que le style A, trait encré et plumage crayonné.
import React from 'react';
import {mix} from '../../design/color';
import {LOOKS} from '../../design/looks';
import type {OwlRig} from '../../mascot/rig';
import {hatch, roughEllipse, roughLine, roughPoly, segsPath, smoothClosed, type Pt} from './rough';
import {Ink, Shape} from './Shape';

/** Hauteur du dessin en unités locales (pattes en 0, pointe des aigrettes en haut). */
const SIZE = 215;
const NIGHT_TINT = '#3B3566';

const BODY: Pt[] = [
  [0, -4], [50, -12], [70, -52], [70, -104], [61, -150], [64, -186], [72, -214], [40, -194], [0, -199],
  [-40, -194], [-72, -214], [-64, -186], [-61, -150], [-70, -104], [-70, -52], [-50, -12],
];

const GEO = (() => {
  const body = smoothClosed(BODY, 0.7);
  const feathers = segsPath(hatch({x: -72, y: -210, w: 144, h: 205}, 'owl-feathers', {count: 140, length: 13, angle: 25, spread: 30}));
  const belly = roughEllipse(0, -58, 44, 46, 'owl-belly', 0.04);
  const chevrons = [[-16, -76], [12, -80], [-2, -56], [-22, -40], [18, -46], [0, -28]]
    .map(([x, y]) => roughPoly([[x - 7, y - 4], [x, y + 3], [x + 7, y - 4]], `chev${x}${y}`, 0.6, 10, false))
    .join('');
  const mask = roughEllipse(0, -150, 62, 38, 'owl-mask', 0.035);
  // Aile droite (à droite de l'écran), suspendue à l'épaule en (0, 0).
  const wing = smoothClosed([[0, -4], [16, 10], [20, 46], [10, 82], [0, 92], [-9, 62], [-9, 20]], 0.8);
  const wingTex = segsPath(hatch({x: -10, y: 0, w: 32, h: 92}, 'owl-wing', {count: 22, length: 12, angle: 75, spread: 12}));
  const foot = (x: number) => roughPoly([[x - 12, -2], [x - 8, -8], [x, -10], [x + 8, -8], [x + 12, -2], [x, 0]], `foot${x}`, 0.5);
  const bag = roughPoly([[-72, -54], [-30, -58], [-26, -18], [-70, -14]], 'owl-bag', 0.8);
  const flap = roughPoly([[-73, -54], [-29, -58], [-31, -38], [-71, -34]], 'owl-flap', 0.6);
  return {body, feathers, belly, chevrons, mask, wing, wingTex, feet: foot(-20) + foot(20), bag, flap};
})();

export type OwlDrawnState = {
  rig: OwlRig;
  /** Position des pattes dans le monde. */
  x: number;
  y: number;
  height: number;
  /** Saut vertical, en unités du monde. */
  hop: number;
  squash: number;
  /** Inclinaison du corps (degrés), en vol par exemple. */
  lean: number;
  /** Battement d'ailes ajouté au rig (radians), en vol. */
  flap: number;
  night: number;
};

const deg = (rad: number) => (rad * 180) / Math.PI;

export const OwlDrawn: React.FC<{s: OwlDrawnState; ink: string}> = ({s, ink}) => {
  const base = LOOKS.A.owl.colors;
  const col = (hex: string) => mix(hex, NIGHT_TINT, s.night * 0.45);
  const scale = s.height / SIZE;
  const {rig} = s;
  const faceX = rig.headYaw * 26;
  const faceTilt = deg(rig.headTilt);
  const eye = (side: -1 | 1) => {
    const cx = side * 26 + faceX;
    const cy = -151;
    const px = cx + rig.lookX * 7;
    const py = cy - rig.lookY * 6;
    const lid = Math.max(0, Math.min(1, rig.lids));
    const browY = cy - 30 - rig.brows * 7;
    const id = `owl-eye${side}`;
    return (
      <g key={side}>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={21} />
        </clipPath>
        <circle cx={cx} cy={cy} r={21} fill={col(base.eye)} />
        <circle cx={px} cy={py} r={11} fill={base.pupil} />
        <rect x={px + 2} y={py - 8} width={6} height={6} fill="#FFFFFF" />
        <circle cx={px - 5} cy={py + 5} r={1.8} fill="#FFFFFF" />
        {lid > 0.02 ? <rect x={cx - 24} y={cy - 24} width={48} height={lid * 46} fill={col(base.plumage)} clipPath={`url(#${id})`} /> : null}
        {lid > 0.02 ? <Ink d={`M${cx - 20} ${cy - 22 + lid * 44}L${cx + 20} ${cy - 22 + lid * 44}`} color={ink} w={3} /> : null}
        <circle cx={cx} cy={cy} r={21} fill="none" stroke={ink} strokeWidth={4} />
        <Ink d={roughLine(cx - side * 16, browY + 4 + rig.brows * 2, cx + side * 18, browY - 2 * rig.brows, `brow${side}`, 0.5)} color={ink} w={5} />
      </g>
    );
  };
  const wing = (side: -1 | 1, raise: number) => (
    <g transform={`translate(${side * 60} -112) scale(${side} 1) rotate(${-deg(raise)})`}>
      <Shape id={`owl-wing${side}`} d={GEO.wing} fill={col(base.plumageDark)} ink={ink} sw={4} tex={GEO.wingTex} texColor={col(base.plumage)} texOpacity={0.8} />
    </g>
  );
  const sx = 1 / Math.sqrt(s.squash);
  return (
    <g transform={`translate(${s.x} ${s.y - s.hop}) rotate(${s.lean}) scale(${scale * sx} ${scale * s.squash})`}>
      <ellipse cx={0} cy={2} rx={58} ry={8} fill={ink} opacity={0.25 * (1 - Math.min(1, s.hop / 60))} />
      <path d={GEO.feet} fill={col(base.beak)} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
      <Shape id="owl-body" d={GEO.body} fill={col(base.plumage)} ink={ink} sw={5} tex={GEO.feathers} texColor={col(base.plumageDark)} texOpacity={0.55} texWidth={2.5} />
      <Shape id="owl-belly" d={GEO.belly} fill={col(base.belly)} ink={ink} sw={3} />
      <Ink d={GEO.chevrons} color={col(base.plumageDark)} w={3} />
      {/* Bandoulière et sacoche. */}
      <path d="M44 -128L-44 -52" stroke={ink} strokeWidth={13} strokeLinecap="round" />
      <path d="M44 -128L-44 -52" stroke={col(base.strap)} strokeWidth={7} strokeLinecap="round" />
      <Shape id="owl-bag" d={GEO.bag} fill={col(base.bag)} ink={ink} sw={4} />
      <Shape id="owl-flap" d={GEO.flap} fill={mix(col(base.bag), ink, 0.15)} ink={ink} sw={3} />
      <circle cx={-50} cy={-38} r={4} fill={col(base.eye)} stroke={ink} strokeWidth={2} />
      {/* Petite loupe accrochée à la bandoulière. */}
      <circle cx={30} cy={-104} r={11} fill={col(base.lens)} stroke={ink} strokeWidth={4} />
      <Ink d="M38 -96L48 -84" color={ink} w={5} />
      <g transform={`rotate(${faceTilt} 0 -150)`}>
        <Shape id="owl-mask" d={GEO.mask} fill={col(base.mask)} ink={ink} sw={3} />
        {eye(-1)}
        {eye(1)}
        <Shape id="owl-beak" d={roughPoly([[faceX - 8, -138], [faceX + 8, -138], [faceX, -122]], 'owl-beak', 0.4)} fill={col(base.beak)} ink={ink} sw={3} />
      </g>
      {wing(1, rig.wingRight + s.flap)}
      {wing(-1, rig.wingLeft + s.flap)}
    </g>
  );
};
