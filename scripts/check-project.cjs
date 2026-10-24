// Contrôle statique du dépôt (npm run verify). Ne rend aucune vidéo.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const rules = require('./lib/project-rules.cjs');

const root = path.resolve(__dirname, '..');
const at = (...parts) => path.join(root, ...parts);
const read = (...parts) => fs.readFileSync(at(...parts), 'utf8');
const problems = [];

const REQUIRED = [
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'CONTRIBUTING.md', 'docs/vision.md',
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

const fonts = fs.readdirSync(at('public/fonts'));
problems.push(...rules.fontLicenceProblems(fonts, (name) => read('public/fonts', name)));

// Le schéma des épisodes sera défini avec le premier flux de création ; en attendant, JSON valide.
const episodes = fs.readdirSync(at('content/episodes')).filter((f) => f.endsWith('.json'));
for (const file of episodes) {
  try {
    JSON.parse(read('content/episodes', file));
  } catch (error) {
    problems.push(`Épisode illisible : content/episodes/${file} (${error.message})`);
  }
}

if (fs.existsSync(at('.git'))) {
  const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'}).split('\0').filter(Boolean);
  problems.push(...rules.trackedFileProblems(tracked, (file) => (fs.existsSync(at(file)) ? fs.statSync(at(file)).size : 0)));
}

for (const problem of problems) console.error(problem);
if (problems.length) process.exitCode = 1;
else console.log(`Projet : configuration, versions, polices et règles de déterminisme conformes (${episodes.length} épisode(s)).`);
