#!/usr/bin/env python3
"""Сөз-деңгейіндегі транскрипция: work/audio16.wav → work/words.json + work/words.txt

  python3 scripts/transcribe.py --lang kk
  python3 scripts/transcribe.py --lang kk --backend groq      # GROQ_API_KEY болса, бірнеше есе жылдам

Ұзын аудионы Whisper бөлік-бөлік өткізіп жібереді, сондықтан:
- аудио 150 с бөліктерге 8 с қабаттасып бөлінеді, әр бөліктен тек ортасы алынады;
- 2 с-тан ұзақ «сөзсіз» аралықтар бөлек, тар терезеде қайта танылады;
- Whisper-ге prompt берілмейді: кідірісте промптты қайталап галлюцинация жасайды.
Бэкенд: mlx (Apple Silicon) → faster → openai → groq, қолжетімдісі автоматты таңдалады.
"""
import argparse, importlib.util, json, os, subprocess, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from common import FF, WORK, save

MLX = {'large-v3': 'mlx-community/whisper-large-v3-mlx', 'large-v3-turbo': 'mlx-community/whisper-large-v3-turbo'}


def have(m):
    return importlib.util.find_spec(m) is not None


def words_mlx(path, lang, model):
    import mlx_whisper
    r = mlx_whisper.transcribe(path, path_or_hf_repo=MLX.get(model, model), language=lang, word_timestamps=True, condition_on_previous_text=False)
    return [(w['word'], w['start'], w['end']) for s in r['segments'] for w in s.get('words', [])]


_fw = {}
def words_faster(path, lang, model):
    from faster_whisper import WhisperModel
    m = _fw.get(model) or _fw.setdefault(model, WhisperModel(model, device='auto', compute_type='auto'))
    segs, _ = m.transcribe(path, language=lang, word_timestamps=True, condition_on_previous_text=False)
    return [(w.word, w.start, w.end) for s in segs for w in (s.words or [])]


def words_openai(path, lang, model):
    import whisper
    r = whisper.load_model(model).transcribe(path, language=lang, word_timestamps=True, condition_on_previous_text=False)
    return [(w['word'], w['start'], w['end']) for s in r['segments'] for w in s.get('words', [])]


def words_groq(path, lang, model):
    import requests
    key = os.environ.get('GROQ_API_KEY') or sys.exit('GROQ_API_KEY жоқ')
    data = [('model', 'whisper-large-v3'), ('response_format', 'verbose_json'), ('temperature', '0'), ('timestamp_granularities[]', 'word')]
    if lang:
        data.append(('language', lang))
    with open(path, 'rb') as f:
        r = requests.post('https://api.groq.com/openai/v1/audio/transcriptions', headers={'Authorization': f'Bearer {key}'}, data=data, files={'file': (Path(path).name, f)}, timeout=300)
    r.raise_for_status()
    return [(w['word'], w['start'], w['end']) for w in r.json().get('words', [])]


BACK = {'mlx': ('mlx_whisper', words_mlx), 'faster': ('faster_whisper', words_faster), 'openai': ('whisper', words_openai), 'groq': ('requests', words_groq)}


def cut(src, a, d, dst):
    subprocess.run([FF, '-v', 'error', '-y', '-ss', str(a), '-t', str(d), '-i', src, '-af', 'highpass=f=70,loudnorm=I=-18:TP=-2', '-ac', '1', '-ar', '16000', dst], check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--audio', default=str(WORK / 'audio16.wav'))
    ap.add_argument('--lang', default=None)
    ap.add_argument('--model', default='large-v3')
    ap.add_argument('--backend', choices=list(BACK))
    ap.add_argument('--chunk', type=float, default=150)
    a = ap.parse_args()
    names = [a.backend] if a.backend else [b for b in ('mlx', 'faster', 'openai') if have(BACK[b][0])]
    if not names:
        sys.exit('Whisper табылмады: pip install mlx-whisper (Mac M) не faster-whisper, не --backend groq')
    fn = BACK[names[0]][1]
    dur = float(subprocess.run([FF.replace('ffmpeg', 'ffprobe'), '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.audio], capture_output=True, text=True).stdout.strip())
    print(f'Whisper: {names[0]} · {a.model} · тіл={a.lang or "авто"} · {dur:.0f} с')
    tmp = tempfile.mkdtemp()
    W = []
    s = 0.0
    while s < dur:
        p = f'{tmp}/c{int(s)}.wav'
        cut(a.audio, s, a.chunk + 8, p)
        for w, b, e in fn(p, a.lang, a.model):
            t = b + s
            if (s > 0 and t < s + 4) or (s + a.chunk < dur and t >= s + a.chunk + 4):
                continue
            W.append({'w': w.strip(), 's': round(t, 2), 'e': round(e + s, 2)})
        print(f'  {s:.0f}–{min(s + a.chunk, dur):.0f} с: {len(W)} сөз')
        s += a.chunk
    W.sort(key=lambda x: x['s'])
    # Сөзсіз ұзақ аралықтарды тар терезеде қайта тану
    gaps = [(x['e'], y['s']) for x, y in zip(W, W[1:]) if y['s'] - x['e'] > 2.0]
    for g0, g1 in gaps:
        p = f'{tmp}/g{int(g0)}.wav'
        a0 = max(g0 - 1, 0)
        cut(a.audio, a0, g1 - a0 + 1, p)
        add = [{'w': w.strip(), 's': round(b + a0, 2), 'e': round(e + a0, 2)} for w, b, e in fn(p, a.lang, a.model) if g0 + 0.05 < b + a0 < g1 - 0.05]
        if add:
            W += add
            print(f'  аралық {g0:.1f}–{g1:.1f}: +{len(add)} сөз')
    W.sort(key=lambda x: x['s'])
    save(WORK / 'words.json', W)
    lines, cur, t0 = [], [], 0
    for x in W:
        if not cur:
            t0 = x['s']
        cur.append(x['w'])
        if len(cur) >= 14 or x['w'][-1:] in '.?!':
            lines.append(f'{t0:7.1f} {" ".join(cur)}'); cur = []
    if cur:
        lines.append(f'{t0:7.1f} {" ".join(cur)}')
    (WORK / 'words.txt').write_text('\n'.join(lines))
    rest = [(round(x['e'], 1), round(y['s'], 1)) for x, y in zip(W, W[1:]) if y['s'] - x['e'] > 2.0]
    print(f'{len(W)} сөз → work/words.json, work/words.txt; 2 с-тан ұзақ сөзсіз аралық: {rest}')


if __name__ == '__main__':
    main()
