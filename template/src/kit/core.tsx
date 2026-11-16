import React, {createContext, useContext, useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, staticFile, useCurrentFrame} from 'remotion';
import meta from '../meta.json';
import sync from '../sync.json';
import {C, EASE, SANS, SERIF, softIn} from './tokens';

export const FPS: number = meta.fps;
export const fr = (t: number) => Math.round(t * FPS);
export type Key = string;
type Line = {text: string; t: number[]};
const SYNC = sync as unknown as Record<string, Line>;
export const line = (k: Key): Line => {
  const l = SYNC[k];
  if (!l) throw new Error(`sync.json-да «${k}» жоқ: phrases.json-ға қосып, syncgen.py іске қос`);
  return l;
};

// Уақыт контексі: ұзын видеода — сахна басынан кадр, рилсте — кесінділер картасы
export const TimeCtx = createContext<(t: number) => number>((t) => fr(t));
// Сахна ауданы: 1920×1080 (ұзын), 1080×960 (рилс top), 1080×1920 (рилс anim)
export const BoxCtx = createContext({w: 1920, h: 1080});
export const useBox = () => {
  const b = useContext(BoxCtx);
  // Тік форматта телефон экраны кіші: мәтін 1,3 есе ірі
  const wide = b.w > b.h * 1.3;
  return {...b, S: (Math.min(b.w, b.h) / 1080) * (wide ? 1 : 1.3), wide};
};
// k сөйлемінің i-сөзі шыққан кадр (i < 0 — соңынан)
export const useW = () => {
  const toF = useContext(TimeCtx);
  return (k: Key, i = 0) => {
    const t = line(k).t;
    return toF(t[Math.max(0, Math.min(i < 0 ? t.length + i : i, t.length - 1))]);
  };
};

const parse = (text: string) => {
  let acc = false;
  return text.split(' ').filter(Boolean).map((raw) => {
    let w = raw;
    const o = w.startsWith('*');
    if (o) { acc = true; w = w.slice(1); }
    const c = w.endsWith('*');
    if (c) w = w.slice(0, -1);
    const r = {text: w, accent: acc};
    if (c) acc = false;
    return r;
  });
};

// Мәтін: әр сөз өз сәтінде жұмсақ маскамен ашылады. *сөз* = италик акцент.
export const W: React.FC<{k: Key; size?: number; weight?: number; color?: string; accent?: string; align?: 'left' | 'center' | 'right'; lh?: number; style?: React.CSSProperties}> = ({k, size = 60, weight = 600, color = C.white, accent = C.gold, align = 'center', lh = 1.14, style}) => {
  const f = useCurrentFrame();
  const toF = useContext(TimeCtx);
  const l = line(k);
  const ws = parse(l.text);
  const st = l.t.map(toF);
  return (
    <div style={{fontFamily: SANS, fontSize: size, fontWeight: weight, color, textAlign: align, lineHeight: lh, letterSpacing: '-0.018em', fontVariantNumeric: 'lining-nums', ...style}}>
      {ws.map((w, i) => {
        const s = st[Math.min(i, st.length - 1)];
        const p = interpolate(f, [s, s + Math.max(8, w.text.length + 1)], [0, 1], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const edge = -50 + p * 150;
        const done = p >= 1;
        const mask = done ? undefined : `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 50}%)`;
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span style={{display: 'inline-block', padding: '0.16em 0.12em', margin: '-0.16em -0.12em', WebkitMaskImage: mask, maskImage: mask, filter: done ? undefined : `blur(${(1 - p) * 5}px)`, ...(w.accent ? {fontFamily: SERIF, fontStyle: 'italic', fontWeight: 400, fontSize: '1.07em', color: accent, letterSpacing: 0} : null)}}>{w.text}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Кілт сөзі айтылғанда ғана көрінетін блок
export const Pop: React.FC<{k: Key; i?: number; rise?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({k, i = 0, rise = 14, style, children}) => {
  const f = useCurrentFrame();
  const a = useW()(k, i);
  return <div style={{visibility: f < a ? 'hidden' : 'visible', ...softIn(f, a, 9, rise), ...style}}>{children}</div>;
};

export const Glass: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div style={{borderRadius: 26, background: 'linear-gradient(150deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 26px 60px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden', ...style}}>{children}</div>
);

export const Num: React.FC<{v: string; size?: number; color?: string; style?: React.CSSProperties}> = ({v, size = 100, color = C.white, style}) => (
  <span style={{fontFamily: SANS, fontWeight: 650, fontSize: size, color, letterSpacing: '-0.03em', fontVariantNumeric: 'lining-nums', ...style}}>{v}</span>
);

export const PersonPath = 'M40 5a19 19 0 1 1 0 38a19 19 0 1 1 0-38zM10 98c0-27 13-46 30-46s30 19 30 46z';

export const useFonts = () => {
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all([
      new FontFace(SANS, `url(${staticFile('fonts/InterTight-VF.ttf')})`, {weight: '100 900'}).load(),
      new FontFace(SERIF, `url(${staticFile('fonts/PlayfairDisplay-Italic.ttf')})`, {style: 'italic', weight: '400'}).load(),
    ]).then((fs) => { fs.forEach((x) => document.fonts.add(x)); continueRender(h); });
  }, [h]);
};

const NOISE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
export const Bg: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, #2C2C2F 0%, ${C.bg} 55%, ${C.bgEdge} 100%)`}}>
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '96px 96px', backgroundPosition: 'center'}} />
    <AbsoluteFill style={{backgroundImage: NOISE, opacity: 0.1}} />
  </AbsoluteFill>
);
const PAPER = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 -0.02'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
export const PaperBg: React.FC = () => (
  <AbsoluteFill style={{background: '#E9E7E1'}}>
    <AbsoluteFill style={{backgroundImage: PAPER, opacity: 0.32}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 48%, transparent 45%, rgba(90,86,76,0.3) 100%)'}} />
  </AbsoluteFill>
);

// Сахна қаңқасы: жоғарғы мәтін · ортасында сурет (svg viewBox масштабталады) · төменгі мәтін
export const Frame: React.FC<{head?: React.ReactNode; foot?: React.ReactNode; vb?: [number, number]; children?: React.ReactNode; over?: React.ReactNode}> = ({head, foot, vb = [1000, 520], children, over}) => {
  const {w, h, S} = useBox();
  return (
    <AbsoluteFill style={{padding: `${60 * S}px ${70 * S}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 * S}}>
      {head ? <div style={{width: '100%'}}>{head}</div> : null}
      <div style={{flex: 1, width: '100%', position: 'relative', minHeight: 0}}>
        <svg viewBox={`0 0 ${vb[0]} ${vb[1]}`} preserveAspectRatio="xMidYMid meet" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}>{children}</svg>
        {over}
      </div>
      {foot ? <div style={{width: '100%'}}>{foot}</div> : null}
      <span style={{display: 'none'}}>{w}{h}</span>
    </AbsoluteFill>
  );
};
