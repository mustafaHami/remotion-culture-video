"""Vérifie que chaque police de public/fonts contient les caractères du français.

Usage : .venv/Scripts/python scripts/check-fonts.py   (Linux : .venv/bin/python)
"""
from pathlib import Path
import sys

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / 'public' / 'fonts'

# Indispensables : lettres accentuées, ligatures, ponctuation française, espace insécable (U+00A0).
REQUIRED = (
    'àâäçéèêëîïôöùûüÿæœ'
    'ÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸÆŒ'
    '«»’‘“”–—…°·'
) + chr(0x00A0)
# Utiles mais remplaçables : espace fine insécable (U+202F) et symboles des annotations.
OPTIONAL = chr(0x202F) + '€≤≥→'


def absent(cmap, chars):
    return [f'U+{ord(c):04X}' for c in chars if ord(c) not in cmap]


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    failed = False
    for path in sorted(FONTS.glob('*.[to]tf')):
        cmap = TTFont(path, fontNumber=0).getBestCmap()
        required, optional = absent(cmap, REQUIRED), absent(cmap, OPTIONAL)
        failed = failed or bool(required)
        status = f'ERREUR, absents : {" ".join(required)}' if required else 'caractères français présents'
        note = f' (facultatifs absents : {" ".join(optional)})' if optional else ''
        print(f'{path.name} : {status}{note}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
