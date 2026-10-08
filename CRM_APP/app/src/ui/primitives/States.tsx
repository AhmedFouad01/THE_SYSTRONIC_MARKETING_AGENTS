import { Identity } from "./Identity.tsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import { useI18n } from "../i18n/index.ts";
import { Button } from "./Button.tsx";
import { Spinner } from "./Spinner.tsx";

function Block({
	icon,
	title,
	hint,
	role,
	children,
	testId,
}: {
	icon: IconName | null;
	title: string;
	hint?: string | undefined;
	role?: "status" | "alert";
	children?: ReactNode;
	testId?: string;
}) {
	return (
		<div
			className="sy-state grid justify-items-center gap-8 p-22 text-center text-text-2"
			role={role}
			data-testid={testId}
		>
			{icon ? <Icon name={icon} size={28} /> : null}
			<p className="sy-state__title m-0 font-[600] text-text">{title}</p>
			{hint ? (
				<p className="sy-state__hint m-0 text-data text-text-3">{hint}</p>
			) : null}
			{children}
		</div>
	);
}

export function LoadingState({ label }: { label?: string }) {
	const { t } = useI18n();
	const text = label ?? t("state.loading");
	return (
		<div
			className="sy-state grid justify-items-center gap-8 p-22 text-center text-text-2"
			role="status"
			aria-busy="true"
			data-testid="state-loading"
		>
			<Spinner size={24} />
			<p className="sy-state__title m-0 font-[600] text-text">{text}</p>
		</div>
	);
}

/** Loading placeholder shaped like list rows (UX-23): keeps the layout stable instead of a lone spinner. */
export function SkeletonRows({
	count = 6,
	label,
}: {
	count?: number;
	label?: string;
}) {
	const { t } = useI18n();
	return (
		<div
			className="sy-skel grid gap-8"
			role="status"
			aria-busy="true"
			aria-label={label ?? t("state.loading")}
			data-testid="state-loading"
		>
			{Array.from({ length: count }, (_, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: fixed-length decorative placeholders
					key={i}
					className="sy-skel__row flex items-center gap-16 min-h-[48px] px-12 border border-solid border-border rounded-8 bg-surface"
					data-testid="skeleton-row"
					aria-hidden="true"
				>
					<span className="sy-skel__bar sy-skel__bar--lg block h-12 rounded-8 bg-divider motion-safe:animate-[sy-skel-pulse_1.2s_ease-in-out_infinite] flex-[3_1_0]" />
					<span className="sy-skel__bar sy-skel__bar--md block h-12 rounded-8 bg-divider motion-safe:animate-[sy-skel-pulse_1.2s_ease-in-out_infinite] flex-[2_1_0]" />
					<span className="sy-skel__bar sy-skel__bar--sm block h-12 rounded-8 bg-divider motion-safe:animate-[sy-skel-pulse_1.2s_ease-in-out_infinite] flex-[1_1_0]" />
				</div>
			))}
		</div>
	);
}

export function EmptyState({
	title,
	hint,
	action,
}: {
	title?: string;
	hint?: string;
	action?: ReactNode;
}) {
	const { t } = useI18n();
	return (
		<Block
			icon="inbox"
			title={title ?? t("state.empty")}
			hint={hint}
			testId="state-empty"
		>
			{action}
		</Block>
	);
}

export function ErrorState({
	title,
	hint,
	requestId,
	onRetry,
}: {
	title?: string;
	hint?: string;
	requestId?: string | null;
	onRetry?: () => void;
}) {
	const { t } = useI18n();
	return (
		<Block
			icon="warning"
			title={title ?? t("state.error")}
			hint={hint}
			role="alert"
			testId="state-error"
		>
			{requestId ? (
				<p className="sy-state__ref sy-ltr m-0 text-data text-text-3">
					<Identity value={requestId} label={t("record.technical")} />
				</p>
			) : null}
			{onRetry ? (
				<Button variant="secondary" onClick={onRetry}>
					{t("state.retry")}
				</Button>
			) : null}
		</Block>
	);
}

/** 403: authenticated but not permitted. No retry (retrying cannot help); it is not an error of the system. */
export function ForbiddenState({
	title,
	hint,
}: {
	title?: string;
	hint?: string;
}) {
	const { t } = useI18n();
	return (
		<Block
			icon="lock"
			title={title ?? t("state.forbidden")}
			hint={hint ?? t("state.forbiddenHint")}
			testId="state-forbidden"
		/>
	);
}
