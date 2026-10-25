// Calcul, pour une image donnée, de l'état de la scène décrite par la mise en scène : objets, caméra, hibou,
// annotations. Fonctions pures du numéro d'image et du minutage de la voix.
import {random} from 'remotion';
import type {Timeline} from '../content/timeline';
import {mixRig, POSES, type OwlRig} from '../mascot/rig';
import type {OwlState} from '../mascot/Owl';
import type {AnnotationSpec} from '../overlays/Annotations';
import {mixShots, type Shot, type Vec3} from '../scenes/camera';
import {progress, scalarAt, vecAt, windowAt, type Window} from './anim';
import {num, vec, type Ctx} from './expr';
import {timeOf} from './time';
import type {AnnotationItem, CameraStep, ObjectSpec, OwlSpec, Part} from './types';

const AXIS = {x: 0, y: 1, z: 2} as const;

export type ObjectState = {
  id: string;
  part: string;
  visible: boolean;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  pivot: Vec3;
  opacity: number;
  reveal: number;
};

/** État des objets ; chaque objet ajoute `id.x`, `id.y`, `id.z` au contexte des expressions, pour les suivants. */
export const objectsAt = (specs: ObjectSpec[], parts: Record<string, Part>, frame: number, tl: Timeline, ctx: Ctx): ObjectState[] =>
  specs.map((s) => {
    const partName = s.part ?? s.id;
    const part = parts[partName];
    if (!part) throw new Error(`Objet « ${s.id} » : pièce « ${partName} » absente du décor`);
    let position: Vec3 = s.position ? vec(s.position, ctx) : part.position ?? [0, 0, 0];
    if (s.move) position = vecAt(s.move, frame, tl, ctx, position);
    if (s.path) {
      const pts = s.path.points.map(([a, b]) => [num(a, ctx), num(b, ctx)]);
      const n = pts.length - 1;
      const u = Math.max(0, Math.min(0.9999, scalarAt(s.path.progress, frame, tl, ctx))) * n;
      const i = Math.floor(u);
      const f = u - i;
      const a = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f;
      const b = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
      const axes = s.path.axes ?? 'xy';
      position = [...position] as Vec3;
      position[AXIS[axes[0] as 'x']] = a;
      position[AXIS[axes[1] as 'x']] = b;
    }
    position = [...position] as Vec3;
    for (const w of s.waves ?? []) position[AXIS[w.axis]] += w.amp * Math.sin(frame / w.period + (w.phase ?? 0));
    if (s.loop) position[AXIS[s.loop.axis]] += Math.sign(s.loop.speed) * ((frame * Math.abs(s.loop.speed)) % s.loop.length);
    let rotation: Vec3 = s.rotation ? vec(s.rotation, ctx) : part.rotation ?? [0, 0, 0];
    if (s.rotate) rotation = vecAt(s.rotate, frame, tl, ctx, rotation);
    rotation = [...rotation] as Vec3;
    if (s.spin) rotation[AXIS[s.spin.axis]] += frame / s.spin.period;
    const k = s.scale ? scalarAt(s.scale, frame, tl, ctx) : 1;
    const ky = s.scaleY ? scalarAt(s.scaleY, frame, tl, ctx) : 1;
    const visible = (s.from === undefined || frame >= timeOf(s.from, tl)) && (s.until === undefined || frame < timeOf(s.until, tl));
    ctx[`${s.id}.x`] = position[0];
    ctx[`${s.id}.y`] = position[1];
    ctx[`${s.id}.z`] = position[2];
    return {
      id: s.id,
      part: partName,
      visible,
      position,
      rotation,
      scale: [k, k * ky, k],
      pivot: s.pivot ? vec(s.pivot, ctx) : [0, 0, 0],
      opacity: s.opacity ? scalarAt(s.opacity, frame, tl, ctx) : 1,
      reveal: s.reveal ? scalarAt(s.reveal, frame, tl, ctx) : 1,
    };
  });

