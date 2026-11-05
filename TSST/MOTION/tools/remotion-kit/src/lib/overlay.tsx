import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {DIST, DUR, ease, fadeIn, fadeOut} from './motion';
import {CAPTION, FONT, H, SAFE, W} from '../job/brand';
import {Ar} from './text';

// Burned-in caption for one VO line. Times are absolute frames.
// Motion spec: FADE_IN + 16px rise over 8 frames (ENTER), no scale, no bounce; leaves with a quicker EXIT fade.
export const Caption: React.FC<{text: string; start: number; end: number}> = ({text, start, end}) => {
	const f = useCurrentFrame();
	if (f < start || f > end + DUR.exit) return null;
	const o = Math.min(fadeIn(f, start, DUR.caption), fadeOut(f, end, DUR.exit - 1));
	const y = ease(f, start, DUR.caption, DIST.caption, 0);
	const width = SAFE.right - SAFE.left;
	return (
		<div style={{position: 'absolute', left: SAFE.left, width, top: CAPTION.top, height: CAPTION.bottom - CAPTION.top,
			display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, transform: `translateY(${y}px)`}}>
			<div style={{fontFamily: FONT, fontWeight: 600, fontSize: text.length > 44 ? 45 : 50, lineHeight: 1.35, color: CAPTION.color, textAlign: 'center',
				background: CAPTION.bg, borderRadius: 22, padding: '14px 30px', maxWidth: width}}>
				<Ar>{text}</Ar>
			</div>
		</div>
	);
};

// Text inside a zooming container: wrap it in <Steady zoom={z}> (same transform origin as the parent's
// top-left) so the zoom is undone and the words hold still while they are read. House rule: text never
// rides a camera push or a shake.
export const Steady: React.FC<{zoom: number; children: React.ReactNode}> = ({zoom, children}) => (
	<div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `scale(${1 / zoom})`}}>{children}</div>
);

// Review overlay for stills (`safe: true`): everything outside the safe box in red, the caption band in yellow.
export const SafeZones: React.FC = () => {
	const band: React.CSSProperties = {position: 'absolute', background: 'rgba(227,20,27,.28)', outline: '2px dashed rgba(255,255,255,.7)'};
	const label: React.CSSProperties = {fontFamily: 'monospace', fontSize: 26, color: '#fff', padding: 8, textShadow: '0 1px 2px #000'};
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{...band, left: 0, top: 0, width: W, height: SAFE.top}}><div style={label}>{`UI 0–${SAFE.top}`}</div></div>
			<div style={{...band, left: 0, top: SAFE.bottom, width: W, height: H - SAFE.bottom}}><div style={label}>{`UI ${SAFE.bottom}–${H}`}</div></div>
			<div style={{...band, left: 0, top: SAFE.top, width: SAFE.left, height: SAFE.bottom - SAFE.top}} />
			<div style={{...band, left: SAFE.right, top: SAFE.top, width: W - SAFE.right, height: SAFE.bottom - SAFE.top}} />
			<div style={{position: 'absolute', left: SAFE.left, width: SAFE.right - SAFE.left, top: CAPTION.top, height: CAPTION.bottom - CAPTION.top,
				outline: '2px dashed rgba(255,230,0,.8)'}} />
		</AbsoluteFill>
	);
};

// Tag for a stand-in (missing asset, unconfirmed fact). Off in every final export (`placeholders: false`).
export const Placeholder: React.FC<{text: string}> = ({text}) => (
	<div style={{position: 'absolute', top: 120, left: 60, right: 60, textAlign: 'center', fontFamily: 'monospace', fontSize: 28,
		color: '#fff', background: 'rgba(0,0,0,.55)', border: '2px dashed #ffe600', borderRadius: 12, padding: '10px 16px'}}>
		{text}
	</div>
);
