// Mise en scène de l'essai : tout est une fonction pure du numéro d'image et du minutage de la voix.
// Chaque direction de style a sa grammaire de caméra (docs/vision.md) :
// A travelling lent et glissés, B dérive flottante et rapprochements, D plans fixes, coupes et zooms secs.
import {Easing, interpolate} from 'remotion';
import type {LookId} from '../../design/looks';
import type {OwlState} from '../../mascot/Owl';
import {mixRig, POSES, type OwlPoseName, type OwlRig} from '../../mascot/rig';
import {mixShots, type Shot, type Vec3} from '../../scenes/camera';
import {cueById, wordFrame, type Timeline} from '../../content/timeline';

export type Beats = {
  /** Fin de l'accroche = début du passage « regle ». */
  dive: number;
  roof: number;
  end: number;
  cote: number;
  pente: number;
  rues: number;
  facades: number;
};

export const beatsOf = (timeline: Timeline): Beats => ({
  dive: cueById(timeline, 'regle').from,
  roof: cueById(timeline, 'toit').from,
  end: timeline.durationInFrames,
  cote: wordFrame(timeline, 'regle', '20', 2),
  pente: wordFrame(timeline, 'toit', '45'),
  rues: wordFrame(timeline, 'regle', 'rues'),
  facades: wordFrame(timeline, 'regle', 'façades'),
});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const smooth = Easing.inOut(Easing.cubic);

/** Cadrages et places du hibou propres à un décor ; la grammaire de caméra reste celle du style. */
export type Layout = {
  hook: Shot;
  cut: Shot;
  roof: Shot;
  /** Vue en travers de la rue (facultative) : montrée de « rues » à « façades » pour mesurer la largeur. */
  street?: Shot;
  streetSpot: Vec3;
  roofSpot: Vec3;
  streetHeight: number;
  roofHeight: number;
};

/** Passage vers la vue en travers de la rue (0 à 1), s'il y en a une. */
export const streetViewAt = (frame: number, b: Beats, layout: Layout) =>
  layout.street
    ? interpolate(frame, [b.rues - 14, b.rues + 16], [0, 1], {...clamp, easing: smooth}) *
      (1 - interpolate(frame, [b.facades - 4, b.facades + 24], [0, 1], {...clamp, easing: smooth}))
    : 0;

// Plans de référence (coordonnées Three.js : X le long de la rue, Y en haut, Z vers la rue).
// Le hibou commence sur le trottoir devant la coupe (8 blocs de haut, comme sur la planche),
// puis se perche sur le toit pour montrer la pente. Positions = centre des pattes.
export const VOXEL_LAYOUT: Layout = {
  hook: {target: [21, 10, 8], yaw: 45, pitch: 28, distance: 165, fov: 26, centerY: 1270},
  cut: {target: [26, 11, 6], yaw: 60, pitch: 22, distance: 125, fov: 26, centerY: 960},
  roof: {target: [29, 20, 3], yaw: 90, pitch: 16, distance: 72, fov: 26, centerY: 1160},
  streetSpot: [24, 0, 13.5],
  roofSpot: [25, 23, 2.4],
  streetHeight: 8,
  roofHeight: 5,
};

// L'accroche est cadrée au centre, derrière le titre centré et le voile.
const HOOK_CENTER: Record<LookId, number> = {A: 1000, B: 1000, D: 1000};
const withCenter = (shot: Shot, look: LookId): Shot => ({...shot, centerY: HOOK_CENTER[look]});

const drift = (shot: Shot, frame: number, amount: number): Shot => ({
  ...shot,
  yaw: shot.yaw + Math.sin(frame / 38) * 1.6 * amount,
  pitch: shot.pitch + Math.sin(frame / 51 + 1) * 0.9 * amount,
  target: [shot.target[0], shot.target[1] + Math.sin(frame / 44) * 0.35 * amount, shot.target[2]],
});

