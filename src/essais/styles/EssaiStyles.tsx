// Essai comparatif des directions de style : même scène, même voix, trois habillages.
// Les textes, la voix, le minutage et les annotations viennent de content/essais/styles-paris.json.
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import content from '../../../content/essais/styles-paris.json';
import {buildTimeline, cueById, type Cue} from '../../content/timeline';
import {HEIGHT, WIDTH} from '../../design/format';
import {useLookFonts} from '../../design/fonts';
import {LOOKS, type LookId} from '../../design/looks';
import {Owl, OwlLights} from '../../mascot/Owl';
import {Annotations, type AnnotationSpec} from '../../overlays/Annotations';
import {ChapterBanner} from '../../overlays/ChapterBanner';
import {HookTitle, HookVeil, hookBlur} from '../../overlays/HookTitle';
import {Subtitles} from '../../overlays/Subtitles';
import {CameraRig} from '../../scenes/CameraRig';
import {ParisStreet} from '../paris/ParisStreet';
import {NightSky} from '../../overlays/NightSky';
import {beatsOf, cameraAt, liftAt, overlaysAt, owlAt, owlPlacementAt} from './direction';
import {DrawnFilters, GrainOverlay} from '../../render/Filters';
import {InkOutline} from '../../render/DrawnVoxel';
import {DrawnFineStreet, FINE_ANCHORS, FINE_LAYOUT} from '../voxel-dessin/FineStreet';
import {withAlpha} from '../../design/color';

// Une demi-seconde de silence n'est pas souhaitable sur l'accroche : la voix part presque aussitôt.
const LEAD_FRAMES = 4;

export const essaiTimeline = () => buildTimeline(content.narration as Cue[], LEAD_FRAMES);

// Repères 3D des annotations (coordonnées Three.js) : corniches, angle avant de la coupe, comble.
const CORNICE_FRONT = 9.2;
const CUT_FACE = 29.05;
const ANCHORS = {
  clueFrom: [0, 19, CORNICE_FRONT],
  clueTo: [30, 19, CORNICE_FRONT],
  clueBadge: [15, 19, CORNICE_FRONT],
  coteFrom: [CUT_FACE, 0, 8.6],
  coteTo: [CUT_FACE, 19, 8.6],
  roofCorner: [CUT_FACE, 19, 8],
  roofSlope: [CUT_FACE, 23, 4],
  roofLevel: [CUT_FACE, 19, 2],
} as const satisfies Record<string, [number, number, number]>;


