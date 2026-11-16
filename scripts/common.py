"""Ортақ жолдар мен көмекшілер. Барлық скрипт репо түбірінен іске қосылады."""
import json, math, os, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / 'work'
OUT = ROOT / 'out'
TPL = ROOT / 'template'
SRC = TPL / 'src'
PUB = TPL / 'public'
FF = os.environ.get('FFMPEG') or shutil.which('ffmpeg') or 'ffmpeg'
FP = os.environ.get('FFPROBE') or (FF[:-6] + 'ffprobe' if FF.endswith('ffmpeg') else shutil.which('ffprobe') or 'ffprobe')
MARGIN = 0.10  # сөз айтылғаннан кейін ғана көрінеді


def meta():
    return json.loads((SRC / 'meta.json').read_text())


def fr(t, fps):
    # JS Math.round сияқты: Python round() .5-ті жұпқа дөңгелектейді, кадр ығысады
    return math.floor(t * fps + 0.5)


def run(args):
    subprocess.run([FF, '-v', 'error', '-y'] + args, check=True)


def frames(p):
    o = subprocess.run([FP, '-v', 'error', '-select_streams', 'v', '-count_frames', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', str(p)], capture_output=True, text=True).stdout
    return int(o.strip().split(',')[0])


def load(p, default=None):
    p = Path(p)
    return json.loads(p.read_text()) if p.exists() else default


def save(p, obj):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=1))
