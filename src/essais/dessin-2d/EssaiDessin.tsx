// Essai « dessiné à la main » : même narration que l'essai de styles (content/essais/styles-paris.json),
// rendue en illustration 2D au trait tremblé, hachures, grain et lumière du crépuscule à la nuit.
// Tout est calculé depuis useCurrentFrame() : caméra, lumière, hibou, tremblement du trait, grain.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import content from '../../../content/essais/styles-paris.json';
import {cueById, wordFrame} from '../../content/timeline';
import {mix, withAlpha} from '../../design/color';
import {HEIGHT, WIDTH} from '../../design/format';
import {useLookFonts} from '../../design/fonts';
import {LOOKS} from '../../design/looks';
import {mixRig, POSES, type OwlPoseName, type OwlRig} from '../../mascot/rig';
import {HookTitle, HookVeil} from '../../overlays/HookTitle';
import {beatsOf} from '../styles/direction';
import {essaiTimeline} from '../styles/EssaiStyles';
import {Building} from './Building';
import {DrawnBanner, DrawnSubtitles, GlowLine, Label, type Vec} from './DrawnOverlays';
import {DrawnFilters, GrainOverlay} from '../../render/Filters';
import {Fireflies, Foreground} from './Foreground';
import {OwlDrawn, type OwlDrawnState} from './OwlDrawn';
import {atmosphereAt} from './palette';
import {FarCity, NearTrees, SkyLayer} from './Sky';
import {Lamp, Pavement, Tree, Underground} from './Street';
import {CORNICE_Y, FACADE_X, GROUND, OPPOSITE_X, OWL_ROOF, OWL_STREET} from './world';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = Easing.inOut(Easing.cubic);

type Cam = {x: number; y: number; zoom: number};

const HOOK: Cam = {x: 560, y: 930, zoom: 0.92};
const CUT_A: Cam = {x: 480, y: 940, zoom: 1.04};
const CUT_B: Cam = {x: 500, y: 910, zoom: 1.12};
const ROOF: Cam = {x: 780, y: 640, zoom: 1.6};

const mixCam = (a: Cam, b: Cam, t: number): Cam => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, zoom: a.zoom + (b.zoom - a.zoom) * t});

/** Transformation d'une couche du décor ; parallax = 1 pour le décor, moins pour les lointains. */
const layerTransform = (cam: Cam, parallax: number) => {
  const zoom = 1 + (cam.zoom - 1) * parallax;
  const cx = WIDTH / 2 + (cam.x - WIDTH / 2) * parallax;
  const cy = HEIGHT / 2 + (cam.y - HEIGHT / 2) * parallax;
  return `translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${zoom}) translate(${-cx} ${-cy})`;
};

const project = (cam: Cam, [x, y]: Vec): Vec => [WIDTH / 2 + (x - cam.x) * cam.zoom, HEIGHT / 2 + (y - cam.y) * cam.zoom];

const bounce = (frame: number, at: number, length: number, height: number) =>
  frame < at || frame >= at + length ? 0 : Math.sin(((frame - at) / length) * Math.PI) * height;

const landing = (frame: number, at: number) => (frame < at || frame >= at + 8 ? 1 : 1 - 0.1 * Math.sin(((frame - at) / 8) * Math.PI));

const rigAt = (frame: number, keys: [number, OwlPoseName][]): OwlRig => {
  let current = POSES[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    const [at, pose] = keys[i];
    if (frame < at) break;
    current = mixRig(current, POSES[pose], interpolate(frame, [at, at + 8], [0, 1], {...clamp, easing: smooth}));
  }
  return {...current};
};

const BLINKS = [44, 131, 214, 302, 388];

