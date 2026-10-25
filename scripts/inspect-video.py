"""Contrôle technique de MP4 rendus et planche d'images des moments clés.

Usage :
  .venv/Scripts/python scripts/inspect-video.py --content content/essais/styles-paris.json \\
      --videos output/essais/EssaiStyleA.mp4,output/essais/EssaiStyleB.mp4 --board output/essais/planche.jpg

Vérifie : H.264 1080 × 1920 à 30 i/s, yuv420p, BT.709, AAC, nombre d'images attendu, décodage
complet sans erreur, voix présente sur chaque passage, silence entre les passages, pas de saturation.
Ce contrôle ne remplace ni l'inspection visuelle des images ni l'écoute.
"""
from pathlib import Path
import argparse, array, io, json, math, re, shutil, subprocess, sys, wave

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FPS = 30
# Même règle que src/content/timeline.ts : la voix démarre après LEAD_FRAMES images,
# chaque passage dure sa voix mesurée puis sa pause.
LEAD_FRAMES = 4


def tool(name):
    found = shutil.which(name)
    if found:
        return found
    suffix = '.exe' if sys.platform == 'win32' else ''
    for path in (ROOT / 'node_modules' / '@remotion').glob(f'compositor-*/{name}{suffix}'):
        if ('win32' in str(path)) == (sys.platform == 'win32'):
            return str(path)
    raise RuntimeError(f'{name} introuvable')


def timeline(content):
    cues, cursor = [], LEAD_FRAMES
    for cue in content['narration']:
        audio = cue['audio']
        words = [{**w, 'frame': cursor + round(w['startMs'] * FPS / 1000)} for w in audio['words']]
        cues.append({'id': cue['id'], 'from': cursor, 'to': cursor + audio['durationInFrames'], 'words': words})
        cursor += audio['durationInFrames'] + cue['pauseAfterFrames']
    return cues, cursor


def word_frame(cues, cue_id, word, occurrence=1):
    cue = next(c for c in cues if c['id'] == cue_id)
    # Même normalisation que scripts/lib/content.cjs : minuscules, sans ponctuation ni espaces.
    norm = lambda text: re.sub(r"[^\w'’-]", '', text.lower())
    found = [w for w in cue['words'] if norm(w['text']) == norm(word)]
    return found[occurrence - 1]['frame']


def key_frames(content, cues, total):
    """Première image (vignette), plongée (début du 2e passage), chaque annotation, dernière image."""
    frames = {'vignette': 0, 'plongee': cues[min(1, len(cues) - 1)]['from'] + 30}
    for a in content.get('annotations', []):
        frames[a['id']] = word_frame(cues, a['cue'], a['word'], a.get('occurrence', 1)) + 14
    frames['fin'] = total - 1
    return frames


def probe(video):
    meta = json.loads(subprocess.run([tool('ffprobe'), '-v', 'error', '-show_streams', '-count_frames', '-of', 'json', str(video)],
                                     capture_output=True, check=True).stdout)
    v = next(s for s in meta['streams'] if s['codec_type'] == 'video')
    a = [s for s in meta['streams'] if s['codec_type'] == 'audio']
    return v, a