const punch = (shot: Shot, frame: number, at: number, zoom = 0.88): Shot => ({
  ...shot,
  fov: shot.fov * interpolate(frame, [at, at + 5], [1, zoom], {...clamp, easing: Easing.out(Easing.cubic)}),
});

export const cameraAt = (look: LookId, frame: number, b: Beats, layout: Layout = VOXEL_LAYOUT): Shot => {
  const {cut: CUT, roof: ROOF} = layout;
  const hook = withCenter(layout.hook, look);
  if (look === 'A') {
    // Travelling latéral lent, puis glissés vers la coupe et vers le comble.
    const travel = (s: Shot, from: number, to: number, deg: number) => ({...s, yaw: s.yaw + interpolate(frame, [from, to], [0, deg], clamp)});
    const hookShot = travel(hook, 0, b.dive, 4);
    const cutShot = travel(CUT, b.dive + 45, b.roof, 3);
    const roofShot = travel(ROOF, b.roof + 36, b.end, 2);
    if (frame < b.dive) return hookShot;
    if (frame < b.roof) {
      const shot = mixShots(hookShot, cutShot, interpolate(frame, [b.dive, b.dive + 45], [0, 1], {...clamp, easing: smooth}));
      return layout.street ? mixShots(shot, layout.street, streetViewAt(frame, b, layout)) : shot;
    }
    return mixShots(cutShot, roofShot, interpolate(frame, [b.roof, b.roof + 36], [0, 1], {...clamp, easing: smooth}));
  }
  if (look === 'B') {
    // Dérive flottante permanente ; rapprochements lents à chaque chapitre.
    const cut: Shot = {...CUT, distance: interpolate(frame, [b.dive + 60, b.roof], [CUT.distance, CUT.distance * 0.88], clamp)};
    let shot: Shot;
    if (frame < b.dive) shot = hook;
    else if (frame < b.roof) shot = mixShots(hook, cut, interpolate(frame, [b.dive, b.dive + 60], [0, 1], {...clamp, easing: smooth}));
    else shot = mixShots(cut, ROOF, interpolate(frame, [b.roof, b.roof + 48], [0, 1], {...clamp, easing: smooth}));
    return drift(shot, frame, 1);
  }
  // D : plans fixes cadrés comme des affiches, coupes franches et zooms rapides sur les mots clés.
  if (frame < b.dive) return hook;
  if (frame < b.roof) return punch(CUT, frame, b.cote);
  return punch(ROOF, frame, b.pente);
};

/** Avancement (0 à 1) du soulèvement du mur latéral qui révèle la coupe. */
export const liftAt = (look: LookId, frame: number, b: Beats) => {
  if (look === 'D') return interpolate(frame, [b.dive + 2, b.dive + 16], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const span = look === 'B' ? [b.dive + 10, b.dive + 56] : [b.dive + 6, b.dive + 40];
  return interpolate(frame, span, [0, 1], {...clamp, easing: smooth});
};

const BLINKS = [44, 131, 214, 302, 388];

const bounce = (frame: number, at: number, length: number, height: number) => {
  if (frame < at || frame >= at + length) return 0;
  return Math.sin(((frame - at) / length) * Math.PI) * height;
};

const landing = (frame: number, at: number) =>
  // Petit écrasement à la réception, puis retour à la normale.
  frame < at || frame >= at + 8 ? 1 : 1 - 0.1 * Math.sin(((frame - at) / 8) * Math.PI);

/** Position, hauteur et apparition (0 à 1, « pop ») du hibou. */
export const owlPlacementAt = (frame: number, b: Beats, layout: Layout = VOXEL_LAYOUT) => {
  const leave = b.roof + 4;
  const arrive = b.roof + 10;
  if (frame < arrive) {
    const scale = 1 - interpolate(frame, [leave, leave + 5], [0, 1], {...clamp, easing: Easing.in(Easing.back(2))});
    return {position: layout.streetSpot, height: layout.streetHeight, appear: scale};
  }
  const pop = interpolate(frame, [arrive, arrive + 8], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.2))});
  return {position: layout.roofSpot, height: layout.roofHeight, appear: pop};
};

