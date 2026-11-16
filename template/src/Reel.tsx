import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bg, BoxCtx, FPS, line, TimeCtx, useFonts, W} from './kit/core';
import {C, col} from './kit/tokens';
import {SCENES} from './scenes';

// 9:16 рилс. Спикер кадры тұрақты, таза кесу. Сөздер кесінділер картасы бойынша: айтылғаннан ерте емес.
export type Shot = {from: number; to: number; cx: number; top: number};
export type Data = {segs: number[][]; shots: Shot[]};
type Mode = 'full' | 'top' | 'anim';
export type Part = {from: number; mode: Mode; low?: {a?: string; b?: string; c?: string; aSize?: number; bSize?: number; bColor?: string}; scene?: {type: string; props?: Record<string, any>}};
export type ReelCfg = {name?: string; range: number[]; skip?: number[][]; parts: Part[]; ticks?: boolean};

export const makeMap = (d: Data) => {
  const lens = d.segs.map(([a, b]) => Math.round((b - a) * FPS));
  const offs = lens.reduce<number[]>((o, l, i) => [...o, (o[i] ?? 0) + l], [0]);
  const dur = offs[offs.length - 1];
  const toF = (t: number) => {
    for (let i = 0; i < d.segs.length; i++) {
      if (t < d.segs[i][0]) return offs[i];
      if (t < d.segs[i][1]) return offs[i] + Math.ceil((t - d.segs[i][0]) * FPS);
    }
    return dur;
  };
  return {d, lens, offs, dur, toF};
};

const frameFor = (shots: Shot[], src: number, top: boolean) => {
  const s = shots.find((x) => src >= x.from && src < x.to) ?? shots[shots.length - 1];
  const k = top ? 1.35 : 2;
  const h = top ? 960 : 1920;
  return {k, x: Math.min(0, Math.max(1080 - 1920 * k, 540 - s.cx * 1920 * k)), y: Math.min(0, Math.max(h - 1080 * k, (top ? 50 : 170) - s.top * 1080 * k))};
};

const SegVideo: React.FC<{a: number; shots: Shot[]; top: (t: number) => boolean}> = ({a, shots, top}) => {
  const f = useCurrentFrame();
  const t = top(a + f / FPS);
  const v = frameFor(shots, a + f / FPS, t);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: t ? 960 : 1920, overflow: 'hidden'}}>
      <OffthreadVideo src={staticFile('cut.mp4')} muted trimBefore={Math.round(a * FPS)} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, maxWidth: 'none', transformOrigin: '0 0', transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})`}} />
    </div>
  );
};

const Low: React.FC<{p: NonNullable<Part['low']>}> = ({p}) => (
  <div style={{position: 'absolute', left: 50, right: 50, top: 1090, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
    {p.a ? <W k={p.a} size={p.aSize ?? 58} weight={500} color="rgba(255,255,255,0.88)" /> : null}
    {p.b ? <W k={p.b} size={p.bSize ?? 96} color={col(p.bColor)} lh={1.05} /> : null}
    {p.c ? <W k={p.c} size={p.aSize ?? 58} weight={500} color="rgba(255,255,255,0.88)" /> : null}
  </div>
);

export const Reel: React.FC<{id: string; cfg: ReelCfg; data: Data}> = ({id, cfg, data}) => {
  useFonts();
  const f = useCurrentFrame();
  const map = makeMap(data);
  const at = (t: number) => {
    let p = cfg.parts[0];
    for (const x of cfg.parts) if (t >= x.from) p = x;
    return p;
  };
  let i = 0;
  for (let k = 0; k < data.segs.length; k++) if (f >= map.offs[k]) i = k;
  const part = at(data.segs[i][0] + (f - map.offs[i]) / FPS);
  const Comp = part.scene ? SCENES[part.scene.type] : null;
  const keys = new Set<string>();
  cfg.parts.forEach((p) => JSON.stringify(p).replace(/"([a-zA-Z0-9_]+)"/g, (_, k) => { try { line(k); keys.add(k); } catch { /* бұл кілт емес */ } return ''; }));
  return (
    <TimeCtx.Provider value={map.toF}>
      <AbsoluteFill style={{background: '#000'}}>
        {part.mode !== 'anim' ? data.segs.map(([a], k) => (
          <Sequence key={a} from={map.offs[k]} durationInFrames={map.lens[k]} layout="none"><SegVideo a={a} shots={data.shots} top={(t) => at(t).mode === 'top'} /></Sequence>
        )) : null}
        {part.mode === 'full' ? (
          <>
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,8,10,0) 50%, rgba(8,8,10,0.94) 67%, #08080A 78%)'}} />
            {part.low ? <Low p={part.low} /> : null}
          </>
        ) : (
          <div style={{position: 'absolute', left: 0, top: part.mode === 'top' ? 960 : 0, width: 1080, height: part.mode === 'top' ? 960 : 1920, overflow: 'hidden'}}>
            <Bg />
            <BoxCtx.Provider value={{w: 1080, h: part.mode === 'top' ? 960 : 1920}}>{Comp ? <Comp {...part.scene!.props} /> : null}</BoxCtx.Provider>
          </div>
        )}
        <Audio src={staticFile(`reels/${id}.wav`)} />
        {cfg.ticks === false ? null : [...keys].map((k) => {
          const t = line(k).t[0];
          return data.segs.some(([a, b]) => t >= a && t < b) ? <Sequence key={k} from={map.toF(t)} layout="none"><Audio src={staticFile('sfx/tick.wav')} volume={0.22} /></Sequence> : null;
        })}
        <span style={{display: 'none', color: C.white}} />
      </AbsoluteFill>
    </TimeCtx.Provider>
  );
};
