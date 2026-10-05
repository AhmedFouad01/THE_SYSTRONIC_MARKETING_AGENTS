import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Gate A / G: components consume var(--sy-*) tokens; raw colors live only in app/src/ui/tokens.
const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOKENS_DIR = join(SRC, "ui", "tokens");

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
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
	return [...(t.match(HEX) ?? []), ...(t.match(FUNC) ?? [])];
}

describe("no raw colors outside ui/tokens", () => {
	it("detector catches hex and color functions, ignores comments", () => {
		expect(findRawColors("a{color:#fff}")).toEqual(["#fff"]);
		expect(findRawColors("a{color:#FF003C}")).toEqual(["#FF003C"]);
		expect(findRawColors("a{color:rgba(0,0,0,.5)}")).toEqual(["rgba("]);
		expect(findRawColors("/* #fff */ a{color:var(--sy-text)}")).toEqual([]);
		expect(findRawColors("#root{margin:0}")).toEqual([]);
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
