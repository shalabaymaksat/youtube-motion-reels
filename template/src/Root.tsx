import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './kit/core';
import {Main} from './Main';
import meta from './meta.json';
import {Data, makeMap, Reel, ReelCfg} from './Reel';
import reels from './reels.json';
import reelsData from './reels_data.json';

const R = reels as unknown as Record<string, ReelCfg>;
const RD = reelsData as unknown as Record<string, Data>;

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={Math.max(1, meta.frames)} fps={FPS} width={1920} height={1080} />
    {Object.keys(R).filter((id) => RD[id]).map((id) => {
      const C: React.FC = () => <Reel id={id} cfg={R[id]} data={RD[id]} />;
      return <Composition key={id} id={`Reel-${id}`} component={C} durationInFrames={Math.max(1, makeMap(RD[id]).dur)} fps={FPS} width={1080} height={1920} />;
    })}
  </>
);
