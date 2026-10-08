import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Gate A / G: components consume var(--sy-*) tokens; raw colors live only in app/src/ui/tokens.
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOKENS_DIR = join(SRC, "ui", "tokens");

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const NAMED = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(" "));
const COLOR_PROPERTY = /\b(?:color|background(?:-color|Color)?|border(?:-[\w-]+|[A-Z][A-Za-z]*)?|outline(?:-color|Color)?|fill(?:Style)?|stroke(?:Style)?|box-shadow|boxShadow|text-shadow|textShadow)\s*[:=]\s*([^;\n}]+)/g;
const PAINT_ATTRIBUTE = /\b(?:color|fill|stroke)\s*=\s*["']([^"']+)["']/g;
const FUNC = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g;

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		return e.isDirectory() ? walk(p) : [p];
	});
}

function stripComments(text: string): string {
	return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function findRawColors(text: string): string[] {
	const t = stripComments(text);
	const named: string[] = [];
 for (const match of [...t.matchAll(COLOR_PROPERTY), ...t.matchAll(PAINT_ATTRIBUTE)]) {
  for (const word of match[1]?.replace(/var\([^)]*\)/g, "").match(/\b[a-z]+\b/gi) ?? [])
   if (NAMED.has(word.toLowerCase())) named.push(word);
 }
 // Standard Tailwind palettes must not bypass the canonical theme, including named arbitrary values.
 for (const match of t.matchAll(/\b(?:bg|text|border|outline|fill|stroke|shadow)-(?:\[)?([a-z]+)(?:-\d+|\])?\b/gi))
  if (NAMED.has(match[1]?.toLowerCase() ?? "")) named.push(match[1] ?? "");
 return [...(t.match(HEX) ?? []), ...(t.match(FUNC) ?? []), ...named];
}

describe("no raw colors outside ui/tokens", () => {
	it("detector catches hex and color functions, ignores comments", () => {
		expect(findRawColors("a{color:#fff}")).toEqual(["#fff"]);
		expect(findRawColors("a{color:#FF003C}")).toEqual(["#FF003C"]);
		expect(findRawColors("a{color:rgba(0,0,0,.5)}")).toEqual(["rgba("]);
		expect(findRawColors("/* #fff */ a{color:var(--sy-text)}")).toEqual([]);
		expect(findRawColors("#root{margin:0}")).toEqual([]);
	});

	it("detects named CSS/JS/canvas colours and utility pigments, without matching ordinary data", () => {
  for (const code of ['a{color:red}', 'a{border:1px solid white}', 'style={{backgroundColor: "rebeccapurple"}}', 'ctx.fillStyle = "orange";', '<svg fill="blue" />', '<div className="text-red-500 bg-[black]" />'])
   expect(findRawColors(code).length, code).toBeGreaterThan(0);
  expect(findRawColors('const name = "Orange Egypt"; const status = "blue";')).toEqual([]);
  expect(findRawColors('a{color:var(--sy-text);background:transparent;fill:currentColor}')).toEqual([]);
 });
 it("detects every colour function form", () => {
  for (const fn of ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch", "color"])
   expect(findRawColors(`a{color:${fn}(0 0 0)}`)).toContain(`${fn}(`);
 });

 it("app/src (excluding ui/tokens and tests) has no raw color literals", () => {
		const offenders: string[] = [];
		for (const file of walk(SRC)) {
			if (!/\.(ts|tsx|css)$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
			if (file.startsWith(TOKENS_DIR + sep)) continue;
			const hits = findRawColors(readFileSync(file, "utf8"));
			if (hits.length)
				offenders.push(`${relative(SRC, file)}: ${hits.join(", ")}`);
		}
		expect(offenders).toEqual([]);
	});
});
