#!/bin/bash
# YouTube видеосын жүктеп, жұмысқа дайындайды.
#   scripts/fetch.sh "<сілтеме>"                    # толық видео
#   scripts/fetch.sh "<сілтеме>" --from 90 --to 250  # тек бөлігі (тест үшін)
#   scripts/fetch.sh /path/video.mp4                 # жергілікті файл
# Шығыс: work/source.mp4, template/public/cut.mp4 (H.264 прокси), work/audio16.wav, template/src/meta.json
set -e
K="$(cd "$(dirname "$0")/.." && pwd)"; cd "$K"
IN="$1"; shift || true
FROM=; TO=
while [ $# -gt 0 ]; do case "$1" in --from) FROM="$2"; shift 2;; --to) TO="$2"; shift 2;; *) shift;; esac; done
FF="${FFMPEG:-ffmpeg}"; FP="${FFPROBE:-${FF%ffmpeg}ffprobe}"; [ -x "$FP" ] || FP=ffprobe
YT="${YTDLP:-yt-dlp}"; command -v "$YT" >/dev/null || YT="python3 -m yt_dlp"
mkdir -p work template/public template/src
rm -f work/source.*
if [ -f "$IN" ]; then
  cp "$IN" work/source.mp4
else
  SEC=(); [ -n "$FROM$TO" ] && SEC=(--download-sections "*${FROM:-0}-${TO:-inf}" --force-keyframes-at-cuts)
  $YT ${YTDLP_ARGS:-} --no-playlist --no-progress -f "bv*[height<=1080]+ba/b[height<=1080]/b" --merge-output-format mp4 \
    -o "work/source.%(ext)s" --print-to-file "%(title)s" work/title.txt "${SEC[@]}" -- "$IN"
fi
FPS=$($FP -v error -select_streams v -show_entries stream=r_frame_rate -of csv=p=0 work/source.mp4 | head -1)
# Прокси: тұрақты FPS, жиі кілт кадр — Remotion кадрды дәл табады
$FF -v error -y -i work/source.mp4 -an -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -g 15 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 template/public/cut.mp4
$FF -v error -y -i work/source.mp4 -vn -ac 1 -ar 16000 work/audio16.wav
N=$($FP -v error -select_streams v -count_packets -show_entries stream=nb_read_packets -of csv=p=0 template/public/cut.mp4)
python3 - "$FPS" "$N" <<'P'
import json, sys
a, b = sys.argv[1].split('/') if '/' in sys.argv[1] else (sys.argv[1], 1)
fps = round(float(a) / float(b), 3)
fps = int(fps) if abs(fps - round(fps)) < 0.01 else fps
n = int(sys.argv[2])
title = open('work/title.txt').read().strip() if __import__('os').path.exists('work/title.txt') else ''
json.dump({'fps': fps, 'frames': n, 'duration': round(n / fps, 3), 'title': title}, open('template/src/meta.json', 'w'), ensure_ascii=False)
print('meta:', json.load(open('template/src/meta.json')))
P
