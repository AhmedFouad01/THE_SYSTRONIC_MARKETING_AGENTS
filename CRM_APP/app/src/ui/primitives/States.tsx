import type { ReactNode } from "react";
import { Icon, type IconName } from "../icons/index.ts";
import { useI18n } from "../i18n/index.ts";
import { Button } from "./Button.tsx";
import { Spinner } from "./Spinner.tsx";
import "./states.css";

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
		<div className="sy-state" role={role} data-testid={testId}>
			{icon ? <Icon name={icon} size={28} /> : null}
			<p className="sy-state__title">{title}</p>
			{hint ? <p className="sy-state__hint">{hint}</p> : null}
			{children}
		</div>
	);
}

export function LoadingState({ label }: { label?: string }) {
	const { t } = useI18n();
	const text = label ?? t("state.loading");
	return (
		<div className="sy-state" role="status" aria-busy="true" data-testid="state-loading">
			<Spinner size={24} />
			<p className="sy-state__title">{text}</p>
		</div>
	);
}

export function EmptyState({ title, hint, action }: { title?: string; hint?: string; action?: ReactNode }) {
	const { t } = useI18n();
	return (
		<Block icon="inbox" title={title ?? t("state.empty")} hint={hint} testId="state-empty">
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
		<Block icon="warning" title={title ?? t("state.error")} hint={hint} role="alert" testId="state-error">
			{requestId ? <p className="sy-state__ref sy-ltr">{t("error.requestId", { id: requestId })}</p> : null}
			{onRetry ? (
				<Button variant="secondary" onClick={onRetry}>
					{t("state.retry")}
				</Button>
			) : null}
		</Block>
	);
}

/** 403: authenticated but not permitted. No retry (retrying cannot help); it is not an error of the system. */
export function ForbiddenState({ title, hint }: { title?: string; hint?: string }) {
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
