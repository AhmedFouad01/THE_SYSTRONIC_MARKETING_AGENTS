import { Button as AriaButton } from "react-aria-components";
import { shellClass } from "./styles.ts";
import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { Workspace } from "../../api/workspaces.ts";
import { sameWorkspace } from "../../api/workspaces.ts";
import { isApiError } from "../../api/errors.ts";
import { Bdi, useI18n } from "../i18n/index.ts";
import { Dialog } from "../overlays/index.ts";
import { Button } from "../primitives/Button.tsx";
import { Identity } from "../primitives/Identity.tsx";
import { workspaceName } from "./workspaceName.ts";
import { describeError } from "./ConnectGate.tsx";

export type WorkspaceControls = {
	workspace?: Workspace | null;
	knownWorkspaceCount?: number;
	loadWorkspaces?: (signal?: AbortSignal) => Promise<Workspace[]>;
	switchWorkspace?: (workspace: Workspace) => Promise<boolean>;
};

export function WorkspaceControl({
	workspace,
	canSwitch,
	onOpen,
}: {
	workspace: Workspace;
	canSwitch: boolean;
	onOpen: () => void;
}) {
	const { t } = useI18n();
	return (
		<div className={shellClass("sy-workspace")} data-testid="workspace-context">
			<span className={shellClass("sy-workspace__label")}>
				{t("workspace.label")}
			</span>
			<span className={shellClass("sy-workspace__name")}>
				<Identity value={workspace.tenantId} label={workspaceName(workspace, t("nav.workspace"))} />
			</span>
			{workspace.grantId ? (
				<span className={shellClass("sy-workspace__hint")}>
					{t("workspace.restricted")}
				</span>
			) : null}
			{canSwitch ? (
				<Button size="sm" onClick={onOpen} data-testid="workspace-switch">
					{t("workspace.switch")}
				</Button>
			) : null}
		</div>
	);
}

export function WorkspaceSwitchDialog({
	open,
	onClose,
	workspace,
	loadWorkspaces,
	switchWorkspace,
	returnFocusRef,
}: {
	open: boolean;
	onClose: () => void;
	workspace: Workspace;
	loadWorkspaces: (signal?: AbortSignal) => Promise<Workspace[]>;
	switchWorkspace: (workspace: Workspace) => Promise<boolean>;
	returnFocusRef: RefObject<HTMLElement | null>;
}) {
	const { t, formatCount } = useI18n();
	const [options, setOptions] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(true);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestController = useRef<AbortController | null>(null);
	const load = useCallback(() => {
		requestController.current?.abort();
		const controller = new AbortController();
		requestController.current = controller;
		setOptions([]);
		setLoading(true);
		setError(null);
		loadWorkspaces(controller.signal)
			.then((available) => {
				if (!controller.signal.aborted) setOptions(available);
			})
			.catch((failure: unknown) => {
				if (!controller.signal.aborted)
					setError(
						isApiError(failure)
							? describeError(failure, t)
							: t("error.network"),
					);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
	}, [loadWorkspaces, t]);
	useEffect(() => {
		if (!open) return;
		load();
		return () => requestController.current?.abort();
	}, [open, load]);
	const choose = async (option: Workspace) => {
		if (pending) return;
		setPending(true);
		setError(null);
		try {
			if (await switchWorkspace(option)) onClose();
			else {
				load();
				setError(t("workspace.switchFailed"));
			}
		} finally {
			setPending(false);
		}
	};
	return (
		<Dialog
			open={open}
			onClose={() => {
				if (!pending) onClose();
			}}
			title={t("workspace.switch")}
			placement="side"
			dock="right"
			returnFocusRef={returnFocusRef}
			testId="workspace-switch-dialog"
			footer={
				<Button disabled={pending} onClick={onClose}>
					{t("common.close")}
				</Button>
			}
		>
			<p>{t("workspace.knownOnly")}</p>
			{loading ? <p role="status">{t("workspace.checking")}</p> : null}
			{error ? (
				<div role="alert">
					<p>{error}</p>
					<Button disabled={pending} onClick={load}>
						{t("state.retry")}
					</Button>
				</div>
			) : null}
			{!loading && !error && options.length === 0 ? (
				<p>{t("workspace.none")}</p>
			) : null}
			<div
				className={shellClass("sy-workspace-options")}
				aria-busy={loading || pending}
			>
				{options.map((option, index) => (
					<AriaButton
						key={JSON.stringify([option.tenantId, option.grantId ?? ""])}
						type="button"
						render={(domProps) => <button {...domProps} title={option.tenantId} />}
						className={shellClass("sy-nav sy-workspace-option")}
						isDisabled={pending || sameWorkspace(option, workspace)}
						aria-current={sameWorkspace(option, workspace) ? "true" : undefined}
						onPress={() => void choose(option)}
					>
						<Bdi>{workspaceName(option, `${t("nav.workspace")} ${formatCount(index + 1)}`)}</Bdi>
						{option.grantId ? <span>{t("workspace.restricted")}</span> : null}
					</AriaButton>
				))}
			</div>
		</Dialog>
	);
}
