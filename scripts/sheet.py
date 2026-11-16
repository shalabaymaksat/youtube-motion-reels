#!/usr/bin/env python3
"""Stills → контакт парақтары (out/sheet_N.jpg), қарап тексеру үшін.
  python3 scripts/sheet.py          # ұзын видео сахналары, 12-ден
  python3 scripts/sheet.py reels    # рилстер, әр қатарда бір рилстің 8 кадры
"""
import subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from common import FF, OUT, SRC, load

reels = len(sys.argv) > 1 and sys.argv[1] == 'reels'
outs = []
if reels:
    ids = list(load(SRC / 'reels.json'))
    for b in range(0, len(ids), 4):
        files = [OUT / 'stills' / 'reels' / f'{i}_{k}.jpg' for i in ids[b:b + 4] for k in range(8)]
        files = [f for f in files if f.exists()]
        if not files:
            continue
        inp = sum([['-i', str(f)] for f in files], [])
        fc = ''.join(f'[{n}:v]scale=216:384[v{n}];' for n in range(len(files))) + ''.join(f'[v{n}]' for n in range(len(files)))
        fc += f'xstack=inputs={len(files)}:layout=' + '|'.join(f'{(n % 8) * 216}_{(n // 8) * 384}' for n in range(len(files))) + ':fill=black'
        o = OUT / f'rsheet_{b // 4}.jpg'
        subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', fc, '-frames:v', '1', str(o)], check=True)
        outs.append(o)
else:
    ids = [s['id'] for s in load(SRC / 'plan.json')['scenes']]
    for b in range(0, len(ids), 12):
        part = [i for i in ids[b:b + 12] if (OUT / 'stills' / f'{i}.jpg').exists()]
        if not part:
            continue
        inp = sum([['-i', str(OUT / 'stills' / f'{i}.jpg')] for i in part], [])
        fc = ''.join(f"[{n}:v]scale=640:360,drawtext=text='{i}':x=8:y=8:fontsize=24:fontcolor=yellow:box=1:boxcolor=black[v{n}];" for n, i in enumerate(part))
        fc += ''.join(f'[v{n}]' for n in range(len(part))) + f'xstack=inputs={len(part)}:layout=' + '|'.join(f'{(n % 3) * 640}_{(n // 3) * 360}' for n in range(len(part))) + ':fill=black'
        o = OUT / f'sheet_{b // 12}.jpg'
        r = subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', fc, '-frames:v', '1', str(o)])
        if r.returncode:  # drawtext жоқ ffmpeg
            fc = fc.replace(',drawtext', '[x];[x]null').split(';')
            subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', ';'.join(fc), '-frames:v', '1', str(o)])
        outs.append(o)
print('\n'.join(map(str, outs)))
