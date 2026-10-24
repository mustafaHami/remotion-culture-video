// Configuration lue par Remotion Studio et par la CLI (`npx remotion render`).
// Les rendus lancés depuis @remotion/renderer (renderMedia, renderStill…) ne lisent
// PAS ce fichier : ils doivent passer `chromiumOptions: {gl: 'angle'}` eux-mêmes.
import {Config} from '@remotion/cli/config';

// Three.js (@remotion/three) a besoin d'un vrai moteur OpenGL dans Chromium.
// Sur un serveur Linux sans GPU, essayer 'angle-egl' ou 'swangle' et le documenter.
Config.setChromiumOpenGlRenderer('angle');

// Format de livraison : H.264 + AAC, yuv420p, espace colorimétrique BT.709.
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setVideoImageFormat('jpeg');

Config.setOverwriteOutput(true);
