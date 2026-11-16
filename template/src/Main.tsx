import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bg, BoxCtx, fr, line, PaperBg, TimeCtx, useFonts} from './kit/core';
import {C, clamp, enter} from './kit/tokens';
import plan from './plan.json';
import {SCENES} from './scenes';
import {PanelText} from './scenes/lib';

type Scene = {id: string; type: string; from: number; to: number; kind?: 'full' | 'panel' | 'paper'; chapter?: number; props?: Record<string, any>};
type Plan = {scenes: Scene[]; progress?: {total: number; keys: Record<string, string>}};
const P = plan as unknown as Plan;

export const Base: React.FC<{from: number}> = ({from}) => (
  <OffthreadVideo src={staticFile('cut.mp4')} muted trimBefore={fr(from)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
);

// Спикер орнында, оң жақ блюр + қараю, мәтін бағаны
const Panel: React.FC<{from: number; dur: number; children: React.ReactNode}> = ({from, dur, children}) => {
  const f = useCurrentFrame();
  const p = Math.min(enter(f, 0, 8), clamp(f, dur - 7, dur - 1, 1, 0, false));
  return (
    <AbsoluteFill>
      <Base from={from} />
      <AbsoluteFill style={{opacity: p, backdropFilter: 'blur(26px)', WebkitMaskImage: 'linear-gradient(90deg, transparent 60%, #000 72%)', maskImage: 'linear-gradient(90deg, transparent 60%, #000 72%)'}} />
      <AbsoluteFill style={{opacity: p, background: 'linear-gradient(90deg, rgba(6,6,8,0) 58%, rgba(6,6,8,0.8) 72%, rgba(6,6,8,0.92) 100%)'}} />
      <div style={{position: 'absolute', left: 1330, width: 540, top: 0, bottom: 0, opacity: p, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>{children}</div>
    </AbsoluteFill>
  );
};

// Тараулар прогресі: plan.progress берілсе, толық сахналардың астында
const Tracker: React.FC<{n: number; at: number; total: number}> = ({n, at, total}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 26, display: 'flex', justifyContent: 'center', gap: 8}}>
      {Array.from({length: total}).map((_, i) => {
        const p = i === n - 1 ? enter(f, at, 8) : i < n - 1 ? 1 : 0;
        return <div key={i} style={{width: Math.min(46, 900 / total), height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden'}}><div style={{width: `${p * 100}%`, height: '100%', background: i === n - 1 ? C.gold : 'rgba(243,201,75,0.55)'}} /></div>;
      })}
    </div>
  );
};

// Тоқтамайтын баяу жылжу, шектелген: ұзақ сахнада мәтін шетке шықпайды
const Drift: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{transform: `scale(${1 + Math.min(f, 300) * 0.00006})`}}>{children}</AbsoluteFill>;
};

// Толық экран сахна астында спикер видеосы декодталмайды: рендер жылдамырақ
const Under: React.FC = () => {
  const f = useCurrentFrame();
  const covered = P.scenes.some((s) => s.kind !== 'panel' && f >= fr(s.from) && f < fr(s.to));
  return covered ? null : <Base from={0} />;
};

export const Main: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Under />
      {P.scenes.map((s) => {
        const start = fr(s.from);
        const dur = fr(s.to) - start;
        const toF = (t: number) => fr(t) - start;
        const Comp = SCENES[s.type];
        if (s.kind !== 'panel' && !Comp) throw new Error(`«${s.type}» сахна типі жоқ (scenes/index.ts)`);
        const ck = s.chapter && P.progress ? P.progress.keys[String(s.chapter)] : undefined;
        return (
          <Sequence key={s.id} from={start} durationInFrames={dur} layout="none">
            <TimeCtx.Provider value={toF}>
              <BoxCtx.Provider value={{w: 1920, h: 1080}}>
                <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
                  {s.kind === 'panel' ? (
                    <Panel from={s.from} dur={dur}><PanelText {...s.props} /></Panel>
                  ) : (
                    <>
                      {s.kind === 'paper' ? <PaperBg /> : <Bg />}
                      <Drift><Comp {...s.props} {...(s.kind === 'paper' ? {color: C.ink, accent: '#0735E2'} : {})} /></Drift>
                      {s.chapter && P.progress ? <Tracker n={s.chapter} total={P.progress.total} at={ck ? toF(line(ck).t[0]) : 0} /> : null}
                    </>
                  )}
                </AbsoluteFill>
              </BoxCtx.Provider>
            </TimeCtx.Provider>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
