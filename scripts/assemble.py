#!/usr/bin/env python3
"""Соңғы видео: анимациясыз бөліктер (түпнұсқа) + сахна клиптері, таза кесу, дауыс + tick → out/animated.mp4

Бөлу бір декодтан кадр нөмірі бойынша: әр шекарада кілт кадр (уақыт тізімі) + segment muxer.
(-ss VP9/AV1 көзде 1–2 кадрға ығысады; expr:eq(n,..)+... ұзын тізбекте ffmpeg құлайды.)
"""
import glob, json, os, sys, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from common import OUT, SRC, WORK, fr, frames, load, meta, run

M = meta(); FPS = M['fps']
X264 = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-video_track_timescale', str(int(round(FPS)) * 512), '-an']
PANEL_LIFT = float(os.environ.get('PANEL_LIFT', 2))  # Remotion арқылы өткен спикер кадрының жарықтығы
scenes = load(SRC / 'plan.json')['scenes']
tmp = WORK / 'seg'; tmp.mkdir(parents=True, exist_ok=True); OUT.mkdir(exist_ok=True)
for p in glob.glob(f'{tmp}/*.mp4'):
    os.remove(p)
total = M['frames']
marks = sorted({x for s in scenes for x in (fr(s['from'], FPS), fr(s['to'], FPS))})
edges = [0] + marks + [total]
keys = ','.join(f'{(m - 0.25) / FPS:.5f}' for m in marks)
src = WORK / 'source.mp4'
vf = ['-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2']
run(['-i', str(src)] + vf + ['-force_key_frames', keys] + X264 + ['-f', 'segment', '-segment_frames', ','.join(map(str, marks)), '-reset_timestamps', '1', f'{tmp}/src_%04d.mp4'])
sc = {fr(s['from'], FPS): s for s in scenes}
parts = []
for i, (a, b) in enumerate(zip(edges, edges[1:])):
    p = f'{tmp}/src_{i:04d}.mp4'
    if a in sc and fr(sc[a]['to'], FPS) == b:
        s = sc[a]
        q = f"{tmp}/scene_{s['id']}.mp4"
        lift = ['-vf', f"lutyuv=y='clip(val+{PANEL_LIFT},0,255)'"] if s.get('kind') == 'panel' and PANEL_LIFT else []
        run(['-i', str(WORK / 'clips' / f"{s['id']}.mp4")] + lift + X264 + [q])
        p = q
    parts.append((p, b - a))
for p, want in parts:
    got = frames(p)
    if got != want:
        sys.exit(f'{p}: {got} кадр, керегі {want}')
print('бөлік', len(parts), 'кадр', total)
(tmp / 'list.txt').write_text(''.join(f"file '{p}'\n" for p, _ in parts))
run(['-f', 'concat', '-safe', '0', '-i', str(tmp / 'list.txt'), '-c', 'copy', str(tmp / 'video.mp4')])
# Tick: әр сөйлемнің бірінші сөзінде, тек сахна ішінде
sync = load(SRC / 'sync.json')
inside = lambda t: any(s['from'] <= t < s['to'] for s in scenes)
ticks = sorted({v['t'][0] for v in sync.values() if inside(v['t'][0])})
sr = 48000
sfx = np.zeros(int(sr * (total / FPS + 1)), dtype=np.float32)
t = np.arange(int(sr * 0.05)) / sr
tick = (np.sin(2 * np.pi * 1500 * t) * 0.7 + np.sin(2 * np.pi * 2900 * t) * 0.3) * np.exp(-t * 120)
for at in ticks:
    i = int(at * sr); sfx[i:i + len(tick)] += tick * float(os.environ.get('TICK', 0.06))
with wave.open(str(tmp / 'sfx.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.clip(sfx, -1, 1) * 32767).astype(np.int16).tobytes())
out = OUT / 'animated.mp4'
run(['-i', str(tmp / 'video.mp4'), '-i', str(src), '-i', str(tmp / 'sfx.wav'), '-filter_complex',
     '[1:a]aresample=48000[v];[2:a]aformat=channel_layouts=stereo[s];[v][s]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.89:level=disabled[a]',
     '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', str(out)])
print('дайын', out, os.path.getsize(out) >> 20, 'МБ', 'кадр', frames(out), 'tick', len(ticks))
