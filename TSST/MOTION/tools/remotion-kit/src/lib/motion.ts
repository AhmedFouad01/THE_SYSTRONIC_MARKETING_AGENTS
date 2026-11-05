// Motion tokens: the one place that decides how anything moves (TSST-MOTION-SK-001, ref/motion-tokens.md).
// Every text layer enters with ENTER (expo-out) and fades with FADE_IN; exits use EXIT (expo-in, always
// faster than the entrance) or a hard cut on the beat. Springs are only for impact elements, with two
// presets: SNAP (badges, buttons) and STAMP (the new price). Distances stay small; big scale moves belong
// to an opener only. Scene code never writes its own bezier, duration or spring: it uses these names.
// Owner-approved on the Al Doctor Market job (2026-11-03), EX-MO-001.
import React from 'react';
import {Easing, interpolate, spring} from 'remotion';

export const EASE = {
	enter: Easing.bezier(0.16, 1, 0.3, 1), // expo-out
	fade: Easing.out(Easing.cubic),
	exit: Easing.bezier(0.7, 0, 0.84, 0), // expo-in
	move: Easing.inOut(Easing.cubic), // non-text camera/finger paths
};
// frames at 30 fps
export const DUR = {line: 12, headline: 14, fade: 7, exit: 7, strike: 6, caption: 8, scene: 10};
export const DIST = {body: 28, headline: 56, caption: 16};
export const SCALE_FROM = 0.92;
export const STAGGER = 3; // between lines / words, in RTL reading order

export const SNAP = {damping: 20, stiffness: 240, mass: 0.6}; // ~3–5% overshoot
export const STAMP = {damping: 14, stiffness: 260, mass: 0.6}; // one visible overshoot, settled in ~12 frames

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ease = (f: number, at: number, dur: number, from: number, to: number, easing = EASE.enter) =>
	interpolate(f, [at, at + dur], [from, to], {...clamp, easing});
export const fadeIn = (f: number, at: number, dur = DUR.fade) => ease(f, at, dur, 0, 1, EASE.fade);
export const fadeOut = (f: number, at: number, dur = DUR.exit) => ease(f, at, dur, 1, 0, EASE.exit);
// 0→1 progress for lines that draw in (strikes, wipes)
export const draw = (f: number, at: number, dur = DUR.strike) => ease(f, at, dur, 0, 1);

// standard text entrance: the move and the fade start on the same frame
export const enter = (f: number, at: number, {dist = DIST.body, dur = DUR.line, axis = 'y' as 'x' | 'y'} = {}): React.CSSProperties => ({
	opacity: fadeIn(f, at),
	transform: `translate${axis === 'y' ? 'Y' : 'X'}(${ease(f, at, dur, dist, 0)}px)`,
});
export const headline = (f: number, at: number) => enter(f, at, {dist: DIST.headline, dur: DUR.headline});
export const scaleIn = (f: number, at: number, dur = DUR.line): React.CSSProperties => ({
	opacity: fadeIn(f, at),
	transform: `scale(${ease(f, at, dur, SCALE_FROM, 1)})`,
});
export const exit = (f: number, at: number, {dist = DIST.body, dur = DUR.exit} = {}): React.CSSProperties => ({
	opacity: fadeOut(f, at, dur),
	transform: `translateY(${ease(f, at, dur, 0, -dist, EASE.exit)}px)`,
});

export const snap = (f: number, at: number, fps: number) => (f < at ? 0 : spring({frame: f - at, fps, config: SNAP}));
export const stamp = (f: number, at: number, fps: number) => (f < at ? 0 : spring({frame: f - at, fps, config: STAMP}));
