// SFX cue list: every sound sits on the frame its animation hits (timings mirror the scene code).
// Files are public/audio/sfx/<name>.wav from audio/sfx_prep.py (peak -6 dBFS, onset trimmed).
// Example from EX-MO-001:  add(scene('offer').from + 12, 'swish', 0.5);  // the strike draws on frame 12
// Rules: one sound per visual event, never on every transition, nothing in the last 2 s.
import {Cue} from '../lib/schedule';
import {Variant} from './timeline';

export const SFX_CUES = (_variant: Variant): Cue[] => {
	const c: Cue[] = [];
	// const add = (at: number, name: string, vol: number) => c.push({at: Math.round(at), name, vol});
	return c;
};