def audio_pcm(video):
    raw = subprocess.run([tool('ffmpeg'), '-v', 'error', '-xerror', '-i', str(video), '-vn', '-c:a', 'pcm_s16le', '-f', 'wav', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    with wave.open(io.BytesIO(raw), 'rb') as reader:
        return array.array('h', reader.readframes(reader.getnframes()))


def rms(pcm, a, b):
    samples = pcm[round(a * 16000):round(b * 16000)]
    return math.sqrt(sum(v * v for v in samples) / max(1, len(samples))) / 32768


def extract(video, frames, size=(432, 768)):
    # Le FFmpeg minimal de Remotion n'a pas le filtre select : une recherche précise par image.
    w, h = size
    images = []
    for frame in frames:
        raw = subprocess.run([tool('ffmpeg'), '-v', 'error', '-ss', f'{max(0.0, frame / FPS - 0.005):.4f}', '-i', str(video), '-an', '-frames:v', '1',
                              '-vf', f'scale={w}:{h}', '-c:v', 'rawvideo', '-f', 'image2pipe', '-pix_fmt', 'rgb24', '-'],
                             capture_output=True, check=True).stdout
        images.append(Image.frombytes('RGB', size, raw[:w * h * 3]))
    return images


def inspect(video, content):
    cues, total = timeline(content)
    errors = []
    v, audio = probe(video)
    expected = {'codec_name': 'h264', 'width': 1080, 'height': 1920, 'r_frame_rate': '30/1', 'pix_fmt': 'yuv420p', 'color_space': 'bt709'}
    for key, value in expected.items():
        if v.get(key) != value:
            errors.append(f'{key} = {v.get(key)} (attendu {value})')
    frames = int(v.get('nb_read_frames', 0))
    if frames != total:
        errors.append(f'{frames} images (attendu {total})')
    if not any(s['codec_name'] == 'aac' for s in audio):
        errors.append('piste AAC absente')
    # Décodage complet, réduit à 180 × 320 pour rester léger ; chaque image doit sortir entière.
    decode = subprocess.run([tool('ffmpeg'), '-v', 'error', '-xerror', '-i', str(video), '-an', '-vf', 'scale=180:320',
                             '-c:v', 'rawvideo', '-f', 'image2pipe', '-pix_fmt', 'rgb24', '-'], capture_output=True)
    if decode.returncode != 0:
        errors.append('décodage en erreur : ' + decode.stderr.decode(errors='replace')[:300])
    elif len(decode.stdout) != total * 180 * 320 * 3:
        errors.append(f'décodage incomplet : {len(decode.stdout) // (180 * 320 * 3)} images sur {total}')
    pcm = audio_pcm(video)
    voices = []
    for cue in cues:
        energy = rms(pcm, cue['from'] / FPS, cue['to'] / FPS)
        voices.append({'cue': cue['id'], 'from': cue['from'], 'to': cue['to'], 'rms': round(energy, 4)})
        if energy < 0.005:
            errors.append(f'voix absente sur « {cue["id"]} »')
    for a, b in zip(cues, cues[1:]):
        start, end = a['to'] / FPS + 0.12, b['from'] / FPS - 0.12
        if end - start > 0.2 and rms(pcm, start, end) > 0.002:
            errors.append(f'son inattendu entre « {a["id"]} » et « {b["id"]} »')
    peak = max(abs(s) for s in pcm) / 32768
    if peak >= 0.99:
        errors.append(f'saturation (crête {peak:.3f})')
    return {
        'video': str(video.relative_to(ROOT)).replace('\\', '/'),
        'frames': frames,
        'seconds': round(frames / FPS, 2),
        'voices': voices,
        'peak': round(peak, 4),
        'errors': errors,
        'technicalCheck': not errors,
        'visualReview': False,
        'listening': False,
    }, key_frames(content, cues, total)


def board(rows, moments, output):
    w, h, gap, head = 432, 768, 10, 34
    names = list(moments)
    sheet = Image.new('RGB', (len(names) * (w + gap) + 60, len(rows) * (h + gap) + head), '#E9E7ED')
    draw = ImageDraw.Draw(sheet)
    for j, name in enumerate(names):
        draw.text((60 + j * (w + gap) + 8, 8), f'{name} ({moments[name] / FPS:.1f} s)', fill='#1E1B3A', font_size=22)
    for i, (label, images) in enumerate(rows):
        y = head + i * (h + gap)
        draw.text((14, y + h // 2), label, fill='#1E1B3A', font_size=34)
        for j, image in enumerate(images):
            sheet.paste(image, (60 + j * (w + gap), y))
    sheet.save(output, quality=92)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('--content', type=Path, required=True)
    parser.add_argument('--videos', required=True)
    parser.add_argument('--board', type=Path)
    args = parser.parse_args()
    content = json.loads(args.content.read_text(encoding='utf-8'))
    rows, failed = [], False
    for name in args.videos.split(','):
        video = (ROOT / name).resolve()
        report, moments = inspect(video, content)
        video.with_suffix('.inspection.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        status = 'OK' if report['technicalCheck'] else 'ÉCHEC : ' + ' ; '.join(report['errors'])
        print(f'{report["video"]} : {report["frames"]} images, {report["seconds"]} s, crête {report["peak"]} — {status}', flush=True)
        failed = failed or not report['technicalCheck']
        rows.append((video.stem[-1], extract(video, list(moments.values()))))
    if args.board:
        board(rows, moments, args.board)
        print(f'Planche : {args.board}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
