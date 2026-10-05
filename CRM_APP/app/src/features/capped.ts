// A count derived from ONE cursor page (Dashboard, Leads strip): exact when the server said "no more pages",
// otherwise an exact LOWER BOUND shown as "N+". Never extrapolated, never summed past what the server returned.
export type CappedCount = { count: number; capped: boolean };

export function cappedCount(shown: number, hasMore: boolean): CappedCount {
	return { count: Math.max(0, Math.trunc(shown)), capped: hasMore };
}

/** "12" when exact, "50+" when a lower bound. `format` renders the number in the active locale. */
export function formatCapped(
	c: CappedCount,
	format: (n: number) => string,
): string {
	return c.capped ? `${format(c.count)}+` : format(c.count);
}
