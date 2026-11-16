import type React from 'react';
import {Easing, interpolate} from 'remotion';

// Түстер мен қозғалыс: бір жерде, бренд үшін осыны өзгерт
export const C = {
  bg: '#242426',
  bgEdge: '#17171A',
  card: '#F3F1EA',
  ink: '#141416',
  white: '#FFFFFF',
  grey: 'rgba(255,255,255,0.74)',
  accent: '#3AA0FF',
  gold: '#F3C94B',
  red: '#F0524F',
  green: '#35D07F',
  violet: '#7A5CFF',
  pink: '#F878F8',
};
export const SANS = 'Sans';
export const SERIF = 'Serif';
export const EASE = Easing.out(Easing.cubic);
export const EASE_IO = Easing.inOut(Easing.cubic);

export const enter = (f: number, start: number, dur = 12) =>
  interpolate(f, [start, start + dur], [0, 1], {easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Блюрдан ашылу: элементтің өз кіруі (кадр ауысуы емес — ауысу әрқашан таза кесу)
export const softIn = (f: number, start: number, dur = 12, rise = 14): React.CSSProperties => {
  const p = enter(f, start, dur);
  return {opacity: p, filter: p >= 1 ? undefined : `blur(${(1 - p) * 14}px)`, transform: `translateY(${(1 - p) * rise}px)`};
};

export const clamp = (f: number, a: number, b: number, from = 0, to = 1, ease = true) =>
  interpolate(f, [a, b], [from, to], {easing: ease ? EASE : undefined, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const COLORS: Record<string, string> = {gold: C.gold, red: C.red, green: C.green, blue: C.accent, violet: C.violet, pink: C.pink, white: C.white, grey: C.grey};
export const col = (c?: string, d = C.white) => (c ? COLORS[c] ?? c : d);
