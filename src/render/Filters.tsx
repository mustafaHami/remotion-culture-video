// Filtres SVG du rendu « dessiné » : trait qui tremble, halo lumineux et grain.
// Le tremblement et le grain changent de graine toutes les BOIL_FRAMES images, comme un dessin animé
// refait à la main (un grain renouvelé à chaque image coûte cher à l'encodage et se dégrade sur les
// plateformes). Tout dépend du numéro d'image : rendu déterministe.
import React from 'react';
import {HEIGHT, WIDTH} from '../design/format';

const BOIL_FRAMES = 4;

export const DrawnFilters: React.FC<{frame: number}> = ({frame}) => {
  const boil = 1 + (Math.floor(frame / BOIL_FRAMES) % 7);
  return (
    <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
      <defs>
        {/* Trait vivant : léger déplacement des contours par un bruit à basse fréquence. */}
        <filter id="dessin-wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves={2} seed={boil} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Halo doux des lumières (fenêtres, lampadaire, lucioles, annotations). */}
        <filter id="dessin-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dessin-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        {/* Grain fin : bruit gris, renouvelé avec le tremblement (toutes les BOIL_FRAMES images). */}
        <filter id="dessin-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={Math.floor(frame / BOIL_FRAMES) % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {/* Texture de papier : taches lentes, fixes. */}
        <filter id="dessin-paper" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0045 0.009" numOctaves={3} seed={11} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
};

/** Grain, papier et vignette posés sur toute l'image. */
export const GrainOverlay: React.FC<{vignette: string}> = ({vignette}) => (
  <>
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.75}}>
      <rect width={WIDTH} height={HEIGHT} filter="url(#dessin-paper)" />
    </svg>
    <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.3}}>
      <rect width={WIDTH} height={HEIGHT} filter="url(#dessin-grain)" />
    </svg>
    <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, ${vignette} 100%)`}} />
  </>
);
