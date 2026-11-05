// The job's edit map in seconds → frames. Change a duration here and everything follows.
import recorded from './vo.json';
import {assertFits, buildScenes, Recorded, scheduleVo} from '../lib/schedule';
import {fmt, OFFER} from './data';

export const FPS = 30;
export const BPM = 120; // the music's measured tempo (audio/music_analyze.py); the beat grid follows it
export const BEAT = Math.round((FPS * 60) / BPM); // 15 frames at 120 BPM
export const onBeat = (n: number) => n * BEAT;

export type SceneId = 'offer' | 'end';
export const SCENES = buildScenes<SceneId>(
	[
		{id: 'offer', dur: 4, caption: true},
		{id: 'end', dur: 3, caption: false}, // the card carries its own text; the last 2 s hold still
	],
	FPS,
);
export const TOTAL = SCENES.reduce((a, s) => a + s.frames, 0);
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

// One line per scene beat, display spelling; digits come from data. lead = frames after the scene cut.
export const VO = scheduleVo<SceneId>(
	[{scene: 'offer', text: `${OFFER.name}.. وفّر ${fmt(OFFER.save)} جنيه!`, lead: 6}],
	SCENES,
	(recorded as {lines: Recorded[]}).lines,
	FPS,
);
assertFits(VO, FPS);

// Variants differ by one scene or one variable (SK-002 / SK-006); each renders as its own full composition.
export const VARIANTS = ['A'] as const;
export type Variant = (typeof VARIANTS)[number];

// public/audio/music/<file>; trimFrames moves the first beat onto frame 0 (music_analyze.py "first beat").
export const MUSIC: {file: string | null; trimFrames: number; level: number; duck: number} = {file: null, trimFrames: 0, level: 0.5, duck: 0.08};
