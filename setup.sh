#!/bin/bash
# Бір рет: Node тәуелділіктері, Python кітапханалары, ffmpeg бар-жоғын тексеру.
set -e
K="$(cd "$(dirname "$0")" && pwd)"
command -v ffmpeg >/dev/null || { command -v brew >/dev/null && brew install ffmpeg; } || true
command -v ffmpeg >/dev/null || { echo "!! ffmpeg жоқ: орнатыңыз немесе FFMPEG=/path/ffmpeg беріңіз"; }
(cd "$K/template" && npm i --no-audit --no-fund --loglevel=error && npx remotion browser ensure >/dev/null)
# Браузерді ASCII жолға көшіру: жобаның ішінен іске қосқанда кей Mac-та ілініп қалады (icudtl.dat)
B=$(ls -d "$K"/template/node_modules/.remotion/chrome-headless-shell/*/chrome-headless-shell-* "$K"/.remotion/chrome-headless-shell/*/chrome-headless-shell-* 2>/dev/null | head -1)
[ -n "$B" ] && mkdir -p ~/.cache/remotion-chrome && cp -R "$B" ~/.cache/remotion-chrome/ && echo "chrome OK → ~/.cache/remotion-chrome/$(basename "$B")"
${PY:-python3} -m pip install -q --disable-pip-version-check -r "$K/requirements.txt"
${PY:-python3} -c "import numpy; print('python OK')"
echo "дайын. Келесі қадам: scripts/fetch.sh <YouTube сілтемесі>"
