#!/usr/bin/env python3
"""Ұзын видеоны тексеру: (1) анимациясыз бөліктер түпнұсқамен кадрға дәл ме; (2) сөз ерте шықпай ма.
→ out/check_words.jpg: әр жұп «сөзден 1 кадр бұрын / 10 кадр кейін». Сол жақта сөз көрінбеуі керек.
"""
import math, random, subprocess, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from common import FF, OUT, SRC, WORK, fr, load, meta

M = meta(); FPS = M['fps']
P = load(SRC / 'plan.json')['scenes']; S = load(SRC / 'sync.json')
OUTV = str(OUT / 'animated.mp4'); SRCV = str(WORK / 'source.mp4')


def grab(p, n, vf='scale=480:270'):
    r = subprocess.run([FF, '-v', 'error', '-ss', str((n + .5) / FPS), '-i', p, '-frames:v', '1', '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    return np.frombuffer(r, np.uint8).astype(float)


bad = []
for a, b in zip(P, P[1:] + [None]):
    end = fr(a['to'], FPS)
    if b and fr(b['from'], FPS) - end < 30:
        continue  # келесі сахна жақын: тексерілетін таза бөлік жоқ
    n = end + 12
    if n >= M['frames']:
        continue
    o = grab(OUTV, n)
    e = {k: np.abs(o - grab(SRCV, n + k)).mean() for k in (-1, 0, 1)}
    k = min(e, key=e.get)
    if k != 0:
        bad.append((a['id'], k, round(e[0], 2)))
print('таза бөлік ығысуы:', bad or 'жоқ')
keys = [k for k in S if any(s['from'] <= S[k]['t'][0] < s['to'] for s in P)]
random.seed(1)
pick = random.sample(keys, min(8, len(keys)))
inp = []
for i, k in enumerate(pick):
    j = len(S[k]['t']) - 1
    n = math.ceil(S[k]['t'][j] * FPS)
    for tag, m in (('a', n - 1), ('b', n + 10)):
        q = WORK / f'chk_{i}{tag}.jpg'
        subprocess.run([FF, '-v', 'error', '-y', '-ss', str((m + .5) / FPS), '-i', OUTV, '-frames:v', '1', '-vf', 'scale=480:-1', str(q)])
        inp += ['-i', str(q)]
    print(f'  {i}: {k} соңғы сөз «{S[k]["text"].split()[j]}» @ {S[k]["t"][j]}')
lay = '|'.join(f'{(c % 4) * 480}_{(c // 4) * 270}' for c in range(len(inp) // 2))
subprocess.run([FF, '-v', 'error', '-y'] + inp + ['-filter_complex', f'xstack=inputs={len(inp) // 2}:layout={lay}', '-frames:v', '1', str(OUT / 'check_words.jpg')])
print('→ out/check_words.jpg (әр жұпта сол жақта соңғы сөз әлі жоқ, оң жақта бар)')
