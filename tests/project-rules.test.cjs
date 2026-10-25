const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../scripts/lib/project-rules.cjs');

test('les versions npm doivent être figées et Remotion homogène', () => {
  assert.deepEqual(rules.packagePinningProblems({dependencies: {remotion: '4.0.534', '@remotion/three': '4.0.534'}}), []);
  assert.match(rules.packagePinningProblems({dependencies: {remotion: '^4.0.534'}})[0], /non figée/);
  assert.match(rules.packagePinningProblems({devDependencies: {typescript: '~5.9.3'}})[0], /non figée/);
  assert.match(
    rules.packagePinningProblems({dependencies: {remotion: '4.0.534', '@remotion/cli': '4.0.535'}})[0],
    /Versions Remotion différentes/,
  );
});

test('les paquets Python doivent être figés avec ==', () => {
  assert.deepEqual(rules.requirementsProblems('# commentaire\nedge-tts==7.3.1\nPillow==13.0.0 # contrôle\n'), []);
  assert.equal(rules.requirementsProblems('edge-tts>=7\nPillow\n').length, 2);
});

test('les sources non déterministes sont signalées avec leur ligne', () => {
  const code = [
    "import {useFrame} from '@react-three/fiber';",
    'useFrame(() => {});',
    'const t = Date.now();',
    'const r = Math.random();',
    'setTimeout(go, 10);',
    "const css = '@keyframes spin {}';",
    "const style = {transition: 'opacity 0.3s'};",
  ].join('\n');
  const found = rules.determinismProblems('src/x.tsx', code);
  assert.equal(found.length, 6);
  assert.match(found[0], /src\/x\.tsx:2 : useFrame/);
});

test('le code déterministe et les commentaires ne sont pas signalés', () => {
  const code = [
    "import {useCurrentFrame, random, interpolate} from 'remotion';",
    'const frame = useCurrentFrame();',
    "const jitter = random('hibou-' + frame);",
    '// Ne jamais utiliser Date.now() ni Math.random() ici.',
    '/* setTimeout( interdit */',
    "const scene = {transition: 'fondu', url: 'https://example.org'};",
  ].join('\n');
  assert.deepEqual(rules.determinismProblems('src/ok.tsx', code), []);
});

test('chaque police doit être accompagnée de sa licence OFL', () => {
  const ofl = () => 'This Font Software is licensed under the SIL Open Font License, Version 1.1.';
  assert.deepEqual(rules.fontLicenceProblems(['Nunito-Variable.ttf', 'Nunito-OFL.txt', 'README.md'], ofl), []);
  assert.match(rules.fontLicenceProblems(['Inter-Bold.woff2'], ofl)[0], /Inter-OFL\.txt/);
  assert.match(rules.fontLicenceProblems(['Inter-Bold.ttf', 'Inter-OFL.txt'], () => 'Tous droits réservés')[0], /SIL/);
});

test('Git refuse rendus, secrets, caches et fichiers volumineux', () => {
  const size = (file) => (file === 'public/audio/long.wav' ? 20 * 1024 * 1024 : 100);
  const found = rules.trackedFileProblems(
    ['README.md', '.env.example', '.env', 'output/x/video.mp4', 'node_modules/a/index.js', 'public/audio/long.wav'],
    size,
  );
  assert.equal(found.filter((p) => p.includes('.env.example')).length, 0);
  assert.ok(found.some((p) => p.endsWith(': .env')));
  assert.ok(found.some((p) => p.includes('export vidéo')));
  assert.ok(found.some((p) => p.includes('node_modules')));
  assert.ok(found.some((p) => p.includes('trop volumineux')));
});

test('les vidéos finales de videos/ ne passent que par Git LFS', () => {
  const huge = () => 90 * 1024 * 1024;
  assert.deepEqual(rules.trackedFileProblems(['videos/fonds-marins.mp4'], huge, ['videos/*.mp4']), []);
  assert.match(rules.trackedFileProblems(['videos/fonds-marins.mp4'], huge, [])[0], /hors Git LFS/);
  assert.ok(rules.trackedFileProblems(['videos/brouillon/essai.mp4'], huge, ['videos/*.mp4']).some((p) => p.includes('export vidéo')));
});

test('CLAUDE.md doit importer AGENTS.md en première ligne', () => {
  assert.deepEqual(rules.claudeImportProblems('@AGENTS.md\n\nPrécisions Claude.'), []);
  assert.equal(rules.claudeImportProblems('# Claude\n@AGENTS.md').length, 1);
});

test('un décor ne contient aucun code couleur en dur', () => {
  assert.deepEqual(rules.hardcodedColorProblems('src/voxel/decor/x.ts', "grid.set(0, 0, 0, 'structure'); // pas de #A9693D ici"), []);
  assert.equal(rules.hardcodedColorProblems('src/voxel/decor/x.ts', "grid.set(0, 0, 0, '#A9693D');").length, 1);
});
