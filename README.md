# youtube-motion-reels

Claude Code скилі: **YouTube сілтемесі → (1) анимациялы толық видео + (2) рилстер.**

- Айтылған әр сөзге синхрон анимация: сөз айтылғаннан ерте шықпайды (Whisper уақыты + 0,1 с).
- 15 дайын сахна типі (тарау картасы, санауыш, тізбек, салыстыру, тахометр, уақыт сызығы, баспалдақ…). Бір сахна ұзын видеода да, тік рилсте де жұмыс істейді.
- Кадрға дәл жинау: анимациясыз бөліктер түпнұсқадан, сахна шекарасы таза кесу.
- Рилстер: кідіріс қиылған, −14 LUFS, спикер автоматты кадрланады, жоғарыда спикер, төменде анимация.
- Транскрипция жергілікті (mlx-whisper / faster-whisper), API кілт міндетті емес.

## Қолдану
Claude Code-та репоны ашып жаз:
```
SKILL.md бойынша мына видеоны анимацияла және рилстер жаса: https://www.youtube.com/watch?v=…
```
не скил ретінде орнат: `git clone https://github.com/shalabaymaksat/youtube-motion-reels ~/.claude/skills/youtube-motion-reels`

Қолмен:
```bash
./setup.sh
scripts/fetch.sh "https://www.youtube.com/watch?v=…"
python3 scripts/transcribe.py --lang kk
# work/phrases.json, template/src/plan.json, template/src/reels.json жаз (SKILL.md, references/)
python3 scripts/syncgen.py
node template/render.mjs stills && python3 scripts/sheet.py
node template/render.mjs scenes && python3 scripts/assemble.py && python3 scripts/check.py
python3 scripts/reels_prep.py && node template/render.mjs reels && python3 scripts/rcheck.py
```
Нәтиже: `out/animated.mp4`, `out/reels/*.mp4`.

## Талаптар
ffmpeg, Node 18+, Python 3.9+, yt-dlp. Mac M-чипте `mlx-whisper` (ең жылдам), басқада `faster-whisper`. 30 минуттық видео: транскрипция ~10–20 мин, сахна рендері ~30 мин.

## Лицензия
Код — MIT. Шрифттер: Inter Tight, Playfair Display (SIL OFL, `template/public/fonts/`). Басқа адамның видеосын жарияламас бұрын авторлық құқықты ескеріңіз.
