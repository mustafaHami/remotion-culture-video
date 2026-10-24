const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {syncSkills} = require('../scripts/lib/skills.cjs');

const SKILL = '---\nname: verifier-video\ndescription: Contrôler un rendu.\n---\n\nÉtapes.\n';

function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skills-'));
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true});
    fs.writeFileSync(path.join(root, file), text);
  }
  return root;
}

test('aucun skill : la vérification réussit', () => {
  const root = workspace({'.agents/skills/README.md': 'x', '.claude/skills/README.md': 'y'});
  assert.deepEqual(syncSkills(root, {check: true}), {skills: [], problems: []});
});

test('un skill non copié est signalé, puis la synchronisation le corrige', () => {
  const root = workspace({
    '.agents/skills/verifier-video/SKILL.md': SKILL,
    '.agents/skills/verifier-video/references/grille.md': 'grille',
  });
  assert.equal(syncSkills(root, {check: true}).problems.length, 2);
  assert.deepEqual(syncSkills(root, {check: false}).problems, []);
  assert.equal(fs.readFileSync(path.join(root, '.claude/skills/verifier-video/references/grille.md'), 'utf8'), 'grille');
  assert.deepEqual(syncSkills(root, {check: true}).problems, []);
});

test('une copie Claude modifiée ou orpheline est refusée', () => {
  const root = workspace({
    '.agents/skills/verifier-video/SKILL.md': SKILL,
    '.claude/skills/verifier-video/SKILL.md': SKILL + 'modifié localement',
    '.claude/skills/skill-fantome/SKILL.md': SKILL,
  });
  const {problems} = syncSkills(root, {check: true});
  assert.ok(problems.some((p) => p.includes('non synchronisé')));
  assert.ok(problems.some((p) => p.includes('orphelin') && p.includes('skill-fantome')));
});

test("l'en-tête du skill doit déclarer son nom et sa description", () => {
  const root = workspace({'.agents/skills/verifier-video/SKILL.md': '---\nname: autre-nom\n---\n'});
  const {problems} = syncSkills(root, {check: false});
  assert.ok(problems.some((p) => p.includes('différent du nom du dossier')));
  assert.ok(problems.some((p) => p.includes('description absent')));
});
