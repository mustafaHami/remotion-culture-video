// Format commun à toutes les vidéos (AGENTS.md) et zones sûres des plateformes,
// reprises des planches Claude Design : rien d'important sous ces bandes.
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const SAFE = {
  top: 200,
  bottom: 360,
  right: 140,
  left: 64,
} as const;

export const msToFrames = (ms: number) => Math.round((ms * FPS) / 1000);
