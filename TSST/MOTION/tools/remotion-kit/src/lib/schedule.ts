// Scene table → absolute frames, VO lines → speech windows, and the ducked music curve.
// Pure functions; the job's numbers live in src/job/timeline.ts.

export type Row<Id extends string> = {id: Id; dur: number; caption: boolean};
export type Scene<Id extends string> = Row<Id> & {from: number; frames: number};

export const buildScenes = <Id extends string>(table: Row<Id>[], fps: number): Scene<Id>[] => {
	let at = 0;
	return table.map((s) => {
		const from = at;
		const frames = Math.round(s.dur * fps);
		at += frames;
		return {...s, from, frames};
	});
};

// One recorded line, as audio/cut_vo.py writes it to lines.json
export type Recorded = {index: number; file: string; duration: number; speech: number; lead_in: number};
export type VoLine<Id extends string> = {scene: Id; text: string; lead: number};

// Speech starts at its scene + lead, or `gap` frames after the previous line ends if that one ran long
// (never two lines at once). The file starts lead_in earlier (it carries the breath before the first word).
// Without a recording a line holds to its scene's end, so captions and timing can be reviewed before any VO exists.
export const scheduleVo = <Id extends string>(lines: VoLine<Id>[], scenes: Scene<Id>[], recorded: Recorded[], fps: number, gap = 6) => {
	let prevEnd = -Infinity;
	return lines.map((l, i) => {
		const sc = scenes.find((s) => s.id === l.scene);
		if (!sc) throw new Error(`VO line ${i + 1}: unknown scene ${l.scene}`);
		const rec = recorded.find((r) => r.index === i + 1);
		const start = Math.max(sc.from + l.lead, prevEnd + gap);
		const end = rec ? start + Math.ceil(rec.speech * fps) : sc.from + sc.frames - 3;
		prevEnd = end;
		return {
			...l,
			index: i + 1,
			start,
			end,
			captionStart: start,
			caption: sc.caption,
			fileStart: rec ? start - Math.round(rec.lead_in * fps) : start,
			file: rec?.file ?? null,
			overrun: Math.max(0, end - (sc.from + sc.frames)), // > 0 = the line runs into the next scene: fix the script or the lead
		};
	});
};

// Fit check: call it in timeline.ts right after scheduleVo, so a VO line longer than its scene stops the
// build with the numbers before anything is rendered (MOTION-TRAIN-001: cutdown lines recorded before the
// cutdown's scene lengths were fixed). `allow` lists line indexes that may run on on purpose (a montage line).
export const assertFits = (vo: {index: number; text: string; overrun: number}[], fps: number, allow: number[] = []) => {
	const bad = vo.filter((l) => l.overrun > 0 && !allow.includes(l.index));
	if (bad.length)
		throw new Error('VO does not fit its scene: ' + bad.map((l) => `line ${l.index} runs ${(l.overrun / fps).toFixed(2)}s into the next scene ("${l.text}")`).join('; ') +
			'. Re-time the scenes (keep the total) or trim the script; never speed the voice (SK-002).');
};

// Music gain per frame: `duck` from 4 frames before a recorded line's FILE starts (not its scheduled first
// word: TTS word timings can be ~0.3 s late, EX-MO-001 line 4) to 4 frames after it ends, `level`
// otherwise, averaged over `smooth` frames so it never pumps, faded to 0 over the last `tail` frames.
// Defaults are the EX-MO-001 levels; qa/mix_check.py decides on every job.
export const musicCurve = (total: number, vo: {file: string | null; fileStart: number; end: number}[], {level = 0.5, duck = 0.08, smooth = 9, tail = 12} = {}) => {
	const raw = Array.from({length: total}, (_, f) => (vo.some((l) => l.file && f >= l.fileStart - 4 && f <= l.end + 4) ? duck : level));
	const h = Math.floor(smooth / 2);
	return raw.map((_, f) => {
		const w = raw.slice(Math.max(0, f - h), f + h + 1);
		return (w.reduce((a, b) => a + b, 0) / w.length) * Math.min(1, (total - 1 - f) / tail);
	});
};

// One SFX hit: the file in public/audio/sfx/<name>.wav (normalised by audio/sfx_prep.py) on frame `at`
export type Cue = {at: number; name: string; vol: number};
