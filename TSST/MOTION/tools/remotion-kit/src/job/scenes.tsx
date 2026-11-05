// The job's scenes. Each one gets the frame relative to its own start (useCurrentFrame inside a Sequence).
// Demo: an offer card (word-by-word headline, old price struck, new price stamped, badge snapped on the
// beat) and an end card. Swap these for the job's scenes; keep every move on the tokens in lib/motion.ts.
import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, CONTACT, FONT, LOGOS, SAFE} from './brand';
import {fmt, OFFER} from './data';
import {onBeat, SceneId, Variant} from './timeline';
import {DUR, draw, ease, EASE, enter, headline, snap, stamp} from '../lib/motion';
import {Ar, Words} from '../lib/text';
import {Steady} from '../lib/overlay';

const CX = (SAFE.left + SAFE.right) / 2;

const Offer: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	// slow push on the background shape only; the price block sits in <Steady>, so it holds still
	const zoom = ease(f, 0, 120, 1, 1.06, EASE.move);
	const strike = draw(f, onBeat(1), DUR.strike);
	const s = stamp(f, onBeat(2), fps);
	const b = snap(f, onBeat(3), fps);
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `scale(${zoom})`}}>
				<div style={{position: 'absolute', left: 140, top: 500, width: 800, height: 480, borderRadius: 48, background: C.primary}} />
				<Steady zoom={zoom}>
					<div style={{position: 'absolute', left: 140, top: 540, width: 800, textAlign: 'center', fontFamily: FONT}}>
						<div style={{position: 'relative', display: 'inline-block', fontSize: 72, fontWeight: 600, color: 'rgba(255,255,255,.75)', ...enter(f, onBeat(0) + 6)}}>
							<Ar>{`${fmt(OFFER.was)} جنيه`}</Ar>
							<div style={{position: 'absolute', left: -8, right: -8, top: '52%', height: 8, background: C.sale, borderRadius: 4,
								transformOrigin: 'right center', transform: `scaleX(${strike}) rotate(-6deg)`}} />
						</div>
						<div style={{fontSize: 150, fontWeight: 900, color: C.accent, marginTop: 40, transform: `scale(${0.6 + 0.4 * s})`, opacity: f < onBeat(2) ? 0 : 1}}>
							<Ar>{fmt(OFFER.price)}</Ar>
						</div>
					</div>
				</Steady>
			</div>
			<div style={{position: 'absolute', top: SAFE.top + 20, right: 1080 - SAFE.right + 24, left: SAFE.left + 24, textAlign: 'right', fontFamily: FONT,
				fontSize: 64, fontWeight: 800, color: C.white}}>
				<Words text="عرض الأسبوع وصل" f={f} at={3} dist={56} dur={DUR.headline} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', justifyContent: 'center'}}>
				<div style={{height: 110, padding: '0 44px', borderRadius: 55, background: C.sale, color: C.white, whiteSpace: 'nowrap',
					display: 'flex', alignItems: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 56, transform: `scale(${b})`}}>
					<Ar>{`خصم ${OFFER.pct}%`}</Ar>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const End: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const b = snap(f, onBeat(1), fps);
	return (
		<AbsoluteFill style={{background: C.primary, fontFamily: FONT, color: C.white, alignItems: 'center'}}>
			<div style={{position: 'absolute', top: 520, width: '100%', textAlign: 'center', ...headline(f, 0)}}>
				{LOGOS.main ? <Img src={staticFile(LOGOS.main)} style={{height: 220}} /> : <div style={{fontSize: 96, fontWeight: 900}}><Ar>اسم البراند</Ar></div>}
			</div>
			<div style={{position: 'absolute', top: 860, left: CX - 340, width: 680, height: 140, borderRadius: 70, background: '#15803d',
				display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58, fontWeight: 800, transform: `scale(${b})`}}>
				<Ar>{`واتساب ${CONTACT.whatsapp}`}</Ar>
			</div>
		</AbsoluteFill>
	);
};

export const SCENE_VIEWS: Record<SceneId, React.FC<{variant: Variant}>> = {offer: Offer, end: End};
