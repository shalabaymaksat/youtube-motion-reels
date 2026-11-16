// Жалпы сахналар кітапханасы. Әр сахна props арқылы sync.json кілттерін алады,
// және ұзын видеода (1920×1080), рилсте (1080×960 / 1080×1920) бірдей жұмыс істейді.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Frame, Glass, Key, Num, PersonPath, Pop, useBox, useW, W} from '../kit/core';
import {C, clamp, col, enter, rnd, SANS, softIn} from '../kit/tokens';

type P = Record<string, any>;
const Head: React.FC<{k?: Key; size?: number; color?: string}> = ({k, size = 78, color}) => {
  const {S} = useBox();
  return k ? <W k={k} size={size * S} color={col(color)} /> : null;
};
const Foot: React.FC<{keys?: Key[]; size?: number; color?: string}> = ({keys = [], size = 56, color}) => {
  const {S} = useBox();
  return <div style={{display: 'flex', flexDirection: 'column', gap: 10 * S}}>{keys.map((k, i) => <W key={k} k={k} size={(i ? size : size * 1.12) * S} weight={i ? 500 : 600} color={i ? C.grey : col(color)} />)}</div>;
};

// 1. Үлкен мәтін: бірнеше жол, біріншісі кіші
export const Title: React.FC<P> = ({keys = [], sizes, color, accent}) => {
  const {S} = useBox();
  return (
    <div style={{position: 'absolute', inset: 0, padding: 80 * S, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 * S}}>
      {keys.map((k: Key, i: number) => <W key={k} k={k} size={(sizes?.[i] ?? (keys.length > 1 && i === 0 ? 64 : 118)) * S} weight={i === 0 && keys.length > 1 ? 500 : 650} color={col(color, i === 0 && keys.length > 1 ? C.grey : C.white)} accent={col(accent, C.gold)} lh={1.05} />)}
    </div>
  );
};

// 2. Тарау/заң картасы: n/total сақина және үлкен нөмір
export const Chapter: React.FC<P> = ({n = 1, total = 10, numKey, keys = []}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S, wide} = useBox();
  const at = w(numKey ?? keys[0], 0);
  const R = 250;
  const arc = (i: number) => {
    const g = Math.min(0.05, 2 / total / 4);
    const a0 = -Math.PI / 2 + (i / total) * Math.PI * 2 + g;
    const a1 = -Math.PI / 2 + ((i + 1) / total) * Math.PI * 2 - g;
    return `M${300 + R * Math.cos(a0)} ${300 + R * Math.sin(a0)} A${R} ${R} 0 0 1 ${300 + R * Math.cos(a1)} ${300 + R * Math.sin(a1)}`;
  };
  const ring = (
    <svg viewBox="0 0 600 600" style={{width: (wide ? 620 : 520) * S, height: (wide ? 620 : 520) * S, flex: 'none', overflow: 'visible'}}>
      <circle cx="300" cy="300" r="290" fill={C.gold} opacity={enter(f, at, 10) * 0.12} />
      {Array.from({length: total}).map((_, i) => {
        const lit = i < n ? clamp(f, at + i * 2, at + i * 2 + 7) : 0;
        return <g key={i}><path d={arc(i)} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="22" strokeLinecap="round" />{lit > 0 ? <path d={arc(i)} fill="none" stroke={C.gold} strokeWidth="22" strokeLinecap="round" opacity={i === n - 1 ? lit : lit * 0.6} /> : null}</g>;
      })}
      <text x="300" y="300" dominantBaseline="central" textAnchor="middle" fontFamily={SANS} fontWeight={650} fontSize={n > 9 ? 240 : 300} fill={C.gold} opacity={enter(f, at, 10)}>{n}</text>
    </svg>
  );
  return (
    <div style={{position: 'absolute', inset: 0, padding: 80 * S, display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 60 * S}}>
      {ring}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 28 * S}}>
        {(numKey ? [numKey, ...keys] : keys).map((k: Key, i: number) => <W key={k} k={k} size={(i === 0 && numKey ? 44 : i === (numKey ? 1 : 0) ? 92 : 62) * S} weight={i === 0 && numKey ? 500 : 600} color={i === 0 && numKey ? C.gold : C.white} align={wide ? 'left' : 'center'} lh={1.06} />)}
      </div>
    </div>
  );
};

