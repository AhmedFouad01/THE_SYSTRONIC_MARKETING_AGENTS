import React from 'react';
import {Composition} from 'remotion';
import {H, W} from './job/brand';
import {FPS, TOTAL, VARIANTS} from './job/timeline';
import {Master} from './Master';

// One full composition per variant, so each variant renders as its own file for its own ad set.
// Other ratios (1:1, 16:9) are recomposed as their own compositions, never cropped from 9:16 (SK-002).
export const Root: React.FC = () => (
	<>
		{VARIANTS.map((v) => (
			<Composition key={v} id={`Master-9x16-${v}`} component={Master} durationInFrames={TOTAL} fps={FPS} width={W} height={H}
				defaultProps={{variant: v, safe: false, stem: 'all' as const}} />
		))}
	</>
);
