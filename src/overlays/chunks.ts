// Découpage des sous-titres en morceaux courts, partagé par toutes les compositions.
import type {TimedWord} from '../content/timeline';

const MAX_CHARS = 28;
const isWeakEnding = (text: string) => /^[\p{N}]+$/u.test(text) || text.length <= 3;
const endsClause = (text: string) => /[,.:;?!]$/.test(text);

/** Découpe en morceaux d'une ligne ou deux, sans finir sur un petit mot ou un nombre. */
export const chunkWords = (words: TimedWord[]): TimedWord[][] => {
  const chunks: TimedWord[][] = [];
  let current: TimedWord[] = [];
  const length = (ws: TimedWord[]) => ws.reduce((n, w) => n + w.text.length + 1, -1);
  for (const word of words) {
    if (current.length && length([...current, word]) > MAX_CHARS) {
      const carried: TimedWord[] = [];
      while (current.length > 1 && isWeakEnding(current[current.length - 1].text)) carried.unshift(current.pop()!);
      chunks.push(current);
      current = carried;
    }
    current.push(word);
    if (endsClause(word.text)) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
};