export const EssaiDessin: React.FC = () => {
  useLookFonts('A');
  const frame = useCurrentFrame();
  const timeline = useMemo(essaiTimeline, []);
  const b = useMemo(() => beatsOf(timeline), [timeline]);
  const streetWord = useMemo(() => wordFrame(timeline, 'regle', '20', 1), [timeline]);
  const question = cueById(timeline, 'question');
  const a = atmosphereAt(frame, b.dive, b.roof);
  const {c} = a;

  // Caméra : vue d'ensemble au crépuscule, plongée dans la rue, puis montée vers le comble.
  const toCut = interpolate(frame, [b.dive, b.dive + 40], [0, 1], {...clamp, easing: smooth});
  const toRoof = interpolate(frame, [b.roof, b.roof + 34], [0, 1], {...clamp, easing: smooth});
  const cut = mixCam(CUT_A, CUT_B, interpolate(frame, [b.dive + 40, b.roof], [0, 1], clamp));
  let cam = mixCam(mixCam(HOOK, cut, toCut), ROOF, toRoof);
  cam = {...cam, x: cam.x + Math.sin(frame / 53) * 6, y: cam.y + Math.sin(frame / 41 + 1) * 5};

  // Hibou : sur la chaussée, puis envol jusqu'au terrasson.
  const takeOff = b.roof + 2;
  const land = b.roof + 26;
  const fly = interpolate(frame, [takeOff, land], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const control: Vec = [560, 330];
  const bez = (p0: number, p1: number, p2: number) => (1 - fly) ** 2 * p0 + 2 * (1 - fly) * fly * p1 + fly ** 2 * p2;
  const flying = frame >= takeOff && frame < land;
  const pointFrom = b.dive + 18;
  const waveFrom = b.end - 26;
  const rig = rigAt(frame, [
    [0, 'wonder'],
    [pointFrom, 'pointRight'],
    [land, 'pointLeft'],
    [waveFrom, 'wave'],
  ]);
  if (frame < pointFrom) rig.lookY = 0.7;
  if (frame >= waveFrom) rig.wingRight += Math.sin((frame - waveFrom) / 2.6) * 0.35;
  const blink = BLINKS.reduce((v, at) => Math.max(v, frame >= at && frame < at + 5 ? Math.sin(((frame - at) / 5) * Math.PI) : 0), 0);
  rig.lids = Math.max(rig.lids, blink);
  rig.headTilt += Math.sin(frame / 37 + 1) * 0.04;
  rig.headYaw += Math.sin(frame / 23) * 0.08;
  const owl: OwlDrawnState = {
    rig,
    x: flying ? bez(OWL_STREET[0], control[0], OWL_ROOF[0]) : frame < takeOff ? OWL_STREET[0] : OWL_ROOF[0],
    y: flying ? bez(OWL_STREET[1], control[1], OWL_ROOF[1]) : frame < takeOff ? OWL_STREET[1] : OWL_ROOF[1],
    height: interpolate(fly, [0, 1], [230, 150]),
    hop: bounce(frame, 6, 14, 26) + bounce(frame, b.cote - 4, 10, 14) + bounce(frame, b.pente - 4, 10, 10),
    squash: (1 + Math.sin(frame / 20) * 0.012) * landing(frame, 20) * landing(frame, pointFrom) * landing(frame, land) * landing(frame, waveFrom),
    lean: flying ? Math.sin(fly * Math.PI) * 14 : 0,
    flap: flying ? 1.3 + Math.sin(fly * Math.PI * 7) * 0.9 : 0,
    night: a.night,
  };

  // Habillage.
  const enter = (at: number, length: number) => interpolate(frame, [at, at + length], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const titleExit = interpolate(frame, [b.dive - 4, b.dive + 12], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const clue = 1 - interpolate(frame, [b.dive, b.dive + 10], [0, 1], clamp);
  const streetArrow = enter(b.rues, 14) * (1 - interpolate(frame, [b.facades + 10, b.facades + 22], [0, 1], clamp));
  const streetLabel = enter(streetWord, 10) * (1 - interpolate(frame, [b.facades + 10, b.facades + 22], [0, 1], clamp));
  const cote = enter(b.cote - 6, 16) * (1 - interpolate(frame, [b.roof, b.roof + 10], [0, 1], clamp));
  const coteGrow = enter(b.cote - 6, 16);
  const pente = enter(b.pente - 4, 14);
  const cream = mix(c.cream, '#FFFFFF', 0.3);

  // Repères des annotations, projetés du décor vers l'écran.
  const P = (x: number, y: number) => project(cam, [x, y]);
  const coteX = 604;
  const angleCorner: Vec = [FACADE_X, CORNICE_Y];
  const slopeEnd: Vec = [FACADE_X + 196, CORNICE_Y - 196];
  const arc = (r: number) => {
    const [cx, cy] = P(...angleCorner);
    const rr = r * cam.zoom;
    return `M${cx + rr} ${cy}A${rr} ${rr} 0 0 0 ${cx + rr * Math.SQRT1_2} ${cy - rr * Math.SQRT1_2}`;
  };

  const veilLook = {...LOOKS.A, background: mix(c.skyTop, c.ink, 0.45), text: '#FFF4E6', accent: '#FFC56B'};

  return (
    <AbsoluteFill style={{background: c.skyLow}}>
      <DrawnFilters frame={frame} />
      <SkyLayer a={a} frame={frame} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, filter: `url(#dessin-wobble) blur(${6 * (1 - titleExit)}px)`}}>
        <g transform={layerTransform(cam, 0.45)}>
          <FarCity a={a} />
        </g>
        <g transform={layerTransform(cam, 0.75)}>
          <NearTrees a={a} />
        </g>
        <g transform={layerTransform(cam, 1)}>
          <Underground a={a} />
          <g transform={`translate(${FACADE_X + OPPOSITE_X} 0) scale(-1 1)`}>
            <Building a={a} seed="en-face" furniture={false} />
          </g>
          <Building a={a} seed="immeuble" />
          <Pavement a={a} />
          <Tree a={a} frame={frame} />
          <Lamp a={a} />
          <OwlDrawn s={owl} ink={c.ink} />
        </g>
      </svg>
      <Fireflies a={a} frame={frame} />
      {/* Indice de l'accroche : les deux corniches sont exactement à la même hauteur. */}
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, filter: `url(#dessin-wobble) blur(${6 * (1 - titleExit)}px)`}}>
        <GlowLine a={P(OPPOSITE_X - 10, CORNICE_Y - 6)} b={P(FACADE_X + 10, CORNICE_Y - 6)} p={clue} color={cream} ink={c.ink} dash="14 12" />
      </svg>
      <Foreground a={a} frame={frame} />
      {/* Annotations « mannequin technique », au mot prononcé. */}
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0, filter: 'url(#dessin-wobble)'}}>
        <GlowLine a={P(OPPOSITE_X, GROUND + 44)} b={P(FACADE_X, GROUND + 44)} p={streetArrow} color={cream} ink={c.ink} heads={2} />
        <GlowLine a={P(coteX - 16, GROUND - 12)} b={P(FACADE_X - 22, GROUND - 12)} p={cote} color={cream} ink={c.ink} dash="8 8" />
        <GlowLine a={P(coteX - 16, CORNICE_Y)} b={P(FACADE_X - 22, CORNICE_Y)} p={cote} color={cream} ink={c.ink} dash="8 8" />
        <GlowLine a={P(coteX, GROUND - 12)} b={P(coteX, CORNICE_Y)} p={cote} color={cream} ink={c.ink} heads={1} ticks />
        <GlowLine a={P(...angleCorner)} b={P(FACADE_X + 200, CORNICE_Y)} p={pente} color={cream} ink={c.ink} dash="10 10" />
        <GlowLine a={P(...angleCorner)} b={P(...slopeEnd)} p={pente} color={cream} ink={c.ink} />
        {pente > 0.6 ? (
          <g opacity={(pente - 0.6) / 0.4}>
            <path d={arc(96)} fill="none" stroke={c.ink} strokeWidth={9.5} strokeLinecap="round" opacity={0.85} />
            <path d={arc(96)} fill="none" stroke={cream} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        ) : null}
      </svg>
      <Label c={c} at={P((OPPOSITE_X + FACADE_X) / 2, GROUND + 44)} text={content.chapter.rule[0]} p={streetLabel} />
      {/* Compteur qui monte avec la pointe de la cote, puis s'arrête sous la corniche. */}
      <Label c={c} at={P(coteX - 74, Math.min(GROUND - 60, GROUND - 12 - (GROUND - 12 - CORNICE_Y) * coteGrow + 50))} text={`${Math.round(20 * coteGrow)} m`} p={cote} />
      <Label c={c} at={P(FACADE_X + 168, CORNICE_Y - 64)} text={content.annotations.find((n) => n.id === 'pente')?.label ?? ''} p={pente} />
      {/* Accroche : décor atténué et flou, question centrée ; la première image sert de couverture. */}
      <HookVeil look={veilLook} exit={titleExit} />
      <div style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 22px rgba(255, 196, 150, 0.55)) drop-shadow(0 5px 0 rgba(20, 12, 20, 0.55))'}}>
        <HookTitle look={veilLook} title={content.hook.title} highlight={content.hook.highlight} words={question.words} frame={frame} exit={titleExit} />
      </div>
      <DrawnBanner c={c} label={content.chapter.label} rule={content.chapter.rule as [string, string]} enter={enter(b.dive + 8, 12)} street={enter(b.rues, 8)} facade={enter(b.facades, 8)} />
      <DrawnSubtitles c={c} cues={timeline.cues.filter((q) => q.id !== 'question')} frame={frame} />
      <GrainOverlay vignette={withAlpha(mix(c.skyTop, c.ink, 0.6), 0.5)} />
      {timeline.cues.map((cue) => (
        <Sequence key={cue.id} from={cue.from} durationInFrames={cue.audio.durationInFrames} layout="none">
          <Html5Audio src={staticFile(cue.audio.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
