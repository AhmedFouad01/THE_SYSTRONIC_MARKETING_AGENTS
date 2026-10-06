import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/index.ts";
import { Button, EmptyState, SkeletonRows } from "./index.ts";

describe("loading and empty states (UX-23)", () => {
	it("SkeletonRows renders the requested row count, announced as one busy status", () => {
		const html = renderToString(
			<I18nProvider>
				<SkeletonRows count={6} />
			</I18nProvider>,
		);
		expect(html.match(/data-testid="skeleton-row"/g)).toHaveLength(6);
		expect(html).toContain('aria-busy="true"');
		expect(html).toContain('role="status"');
		// individual rows are decorative: only the container is announced
		expect(html.match(/aria-hidden="true"/g)).toHaveLength(6);
	});

	it("EmptyState renders its primary action when one is provided", () => {
		const html = renderToString(
			<I18nProvider>
				<EmptyState
					title="Nothing"
					action={
						<Button variant="primary" data-testid="cta">
							Publish calculation
						</Button>
					}
				/>
			</I18nProvider>,
		);
		expect(html).toContain('data-testid="cta"');
		expect(html).toContain("Publish calculation");
	});
});