// 3. Санауыш: сан көрсетілген сөзде өседі, астында өсетін бағандар
export const Counter: React.FC<P> = ({at, word = 0, from = 0, to = 100, prefix = '', suffix = '', decimals = 0, color = 'green', head, foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const a = w(at, word);
  const v = clamp(f, a, a + 22, from, to);
  const txt = `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${suffix}`;
  const c = col(color);
  return (
    <Frame head={<Head k={head} />} foot={<Foot keys={foot} />} vb={[1000, 460]} over={<div style={{position: 'absolute', left: 0, right: 0, top: '4%', textAlign: 'center', opacity: enter(f, a, 6)}}><Num v={txt} size={170 * S} color={c} style={{filter: `drop-shadow(0 0 26px ${c}66)`}} /></div>}>
      {Array.from({length: 16}).map((_, i) => { const h = 20 + 230 * ((i + 1) / 16) ** 2.2; const p = clamp(f, a + i, a + i + 12); return <rect key={i} x={40 + i * 59} y={440 - h * p} width={42} height={h * p} rx={8} fill={c} opacity={0.3 + (i / 16) * 0.7} />; })}
    </Frame>
  );
};

// 4. Карточкалар: әрқайсысы өз сөзінде шығады; stamp — соңында мөр басылады, strike — сызылады
export const Cards: React.FC<P> = ({items = [], head, foot, stamp, strike, cols}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S, wide} = useBox();
  const st = stamp ? clamp(f, w(stamp, 0), w(stamp, 0) + 7) : 0;
  const n = cols ?? (wide ? Math.min(items.length, 4) : 1);
  return (
    <div style={{position: 'absolute', inset: 0, padding: `${60 * S}px ${70 * S}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 34 * S}}>
      <Head k={head} />
      {strike ? <div style={{alignSelf: 'center', position: 'relative'}}><W k={strike} size={54 * S} weight={500} color={C.grey} /><div style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 6 * S, background: C.red, borderRadius: 3, transformOrigin: 'left', transform: `scaleX(${clamp(f, w(strike, -1) + 6, w(strike, -1) + 16)})`}} /></div> : null}
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 22 * S, opacity: stamp ? clamp(f, w(stamp, 0), w(stamp, 0) + 10, 1, 0.4) : 1}}>
        {items.map((it: P, i: number) => (
          <Pop key={it.key} k={it.key} style={{perspective: 1100}}>
            <Glass style={{padding: `${34 * S}px ${26 * S}px`, boxShadow: `inset 0 0 0 2px ${col(it.color, 'rgba(255,255,255,0.16)')}, 0 26px 60px rgba(0,0,0,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: (wide ? 260 : 120) * S}}>
              {it.num ? <Num v={String(it.num)} size={70 * S} color={col(it.color, C.gold)} style={{marginRight: 22 * S}} /> : null}
              <W k={it.key} size={(it.size ?? (wide && n > 2 ? 46 : 56)) * S} />
            </Glass>
          </Pop>
        ))}
      </div>
      {stamp ? <div style={{alignSelf: 'center', opacity: st, padding: `${16 * S}px ${44 * S}px`, border: `${8 * S}px solid ${C.gold}`, borderRadius: 24 * S, transform: `rotate(-3deg) scale(${1.5 - st * 0.5})`, boxShadow: '0 0 50px rgba(243,201,75,0.3)'}}><W k={stamp} size={84 * S} color={C.gold} /></div> : null}
      {foot ? <Foot keys={foot} /> : null}
    </div>
  );
};