// ---------------------------------------------------------------- Caméra

const resolveShot = (step: CameraStep, frame: number, tl: Timeline, ctx: Ctx): Shot => {
  const s = step.shot;
  let shot: Shot = {
    target: vec(s.target, ctx),
    yaw: num(s.yaw, ctx),
    pitch: num(s.pitch, ctx),
    distance: num(s.distance, ctx),
    fov: s.fov === undefined ? 26 : num(s.fov, ctx),
    centerY: s.centerY === undefined ? 980 : num(s.centerY, ctx),
  };
  if (step.travel) {
    const t = progress(frame, timeOf(step.travel.from, tl), timeOf(step.travel.to, tl) - timeOf(step.travel.from, tl), 'linear');
    shot = {...shot, yaw: shot.yaw + (step.travel.yaw ?? 0) * t, pitch: shot.pitch + (step.travel.pitch ?? 0) * t, distance: shot.distance + (step.travel.distance ?? 0) * t};
  }
  if (step.sway) {
    const w = Math.sin(frame / step.sway.period);
    shot = {...shot, yaw: shot.yaw + (step.sway.yaw ?? 0) * w, pitch: shot.pitch + (step.sway.pitch ?? 0) * w};
  }
  if (step.drift) {
    const a = step.drift;
    shot = {
      ...shot,
      yaw: shot.yaw + Math.sin(frame / 38) * 1.6 * a,
      pitch: shot.pitch + Math.sin(frame / 51 + 1) * 0.9 * a,
      target: [shot.target[0], shot.target[1] + Math.sin(frame / 44) * 0.35 * a, shot.target[2]],
    };
  }
  if (step.punch) {
    const passed = step.punch.at.map((t) => timeOf(t, tl)).filter((t) => frame >= t);
    if (passed.length) shot = {...shot, fov: shot.fov * (1 - (1 - (step.punch.zoom ?? 0.88)) * progress(frame, Math.max(...passed), 5, 'out'))};
  }
  return shot;
};

/** Plans enchaînés : chaque étape se mélange au résultat des précédentes à partir de son repère. */
export const cameraAt = (steps: CameraStep[], frame: number, tl: Timeline, ctx: Ctx): Shot => {
  let shot = resolveShot(steps[0], frame, tl, ctx);
  for (let i = 1; i < steps.length; i++) {
    const step = steps[i];
    const t = progress(frame, timeOf(step.at, tl), step.duration ?? 30, step.ease ?? 'smooth');
    if (t > 0) shot = mixShots(shot, resolveShot(step, frame, tl, ctx), t);
  }
  return shot;
};

// ---------------------------------------------------------------- Hibou

/** Place, hauteur et apparition (0 à 1) : il disparaît en 5 images avant chaque changement de place, réapparaît en 8. */
export const owlSpotAt = (owl: OwlSpec, frame: number, tl: Timeline, ctx: Ctx) => {
  const times = owl.spots.map((s) => timeOf(s.at, tl));
  let i = 0;
  for (let k = 1; k < times.length; k++) if (frame >= times[k]) i = k;
  const appearIn = i === 0 ? 1 : progress(frame, times[i], 8, 'back:2.2');
  const next = times[i + 1];
  const appearOut = next === undefined ? 1 : 1 - progress(frame, next - 6, 5, 'backIn:2');
  const spot = owl.spots[i];
  return {position: vec(spot.position, ctx), height: num(spot.height, ctx), appear: appearIn * appearOut};
};

const bounce = (frame: number, at: number, length: number, height: number) =>
  frame < at || frame >= at + length ? 0 : Math.sin(((frame - at) / length) * Math.PI) * height;
const landing = (frame: number, at: number) => (frame < at || frame >= at + 8 ? 1 : 1 - 0.1 * Math.sin(((frame - at) / 8) * Math.PI));

