// Minutage d'une narration figée : passe des millisecondes mesurées sur les WAV aux images.
// La durée vient toujours de la voix ; aucun passage n'est raccourci pour tenir dans un minutage.
import {msToFrames} from '../design/format';

export type Word = {text: string; startMs: number; endMs: number};

export type Cue = {
  id: string;
  text: string;
  voice: string;
  pauseAfterFrames: number;
  keywords: string[];
  audio?: {src: string; seconds: number; durationInFrames: number; words: Word[]};
};

export type TimedWord = Word & {from: number; to: number; keyword: boolean};
export type TimedCue = Omit<Cue, 'audio'> & {
  audio: NonNullable<Cue['audio']>;
  from: number;
  to: number;
  words: TimedWord[];
};
export type Timeline = {cues: TimedCue[]; durationInFrames: number};

/** Forme comparable d'un mot : minuscules, sans ponctuation ni espaces. */
export const normalizeWord = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, '');

export const buildTimeline = (cues: Cue[], leadFrames: number): Timeline => {
  let cursor = leadFrames;
  const timed = cues.map((cue): TimedCue => {
    if (!cue.audio) {
      throw new Error(`Narration « ${cue.id} » sans voix figée : lancer scripts/prepare-audio.py.`);
    }
    const from = cursor;
    const to = from + cue.audio.durationInFrames;
    cursor = to + cue.pauseAfterFrames;
    const keywords = cue.keywords.map(normalizeWord);
    return {
      ...cue,
      audio: cue.audio,
      from,
      to,
      words: cue.audio.words.map((w) => ({
        ...w,
        from: from + msToFrames(w.startMs),
        to: from + msToFrames(w.endMs),
        keyword: keywords.includes(normalizeWord(w.text)),
      })),
    };
  });
  return {cues: timed, durationInFrames: cursor};
};

export const cueById = (timeline: Timeline, id: string) => {
  const cue = timeline.cues.find((c) => c.id === id);
  if (!cue) throw new Error(`Passage de narration inconnu : ${id}`);
  return cue;
};

/** Image où la voix prononce la n-ième occurrence d'un mot dans un passage. */
export const wordFrame = (timeline: Timeline, cueId: string, word: string, occurrence = 1) => {
  const matches = cueById(timeline, cueId).words.filter((w) => normalizeWord(w.text) === normalizeWord(word));
  const match = matches[occurrence - 1];
  if (!match) throw new Error(`Mot « ${word} » (occurrence ${occurrence}) absent du passage ${cueId}`);
  return match.from;
};