// Fondu d'une pose à la suivante, en images.
const POSE_BLEND = 8;

const rigAt = (frame: number, keys: [number, OwlPoseName][]): OwlRig => {
  let current = POSES[keys[0][1]];
  for (let i = 1; i < keys.length; i++) {
    const [at, pose] = keys[i];
    if (frame < at) break;
    const t = interpolate(frame, [at, at + POSE_BLEND], [0, 1], {...clamp, easing: smooth});
    current = mixRig(current, POSES[pose], t);
  }
  return current;
};

/** acrossStreet : vue en travers de la rue, où il montre l'immeuble d'en face (à gauche de l'écran). */
export const owlAt = (look: LookId, frame: number, b: Beats, cameraYaw: number, acrossStreet = false): OwlState => {
  const pointFrom = b.dive + 18;
  const waveFrom = b.end - 26;
  const onRoof = frame >= b.roof + 10;
  const facingOpposite = acrossStreet && frame >= b.rues && frame < b.facades + 4;
  // Sur le trottoir, il montre la coupe (à droite de l'écran) ; sur le toit, la pente (à gauche).
  const rig = rigAt(frame, [
    [0, 'wonder'],
    [pointFrom, 'pointRight'],
    ...(acrossStreet ? ([[b.rues, 'pointLeft'], [b.facades + 4, 'pointRight']] as [number, OwlPoseName][]) : []),
    [b.roof + 10, 'pointLeft'],
    [waveFrom, 'wave'],
  ]);
  if (frame >= waveFrom) rig.wingRight += Math.sin((frame - waveFrom) / 2.6) * 0.35;
  // Clignements : la paupière descend puis remonte en 5 images.
  const blink = BLINKS.reduce((v, at) => Math.max(v, frame >= at && frame < at + 5 ? Math.sin(((frame - at) / 5) * Math.PI) : 0), 0);
  rig.lids = Math.max(rig.lids, blink);
  rig.headYaw += Math.sin(frame / 23) * (look === 'D' ? 0.04 : 0.08);
  rig.headTilt += Math.sin(frame / 37 + 1) * 0.03;
  const hop =
    bounce(frame, 6, 14, 0.15) + bounce(frame, b.cote - 4, 10, 0.08) + bounce(frame, b.pente - 4, 10, 0.08) + (acrossStreet ? bounce(frame, b.rues + 18, 10, 0.08) : 0);
  const breathe = 1 + Math.sin(frame / 20) * 0.012;
  const squash =
    breathe * landing(frame, 20) * landing(frame, pointFrom) * landing(frame, waveFrom) * landing(frame, b.cote + 6) * landing(frame, b.pente + 6);
  // Il fait face à la caméra, puis se tourne un peu vers ce qu'il montre.
  const turn = interpolate(frame, [pointFrom - 6, pointFrom + 6], [0, 0.25], clamp) * (frame < waveFrom ? 1 : 0) * (onRoof || facingOpposite ? -1 : 1);
  return {rig, yaw: (cameraYaw * Math.PI) / 180 + turn, hop, squash};
};

/** Apparitions de l'habillage, en avancement 0 à 1. */
export const overlaysAt = (look: LookId, frame: number, b: Beats) => {
  const fast = look === 'D';
  const enter = (at: number, length: number) =>
    interpolate(frame, [at, at + (fast ? Math.max(3, length / 2) : length)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return {
    titleExit: interpolate(frame, [b.dive - 4, b.dive + (fast ? 4 : 12)], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)}),
    hookClue: 1 - interpolate(frame, [b.dive, b.dive + 10], [0, 1], clamp),
    chapter: enter(b.dive + 8, 12),
    ruleStreet: enter(b.rues, 8),
    ruleFacade: enter(b.facades, 8),
    // La cote s'efface quand la caméra monte vers le comble.
    cote: enter(b.cote, 12) * (1 - interpolate(frame, [b.roof, b.roof + 10], [0, 1], clamp)),
    pente: enter(b.pente, 12),
  };
};
