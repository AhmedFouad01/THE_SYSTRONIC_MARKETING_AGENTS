import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Fonts} from './lib/fonts';
import {Caption, SafeZones} from './lib/overlay';
import {musicCurve} from './lib/schedule';
import {C} from './job/brand';
import {SCENE_VIEWS} from './job/scenes';
import {SFX_CUES} from './job/sfx';
import {MUSIC, SCENES, TOTAL, Variant, VO} from './job/timeline';

// `stem` renders one audio group on its own for the mix QA (qa/mix_check.py); 'all' is the real mix.
// `safe` draws the safe-box overlay for review stills; never on in an export.
export type MasterProps = {variant: Variant; safe: boolean; stem?: 'all' | 'vo' | 'music' | 'sfx'};

const TAIL = 9; // each scene keeps rendering under the next one's entrance
const musicLevel = musicCurve(TOTAL, VO, {level: MUSIC.level, duck: MUSIC.duck});

export const Master: React.FC<MasterProps> = ({variant, safe, stem = 'all'}) => {
	const play = (g: 'vo' | 'music' | 'sfx') => stem === 'all' || stem === g;
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Fonts />
			{SCENES.map((s, i) => {
				const View = SCENE_VIEWS[s.id];
				const last = i === SCENES.length - 1;
				return (
					<Sequence key={s.id} from={s.from} durationInFrames={s.frames + (last ? 0 : TAIL)} name={s.id}>
						<View variant={variant} />
					</Sequence>
				);
			})}
			{VO.map((l) => (
				<React.Fragment key={l.index}>
					{l.file && play('vo') && (
						<Sequence from={l.fileStart} name={`vo ${l.index}`}>
							<Audio src={staticFile(`audio/vo/${l.file}`)} />
						</Sequence>
					)}
					{l.caption && <Caption text={l.text} start={l.captionStart} end={l.end} />}
				</React.Fragment>
			))}
			{MUSIC.file && play('music') && (
				<Audio src={staticFile(`audio/music/${MUSIC.file}`)} trimBefore={MUSIC.trimFrames} volume={(f) => musicLevel[Math.min(TOTAL - 1, f)]} />
			)}
			{play('sfx') &&
				SFX_CUES(variant).map((c, i) => (
					<Sequence key={i} from={c.at} durationInFrames={60} name={`sfx ${c.name}`}>
						<Audio src={staticFile(`audio/sfx/${c.name}.wav`)} volume={c.vol} />
					</Sequence>
				))}
			{safe && <SafeZones />}
		</AbsoluteFill>
	);
};
