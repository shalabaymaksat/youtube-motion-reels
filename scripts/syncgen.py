#!/usr/bin/env python3
"""Экрандағы әр сөзді транскриптпен сәйкестендіреді: work/phrases.json → template/src/sync.json

phrases.json: {"кілт": [шамамен_уақыт_с, "экрандағы *акцент* мәтін"], ...}
overrides.json (міндетті емес): {"кілт": [әр сөздің басталу уақыты, ...]} — Whisper қате тапқан жерге қолмен.
Шығыс логы work/sync.log: «!!» белгісі = кей сөз табылмады, оны тексер.
Ереже: сөз айтылғаннан ЕРТЕ шықпайды. Табылмаған сөз келесі табылған сөздің уақытын алады.
"""
import difflib, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from common import MARGIN, SRC, WORK, load, save


def norm(s):
    return ''.join(c for c in s.lower() if c.isalnum() or c in '%№')


def sim(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0
    r = difflib.SequenceMatcher(None, a, b).ratio()
    return max(r, 0.8) if a[:4] == b[:4] and len(a) >= 4 else r


def main():
    W = load(WORK / 'words.json') or sys.exit('work/words.json жоқ: алдымен transcribe.py')
    P = load(WORK / 'phrases.json') or sys.exit('work/phrases.json жоқ')
    O = load(WORK / 'overrides.json', {})
    out, log, bad = {}, [], 0
    for k, (t0, text) in P.items():
        toks = text.split()
        cand = [x for x in W if t0 - 0.6 <= x['s'] <= t0 + 12]
        times, pos, row = [], 0, []
        for tok in toks:
            best, bi = 0, None
            for j in range(pos, min(pos + 7, len(cand))):
                s = sim(tok.replace('*', ''), cand[j]['w']) - 0.02 * (j - pos)
                if s > best:
                    best, bi = s, j
            if best >= 0.5:
                times.append(cand[bi]['s']); row.append(f"{tok}={cand[bi]['w']}@{cand[bi]['s']}"); pos = bi + 1
            else:
                times.append(None); row.append(f'{tok}=?')
        for i in range(len(times) - 2, -1, -1):
            if times[i] is None:
                times[i] = times[i + 1]
        for i in range(len(times)):
            if times[i] is None:
                times[i] = (times[i - 1] + 0.35) if i else t0 + 0.2
        for i in range(1, len(times)):
            times[i] = max(times[i], times[i - 1])
        if k in O:
            if len(O[k]) != len(toks):
                sys.exit(f'overrides[{k}]: {len(toks)} сөз, {len(O[k])} уақыт')
            times = O[k]; row.append('(қолмен)')
        miss = sum('=?' in x for x in row) if k not in O else 0
        far = abs(times[0] - t0) > 1.6
        bad += miss
        log.append(('!! ' if miss or far else '   ') + k + (' [t0-ден алыс]' if far else '') + ' ' + ' '.join(row))
        out[k] = {'text': text, 't': [round(t + MARGIN, 3) for t in times]}
    save(SRC / 'sync.json', out)
    (WORK / 'sync.log').write_text('\n'.join(log))
    print(f'{len(out)} сөйлем → template/src/sync.json; табылмаған сөз: {bad}; тексер: grep "^!!" work/sync.log')


if __name__ == '__main__':
    main()
