import React from 'react';
import {DIST, DUR, enter, STAGGER} from './motion';

// Arabic text with every number run (digits, commas, %) isolated LTR, so "48%" and "3,300" never flip.
const RUN = /([0-9][0-9,.]*%?|%)/;
const IS_RUN = /^([0-9][0-9,.]*%?|%)$/;
export const Ar: React.FC<{children: string; style?: React.CSSProperties}> = ({children, style}) => (
	<span dir="rtl" style={style}>
		{children.split(RUN).map((part, i) =>
			IS_RUN.test(part) ? (
				<bdi key={i} dir="ltr">{part}</bdi>
			) : (
				<React.Fragment key={i}>{part}</React.Fragment>
			),
		)}
	</span>
);

// Per-word entrance for Arabic (never per letter, which breaks the joining). DOM order is reading order,
// so in RTL the right-most word starts first; each word is staggered by `step` frames.
export const Words: React.FC<{text: string; f: number; at: number; dist?: number; dur?: number; step?: number; style?: React.CSSProperties}> = ({
	text, f, at, dist = DIST.body, dur = DUR.line, step, style,
}) => {
	const words = text.split(' ');
	// long lines stagger tighter so the last word still settles within ~0.5s of the first
	step = step ?? (words.length > 3 ? 2 : STAGGER);
	return (
		<span dir="rtl" style={style}>
			{words.map((w, i) => (
				<React.Fragment key={i}>
					<span style={{display: 'inline-block', ...enter(f, at + i * step, {dist, dur})}}><Ar>{w}</Ar></span>
					{i < words.length - 1 ? ' ' : null}
				</React.Fragment>
			))}
		</span>
	);
};
