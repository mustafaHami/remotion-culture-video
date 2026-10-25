// Contrôle des fichiers de contenu (content/episodes, content/essais) : voix figée cohérente avec le
// texte affiché, annotations accrochées à un mot réellement prononcé, sources présentes.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const FPS = 30;
// Styles officiels (src/design/looks.ts) : chaque vidéo choisit le sien.
const LOOK_IDS = ['A', 'B', 'D'];
const ttsText = (text) => text.replace(/’/g, "'");
const normalizeWord = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '');

// Même clé que scripts/prepare-audio.py : un texte modifié sans nouvelle voix est détecté.
const audioKey = (cue) =>
  crypto.createHash('sha256').update(`${cue.voice}|${cue.rate ?? '+0%'}|${ttsText(cue.text)}`).digest('hex').slice(0, 16);

function narrationProblems(content, {publicDir, checkFiles = true}) {
  const problems = [];
  const label = content.id ?? '(sans id)';
  for (const cue of content.narration ?? []) {
    const where = `${label}/${cue.id}`;
    const audio = cue.audio;
    if (!audio) {
      problems.push(`${where} : voix non figée (lancer scripts/prepare-audio.py)`);
      continue;
    }
    if (!/^audio\/[0-9a-f]{16}\.wav$/.test(audio.src)) problems.push(`${where} : chemin audio inattendu ${audio.src}`);
    else if (path.basename(audio.src, '.wav') !== audioKey(cue)) problems.push(`${where} : voix périmée, le texte a changé depuis la synthèse`);
    if (checkFiles && !fs.existsSync(path.join(publicDir, audio.src))) problems.push(`${where} : fichier absent ${audio.src}`);
    const shown = audio.words.map((w) => w.text).join(' ').replace(/ /g, ' ');
    if (shown !== cue.text) problems.push(`${where} : les mots minutés ne reproduisent pas le texte prononcé`);
    if (audio.durationInFrames !== Math.ceil(audio.seconds * FPS)) problems.push(`${where} : durée en images incohérente`);
    let previous = -1;
    for (const w of audio.words) {
      if (w.startMs < previous || w.endMs < w.startMs) problems.push(`${where} : minutage non croissant à « ${w.text} »`);
      previous = w.startMs;
    }
    const last = audio.words[audio.words.length - 1];
    if (last && last.endMs > audio.seconds * 1000 + 50) problems.push(`${where} : dernier mot après la fin de la voix`);
  }
  for (const a of content.annotations ?? []) {
    const cue = (content.narration ?? []).find((c) => c.id === a.cue);
    const matches = cue?.audio?.words.filter((w) => normalizeWord(w.text) === normalizeWord(a.word)) ?? [];
    if (matches.length < (a.occurrence ?? 1)) problems.push(`${label} : annotation ${a.id} accrochée à un mot absent (« ${a.word} »)`);
  }
  const looks = content.kind === 'essai' ? content.looks ?? [] : [content.look];
  if (!looks.length || looks.some((look) => !LOOK_IDS.includes(look))) {
    problems.push(`${label} : style absent ou inconnu (attendu ${content.kind === 'essai' ? '"looks"' : '"look"'} parmi ${LOOK_IDS.join(', ')})`);
  }
  const sources = (content.sources ?? []).filter((s) => s.url && s.consulted && s.fact);
  if ((content.narration ?? []).length && sources.length < 2) problems.push(`${label} : moins de deux sources complètes (fait, url, date)`);
  return problems;
}

module.exports = {narrationProblems, audioKey, LOOK_IDS};
