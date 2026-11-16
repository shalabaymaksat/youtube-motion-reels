#!/usr/bin/env python3
"""Рилс дайындығы: template/src/reels.json → кідіріс қию, спикер орны, −14 LUFS дауыс.

reels.json: {"r1": {"name": "vagon", "range": [96.5, 133.4], "skip": [[a, b]], "parts": [...]}}
Шығыс: template/src/reels_data.json (кесінділер + спикер шоттары), template/public/reels/<id>.wav,
template/public/sfx/tick.wav. Кесінділер кадрға тұрақтандырылады: сурет пен дауыс ұзындығы бірдей.
"""
import statistics as st, subprocess, sys, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from common import FF, PUB, SRC, WORK, load, meta, save

FPS = meta()['fps']
GAP, PRE, POST = 0.42, 0.08, 0.1
R = load(SRC / 'reels.json') or sys.exit('template/src/reels.json жоқ')
W = load(WORK / 'words.json')
src = str(WORK / 'source.mp4')
(PUB / 'reels').mkdir(parents=True, exist_ok=True); (PUB / 'sfx').mkdir(parents=True, exist_ok=True)

# Тықыл: синтезделеді, сыртқы файл керек емес
sr = 48000; t = np.arange(int(sr * 0.05)) / sr
tk = (np.sin(2 * np.pi * 1500 * t) * 0.7 + np.sin(2 * np.pi * 2900 * t) * 0.3) * np.exp(-t * 120) * 0.5
with wave.open(str(PUB / 'sfx' / 'tick.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((tk * 32767).astype(np.int16).tobytes())


def speaker(A, B):
    """Шот кесулері және спикер орны. Фон қозғалмайды, сондықтан қозғалыс картасының ортасы = спикер."""
    o = subprocess.run([FF, '-v', 'error', '-ss', str(A), '-t', str(B - A), '-i', src, '-vf', 'fps=10,scale=320:180', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    g = np.frombuffer(o, np.uint8).reshape(-1, 180, 320).astype(np.float32)
    d = np.abs(np.diff(g, axis=0))
    m = d.mean(axis=(1, 2))
    edges = [0] + [int(j) + 1 for j in np.where(m > 12)[0] if j > 0] + [len(g)]
    res = []
    for a, b in zip(edges, edges[1:]):
        if b - a < 8:
            continue
        e = (d[a:b - 1] > 8).sum(axis=0).astype(np.float32)
        cs = np.cumsum(e[:90].sum(axis=0))
        cx = float(np.searchsorted(cs, cs[-1] * 0.5) / 320) if cs[-1] else 0.5
        row = e[:, max(int(cx * 320) - 50, 0):int(cx * 320) + 50].sum(axis=1)
        rs = np.cumsum(row)
        top = float(np.searchsorted(rs, rs[-1] * 0.02) / 180) if rs[-1] else 0.15
        res.append({'from': round(A + a / 10, 2), 'to': round(A + b / 10, 2), 'cx': round(cx, 3), 'top': round(top, 3)})
    if not res:
        res = [{'from': A, 'to': B, 'cx': 0.5, 'top': 0.15}]
    res[0]['from'] = A; res[-1]['to'] = B + 1
    return res


q = lambda x: round(x * FPS) / FPS
out = {}
for rid, c in R.items():
    A, B = c['range']; skip = c.get('skip', [])
    ws = [x for x in W if A <= x['s'] < B and not any(a <= x['s'] < b for a, b in skip)]
    segs = []
    s, e = max(ws[0]['s'] - PRE, A), ws[0]['e']
    for x in ws[1:]:
        jump = any(e <= b and a <= x['s'] and x['s'] >= b for a, b in skip)
        if x['s'] - e > GAP or jump:
            segs.append([s, e + POST]); s = x['s'] - PRE
        e = max(e, x['e'])
    segs.append([s, min(e + 0.25, B)])
    segs = [[q(a), q(b)] for a, b in segs if q(b) > q(a)]
    fixed = []
    for a, b in segs:
        if fixed and a <= fixed[-1][1]:
            fixed[-1][1] = b
        else:
            fixed.append([a, b])
    segs = [[round(a, 3), round(b, 3)] for a, b in fixed]
    out[rid] = {'segs': segs, 'shots': speaker(A, B)}
    print(rid, len(segs), 'бөлік', round(sum(y - x for x, y in segs), 1), 'с', 'спикер', [(s['cx'], s['top']) for s in out[rid]['shots']])
    parts = ';'.join(f"[0:a]atrim={x}:{y},asetpts=N/SR/TB,afade=t=in:d=0.012,afade=t=out:st={y - x - 0.012:.3f}:d=0.012[a{i}]" for i, (x, y) in enumerate(segs))
    inp = ''.join(f'[a{i}]' for i in range(len(segs)))
    subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-filter_complex', f"{parts};{inp}concat=n={len(segs)}:v=0:a=1,aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[o]", '-map', '[o]', '-ar', '48000', '-c:a', 'pcm_s16le', str(PUB / 'reels' / f'{rid}.wav')], check=True)
save(SRC / 'reels_data.json', out)
