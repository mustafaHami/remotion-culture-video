"""Fige la narration d'un fichier de contenu : WAV + minutage mot à mot.

Usage : .venv/Scripts/python scripts/prepare-audio.py --content content/essais/styles-paris.json

Pour chaque passage de `narration`, synthétise la voix (si elle n'est pas déjà en cache dans
public/audio), mesure sa durée, récupère le minutage de chaque mot et écrit le tout dans le
fichier de contenu (`audio`). Un rendu ne fait que lire ces données.
Une panne de synthèse arrête la préparation : on ne produit jamais un passage muet.

Champ `voice` d'un passage :
  "elevenlabs:<modèle>:<identifiant de voix>"  ElevenLabs (clé ELEVENLABS_API_KEY dans .env, jamais versionnée)
  "fr-FR-DeniseNeural"                        edge-tts (nom de voix Microsoft)
Le champ `rate` (« +0% », « +10% »…) règle le débit dans les deux cas.
"""
from pathlib import Path
import argparse, array, asyncio, base64, hashlib, io, json, math, os, re, shutil, subprocess, sys, unicodedata, urllib.error, urllib.request, wave

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'public' / 'audio'
FPS = 30
RATE = 24000
LEAD_MS = 120   # silence conservé avant la voix
TAIL_MS = 160   # silence conservé après la voix
# ElevenLabs : réglages fixes de la voix (les changer impose de changer le champ `voice` pour refaire les WAV).
ELEVEN_SETTINGS = {'stability': 0.5, 'similarity_boost': 0.75, 'style': 0.0, 'use_speaker_boost': True}
ELEVEN_SEED = 1859
# Voix de secours (la voix d'origine du projet), utilisée pour TOUT l'épisode quand ElevenLabs refuse faute de crédits
# ou d'abonnement : jamais de mélange de deux voix dans une même vidéo.
FALLBACK_VOICE, FALLBACK_RATE = 'fr-FR-DeniseNeural', '+0%'


class CreditsExhausted(RuntimeError):
    """ElevenLabs refuse la génération faute de crédits ou d'abonnement : on bascule sur la voix de secours."""


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


def api_key():
    """Clé ElevenLabs : variable d'environnement, sinon fichier .env à la racine (exclu de Git)."""
    key = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    env = ROOT / '.env'
    if not key and env.exists():
        for line in env.read_text(encoding='utf-8').splitlines():
            name, _, value = line.partition('=')
            if name.strip() == 'ELEVENLABS_API_KEY':
                key = value.strip().strip('"\'')
    if not key:
        raise RuntimeError('Clé ElevenLabs absente : ajouter ELEVENLABS_API_KEY=… dans .env (voir .env.example).')
    return key


def speed_of(rate):
    """« +10% » → 1.1 ; ElevenLabs accepte 0,7 à 1,2."""
    return max(0.7, min(1.2, 1 + int(rate.rstrip('%')) / 100))


def words_from_alignment(alignment):
    """Caractères minutés d'ElevenLabs → [(mot, début_ms, fin_ms)], un mot = suite de caractères sans espace."""
    words, current = [], None
    for char, start, end in zip(alignment['characters'], alignment['character_start_times_seconds'], alignment['character_end_times_seconds']):
        if char.isspace():
            if current:
                words.append(current)
            current = None
        elif current is None:
            current = [char, start * 1000, end * 1000]
        else:
            current[0] += char
            current[2] = end * 1000
    if current:
        words.append(current)
    return [tuple(w) for w in words]