// 5. Салыстыру: екі карта, verdict сөзінде ✓ немесе ✗
export const Compare: React.FC<P> = ({left, right, verdict, mark = 'check'}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S, wide} = useBox();
  const v = verdict ? clamp(f, w(verdict, -1), w(verdict, -1) + 10) : 0;
  const card = (c: P, i: number) => (
    <Pop k={c.key} style={{flex: 1}}>
      <Glass style={{padding: 34 * S, minHeight: (wide ? 380 : 200) * S, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 * S, boxShadow: `inset 0 0 0 3px ${col(c.color, i ? C.red : C.green)}, 0 26px 60px rgba(0,0,0,0.4)`}}>
        <W k={c.key} size={(wide ? 76 : 58) * S} />
        {c.sub ? <W k={c.sub} size={(wide ? 58 : 46) * S} weight={500} color={col(c.color, i ? C.red : C.green)} /> : null}
        {mark && v > 0 ? <svg viewBox="0 0 90 90" style={{position: 'absolute', right: 20 * S, top: 20 * S, width: 80 * S, opacity: v}}><circle cx="45" cy="45" r="41" fill={mark === 'check' ? C.gold : C.red} /><path d={mark === 'check' ? 'M24 46l15 15 28-30' : 'M28 28l34 34M62 28 28 62'} fill="none" stroke={C.ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
      </Glass>
    </Pop>
  );
  return (
    <div style={{position: 'absolute', inset: 0, padding: `${60 * S}px ${70 * S}px`, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 50 * S}}>
      <div style={{display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 30 * S}}>{card(left, 0)}{card(right, 1)}</div>
      {verdict ? <W k={verdict} size={120 * S} accent={C.gold} /> : null}
    </div>
  );
};

// 6. Тізбек: A → B → C … әр түйін өз сөзінде жанады
export const Chain: React.FC<P> = ({keys = [], colors, head}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {wide} = useBox();
  const pal = colors ?? ['pink', 'violet', 'blue', 'green', 'gold', 'white', 'red'];
  const n = keys.length;
  const vb: [number, number] = wide ? [1000, 520] : [1000, 900];
  const pos = keys.map((_: Key, i: number) => wide ? {x: 90 + (820 * i) / Math.max(n - 1, 1), y: 260 + (i % 2 ? -110 : 110)} : {x: i % 2 ? 720 : 280, y: 70 + (760 * i) / Math.max(n - 1, 1)});
  return (
    <Frame head={<Head k={head} />} vb={vb}>
      {pos.slice(1).map((p: P, i: number) => {
        const a = pos[i];
        const at = w(keys[i + 1], 0);
        const d = wide ? `M${a.x} ${a.y}C${(a.x + p.x) / 2} ${a.y} ${(a.x + p.x) / 2} ${p.y} ${p.x} ${p.y}` : `M${a.x} ${a.y}C${a.x} ${(a.y + p.y) / 2} ${p.x} ${(a.y + p.y) / 2} ${p.x} ${p.y}`;
        return <path key={i} d={d} fill="none" stroke={col(pal[(i + 1) % pal.length])} strokeWidth="6" pathLength={1} strokeDasharray={`${clamp(f, at - 8, at + 4)} 1`} />;
      })}
      {keys.map((k: Key, i: number) => {
        const at = w(k, 0);
        const s = enter(f, at, 10);
        const c = col(pal[i % pal.length]);
        const bw = wide ? 190 : 400, bh = wide ? 110 : 120;
        return (
          <g key={k} opacity={s} transform={`translate(${pos[i].x} ${pos[i].y}) scale(${0.6 + s * 0.4})`}>
            <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh / 2} fill="#1E1E22" stroke={c} strokeWidth="4" style={{filter: `drop-shadow(0 0 14px ${c}88)`}} />
            <foreignObject x={-bw / 2} y={-bh / 2} width={bw} height={bh}><div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><W k={k} size={wide ? 30 : 50} /></div></foreignObject>
          </g>
        );
      })}
    </Frame>
  );
};

