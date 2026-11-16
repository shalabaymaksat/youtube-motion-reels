// Сахна типтерінің тізілімі. Өз сахнаңды жасасаң: scenes/custom/<Name>.tsx жаз да, осында қос.
import React from 'react';
import {Cards, Ceiling, Chain, Chapter, Compare, Counter, Curves, Gauge, Loop, Network, Orbit, Ring, Steps, Timeline, Title} from './lib';

export const SCENES: Record<string, React.FC<Record<string, any>>> = {
  title: Title, chapter: Chapter, counter: Counter, cards: Cards, compare: Compare, chain: Chain, gauge: Gauge,
  timeline: Timeline, curves: Curves, ring: Ring, network: Network, orbit: Orbit, ceiling: Ceiling, loop: Loop, steps: Steps,
};
