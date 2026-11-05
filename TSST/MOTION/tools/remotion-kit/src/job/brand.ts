// The job's brand and layout. Replace every value for a new job; the kit reads only these names.
// Demo values (a neutral navy/yellow sale look); a real job takes them from the brand's approved tokens.
export const C = {bg: '#0a1650', primary: '#1b33b5', accent: '#ffe600', sale: '#e3141b', white: '#ffffff', ink: '#0a1650'};

// Font files in public/fonts. Alexandria (SIL OFL, public/fonts/OFL.txt) ships with the kit as the default
// Arabic face; a brand face replaces it here after its licence is checked.
export const FAMILY = 'Alexandria';
export const FONT = `"${FAMILY}", system-ui, sans-serif`;
export const FONT_FILES = [
	{file: 'fonts/alexandria-arabic.woff2', range: 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC'},
	{file: 'fonts/alexandria-latin.woff2', range: 'U+0000-00FF, U+2000-206F, U+20AC, U+2212'},
];

export const W = 1080;
export const H = 1920;
// Meta Reels safe box from SPARK (14% top, 35% bottom, 6% sides; TSST-MOTION-SK-007). A brief may set a
// different box for one placement: change it here and say so in the job notes.
export const SAFE = {top: 269, bottom: 1248, left: 65, right: 1015};
export const CAPTION = {top: 1088, bottom: 1238, bg: 'rgba(10,22,80,.85)', color: '#ffffff'};

// Client facts still waiting for confirmation live here, once, so one edit + a re-render swaps them.
export const CONTACT = {whatsapp: '01000000000'};
// Approved logo files in public/logos (composited, never regenerated or retyped). null = not delivered yet.
export const LOGOS: {main: string | null} = {main: null};
