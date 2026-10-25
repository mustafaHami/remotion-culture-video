const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {narrationProblems, audioKey} = require('../scripts/lib/content.cjs');

const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const essai = JSON.parse(fs.readFileSync(path.join(root, 'content/essais/styles-paris.json'), 'utf8'));
const clone = (x) => JSON.parse(JSON.stringify(x));

test("l'essai de styles a une voix figée conforme au texte et ses sources", () => {
  assert.deepEqual(narrationProblems(essai, {publicDir}), []);
});

test('un texte modifié sans nouvelle synthèse est refusé', () => {
  const changed = clone(essai);
  changed.narration[1].text = changed.narration[1].text.replace('1859', '1860');
  const problems = narrationProblems(changed, {publicDir});
  assert.ok(problems.some((p) => p.includes('voix périmée')));
  assert.ok(problems.some((p) => p.includes('ne reproduisent pas')));
});

test('une voix absente arrête la production', () => {
  const silent = clone(essai);
  delete silent.narration[0].audio;
  assert.ok(narrationProblems(silent, {publicDir}).some((p) => p.includes('voix non figée')));
});

test('une annotation doit viser un mot réellement prononcé', () => {
  const wrong = clone(essai);
  wrong.annotations.find((a) => a.id === 'hauteur').occurrence = 3;
  assert.ok(narrationProblems(wrong, {publicDir}).some((p) => p.includes('annotation hauteur')));
});

test('au moins deux sources complètes sont exigées', () => {
  const thin = clone(essai);
  thin.sources = thin.sources.slice(0, 1);
  assert.ok(narrationProblems(thin, {publicDir}).some((p) => p.includes('deux sources')));
});

test('la clé audio suit la voix, le débit et le texte', () => {
  const cue = essai.narration[0];
  assert.equal(audioKey(cue), path.basename(cue.audio.src, '.wav'));
  assert.notEqual(audioKey({...cue, rate: '+10%'}), audioKey(cue));
});

test('chaque vidéo déclare un style officiel (A, B ou D)', () => {
  const episode = {...clone(essai), kind: 'episode', look: 'B'};
  delete episode.looks;
  assert.deepEqual(narrationProblems(episode, {publicDir}), []);
  assert.ok(narrationProblems({...episode, look: 'C'}, {publicDir}).some((p) => p.includes('style absent ou inconnu')));
  const sansStyle = clone(episode);
  delete sansStyle.look;
  assert.ok(narrationProblems(sansStyle, {publicDir}).some((p) => p.includes('style absent ou inconnu')));
});
