"""Fige la narration d'un fichier de contenu : WAV + minutage mot à mot.

Usage : .venv/Scripts/python scripts/prepare-audio.py --content content/essais/styles-paris.json

Pour chaque passage de `narration`, synthétise la voix avec edge-tts (si elle n'est pas déjà
en cache dans public/audio), mesure sa durée, récupère le minutage de chaque mot et écrit le
tout dans le fichier de contenu (`audio`). Un rendu ne fait que lire ces données.
Une panne de synthèse arrête la préparation : on ne produit jamais un passage muet.
"""
from pathlib import Path
import argparse, array, asyncio, hashlib, io, json, math, re, shutil, subprocess, sys, unicodedata, wave

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'public' / 'audio'
FPS = 30
RATE = 24000
LEAD_MS = 120   # silence conservé avant la voix
TAIL_MS = 160   # silence conservé après la voix


def ffmpeg():
    found = shutil.which('ffmpeg')
    if found:
        return found
    name = 'ffmpeg.exe' if sys.platform == 'win32' else 'ffmpeg'
    for path in (ROOT / 'node_modules' / '@remotion').glob(f'compositor-*/{name}'):
        if ('win32' in str(path)) == (sys.platform == 'win32'):
            return str(path)
    raise RuntimeError('FFmpeg introuvable : lancer npm ci (FFmpeg de Remotion) ou installer FFmpeg.')


def tts_text(text):
    # La synthèse lit mieux l'apostrophe droite ; le texte affiché garde l'apostrophe typographique.
    return text.replace('’', "'")


def normalize(text):
    text = unicodedata.normalize('NFKC', tts_text(text)).lower()
    return re.sub(r"[^\w']", '', text)


async def synthesize(text, voice, rate):
    """Renvoie (mp3, mots) ; mots = [(texte, début_ms, fin_ms)] relatifs au début de l'audio."""
    for attempt in range(3):
        try:
            mp3, words = bytearray(), []
            communicate = edge_tts.Communicate(tts_text(text), voice=voice, rate=rate, boundary='WordBoundary')
            async for chunk in communicate.stream():
                if chunk['type'] == 'audio':
                    mp3.extend(chunk['data'])
                elif chunk['type'] == 'WordBoundary':
                    start = chunk['offset'] / 10_000
                    words.append((chunk['text'], start, start + chunk['duration'] / 10_000))
            if not mp3 or not words:
                raise RuntimeError('réponse vide de la synthèse vocale')
            return bytes(mp3), words
        except Exception:
            if attempt == 2:
                raise
            await asyncio.sleep(2)


def decode(mp3):
    raw = subprocess.run(
        [ffmpeg(), '-v', 'error', '-i', '-', '-c:a', 'pcm_s16le', '-f', 'wav', '-ac', '1', '-ar', str(RATE), '-'],
        input=mp3, capture_output=True, check=True,
    ).stdout
    with wave.open(io.BytesIO(raw), 'rb') as reader:
        return array.array('h', reader.readframes(reader.getnframes()))


