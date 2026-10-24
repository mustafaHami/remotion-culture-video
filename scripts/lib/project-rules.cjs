// Contrôles statiques des règles d'AGENTS.md. Chaque fonction renvoie une liste de problèmes
// (chaînes) ; une liste vide signifie que la règle est respectée. Ces contrôles sont des garde-fous :
// ils ne remplacent ni un rendu, ni l'inspection des images, ni l'écoute.
const fs = require('node:fs');
const path = require('node:path');

const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/;

function packagePinningProblems(pkg) {
  const problems = [];
  const all = {...pkg.dependencies, ...pkg.devDependencies};
  for (const [name, version] of Object.entries(all)) {
    if (!EXACT_VERSION.test(version)) problems.push(`Version non figée : ${name}@${version}`);
  }
  const remotionVersions = new Set(
    Object.entries(all).filter(([name]) => name === 'remotion' || name.startsWith('@remotion/')).map(([, v]) => v),
  );
  if (remotionVersions.size > 1) problems.push(`Versions Remotion différentes : ${[...remotionVersions].join(', ')}`);
  return problems;
}

function requirementsProblems(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trim())
    .filter(Boolean)
    .filter((line) => !/^[A-Za-z0-9._-]+(\[[A-Za-z0-9,._-]+\])?==[0-9][0-9A-Za-z.]*$/.test(line))
    .map((line) => `Paquet Python non figé (==) : ${line}`);
}

// Animation déterministe : tout doit découler de useCurrentFrame().
const NON_DETERMINISTIC = [
  [/\buseFrame\s*\(/, 'useFrame de react-three-fiber (utiliser useCurrentFrame)'],
  [/\bDate\.now\s*\(/, 'Date.now()'],
  [/\bnew\s+Date\s*\(/, 'new Date()'],
  [/\bperformance\.now\s*\(/, 'performance.now()'],
  [/\bset(Timeout|Interval)\s*\(/, 'setTimeout/setInterval'],
  [/\brequestAnimationFrame\s*\(/, 'requestAnimationFrame'],
  [/\bMath\.random\s*\(/, 'Math.random() (utiliser random(seed) de remotion)'],
  [/@keyframes\b/, 'animation CSS autonome (@keyframes)'],
  [/\b(animation|transition)(-?[Dd]uration)?\s*:\s*['"`][^'"`\n]*\d(\.\d+)?m?s\b/, 'animation/transition CSS minutée'],
];

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

function determinismProblems(file, code) {
  const problems = [];
  stripComments(code).split('\n').forEach((line, index) => {
    for (const [pattern, label] of NON_DETERMINISTIC) {
      if (pattern.test(line)) problems.push(`${file}:${index + 1} : ${label}`);
    }
  });
  return problems;
}

const FONT_FILE = /\.(ttf|otf|woff2?)$/i;

// Chaque police <Famille>-<Style>.<ext> doit être accompagnée de <Famille>-OFL.txt.
function fontLicenceProblems(files, readText) {
  const problems = [];
  for (const font of files.filter((f) => FONT_FILE.test(f))) {
    const family = font.split(/[-.]/)[0];
    const licence = `${family}-OFL.txt`;
    if (!files.includes(licence)) problems.push(`Licence absente pour ${font} (attendu : ${licence})`);
    else if (!/SIL Open Font License/i.test(readText(licence))) problems.push(`${licence} ne mentionne pas la SIL Open Font License`);
  }
  return problems;
}

const FORBIDDEN_TRACKED = [
  [/(^|\/)(node_modules|\.venv|output|out|\.remotion|\.runtime|\.cache|\.npm-cache)\//, 'dossier de dépendances, cache ou rendu'],
  [/\.(mp4|mov|webm|mkv)$/i, 'export vidéo'],
  [/(^|\/)\.env(\..+)?$/, 'fichier de secrets'],
  [/\.(pem|key)$/i, 'clé privée'],
];
const EXAMPLE_ENV = /(^|\/)\.env\.example$/;
const MAX_TRACKED_BYTES = 15 * 1024 * 1024;

function trackedFileProblems(files, sizeOf) {
  const problems = [];
  for (const file of files) {
    for (const [pattern, label] of FORBIDDEN_TRACKED) {
      if (pattern.test(file) && !EXAMPLE_ENV.test(file)) problems.push(`Fichier interdit dans Git (${label}) : ${file}`);
    }
    const size = sizeOf(file);
    if (size > MAX_TRACKED_BYTES) problems.push(`Fichier trop volumineux pour Git (${(size / 1048576).toFixed(1)} Mo) : ${file}`);
  }
  return problems;
}

function claudeImportProblems(text) {
  const first = text.split(/\r?\n/).find((line) => line.trim());
  return first && first.trim() === '@AGENTS.md' ? [] : ['CLAUDE.md doit commencer par la ligne « @AGENTS.md »'];
}

function listFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true, recursive: true})
    .filter((e) => e.isFile() && extensions.test(e.name))
    .map((e) => path.join(e.parentPath ?? e.path, e.name));
}

module.exports = {
  packagePinningProblems,
  requirementsProblems,
  determinismProblems,
  fontLicenceProblems,
  trackedFileProblems,
  claudeImportProblems,
  listFiles,
};
