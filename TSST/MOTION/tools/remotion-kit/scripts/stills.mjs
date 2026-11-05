// Review stills from one bundle: node scripts/stills.mjs <outDir> <compositionId> <scale> <safe 0|1> <name:frame>...
// e.g. node scripts/stills.mjs out/stills Master-9x16-A 0.5 1 f000:0 f045:45 mid:105 end:200
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const here = path.dirname(fileURLToPath(import.meta.url));
const [outDir, id, scale, safe, ...shots] = process.argv.slice(2);
if (!shots.length) {
	console.error('usage: node scripts/stills.mjs <outDir> <compositionId> <scale> <safe 0|1> <name:frame>...');
	process.exit(2);
}
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, '..', 'src', 'index.ts')});
const variant = id.split('-').pop();
const inputProps = {variant, safe: safe === '1', stem: 'all'};
const composition = await selectComposition({serveUrl, id, inputProps});
for (const s of shots) {
	const [name, frame] = s.split(':');
	const output = path.join(outDir, `${name}.png`);
	await renderStill({serveUrl, composition, frame: Number(frame), output, scale: Number(scale), inputProps, imageFormat: 'png'});
	console.log(output);
}
