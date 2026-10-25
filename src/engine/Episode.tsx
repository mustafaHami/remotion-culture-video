// Moteur d'épisode générique : une seule composition qui fabrique n'importe quelle vidéo à partir de son fichier
// content/episodes/<id>.json (narration, annotations, chapitres et mise en scène "staging") et d'un décor du registre.
// Ordre des calques : docs/rendu.md § 6. Format de la mise en scène : docs/moteur.md.
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {buildTimeline, cueById, type Cue, type Timeline} from '../content/timeline';
import {withAlpha} from '../design/color';
import {useLookFonts} from '../design/fonts';
import {HEIGHT, WIDTH} from '../design/format';
import {LOOKS, type Look, type LookId} from '../design/looks';
import {Owl, OwlLights} from '../mascot/Owl';
import {Annotations} from '../overlays/Annotations';
import {ChapterBanner} from '../overlays/ChapterBanner';
import {Beam, Darkness, Waves} from '../overlays/Effects';
import {HookTitle, HookVeil, hookBlur} from '../overlays/HookTitle';
import {Subtitles} from '../overlays/Subtitles';
import {Badge, Bar, formatNumber, Gauge} from '../overlays/Widgets';
import {CameraRig} from '../scenes/CameraRig';
import {projectPoint} from '../scenes/camera';
import {VoxelModel} from '../voxel/VoxelModel';
import {DECORS} from '../voxel/decor/scenes';
import {DrawnFilters, GrainOverlay} from '../compositions/dessin/Filters';
import {DrawnVoxelModel, InkOutline} from '../compositions/voxel-dessin/DrawnVoxel';
import {progress, windowAt} from './anim';
import {num, vec, type Ctx} from './expr';
import {annotationsAt, cameraAt, objectsAt, owlSpotAt, owlStateAt, type ObjectState} from './scene';
import {timeOf} from './time';
import type {Chapter, DecorScene, Part, Piece, Staging} from './types';
import {episodeById} from './episodes';

export type EpisodeContent = {
  id: string;
  look: LookId;
  finish?: 'crayonné';
  hook: {title: string; highlight: string};
  chapters: Chapter[];
  narration: Cue[];
  annotations: {id: string; label: string}[];
  staging: Staging;
};

/** Images de silence avant la première voix. */
export const LEAD_FRAMES = 4;
export const episodeTimeline = (episode: EpisodeContent) => buildTimeline(episode.narration, LEAD_FRAMES);

type PartProps = {look: Look; decor: DecorScene; part: Part; drawn: boolean; opacity?: number; reveal?: number};

const PieceModel: React.FC<{look: Look; decor: DecorScene; part: Part; piece: Piece; drawn: boolean; opacity: number}> = ({look, decor, part, piece, drawn, opacity}) =>
  drawn ? (
    <DrawnVoxelModel geometry={piece.geometry} edges={piece.edges} ink={look.text} opacity={opacity} {...decor.drawn} {...part.drawn} />
  ) : (
    <VoxelModel geometry={piece.geometry} opacity={opacity} />
  );

const PartModel: React.FC<PartProps> = ({look, decor, part, drawn, opacity = 1, reveal = 1}) => {
  if (part.piece) return <PieceModel look={look} decor={decor} part={part} piece={part.piece} drawn={drawn} opacity={opacity} />;
  const chunks = part.chunks ?? [];
  return (
    <>
      {chunks.map((c, i) => ((i + 1) / chunks.length <= reveal + 0.001 ? <PieceModel key={i} look={look} decor={decor} part={part} piece={c} drawn={drawn} opacity={opacity} /> : null))}
    </>
  );
};

const StagedObject: React.FC<{state: ObjectState} & Omit<PartProps, 'opacity' | 'reveal'>> = ({state, ...rest}) => {
  const [px, py, pz] = state.pivot;
  if (!state.visible || state.opacity <= 0.001 || state.scale.some((s) => Math.abs(s) < 0.01)) return null;
  return (
    <group position={[state.position[0] + px, state.position[1] + py, state.position[2] + pz]} rotation={state.rotation} scale={state.scale}>
      <group position={[-px, -py, -pz]}>
        <PartModel {...rest} opacity={state.opacity} reveal={state.reveal} />
      </group>
    </group>
  );
};