/** Clignements réguliers mais irréguliers (graine fixe) : un toutes les 3 à 6 secondes. */
const blinkAt = (frame: number) => {
  let at = 40;
  for (let i = 0; at <= frame; i++) {
    if (frame < at + 5) return Math.sin(((frame - at) / 5) * Math.PI);
    at += 90 + Math.round(random(`blink-${i}`) * 90);
  }
  return 0;
};

export const owlStateAt = (owl: OwlSpec, frame: number, tl: Timeline, cameraYaw: number): OwlState => {
  let rig: OwlRig = POSES[owl.poses[0][1]];
  let turn = 0;
  let waveFrom: number | null = null;
  for (const [at, pose, side] of owl.poses) {
    const t0 = timeOf(at, tl);
    if (frame < t0) break;
    const t = progress(frame, t0, 8, 'smooth');
    rig = mixRig(rig, POSES[pose], t);
    turn += (side * 0.25 - turn) * t;
    waveFrom = pose === 'wave' ? t0 : null;
  }
  rig = {...rig};
  if (waveFrom !== null) rig.wingRight += Math.sin((frame - waveFrom) / 2.6) * 0.35;
  rig.lids = Math.max(rig.lids, blinkAt(frame));
  rig.headYaw += Math.sin(frame / 23) * 0.08;
  rig.headTilt += Math.sin(frame / 37 + 1) * 0.03;
  const hops = (owl.hops ?? []).map((h) => timeOf(h, tl));
  const hop = bounce(frame, 6, 14, 0.15) + hops.reduce((h, at) => h + bounce(frame, at - 4, 10, 0.08), 0);
  const squash = (1 + Math.sin(frame / 20) * 0.012) * hops.reduce((s, at) => s * landing(frame, at + 6), landing(frame, 20));
  return {rig, yaw: (cameraYaw * Math.PI) / 180 + turn, hop, squash};
};

// ---------------------------------------------------------------- Annotations

/** Plus visible des fenêtres `windows` (s'il y en a), multiplié par la fenêtre propre de l'annotation (in/out). */
const visibility = (item: Window & {windows?: Window[]}, frame: number, tl: Timeline) =>
  (item.windows ? Math.max(...item.windows.map((w) => windowAt(w, frame, tl))) : 1) * windowAt(item, frame, tl);

export const annotationsAt = (items: AnnotationItem[], frame: number, tl: Timeline, ctx: Ctx, label: (id: string) => string): AnnotationSpec[] =>
  items.map((item): AnnotationSpec => {
    const p = visibility(item, frame, tl);
    const text = (l: {id?: string; text?: string}) => (l.id ? label(l.id) : l.text ?? '');
    switch (item.kind) {
      case 'cote':
        return {kind: 'cote', from: vec(item.from, ctx), to: vec(item.to, ctx), offset: item.offset ?? 0, label: text(item), progress: p, count: item.count, marks: item.marks?.map((m) => num(m, ctx))};
      case 'angle':
        return {kind: 'angle', corner: vec(item.corner, ctx), along: vec(item.along, ctx), level: vec(item.level, ctx), label: text(item), progress: p};
      case 'clue':
        return {kind: 'clue', from: vec(item.from, ctx), to: vec(item.to, ctx), badgeAt: vec(item.badgeAt, ctx), badge: item.badge, progress: p};
      case 'line':
        return {kind: 'line', from: vec(item.from, ctx), to: vec(item.to, ctx), progress: p, hot: item.hot, dashed: item.dashed, label: item.id || item.text ? text(item) : undefined};
      case 'path':
        return {kind: 'path', points: item.points.map((pt) => vec(pt, ctx)), progress: p, hot: item.hot, dashed: item.dashed, label: item.id || item.text ? text(item) : undefined};
      case 'tags':
        return {kind: 'tags', tags: item.tags.map((tag) => ({at: vec(tag.at, ctx), text: text(tag), progress: windowAt(tag, frame, tl, {inFor: 8, ease: 'out'}) * p, hot: tag.hot}))};
    }
  });
