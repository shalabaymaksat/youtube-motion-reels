import {Config} from '@remotion/cli/config';

// Жобаның жолында кириллица/латын емес әріп болса (мыс. ".../ютуб/..."), Remotion-ның
// chrome-headless-shell `icudtl.dat not found` деп құлайды ("Target closed").
// Шешімі: браузерді ASCII жолға көшіріп, REMOTION_BROWSER айнымалысына жазу.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