// 7. Тахометр: at сөзінде 0-ден to-ға бұрылады
export const Gauge: React.FC<P> = ({at, word = 0, to = 100, prefix = '', suffix = '', head, foot, end}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const a = w(at, word);
  const b = end ? w(end, -1) + 10 : a + 40;
  const v = clamp(f, a, b);
  const a0 = -210, a1 = 30, cx = 500, cy = 300, R = 240;
  const pol = (d: number, r: number) => [cx + r * Math.cos((d * Math.PI) / 180), cy + r * Math.sin((d * Math.PI) / 180)];
  const arc = (d0: number, d1: number) => { const [x0, y0] = pol(d0, R); const [x1, y1] = pol(d1, R); return `M${x0} ${y0} A${R} ${R} 0 ${d1 - d0 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const ang = a0 + (a1 - a0) * v;
  const [nx, ny] = pol(ang, R - 46);
  const val = `${prefix}${Math.round(to * v).toLocaleString('en').replace(/,/g, ' ')}${suffix}`;
  return (
    <Frame head={<Head k={head} />} foot={<Foot keys={foot} />} vb={[1000, 560]}>
      <path d={arc(a0, a1)} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="30" strokeLinecap="round" />
      <path d={arc(a0, Math.max(ang, a0 + 0.1))} fill="none" stroke={C.gold} strokeWidth="30" strokeLinecap="round" style={{filter: `drop-shadow(0 0 16px ${C.gold})`}} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="10" strokeLinecap="round" /><circle cx={cx} cy={cy} r={20} fill="#fff" />
      <text x={cx} y={cy + 200} textAnchor="middle" fontFamily={SANS} fontWeight={650} fontSize={84} fill={C.gold} opacity={enter(f, a, 8)}>{val}</text>
      <span style={{display: 'none'}}>{S}</span>
    </Frame>
  );
};

// 8. Уақыт сызығы: төменнен жоғары (рилс) не солдан оңға (ұзын)
export const Timeline: React.FC<P> = ({items = [], head}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S, wide} = useBox();
  const pal = ['white', 'blue', 'green', 'gold', 'violet', 'pink'];
  const p = clamp(f, w(items[0].key, 0), w(items[items.length - 1].key, 0), 0, 1, false);
  return (
    <div style={{position: 'absolute', inset: 0, padding: `${60 * S}px ${70 * S}px`, display: 'flex', flexDirection: 'column', gap: 30 * S}}>
      <Head k={head} />
      <div style={{flex: 1, position: 'relative', display: 'flex', flexDirection: wide ? 'row' : 'column-reverse', justifyContent: 'space-between'}}>
        <div style={{position: 'absolute', background: 'rgba(255,255,255,0.12)', borderRadius: 6, ...(wide ? {left: 60 * S, right: 60 * S, top: 60 * S, height: 10 * S} : {left: 61 * S, top: 66 * S, bottom: 66 * S, width: 10 * S})}} />
        <div style={{position: 'absolute', background: C.gold, borderRadius: 6, boxShadow: `0 0 14px ${C.gold}`, ...(wide ? {left: 60 * S, top: 60 * S, height: 10 * S, width: `calc((100% - ${120 * S}px) * ${p})`} : {left: 61 * S, bottom: 66 * S, width: 10 * S, height: `calc((100% - ${132 * S}px) * ${p})`})}} />
        {items.map((it: P, i: number) => {
          const c = col(it.color ?? pal[i % pal.length]);
          return (
            <Pop key={it.key} k={it.key} rise={0} style={{display: 'flex', flexDirection: wide ? 'column' : 'row', alignItems: wide ? 'flex-start' : 'center', gap: 24 * S, width: wide ? `${100 / items.length}%` : undefined}}>
              <div style={{width: 132 * S, height: 132 * S, borderRadius: 66 * S, background: c, boxShadow: `0 0 30px ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none'}}><Num v={String(it.label ?? i + 1)} size={56 * S} color={C.ink} /></div>
              <W k={it.key} size={(wide ? 44 : 52) * S} align="left" />
            </Pop>
          );
        })}
      </div>
    </div>
  );
};

