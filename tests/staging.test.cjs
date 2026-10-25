const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {stagingProblems, timeProblem} = require('../scripts/lib/staging.cjs');

const root = path.resolve(__dirname, '..');
const episode = JSON.parse(fs.readFileSync(path.join(root, 'content/episodes/fonds-marins.json'), 'utf8'));
const decors = ['ocean', 'rue-haussmannienne'];
const clone = (x) => JSON.parse(JSON.stringify(x));

test("la mise en scène d'un épisode validé est conforme", () => {
  assert.deepEqual(stagingProblems(episode, {decors}), []);
});

test('les repères de temps acceptent passage, mot, occurrence, décalage et interpolation', () => {
  const n = episode.narration;
  for (const ref of ['start', 'end-26', 'sonar', 'sonar.end', 'lumiere:200', 'fosse:000-4', 'resultat:28,7-6', 'sonar+6..resultat+46@0.5', 120]) {
    assert.equal(timeProblem(ref, n), null, String(ref));
  }
});

test('un repère sur un mot non prononcé est refusé', () => {
  const broken = clone(episode);
  broken.staging.owl.hops.push('lumiere:300');
  broken.staging.camera[1].at = 'inconnu+4';
  const problems = stagingProblems(broken, {decors});
  assert.ok(problems.some((p) => p.includes('mot « 300 »')));
  assert.ok(problems.some((p) => p.includes('passage « inconnu »')));
});

test('une annotation jamais affichée, un décor ou une pose inconnus sont refusés', () => {
  const broken = clone(episode);
  broken.staging.widgets = broken.staging.widgets.filter((w) => w.kind !== 'bar');
  broken.staging.decor = 'lune';
  broken.staging.owl.poses.push(['lune', 'danse', 0]);
  const problems = stagingProblems(broken, {decors});
  assert.ok(problems.some((p) => p.includes('« carte » jamais affichée')));
  assert.ok(problems.some((p) => p.includes('décor « lune »')));
  assert.ok(problems.some((p) => p.includes('pose inconnue « danse »')));
});
