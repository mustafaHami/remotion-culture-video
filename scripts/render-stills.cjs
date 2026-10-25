// Rend des images fixes pour régler un cadrage sans rendre toute la vidéo.
// Usage : node scripts/render-stills.cjs --compositions=EssaiStyleA,EssaiStyleB --frames=0,90,300 [--out=output/stills]
// Les rendus programmatiques ne lisent pas remotion.config.ts : le moteur OpenGL est passé ici.
const path = require('node:path');
const fs = require('node:fs');
const {bundle} = require('@remotion/bundler');
const {renderStill, selectComposition, ensureBrowser} = require('@remotion/renderer');

const arg = (name, fallback) => {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(name.length + 3) : fallback;
};

const root = path.resolve(__dirname, '..');
const compositions = arg('compositions', '').split(',').filter(Boolean);
const frames = arg('frames', '0').split(',').map(Number);
const out = path.resolve(root, arg('out', 'output/stills'));
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
    const composition = await selectComposition({serveUrl, id, chromiumOptions});
    for (const frame of frames) {
      const output = path.join(out, `${id}-${String(frame).padStart(4, '0')}.png`);
      await renderStill({serveUrl, composition, frame, output, chromiumOptions, overwrite: true});
      console.log(output);
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