// 9. Екі қисық: біреуі өседі, біреуі тұрып қалады
export const Curves: React.FC<P> = ({low = [], high = [], foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const la = w(low[0], 0), ha = w(high[0], 0);
  const end = foot ? w(foot, -1) + 20 : ha + 200;
  const up = clamp(f, ha + 10, end, 0, 1, false);
  const flat = clamp(f, la + 10, end, 0, 1, false);
  const pt = (t: number, h: number) => [40 + 920 * t, 470 - h * Math.pow(t, 2.2)];
  const ln = (p: number, h: number) => Array.from({length: 40}).map((_, i) => { const [x, y] = pt((i / 39) * p, h); return `${i ? 'L' : 'M'}${x} ${y + (h < 100 ? Math.sin(i * 0.9) * 5 * p : 0)}`; }).join(' ');
  const [hx, hy] = pt(up, 400); const [lx, ly] = pt(flat, 30);
  return (
    <Frame foot={<Foot keys={foot ? [foot] : []} />} vb={[1000, 500]} over={
      <>
        <div style={{position: 'absolute', left: 0, top: 0, maxWidth: '62%'}}>{high.map((k: Key, i: number) => <W key={k} k={k} size={(i ? 44 : 54) * S} weight={i ? 500 : 650} color={i ? C.white : C.gold} align="left" />)}</div>
        <div style={{position: 'absolute', left: 0, bottom: 0, maxWidth: '62%'}}>{low.map((k: Key, i: number) => <W key={k} k={k} size={(i ? 40 : 46) * S} weight={i ? 500 : 600} color={i ? C.red : C.white} align="left" />)}</div>
      </>
    }>
      <line x1={40} y1={472} x2={960} y2={472} stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
      <path d={ln(flat, 30)} fill="none" stroke={C.red} strokeWidth="8" strokeLinecap="round" opacity={f < la ? 0 : 1} /><circle cx={lx} cy={ly} r={13} fill={C.red} opacity={f < la ? 0 : 1} />
      {f >= ha ? <><path d={ln(up, 400)} fill="none" stroke={C.gold} strokeWidth="10" strokeLinecap="round" style={{filter: `drop-shadow(0 0 12px ${C.gold})`}} /><circle cx={hx} cy={hy} r={18} fill={C.gold} /></> : null}
    </Frame>
  );
};

// 10. Сақина: count адам, ортада «сен», me сөзінде алтынға айналады
export const Ring: React.FC<P> = ({count = 5, at, me, head, foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const a = w(at, 0);
  const m = me ? clamp(f, w(me, 0), w(me, 0) + 14) : 0;
  const person = (x: number, y: number, s: number, fill: string, op = 1, glow = 0) => <path d={PersonPath} transform={`translate(${x - 40 * s} ${y - 50 * s}) scale(${s})`} fill={fill} opacity={op} style={glow ? {filter: `drop-shadow(0 0 ${glow}px ${C.gold})`} : undefined} />;
  return (
    <Frame head={<Head k={head} />} foot={<Foot keys={foot} color="gold" />} vb={[1000, 560]}>
      {Array.from({length: count}).map((_, i) => { const an = -Math.PI / 2 + (i / count) * Math.PI * 2; const p = clamp(f, a + i * 3, a + i * 3 + 10); return <g key={i}>{person(500 + Math.cos(an) * 220, 280 + Math.sin(an) * 210, 1.1, C.gold, p, 12)}</g>; })}
      {person(500, 280, 1.35, m > 0.5 ? C.gold : '#fff', 1, m * 26)}
    </Frame>
  );
};

// 11. Желі: at сөзінен бастап түйіндер біртіндеп жанады
export const Network: React.FC<P> = ({at, head, foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const a = w(at, 0);
  const lit = clamp(f, a, a + 70, 0, 1, false);
  const N = [[500, 260]].concat(Array.from({length: 20}).map((_, i) => { const an = (i / 20) * 6.283 + rnd(i) * 0.3; const r = i % 2 ? 140 : 250; return [500 + Math.cos(an) * r * 1.6, 260 + Math.sin(an) * r * 0.85]; }));
  return (
    <Frame head={<Head k={head} />} foot={<Foot keys={foot} color="gold" />} vb={[1000, 520]}>
      {N.slice(1).map((n, i) => { const fr0 = i % 2 ? N[0] : N[Math.max(i, 1)]; const on = lit > (i + 1) / 22; return <line key={i} x1={fr0[0]} y1={fr0[1]} x2={n[0]} y2={n[1]} stroke={on ? C.gold : 'rgba(255,255,255,0.1)'} strokeWidth={on ? 3.5 : 2} />; })}
      {N.map((n, i) => { const on = i === 0 || lit > i / 22; return <circle key={i} cx={n[0]} cy={n[1]} r={i === 0 ? 40 : 15} fill={on ? C.gold : 'rgba(255,255,255,0.22)'} style={on ? {filter: `drop-shadow(0 0 12px ${C.gold})`} : undefined} />; })}
    </Frame>
  );
};

// 12. Орбита: ортада адам, айналасында әдеттер/дағдылар шығады
export const Orbit: React.FC<P> = ({items = [], head}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S, wide} = useBox();
  const grow = clamp(f, w(items[0], 0), w(items[items.length - 1], -1) + 8);
  const rx = wide ? 40 : 38, ry = wide ? 36 : 40;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      {head ? <div style={{position: 'absolute', left: 60 * S, right: 60 * S, top: 50 * S}}><Head k={head} /></div> : null}
      <div style={{position: 'absolute', left: '50%', top: '52%', width: (160 + grow * 90) * S, height: (160 + grow * 90) * S, borderRadius: '50%', transform: 'translate(-50%,-50%)', background: C.gold, boxShadow: `0 0 50px ${C.gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><svg viewBox="0 0 80 100" style={{width: 80 * S}}><path d={PersonPath} fill={C.ink} /></svg></div>
      {items.map((k: Key, i: number) => {
        const an = -Math.PI / 2 + (i / items.length) * Math.PI * 2 + f * 0.002;
        return <div key={k} style={{position: 'absolute', left: `${50 + Math.cos(an) * rx}%`, top: `${52 + Math.sin(an) * ry}%`, transform: 'translate(-50%,-50%)', width: (wide ? 420 : 400) * S}}><Pop k={k}><div style={{padding: `${20 * S}px ${14 * S}px`, borderRadius: 999, background: '#2B2B30', boxShadow: `inset 0 0 0 2px ${C.gold}`}}><W k={k} size={40 * S} /></div></Pop></div>;
      })}
    </div>
  );
};

// 13. Төбе: бағандар өседі, line сөзінде пунктир төбе пайда болып, бағандар соған тіреледі
export const Ceiling: React.FC<P> = ({items = [], line: lk, head}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const lay = w(lk, 0);
  const n = items.length;
  const bw = 820 / n - 30;
  return (
    <Frame head={<Head k={head} />} foot={<Head k={lk} size={70} color="gold" />} vb={[1000, 520]} over={
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-around'}}>{items.map((k: Key) => <div key={k} style={{width: `${76 / n}%`}}><Pop k={k}><W k={k} size={40 * S} /></Pop></div>)}</div>
    }>
      <line x1={40} y1={130} x2={960} y2={130} stroke={C.gold} strokeWidth={5} strokeDasharray="16 12" opacity={enter(f, lay, 8)} />
      {items.map((k: Key, i: number) => {
        const at = w(k, 0);
        const g = clamp(f, at, at + 18);
        const bump = f > lay + 8 ? Math.sin((f - lay - 8) * 0.5) * Math.exp(-(f - lay - 8) * 0.07) * 14 : 0;
        const h = Math.max(300 * g + bump, 0);
        return <rect key={k} x={90 + i * (820 / n)} y={430 - h} width={bw} height={h} rx={14} fill={[C.accent, '#7FB8FF', '#BFD8FF', C.violet][i % 4]} opacity={f < at ? 0 : 0.9} />;
      })}
    </Frame>
  );
};

// 14. Тұйық шеңбер: label ішінде айналады, escape сөзінде алтын жолмен шығады
export const Loop: React.FC<P> = ({label, escape, foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const t0 = w(label, 0);
  const out = w(escape, 0);
  const esc = clamp(f, out, out + 20);
  const u = (f - t0) * 0.09;
  return (
    <Frame foot={<div style={{display: 'flex', flexDirection: 'column', gap: 14 * S}}>{(foot ?? []).map((k: Key) => <W key={k} k={k} size={48 * S} weight={500} />)}<W k={escape} size={84 * S} accent={C.gold} /></div>} vb={[1000, 520]} over={<div style={{position: 'absolute', left: '30%', right: '30%', top: '40%'}}><W k={label} size={36 * S} color={C.red} /></div>}>
      <circle cx={500} cy={260} r={200} fill="none" stroke="rgba(240,82,79,0.22)" strokeWidth="38" />
      {f >= t0 ? [0, 1, 2, 3].map((i) => { const a = u + (i * Math.PI) / 2; return <path key={i} d="M-22 -22 26 0-22 22Z" fill={C.red} transform={`translate(${500 + Math.cos(a) * 200} ${260 + Math.sin(a) * 200}) rotate(${(a * 180) / Math.PI + 90})`} opacity={1 - esc * 0.6} />; }) : null}
      {f >= out ? <path d="M700 260C840 260 900 180 990 40" fill="none" stroke={C.gold} strokeWidth="14" strokeLinecap="round" pathLength={1} strokeDasharray={`${esc} 1`} style={{filter: `drop-shadow(0 0 14px ${C.gold})`}} /> : null}
    </Frame>
  );
};

// 15. Баспалдақ: items төменнен жоғары, climb сөзінде шар көтеріледі
export const Steps: React.FC<P> = ({items = [], climb, foot}) => {
  const f = useCurrentFrame();
  const w = useW();
  const {S} = useBox();
  const n = items.length;
  const c0 = climb ? w(climb, 0) : w(items[n - 1], -1);
  const up = clamp(f, c0, c0 + 50, 0, 1, false);
  const step = (i: number) => ({x: 60 + (i * 680) / Math.max(n - 1, 1), y: 430 - (i * 340) / Math.max(n - 1, 1)});
  const q = up * (n - 1); const i0 = Math.min(Math.floor(q), n - 2); const fq = q - i0;
  const A = step(Math.max(i0, 0)), B = step(Math.min(i0 + 1, n - 1));
  const pal = ['rgba(255,255,255,0.35)', C.accent, C.green, C.gold];
  return (
    <Frame foot={<Foot keys={foot} color="gold" />} vb={[1000, 520]} over={items.map((k: Key, i: number) => { const s = step(i); return <div key={k} style={{position: 'absolute', left: `${(s.x / 1000) * 100}%`, top: `${((s.y + 24) / 520) * 100}%`, width: '28%'}}><Pop k={k}><W k={k} size={42 * S} align="left" /></Pop></div>; })}>
      {items.map((k: Key, i: number) => { const s = step(i); const p = clamp(f, w(k, 0), w(k, 0) + 10); return <rect key={k} x={s.x} y={s.y} width={260} height={20} rx={10} fill={pal[Math.min(i, 3)]} opacity={p} transform={`translate(0 ${(1 - p) * 20})`} />; })}
      {f >= c0 ? <circle cx={A.x + 130 + (B.x - A.x) * fq} cy={A.y - 34 + (B.y - A.y) * fq - Math.sin(fq * Math.PI) * 50} r={28} fill="#fff" style={{filter: 'drop-shadow(0 0 18px #fff)'}} /> : null}
    </Frame>
  );
};

// Панель: спикер көрінеді, оң жақта мәтін (тек ұзын видеода; рилсте 'full' мәтін)
export const PanelText: React.FC<P> = ({keys = [], accent}) => (
  <>{keys.map((k: Key, i: number) => <W key={k} k={k} size={i === 0 && keys.length > 1 ? 40 : 60} weight={i === 0 && keys.length > 1 ? 500 : 650} color={i === 0 && keys.length > 1 ? C.grey : i === keys.length - 1 ? col(accent, C.gold) : C.white} style={{marginTop: i ? 16 : 0}} />)}</>
);

export const _unused = softIn;
