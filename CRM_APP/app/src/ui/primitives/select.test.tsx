import { describe, expect, it } from "vitest";
import { parseOptions } from "./Select.tsx";

describe("Select option parsing", () => {
	it("flattens <option> children through fragments, arrays and nulls", () => {
		const opts = parseOptions(
			<>
				<option value="">All</option>
				{null}
				{[1, 2].map((n) => (
					<option key={n} value={`v${n}`}>
						Item {n}
					</option>
				))}
				<option value="x" disabled>
					Locked
				</option>
			</>,
		);
		expect(opts).toEqual([
			{ value: "", label: "All", disabled: false },
			{ value: "v1", label: "Item 1", disabled: false },
			{ value: "v2", label: "Item 2", disabled: false },
			{ value: "x", label: "Locked", disabled: true },
		]);
	});
	it("falls back to the label when value is omitted", () => {
		expect(parseOptions(<option>Plain</option>)).toEqual([
			{ value: "Plain", label: "Plain", disabled: false },
		]);
	});
});
