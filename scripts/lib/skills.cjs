// Synchronisation des skills : .agents/skills (source de vérité) -> .claude/skills (copie).
// Seuls les sous-dossiers sont des skills ; les fichiers à la racine (README.md) sont ignorés.
const fs = require('node:fs');
const path = require('node:path');

const SOURCE = '.agents/skills';
const TARGET = '.claude/skills';

function subdirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function filesIn(dir, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...filesIn(path.join(dir, entry.name), relative));
    else files.push(relative);
  }
  return files.sort();
}

// Vérifie l'en-tête YAML minimal attendu par Claude Code et Codex.
function frontmatterProblems(name, text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return [`Skill ${name} : en-tête YAML (---) absent dans SKILL.md`];
  const problems = [];
  const declared = /^name:\s*(.+)$/m.exec(match[1]);
  if (!declared) problems.push(`Skill ${name} : champ name absent`);
  else if (declared[1].trim() !== name) problems.push(`Skill ${name} : name « ${declared[1].trim()} » différent du nom du dossier`);
  if (!/^description:\s*\S/m.test(match[1])) problems.push(`Skill ${name} : champ description absent`);
  return problems;
}

// Renvoie la liste des écarts. En mode écriture (check=false), copie d'abord la source
// vers la cible ; les skills orphelins côté Claude ne sont jamais supprimés automatiquement.
function syncSkills(root, {check}) {
  const source = path.join(root, SOURCE);
  const target = path.join(root, TARGET);
  const problems = [];
  const skills = subdirectories(source);

  for (const name of skills) {
    const from = path.join(source, name);
    const to = path.join(target, name);
    const skillFile = path.join(from, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      problems.push(`Skill ${name} : SKILL.md absent dans ${SOURCE}/${name}`);
      continue;
    }
    problems.push(...frontmatterProblems(name, fs.readFileSync(skillFile, 'utf8')));

    const expected = filesIn(from);
    if (!check) {
      for (const file of expected) {
        fs.mkdirSync(path.dirname(path.join(to, file)), {recursive: true});
        fs.copyFileSync(path.join(from, file), path.join(to, file));
      }
      for (const file of filesIn(to)) if (!expected.includes(file)) fs.rmSync(path.join(to, file));
    }
    for (const file of expected) {
      const copy = path.join(to, file);
      if (!fs.existsSync(copy) || !fs.readFileSync(copy).equals(fs.readFileSync(path.join(from, file)))) {
        problems.push(`Skill Claude non synchronisé : ${name}/${file}`);
      }
    }
    for (const file of filesIn(to)) {
      if (!expected.includes(file)) problems.push(`Fichier en trop dans ${TARGET}/${name} : ${file}`);
    }
  }

  for (const name of subdirectories(target)) {
    if (!skills.includes(name)) problems.push(`Skill Claude orphelin (absent de ${SOURCE}) : ${name}`);
  }
  return {skills, problems};
}

module.exports = {syncSkills, SOURCE, TARGET};
