// Format de la mise en scène d'un épisode (champ "staging" de content/episodes/<id>.json) et contrat d'un décor.
// Documentation complète : docs/moteur.md.
import type React from 'react';
import type * as THREE from 'three';
import type {LineSegmentsGeometry} from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import type {Look, VoxelRole} from '../design/looks';
import type {OwlPoseName} from '../mascot/rig';
import type {EaseName, Key, VecKey, Window} from './anim';
import type {Ctx, Num, V3} from './expr';
import type {Time} from './time';

// ---------------------------------------------------------------- Décor

/** Réglages du trait crayonné d'une pièce (docs/rendu.md § 3.1). */
export type DrawnSettings = {edgeWidth: number; joint: number; hatchDensity: number; hatchStrength: number};

export type Piece = {geometry: THREE.BufferGeometry; edges: LineSegmentsGeometry};

export type Part = {
  /** Une géométrie, ou des tronçons qui apparaissent un à un (`reveal`). */
  piece?: Piece;
  chunks?: Piece[];
  /** Position par défaut (Three.js). */
  position?: [number, number, number];
  rotation?: [number, number, number];
  drawn?: Partial<DrawnSettings>;
  /** Affichée seulement si la mise en scène la cite dans `objects`. */
  onlyIfStaged?: boolean;
};

/** Ce qu'un décor fournit au moteur (src/voxel/decor/<sujet>.scene.tsx). */
export type DecorScene = {
  /** Constantes et fonctions utilisables dans les expressions de la mise en scène (ex. CUT_FACE, seabedY). */
  context: Ctx;
  /** Pièces du décor, construites une fois par style. */
  build: (look: Look) => Record<string, Part>;
  /** Réglages du trait par défaut pour toutes les pièces du décor. */
  drawn: DrawnSettings;
  /** Éléments non voxel posés dans la scène 3D (eau, ciel…), aux couleurs du style. */
  Backdrop?: React.FC<{look: Look}>;
};

// ---------------------------------------------------------------- Mise en scène

export type ObjectSpec = {
  /** Nom de l'objet dans les expressions (ex. « ship » → ship.x, ship.y, ship.z). */
  id: string;
  /** Pièce du décor affichée (par défaut : `id`). */
  part?: string;
  /** Visible de `from` à `until`. */
  from?: Time;
  until?: Time;
  /** Position de base (par défaut celle de la pièce). */
  position?: V3;
  /** Clés de position (absolues) ; `null` = axe non réglé. */
  move?: VecKey[];
  /** Trajet : ligne brisée dans un plan, parcourue selon `progress` (0 à 1). */
  path?: {points: [Num, Num][]; axes?: 'xy' | 'xz' | 'zy'; progress: Key<Num>[]};
  /** Oscillations ajoutées : amplitude × sin(image / période + phase). */
  waves?: {axis: 'x' | 'y' | 'z'; amp: number; period: number; phase?: number}[];
  /** Défilement en boucle : (image × vitesse) modulo longueur, sur un axe. */
  loop?: {axis: 'x' | 'y' | 'z'; speed: number; length: number};
  rotation?: V3;
  rotate?: VecKey[];
  /** Rotation continue : + image / période (radians) sur un axe. */
  spin?: {axis: 'x' | 'y' | 'z'; period: number};
  /** Échelle uniforme, ou hauteur seule (`scaleY`), en clés. */
  scale?: Key<Num>[];
  scaleY?: Key<Num>[];
  /** Point autour duquel tournent et grandissent les pièces (Three.js, relatif à la position). */
  pivot?: V3;
  opacity?: Key<Num>[];
  /** Tronçons visibles (0 à 1) d'une pièce découpée. */
  reveal?: Key<Num>[];
};

export type CameraShot = {
  /** Point visé : nombres ou expressions (« ship.x », « owl.y + 1 »). */
  target: V3;
  yaw: Num;
  pitch: Num;
  distance: Num;
  fov?: Num;
  centerY?: Num;
};

