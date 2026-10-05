import { type ReactNode, useEffect, useMemo, useState } from "react";
import { isApiError, isForbidden } from "../../api/index.ts";
import { href, navigate } from "../../router.ts";
import {
	ErrorState,
	ForbiddenState,
	LoadingState,
	type MessageKey,
	useI18n,
} from "../../ui/index.ts";
import { contactSearch, formatMinor, UTC_DATETIME } from "./model.ts";

const LABELS: Record<string, MessageKey> = {
	payment_captured: "rep.ev.payment_captured",
	refund_recorded: "rep.ev.refund_recorded",
	deal_won: "rep.ev.deal_won",
	order_placed: "rep.ev.order_placed",
	order_delivered: "rep.ev.order_delivered",
	page_view: "rep.ev.page_view",
	form_submitted: "rep.ev.form_submitted",
	placed: "rep.st.placed",
	cancelled: "rep.st.cancelled",
	shipped: "rep.st.shipped",
	delivered: "rep.st.delivered",
	returned: "rep.st.returned",
	first_touch: "rep.model.first_touch",
	last_non_direct: "rep.model.last_non_direct",
};

/** Formatters shared by all report panels (money = minor units, times = UTC). */
export function useReportFmt() {
	const { t, locale, formatDate } = useI18n();
	return useMemo(
		() => ({
		minor: (v: string | number | bigint, currency: string | null | undefined) =>
			formatMinor(v, currency, locale),
		utc: (iso: string | null | undefined) =>
			iso ? `${formatDate(iso, UTC_DATETIME)} UTC` : "—",
		/** Known enum value -> translated label; unknown values are shown verbatim (never dropped). */
		label: (value: string | null | undefined) => {
			if (!value) return "—";
			const key = LABELS[value];
			return key ? t(key) : value;
		},
		}),
		[t, locale, formatDate],
	);
}

export type AsyncState<T> =
	| { status: "loading" }
	| { status: "ready"; data: T }
	| { status: "error"; error: unknown };

/** Fetch one record whenever `id` or `resetKey` changes; stale responses are aborted. */
export function useDetail<T>(
	fetcher: (id: string, signal: AbortSignal) => Promise<T>,
	id: string | null,
	resetKey: string,
): AsyncState<T> {
	const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
	// biome-ignore lint/correctness/useExhaustiveDependencies: fetcher is a stable module function
	useEffect(() => {
		if (id === null) return;
		const ctrl = new AbortController();
		setState({ status: "loading" });
		fetcher(id, ctrl.signal)
			.then((data) => setState({ status: "ready", data }))
			.catch((error: unknown) => {
				if (!ctrl.signal.aborted) setState({ status: "error", error });
			});
		return () => ctrl.abort();
	}, [id, resetKey]);
	return state;
}

/** Loading / forbidden / error shell for a detail fetch; renders `children` once ready. */
export function DetailState<T>({
	state,
	children,
}: {
	state: AsyncState<T>;
	children: (data: T) => ReactNode;
}) {
	const { t } = useI18n();
	if (state.status === "loading") return <LoadingState />;
	if (state.status === "error")
		return isForbidden(state.error) ? (
			<ForbiddenState />
		) : (
			<ErrorState
				title={t("rep.detail.failed")}
				requestId={isApiError(state.error) ? state.error.requestId : null}
			/>
		);
	return <>{children(state.data)}</>;
}

/** Link to the contact screen with `?select=` hand-off. */
export function ContactLink({ id }: { id: string | null }) {
	const { t } = useI18n();
	if (!id) return <span className="sy-rep__muted">—</span>;
	const search = contactSearch(id);
	return (
		<a
			href={href("/contacts") + search}
			data-testid="report-contact-link"
			onClick={(e) => {
				e.preventDefault();
				navigate("/contacts", search);
			}}
		>
			{t("rep.journey.open")}
		</a>
	);
}