def trim(pcm):
    """Coupe les silences de début et de fin ; renvoie (pcm, millisecondes coupées au début)."""
    window = RATE // 100
    active = [i for i in range(0, len(pcm), window)
              if math.sqrt(sum(v * v for v in pcm[i:i + window]) / max(1, len(pcm[i:i + window]))) > 120]
    if not active:
        raise ValueError('La voix générée est muette.')
    start = max(0, active[0] - LEAD_MS * RATE // 1000)
    end = min(len(pcm), active[-1] + window + TAIL_MS * RATE // 1000)
    return pcm[start:end], start * 1000 / RATE


def align(text, words):
    """Associe les mots minutés aux mots affichés (séparés par des espaces), ponctuation comprise."""
    tokens = text.split()
    # Texte normalisé continu et, pour chaque caractère, l'indice du mot affiché d'origine.
    joined, owner = '', []
    for i, token in enumerate(tokens):
        key = normalize(token)
        joined += key
        owner += [i] * len(key)
    timed, cursor = {}, 0
    for spoken, start, end in words:
        target = normalize(spoken)
        if not target:
            continue
        found = joined.find(target, cursor)
        if found < 0:
            raise ValueError(f'Mot minuté introuvable dans le texte : « {spoken} »')
        cursor = found + len(target)
        # Un mot minuté peut couvrir plusieurs mots affichés (« 20 mètres ») : durée répartie
        # au prorata du nombre de caractères.
        span = owner[found:cursor]
        pieces = [(i, span.count(i)) for i in dict.fromkeys(span)]
        at = start
        for i, count in pieces:
            until = at + (end - start) * count / len(span)
            if i in timed:
                timed[i]['endMs'] = until
            else:
                timed[i] = {'startMs': at, 'endMs': until}
            at = until
    out = []
    for i, token in enumerate(tokens):
        if i in timed:
            out.append({'text': token, 'startMs': timed[i]['startMs'], 'endMs': timed[i]['endMs']})
        elif out:
            # Ponctuation isolée (« ? », « : ») : rattachée au mot précédent par une espace insécable.
            out[-1]['text'] += ' ' + token
        else:
            raise ValueError(f'Le texte commence par un élément non prononcé : « {token} »')
    return out


async def prepare_cue(cue, provenance):
    voice, rate, text = cue['voice'], cue.get('rate', '+0%'), cue['text']
    key = hashlib.sha256(f'{voice}|{rate}|{tts_text(text)}'.encode()).hexdigest()[:16]
    wav_path, words_path = AUDIO / f'{key}.wav', AUDIO / f'{key}.words.json'
    if not (wav_path.exists() and words_path.exists()):
        mp3, raw_words = await synthesize(text, voice, rate)
        pcm, cut_ms = trim(decode(mp3))
        with wave.open(str(wav_path), 'wb') as writer:
            writer.setnchannels(1)
            writer.setsampwidth(2)
            writer.setframerate(RATE)
            writer.writeframes(pcm.tobytes())
        shifted = [(w, max(0.0, s - cut_ms), max(0.0, e - cut_ms)) for w, s, e in raw_words]
        words_path.write_text(json.dumps(shifted, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'  voix synthétisée : {cue["id"]} ({key})', flush=True)
    else:
        print(f'  voix en cache : {cue["id"]} ({key})', flush=True)

    with wave.open(str(wav_path), 'rb') as reader:
        seconds = reader.getnframes() / reader.getframerate()
    words = align(text, json.loads(words_path.read_text(encoding='utf-8')))
    if words[-1]['endMs'] / 1000 > seconds + 0.05:
        raise ValueError(f'Minutage incohérent pour {cue["id"]} : dernier mot après la fin du WAV.')
    cue['audio'] = {
        'src': f'audio/{wav_path.name}',
        'seconds': round(seconds, 3),
        'durationInFrames': math.ceil(seconds * FPS),
        'words': [{**w, 'startMs': round(w['startMs']), 'endMs': round(w['endMs'])} for w in words],
    }
    provenance[key] = {
        'text': tts_text(text), 'voice': voice, 'rate': rate,
        'seconds': round(seconds, 3), 'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest(),
    }


async def prepare(path):
    content = json.loads(path.read_text(encoding='utf-8'))
    AUDIO.mkdir(parents=True, exist_ok=True)
    meta_path = AUDIO / 'provenance.json'
    provenance = json.loads(meta_path.read_text(encoding='utf-8')) if meta_path.exists() else {}
    print(f'{content["id"]} :', flush=True)
    for cue in content['narration']:
        await prepare_cue(cue, provenance)
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    meta_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    total = sum(c['audio']['seconds'] for c in content['narration'])
    print(f'{len(content["narration"])} passage(s) figé(s), {total:.2f} s de voix.', flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('--content', type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(prepare(args.content.resolve()))
