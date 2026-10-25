// Contrôle de la mise en scène d'un épisode (champ "staging", docs/moteur.md) : décor connu, repères de temps
// qui désignent un passage ou un mot réellement prononcé, poses connues, annotations citées existantes et affichées.
// Même syntaxe de repère que src/engine/time.ts.
const normalizeWord = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '');

const POSES = ['idle', 'wonder', 'pointRight', 'pointLeft', 'wave'];
/** Clés dont la valeur (texte ou nombre) est un repère de temps. `from`/`to` ne le sont que s'ils ne sont pas des points 3D. */
const TIME_KEYS = new Set(['at', 'in', 'out', 'from', 'to', 'until', 'hotAt']);

function timeProblem(ref, narration) {
  if (typeof ref === 'number') return null;
  if (typeof ref !== 'string') return `repère invalide ${JSON.stringify(ref)}`;
  const between = /^(.+)\.\.(.+)@(\d+(?:\.\d+)?)$/.exec(ref);
  if (between) return timeProblem(between[1], narration) ?? timeProblem(between[2], narration);
  let base = ref.trim();
  const m = /^(.*[^+-])([+-]\d+(?:\.\d+)?)$/.exec(base);
  if (m && !m[1].endsWith(':')) base = m[1];
  if (base === 'start' || base === 'end') return null;
  const colon = base.indexOf(':');
  const cueId = colon < 0 ? base.replace(/\.end$/, '') : base.slice(0, colon);
  const cue = narration.find((c) => c.id === cueId);
  if (!cue) return `repère « ${ref} » : passage « ${cueId} » inconnu`;
  if (colon < 0) return null;
  let word = base.slice(colon + 1);
  let occurrence = 1;
  const occ = /^(.*)#(\d+)$/.exec(word);
  if (occ) {
    word = occ[1];
    occurrence = Number(occ[2]);
  }
  const found = (cue.audio?.words ?? []).filter((w) => normalizeWord(w.text) === normalizeWord(word)).length;
  if (found < occurrence) return `repère « ${ref} » : mot « ${word} » (occurrence ${occurrence}) absent du passage « ${cueId} »`;
  return null;
}

function stagingProblems(content, {decors}) {
  const s = content.staging;
  if (!s) return [];
  const label = content.id ?? '(sans id)';
  const problems = [];
  const add = (text) => problems.push(`${label}/staging : ${text}`);
  const narration = content.narration ?? [];
  if (!s.composition || !/^[A-Za-z][A-Za-z0-9]*$/.test(s.composition)) add('« composition » absente ou invalide (lettres et chiffres)');
  if (!decors.includes(s.decor)) add(`décor « ${s.decor} » absent du registre (${decors.join(', ')})`);
  if (!Array.isArray(s.camera) || !s.camera.length) add('aucun plan de caméra');
  if (!s.owl?.spots?.length || !s.owl?.poses?.length) add('hibou sans place ou sans pose');
  for (const [, pose] of s.owl?.poses ?? []) if (!POSES.includes(pose)) add(`pose inconnue « ${pose} » (${POSES.join(', ')})`);

  const check = (ref) => {
    const problem = timeProblem(ref, narration);
    if (problem) add(problem);
  };
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (TIME_KEYS.has(key) && (typeof value === 'string' || typeof value === 'number')) check(value);
      else walk(value);
    }
  };
  walk(s);
  if (s.hookExit !== undefined) check(s.hookExit);
  for (const hop of s.owl?.hops ?? []) check(hop);
  for (const [at] of s.owl?.poses ?? []) check(at);
  for (const chapter of content.chapters ?? []) for (const ref of chapter.ruleAt ?? []) check(ref);

  // Textes d'annotation : chaque id cité existe, et chaque annotation de l'épisode est affichée quelque part.
  const ids = new Set((content.annotations ?? []).map((a) => a.id));
  const used = new Set();
  const collect = (node) => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (!node || typeof node !== 'object') return;
    if (typeof node.id === 'string' && (node.kind || node.at || node.in !== undefined)) used.add(node.id);
    Object.values(node).forEach(collect);
  };
  collect([s.annotations, s.widgets]);
  for (const id of used) if (!ids.has(id)) add(`annotation « ${id} » citée mais absente de "annotations"`);
  for (const id of ids) if (!used.has(id)) add(`annotation « ${id} » jamais affichée`);
  return problems;
}

module.exports = {stagingProblems, timeProblem};