/** drawn : essai « voxels dessinés » (hachures, contours encrés, trait tremblé, grain). */
export const EssaiStyles: React.FC<{look: LookId; drawn?: boolean}> = ({look: id, drawn = false}) => {
  const look = LOOKS[id];
  useLookFonts(id);
  const frame = useCurrentFrame();
  const timeline = useMemo(essaiTimeline, []);
  const beats = useMemo(() => beatsOf(timeline), [timeline]);
  // L'essai crayonné utilise la rue fine (voxels de 25 cm), avec ses propres cadrages et repères.
  const layout = drawn ? FINE_LAYOUT : undefined;
  const anchors = drawn ? FINE_ANCHORS : ANCHORS;
  const shot = cameraAt(id, frame, beats, layout);
  const owl = owlAt(id, frame, beats, shot.yaw, drawn);
  const owlSpot = owlPlacementAt(frame, beats, layout);
  const show = overlaysAt(id, frame, beats);
  const question = cueById(timeline, 'question');
  const annotationLabel = (annotationId: string) => content.annotations.find((a) => a.id === annotationId)?.label ?? '';

  // Essai crayonné : l'immeuble d'en face pousse du sol quand la voix parle des rues, la largeur se mesure
  // de façade à façade, puis la hauteur monte étage par étage avec un compteur.
  const clampAll = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const opposite = interpolate(frame, [beats.rues - 16, beats.rues + 4], [0, 1], {...clampAll, easing: Easing.out(Easing.back(1.6))});
  const width =
    interpolate(frame, [beats.rues + 6, beats.rues + 24], [0, 1], {...clampAll, easing: Easing.inOut(Easing.cubic)}) *
    (1 - interpolate(frame, [beats.facades + 8, beats.facades + 18], [0, 1], clampAll));
  const coteGrow = interpolate(frame, [beats.cote - 18, beats.cote + 2], [0, 1], {...clampAll, easing: Easing.inOut(Easing.quad)});
  const cote = drawn ? coteGrow * (1 - interpolate(frame, [beats.roof, beats.roof + 10], [0, 1], clampAll)) : show.cote;
  const widthAnchors = drawn ? FINE_ANCHORS : null;

  const annotations: AnnotationSpec[] = [
    {kind: 'clue', from: [...anchors.clueFrom], to: [...anchors.clueTo], badgeAt: [...anchors.clueBadge], badge: '?', progress: show.hookClue},
    ...(widthAnchors
      ? [{kind: 'cote', from: [...widthAnchors.widthFrom], to: [...widthAnchors.widthTo], offset: 0, label: annotationLabel('largeur'), progress: width} as AnnotationSpec]
      : []),
    {
      kind: 'cote',
      from: [...anchors.coteFrom],
      to: [...anchors.coteTo],
      offset: 60,
      label: annotationLabel('hauteur'),
      progress: cote,
      ...(drawn ? {count: {to: 20, suffix: ' m'}, marks: [16, 26, 40, 52, 63].map((z) => z / 80)} : {}),
    },
    {kind: 'angle', corner: [...anchors.roofCorner], along: [...anchors.roofSlope], level: [...anchors.roofLevel], label: annotationLabel('pente'), progress: show.pente},
  ];

  return (
    <AbsoluteFill style={{background: look.background}}>
      {drawn ? <DrawnFilters frame={frame} /> : null}
      {id === 'B' ? <NightSky frame={frame} /> : null}
      <ThreeCanvas width={WIDTH} height={HEIGHT} linear flat gl={{antialias: true, preserveDrawingBuffer: true}} style={{position: 'absolute', filter: `${drawn ? 'url(#dessin-wobble) ' : ''}blur(${hookBlur(show.titleExit)}px)`}}>
        <CameraRig shot={shot} />
        {drawn ? <DrawnFineStreet look={look} lift={liftAt(id, frame, beats)} opposite={opposite} /> : <ParisStreet look={look} lift={liftAt(id, frame, beats)} />}
        <OwlLights look={look} />
        {owlSpot.appear > 0.01 ? (
          drawn ? (
            <InkOutline ink={look.text}>
              <Owl look={look} state={owl} position={owlSpot.position} height={owlSpot.height * owlSpot.appear} />
            </InkOutline>
          ) : (
            <Owl look={look} state={owl} position={owlSpot.position} height={owlSpot.height * owlSpot.appear} />
          )
        ) : null}
      </ThreeCanvas>
      <Annotations look={look} shot={shot} items={annotations} />
      {/* Accroche : décor visible mais atténué, question centrée ; la première image sert de couverture. */}
      <HookVeil look={look} exit={show.titleExit} />
      <HookTitle look={look} title={content.hook.title} highlight={content.hook.highlight} words={question.words} frame={frame} exit={show.titleExit} />
      <ChapterBanner
        look={look}
        label={content.chapter.label}
        rule={content.chapter.rule as [string, string]}
        level={1}
        levels={3}
        enter={show.chapter}
        ruleFirst={show.ruleStreet}
        ruleSecond={show.ruleFacade}
      />
      {/* La question est déjà à l'écran en grand titre : pas de sous-titre pour elle. */}
      <Subtitles look={look} cues={timeline.cues.filter((c) => c.id !== 'question')} frame={frame} />
      {drawn ? <GrainOverlay vignette={withAlpha(look.text, 0.18)} /> : null}
      {timeline.cues.map((cue) => (
        <Sequence key={cue.id} from={cue.from} durationInFrames={cue.audio.durationInFrames} layout="none">
          <Html5Audio src={staticFile(cue.audio.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
