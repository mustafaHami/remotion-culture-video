import React from 'react';
import {Composition, Folder} from 'remotion';
import {EssaiDessin} from './essais/dessin-2d/EssaiDessin';
import {EssaiImmeubleFin, FINE_SHOTS} from './essais/voxel-dessin/EssaiImmeubleFin';
import {EssaiStyles, essaiTimeline} from './essais/styles/EssaiStyles';
import {FPS, HEIGHT, WIDTH} from './design/format';
import {Episode, episodeTimeline} from './engine/Episode';
import {EPISODES} from './engine/episodes';
import type {LookId} from './design/looks';

// Épisodes : un par fichier content/episodes/<id>.json doté d'une mise en scène, fabriqué par le moteur générique.
// Essais : compositions de réglage des styles et des décors.
const ESSAI_LOOKS: LookId[] = ['A', 'B', 'D'];

export const Root: React.FC = () => (
  <>
  <Folder name="Episodes">
    {EPISODES.map((episode) => (
      <Composition
        key={episode.id}
        id={episode.staging.composition}
        component={Episode}
        defaultProps={{id: episode.id}}
        durationInFrames={episodeTimeline(episode).durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
  </Folder>
  <Folder name="Essais">
    {ESSAI_LOOKS.map((look) => (
      <Composition
        key={look}
        id={`EssaiStyle${look}`}
        component={EssaiStyles}
        defaultProps={{look}}
        durationInFrames={essaiTimeline().durationInFrames}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
    {/* Essai « voxels dessinés » : la scène voxel A, crayonnée. */}
    <Composition id="EssaiVoxelDessin" component={EssaiStyles} defaultProps={{look: 'A' as LookId, drawn: true}} durationInFrames={essaiTimeline().durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Essai d'immeuble plus réaliste (voxels de 25 cm) : une image par angle de vue. */}
    <Composition id="EssaiImmeubleFin" component={EssaiImmeubleFin} defaultProps={{drawn: true}} durationInFrames={FINE_SHOTS.length} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="EssaiImmeubleFinBrut" component={EssaiImmeubleFin} defaultProps={{drawn: false}} durationInFrames={FINE_SHOTS.length} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Essai de rendu « dessiné à la main » (2D), sur la même narration. */}
    <Composition id="EssaiDessin" component={EssaiDessin} durationInFrames={essaiTimeline().durationInFrames} fps={FPS} width={WIDTH} height={HEIGHT} />
  </Folder>
  </>
);