/** Composition d'un épisode, désigné par son identifiant (nom du fichier JSON). */
export const Episode: React.FC<{id: string}> = ({id}) => {
  const episode = episodeById(id);
  const look = LOOKS[episode.look];
  useLookFonts(episode.look);
  const frame = useCurrentFrame();
  const staging = episode.staging;
  const decor = DECORS[staging.decor];
  if (!decor) throw new Error(`Décor inconnu : ${staging.decor}`);
  const drawn = episode.finish === 'crayonné';
  const tl: Timeline = useMemo(() => episodeTimeline(episode), [episode]);
  const parts = useMemo(() => decor.build(look), [decor, look]);
  const label = (id: string) => {
    const found = episode.annotations.find((a) => a.id === id);
    if (!found) throw new Error(`Annotation inconnue : ${id}`);
    return found.label;
  };

  // État de la scène pour cette image : objets, hibou, caméra (chacun enrichit le contexte des expressions).
  const ctx: Ctx = {...decor.context};
  const objects = objectsAt(staging.objects ?? [], parts, frame, tl, ctx);
  const spot = owlSpotAt(staging.owl, frame, tl, ctx);
  ctx['owl.x'] = spot.position[0];
  ctx['owl.y'] = spot.position[1];
  ctx['owl.z'] = spot.position[2];
  const shot = cameraAt(staging.camera, frame, tl, ctx);
  ctx['cam.x'] = shot.target[0];
  ctx['cam.y'] = shot.target[1];
  ctx['cam.z'] = shot.target[2];
  ctx['cam.distance'] = shot.distance;
  const owl = owlStateAt(staging.owl, frame, tl, shot.yaw);
  const P = (v: Parameters<typeof vec>[0]) => projectPoint(shot, vec(v, ctx));

  const hookExit = staging.hookExit ?? tl.cues[1].from;
  const titleExit = progress(frame, timeOf(hookExit, tl) - 4, 16, 'in');
  const staged = new Set(objects.map((o) => o.part));

  const chapters = episode.chapters;
  const index = chapters.reduce((found, ch, i) => (frame >= cueById(tl, ch.cue).from ? i : found), -1);
  const chapter = index >= 0 ? chapters[index] : null;
  const hook = tl.cues[0];
  const show = (w: Parameters<typeof windowAt>[0]) => windowAt(w, frame, tl, {inFor: 12, ease: 'out'});

  const owlModel = <Owl look={look} state={owl} position={spot.position} height={spot.height * spot.appear} />;

  return (
    <AbsoluteFill style={{background: look.background}}>
      {drawn ? <DrawnFilters frame={frame} /> : null}
      <ThreeCanvas
        width={WIDTH}
        height={HEIGHT}
        linear
        flat
        gl={{antialias: true, preserveDrawingBuffer: true}}
        style={{position: 'absolute', filter: `${drawn ? 'url(#dessin-wobble) ' : ''}blur(${hookBlur(titleExit)}px)`}}
      >
        <CameraRig shot={shot} />
        {decor.Backdrop ? <decor.Backdrop look={look} /> : null}
        {Object.entries(parts).map(([name, part]) =>
          staged.has(name) || part.onlyIfStaged ? null : (
            <group key={name} position={part.position} rotation={part.rotation}>
              <PartModel look={look} decor={decor} part={part} drawn={drawn} />
            </group>
          ),
        )}
        {objects.map((o) => (
          <StagedObject key={o.id} state={o} look={look} decor={decor} part={parts[o.part]} drawn={drawn} />
        ))}
        <OwlLights look={look} />
        {spot.appear > 0.01 ? drawn ? <InkOutline ink={look.text}>{owlModel}</InkOutline> : owlModel : null}
      </ThreeCanvas>
      {(staging.effects ?? []).map((e, i) => {
        const s = show(e);
        if (e.kind === 'darkness') return s > 0 ? <Darkness key={i} look={look} amount={Math.max(0, num(e.amount, ctx)) * s} hole={P(e.hole)} radius={e.radius} role={e.role} /> : null;
        const phase = (((frame - (e.in === undefined ? 0 : timeOf(e.in, tl))) / (e.period ?? (e.kind === 'waves' ? 26 : 14))) % 1 + 1) % 1;
        if (e.kind === 'waves') return <Waves key={i} look={look} from={P(e.from)} to={P(e.to)} phase={phase} count={e.count} show={s} />;
        return <Beam key={i} look={look} from={P(e.from)} left={P(e.left)} right={P(e.right)} phase={phase} show={s} />;
      })}
      <Annotations look={look} shot={shot} items={annotationsAt(staging.annotations ?? [], frame, tl, ctx, label)} />
      {(staging.widgets ?? []).map((w, i) => {
        const s = show(w);
        if (w.kind === 'badge') {
          // Compteur : défile de `from` à `to` jusqu'au repère `until`, puis laisse place à l'étiquette.
          const until = w.count ? timeOf(w.count.until, tl) : 0;
          const counting = w.count && frame < until;
          const start = w.in === undefined ? 0 : timeOf(w.in, tl);
          const value = w.count ? w.count.from + (w.count.to - w.count.from) * progress(frame, start, until - start, 'quad') : 0;
          const text = counting && w.count ? `${formatNumber(value)}${w.count.suffix ?? ''}` : label(w.id);
          return <Badge key={i} look={look} text={text} show={s} top={w.top} />;
        }
        if (w.kind === 'bar') return <Bar key={i} look={look} text={label(w.id)} value={w.value} show={s} />;
        if (s <= 0) return null;
        const value = num(w.value, ctx);
        return (
          <Gauge
            key={i}
            look={look}
            show={s}
            value={value}
            max={num(w.max, ctx)}
            scale={w.scale ?? 'linear'}
            unit={w.unit}
            ticks={w.ticks.map(([v, t]) => [num(v, ctx), t])}
            second={w.second ? {value: num(w.second.value, {...ctx, v: value}), unit: w.second.unit, hot: w.second.hotAt === undefined ? 0 : progress(frame, timeOf(w.second.hotAt, tl), 6, 'out')} : undefined}
            note={w.note ? {text: label(w.note.id), show: windowAt(w.note, frame, tl, {inFor: 10, ease: 'out'})} : undefined}
          />
        );
      })}
      <HookVeil look={look} exit={titleExit} />
      <HookTitle look={look} title={episode.hook.title} highlight={episode.hook.highlight} words={hook.words} frame={frame} exit={titleExit} />
      {chapter ? (
        <ChapterBanner
          key={chapter.cue}
          look={look}
          label={chapter.label}
          rule={chapter.rule ?? ['', '']}
          level={index + 1}
          levels={chapters.length}
          enter={progress(frame, cueById(tl, chapter.cue).from + 8, 12, 'out')}
          ruleFirst={chapter.rule && chapter.ruleAt ? progress(frame, timeOf(chapter.ruleAt[0], tl), 8, 'out') : 0}
          ruleSecond={chapter.rule && chapter.ruleAt ? progress(frame, timeOf(chapter.ruleAt[1], tl), 8, 'out') : 0}
        />
      ) : null}
      <Subtitles look={look} cues={tl.cues.slice(1)} frame={frame} />
      {drawn ? <GrainOverlay vignette={withAlpha(look.text, 0.18)} /> : null}
      {tl.cues.map((cue) => (
        <Sequence key={cue.id} from={cue.from} durationInFrames={cue.audio.durationInFrames} layout="none">
          <Html5Audio src={staticFile(cue.audio.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
