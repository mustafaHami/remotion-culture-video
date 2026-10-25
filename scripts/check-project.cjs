// Contrôle statique du dépôt (npm run verify). Ne rend aucune vidéo.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const rules = require('./lib/project-rules.cjs');
const {narrationProblems} = require('./lib/content.cjs');
const {stagingProblems} = require('./lib/staging.cjs');

const root = path.resolve(__dirname, '..');
const at = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(at(...parts), 'utf8');
const problems = [];

const REQUIRED = [
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md', 'docs/vision.md', 'docs/design-system.md',
  '.nvmrc', 'requirements.txt', 'remotion.config.ts', 'src/index.ts', 'src/Root.tsx',
];
for (const file of REQUIRED) if (!fs.existsSync(at(file))) problems.push(`Fichier requis absent : ${file}`);

problems.push(...rules.packagePinningProblems(JSON.parse(read('package.json'))));
problems.push(...rules.requirementsProblems(read('requirements.txt')));
problems.push(...rules.claudeImportProblems(read('CLAUDE.md')));

if (!/setChromiumOpenGlRenderer\(\s*['"]angle['"]\s*\)/.test(read('remotion.config.ts'))) {
  problems.push('remotion.config.ts doit régler le moteur OpenGL « angle » pour Three.js');
}

for (const file of rules.listFiles(at('src'), /\.(tsx?|css)$/)) {
  problems.push(...rules.determinismProblems(path.relative(root, file).replaceAll('\\', '/'), fs.readFileSync(file, 'utf8')));
}

for (const dir of ['src/voxel/decor', 'src/scenes']) {
  for (const file of rules.listFiles(at(dir), /\.(tsx?)$/)) {
    problems.push(...rules.hardcodedColorProblems(path.relative(root, file).replaceAll('\\', '/'), fs.readFileSync(file, 'utf8')));
  }
}

const fonts = fs.readdirSync(at('public/fonts'));
problems.push(...rules.fontLicenceProblems(fonts, (name) => read('public/fonts', name)));

// Épisodes et essais : JSON lisible, voix figée conforme au texte, annotations et sources (content/episodes/README.md),
// mise en scène du moteur (docs/moteur.md) : décor du registre, repères de temps sur des mots prononcés.
const decors = [...read('src/voxel/decor/scenes.ts').matchAll(/^\s+'?([\w-]+)'?:\s*\w+Scene,?$/gm)].map((m) => m[1]);
const contentFiles = ['content/episodes', 'content/essais'].flatMap((dir) =>
  fs.existsSync(at(dir)) ? fs.readdirSync(at(dir)).filter((f) => f.endsWith('.json')).map((f) => `${dir}/${f}`) : [],
);
for (const file of contentFiles) {
  try {
    const content = JSON.parse(read(file));
    problems.push(...narrationProblems(content, {publicDir: at('public')}));
    problems.push(...stagingProblems(content, {decors}));
  } catch (error) {
    problems.push(`Contenu illisible : ${file} (${error.message})`);
  }
}

if (fs.existsSync(at('.git'))) {
  const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
  problems.push(...rules.trackedFileProblems(tracked, (file) => (fs.existsSync(at(file)) ? fs.statSync(at(file)).size : 0)));
}

for (const problem of problems) console.error(problem);
if (problems.length) process.exitCode = 1;
else console.log(`Projet : configuration, versions, polices, déterminisme et contenus conformes (${contentFiles.length} fichier(s) de contenu).`);