def synthesize_elevenlabs(text, voice, rate, context):
    """Renvoie (pcm 24 kHz mono, mots) ; `context` = textes voisins, pour une intonation continue."""
    _, model, voice_id = voice.split(':')
    body = {
        'text': tts_text(text), 'model_id': model, 'seed': ELEVEN_SEED,
        'voice_settings': {**ELEVEN_SETTINGS, 'speed': speed_of(rate)},
        'previous_text': tts_text(context[0]) if context[0] else None, 'next_text': tts_text(context[1]) if context[1] else None,
    }
    request = urllib.request.Request(
        f'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format=pcm_{RATE}',
        data=json.dumps({k: v for k, v in body.items() if v is not None}).encode(),
        headers={'xi-api-key': api_key(), 'Content-Type': 'application/json'},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read())
            pcm = array.array('h', base64.b64decode(data['audio_base64']))
            words = words_from_alignment(data['alignment'])
            if not pcm or not words:
                raise RuntimeError('réponse vide de la synthèse vocale')
            return pcm, words
        except urllib.error.HTTPError as error:
            # Erreurs de requête (clé, voix, quota) : inutile de réessayer ; le message d'ElevenLabs est affiché.
            if error.code < 500 or attempt == 2:
                message = error.read().decode(errors='replace')[:400]
                if error.code == 402 or any(word in message for word in ('quota_exceeded', 'paid_plan_required', 'payment_required')):
                    raise CreditsExhausted(f'ElevenLabs {error.code} : {message}') from None
                raise RuntimeError(f'ElevenLabs {error.code} : {message}') from None
        except Exception:
            if attempt == 2:
                raise


async def synthesize(text, voice, rate):
    """Renvoie (mp3, mots) ; mots = [(texte, début_ms, fin_ms)] relatifs au début de l'audio."""
    import edge_tts
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


async def prepare_cue(cue, provenance, context=(None, None)):
    voice, rate, text = cue['voice'], cue.get('rate', '+0%'), cue['text']
    key = hashlib.sha256(f'{voice}|{rate}|{tts_text(text)}'.encode()).hexdigest()[:16]
    wav_path, words_path = AUDIO / f'{key}.wav', AUDIO / f'{key}.words.json'
    if not (wav_path.exists() and words_path.exists()):
        if voice.startswith('elevenlabs:'):
            raw_pcm, raw_words = synthesize_elevenlabs(text, voice, rate, context)
        else:
            mp3, raw_words = await synthesize(text, voice, rate)
            raw_pcm = decode(mp3)
        pcm, cut_ms = trim(raw_pcm)
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
    if words[-1]['startMs'] / 1000 > seconds:
        raise ValueError(f'Minutage incohérent pour {cue["id"]} : dernier mot après la fin du WAV.')
    # ElevenLabs compte la ponctuation finale dans la durée du dernier mot : la fin est ramenée à celle du WAV.
    for w in words:
        w['endMs'] = min(w['endMs'], seconds * 1000)
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
    cues = content['narration']

    async def run():
        for i, cue in enumerate(cues):
            context = (cues[i - 1]['text'] if i else None, cues[i + 1]['text'] if i + 1 < len(cues) else None)
            await prepare_cue(cue, provenance, context)

    try:
        await run()
    except CreditsExhausted as error:
        # Plus de crédits ElevenLabs : tout l'épisode passe sur la voix de secours (écrite dans le fichier, donc visible).
        print(f'ATTENTION : {error}\n  → épisode entier préparé avec la voix de secours {FALLBACK_VOICE}.', file=sys.stderr, flush=True)
        for cue in cues:
            cue['voice'], cue['rate'] = FALLBACK_VOICE, FALLBACK_RATE
        await run()
    path.write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    meta_path.write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    total = sum(c['audio']['seconds'] for c in content['narration'])
    print(f'{len(content["narration"])} passage(s) figé(s), {total:.2f} s de voix.', flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('--content', type=Path, required=True)
    args = parser.parse_args()
    try:
        asyncio.run(prepare(args.content.resolve()))
    except RuntimeError as error:
        # Panne de synthèse (clé absente, abonnement, quota…) : message clair, rien n'est écrit dans l'épisode.
        print(f'Préparation arrêtée : {error}', file=sys.stderr)
        sys.exit(1)