export type CameraStep = {
  /** Début du passage vers ce plan, et sa durée en images (0 = coupe franche). */
  at: Time;
  duration?: number;
  ease?: EaseName;
  shot: CameraShot;
  /** Travelling pendant que le plan est tenu : décalages ajoutés progressivement de `from` à `to`. */
  travel?: {from: Time; to: Time; yaw?: number; pitch?: number; distance?: number};
  /** Balancement permanent : amplitude × sin(image / période). */
  sway?: {yaw?: number; pitch?: number; period: number};
  /** Dérive flottante (style B) : 1 = réglage standard. */
  drift?: number;
  /** Zooms secs (style D) : le champ se resserre en 5 images à chaque repère. */
  punch?: {at: Time[]; zoom?: number};
};

export type OwlSpec = {
  /** Places successives : le hibou disparaît puis réapparaît à chaque changement. */
  spots: {at: Time; position: V3; height: Num}[];
  /** Poses : [repère, pose, côté (-1 gauche, 0 face, 1 droite)]. */
  poses: [Time, OwlPoseName, number][];
  /** Petits sauts de réaction, typiquement sur les mots chiffrés. */
  hops?: Time[];
};

type AnnotationBase = Window & {
  /** Plusieurs fenêtres d'apparition (la plus visible l'emporte), en plus de la fenêtre propre in/out. */
  windows?: Window[];
};

/** Texte d'étiquette : `id` d'une annotation de l'épisode (son `label`), ou texte court (`text`). */
type Labelled = {id?: string; text?: string};

export type AnnotationItem = AnnotationBase &
  (
    | (Labelled & {kind: 'cote'; from: V3; to: V3; offset?: number; count?: {to: number; suffix: string}; marks?: Num[]})
    | (Labelled & {kind: 'angle'; corner: V3; along: V3; level: V3})
    | {kind: 'clue'; from: V3; to: V3; badgeAt: V3; badge: string}
    | (Labelled & {kind: 'line'; from: V3; to: V3; hot?: boolean; dashed?: boolean})
    | (Labelled & {kind: 'path'; points: V3[]; hot?: boolean; dashed?: boolean})
    | {kind: 'tags'; tags: (Window & Labelled & {at: V3; hot?: boolean})[]}
  );

/** Habillage chiffré (src/overlays/Widgets.tsx). */
export type WidgetItem = Window &
  (
    | {
        kind: 'gauge';
        /** Valeur affichée (expression, ex. « depthOf(sub.y) »). */
        value: string;
        max: Num;
        scale?: 'linear' | 'sqrt';
        unit: string;
        ticks: [Num, string][];
        /** Seconde valeur calculée depuis la première (variable « v »), passée en couleur à `hotAt`. */
        second?: {value: string; unit: string; hotAt?: Time};
        /** Étiquette d'annotation affichée sous les compteurs. */
        note?: Window & {id: string};
      }
    /** Grand chiffre central ; `count` le fait défiler de `from` à `to` pendant l'apparition, puis affiche l'étiquette. */
    | {kind: 'badge'; id: string; top?: number; count?: {from: number; to: number; suffix?: string; until: Time}}
    | {kind: 'bar'; id: string; value: number}
  );

/** Effets 2D posés sur la scène (src/overlays/Effects.tsx). */
export type EffectItem = Window &
  (
    | {kind: 'darkness'; amount: string; hole: V3; radius?: number; role?: VoxelRole}
    | {kind: 'waves'; from: V3; to: V3; count?: number; period?: number}
    | {kind: 'beam'; from: V3; left: V3; right: V3; period?: number}
  );

export type Staging = {
  /** Identifiant de la composition Remotion (ex. « FondsMarins »). */
  composition: string;
  /** Décor (clé du registre src/voxel/decor/scenes.ts). */
  decor: string;
  /** Fin de l'accroche (par défaut : début du deuxième passage). */
  hookExit?: Time;
  objects?: ObjectSpec[];
  camera: CameraStep[];
  owl: OwlSpec;
  annotations?: AnnotationItem[];
  widgets?: WidgetItem[];
  effects?: EffectItem[];
};

export type Chapter = {cue: string; label: string; rule?: [string, string]; ruleAt?: [Time, Time]};
