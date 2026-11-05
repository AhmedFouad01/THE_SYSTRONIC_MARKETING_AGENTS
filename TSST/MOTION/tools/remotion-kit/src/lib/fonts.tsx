import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FAMILY, FONT_FILES} from '../job/brand';

// Loads the job's font files and holds every frame until the weights in use are ready, so no frame can
// render in a fallback font (a fallback breaks Arabic shaping and the layout).
const css = FONT_FILES.map(
	(f) => `@font-face { font-family: "${FAMILY}"; font-weight: 100 900; font-display: block;
  src: url(${staticFile(f.file)}) format("woff2"); unicode-range: ${f.range}; }`,
).join('\n');

export const Fonts: React.FC = () => {
	const [handle] = useState(() => delayRender(FAMILY));
	useEffect(() => {
		const probes = [400, 600, 700, 800, 900].map((w) => `${w} 40px "${FAMILY}"`);
		Promise.all(probes.map((p) => document.fonts.load(p, 'عرض 1,234%')))
			.then(() => document.fonts.ready)
			.then(() => continueRender(handle))
			.catch((e) => { throw e; });
	}, [handle]);
	return <style>{css}</style>;
};
