#!/usr/bin/env python3
"""Рилстерді тексеру: өлшем, кадр саны (күтілгенмен), дауыс ұзақтығы, LUFS, сөз жұптары → out/check_reels.jpg"""
import glob, math, re, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from common import FF, FP, OUT, SRC, WORK, load, meta

FPS = meta()['fps']; D = load(SRC / 'reels_data.json'); R = load(SRC / 'reels.json'); S = load(SRC / 'sync.json')


def toF(d, t):
    o = 0
    for a, b in d['segs']:
        if t < a:
            return o
        if t < b:
            return o + math.ceil((t - a) * FPS)
        o += round((b - a) * FPS)
    return o


inp = []
for rid in R:
    p = (glob.glob(str(OUT / 'reels' / f'{rid}_*.mp4')) or [None])[0]
    if not p:
        print(rid, 'файл жоқ'); continue
    d = D[rid]
    want = sum(round((b - a) * FPS) for a, b in d['segs'])
    v = subprocess.run([FP, '-v', 'error', '-select_streams', 'v', '-count_frames', '-show_entries', 'stream=width,height,nb_read_frames', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip()
    au = subprocess.run([FP, '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip()
    lu = re.search(r'Input Integrated:\s+(\S+)', subprocess.run([FF, '-hide_banner', '-i', p, '-map', '0:a', '-af', 'loudnorm=print_format=summary', '-f', 'null', '-'], capture_output=True, text=True).stderr)
    print(rid, Path(p).name, v, 'күтілген', want, 'дауыс', au, 'LUFS', lu.group(1) if lu else '?')
    # рилстегі ең соңғы сөйлемнің соңғы сөзі
    ks = [k for k in S if any(a <= S[k]['t'][-1] < b for a, b in d['segs'])]
    if ks:
        k = max(ks, key=lambda k: S[k]['t'][-1]); n = toF(d, S[k]['t'][-1])
        for tag, m in (('a', n - 1), ('b', min(n + 10, want - 1))):
            q = WORK / f'rchk_{rid}{tag}.jpg'
            subprocess.run([FF, '-v', 'error', '-y', '-ss', str((m + .5) / FPS), '-i', p, '-frames:v', '1', '-vf', 'scale=216:-1', str(q)])
            inp += ['-i', str(q)]
if inp:
    n = len(inp) // 2
    lay = '|'.join(f'{(c % 12) * 216}_{(c // 12) * 384}' for c in range(n))
    subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', f'xstack=inputs={n}:layout={lay}:fill=black', '-frames:v', '1', str(OUT / 'check_reels.jpg')])
    print('→ out/check_reels.jpg (жұптар: соңғы сөзден 1 кадр бұрын / 10 кадр кейін)')
