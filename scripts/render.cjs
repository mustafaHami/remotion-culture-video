// Rend une ou plusieurs compositions en MP4 (H.264 + AAC, yuv420p, BT.709, 1080 × 1920, 30 i/s).
// Usage : node scripts/render.cjs --compositions=EssaiStyleA,EssaiStyleB --out=output/essais [--look=B]
// Les rendus programmatiques ne lisent pas remotion.config.ts : le moteur OpenGL est passé ici.
const path = require('node:path');
const fs = require('node:fs');
const {bundle} = require('@remotion/bundler');
const {renderMedia, selectComposition, ensureBrowser} = require('@remotion/renderer');

const arg = (name, fallback) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const root = path.resolve(__dirname, '..');
const compositions = arg('compositions', '').split(',').filter(Boolean);
// Style à imposer (A, B ou D) : rend l'épisode dans ce style au lieu du sien ; le style est ajouté au nom du fichier.
const look = arg('look', '');
if (look && !['A', 'B', 'D'].includes(look)) {
  console.error('--look attend A, B ou D');
  process.exit(1);
}
const inputProps = look ? {look} : {};
const suffix = look ? `-${look}` : '';
const out = path.resolve(root, arg('out', 'output/videos'));
if (!compositions.length) {
  console.error('Préciser --compositions=Id1,Id2');
  process.exit(1);
}

(async () => {
  await ensureBrowser();
  const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
  fs.mkdirSync(out, {recursive: true});
  const chromiumOptions = {gl: 'angle'};
  for (const id of compositions) {
    const composition = await selectComposition({serveUrl, id, chromiumOptions, inputProps});
    const outputLocation = path.join(out, `${id}${suffix}.mp4`);
    let reported = -1;
    await renderMedia({
      serveUrl,
      composition,
      outputLocation,
      chromiumOptions,
      inputProps,
      codec: 'h264',
      audioCodec: 'aac',
      pixelFormat: 'yuv420p',
      colorSpace: 'bt709',
      // Qualité de livraison : images intermédiaires JPEG quasi sans perte et H.264 soigné,
      // pour que hachures, contours et grain survivent à la recompression des plateformes.
      jpegQuality: 95,
      crf: 16,
      x264Preset: 'slow',
      overwrite: true,
      onProgress: ({progress}) => {
        const step = Math.floor(progress * 10);
        if (step > reported) {
          reported = step;
          console.log(`${id} : ${step * 10} %`);
        }
      },
    });
    console.log(`${id} : ${outputLocation} (${composition.durationInFrames} images)`);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
