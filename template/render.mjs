// Remotion рендері. Репо түбірінен: node template/render.mjs <режим> [id,id]
//   stills [id]   — әр сахнаның соңына жақын кадр → out/stills/<id>.jpg
//   scenes [id]   — сахна клиптері → work/clips/<id>.mp4 (кейін assemble.py)
//   rstills [id]  — әр рилстен 8 кадр → out/stills/reels/<id>_<n>.jpg
//   reels [id]    — дайын рилстер → out/reels/<id>_<name>.mp4
// Claude Code sandbox ішінде Chrome ілінуі мүмкін: sandbox-тан тыс іске қос.
import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // репо түбірі
const T = R + '/template';
const [mode = 'stills', arg] = process.argv.slice(2);
const only = arg ? arg.split(',') : null;
const meta = JSON.parse(fs.readFileSync(T + '/src/meta.json'));
const fps = meta.fps;
const fr = (t) => Math.round(t * fps);
const conc = Number(process.env.CONCURRENCY || 6);

const serveUrl = await bundle({entryPoint: T + '/src/index.ts', publicDir: T + '/public', outDir: T + '/build'});
// Remotion-ның өз chrome-headless-shell-і кей Mac-та ілініп қалады: setup.sh көшірген ASCII жолдағы нұсқаны қолдан
const cached = `${process.env.HOME}/.cache/remotion-chrome/chrome-headless-shell-${process.platform === 'darwin' ? (process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64') : 'linux64'}/chrome-headless-shell`;
const browserExecutable = process.env.REMOTION_BROWSER || (fs.existsSync(cached) ? cached : null);
const b = await openBrowser('chrome', {browserExecutable});
const opts = {serveUrl, puppeteerInstance: b, browserExecutable, timeoutInMilliseconds: 180000};

if (mode === 'stills' || mode === 'scenes') {
  const plan = JSON.parse(fs.readFileSync(T + '/src/plan.json')).scenes.filter((s) => !only || only.includes(s.id));
  const composition = await selectComposition({...opts, id: 'Main'});
  fs.mkdirSync(R + '/out/stills', {recursive: true});
  fs.mkdirSync(R + '/work/clips', {recursive: true});
  for (const s of plan) {
    if (mode === 'stills') {
      await renderStill({...opts, composition, frame: fr(s.to) - 6, output: `${R}/out/stills/${s.id}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, overwrite: true});
    } else {
      await renderMedia({...opts, composition, codec: 'h264', crf: 15, muted: true, colorSpace: 'bt709', imageFormat: 'jpeg', jpegQuality: 95, concurrency: conc, frameRange: [fr(s.from), fr(s.to) - 1], outputLocation: `${R}/work/clips/${s.id}.mp4`, overwrite: true});
    }
    console.log(mode, s.id);
  }
} else {
  const reels = JSON.parse(fs.readFileSync(T + '/src/reels.json'));
  fs.mkdirSync(R + '/out/reels', {recursive: true});
  fs.mkdirSync(R + '/out/stills/reels', {recursive: true});
  for (const id of Object.keys(reels)) {
    if (only && !only.includes(id)) continue;
    const composition = await selectComposition({...opts, id: `Reel-${id}`});
    if (mode === 'rstills') {
      for (let k = 0; k < 8; k++) {
        const frame = Math.min(composition.durationInFrames - 1, Math.round(((k + 0.92) * composition.durationInFrames) / 8));
        await renderStill({...opts, composition, frame, output: `${R}/out/stills/reels/${id}_${k}.jpg`, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.4, overwrite: true});
      }
    } else {
      await renderMedia({...opts, composition, codec: 'h264', crf: 17, colorSpace: 'bt709', imageFormat: 'jpeg', jpegQuality: 95, audioCodec: 'aac', audioBitrate: '256k', concurrency: conc, outputLocation: `${R}/out/reels/${id}_${reels[id].name || id}.mp4`, overwrite: true});
    }
    console.log(mode, id);
  }
}
await b.close({silent: true});
process.exit(0);
