import { useImportAccess } from "./features/imports/access.ts";
import { useEffect, useRef, useState } from "react";
import { DEV_BEARER, sessionStore, useSession } from "./api/index.ts";
import { fetchAssignees } from "./features/leads/api.ts";
import { ContactsView, DashboardView, DealsView, LeadsView, PipelineView, PropertiesView, ReportingView, TasksView, useSchemaRead } from "./features/index.ts";
import { useRoute } from "./router.ts";
import { EmptyState, I18nProvider, roleLabel, ThemeProvider, ToastProvider, useI18n } from "./ui/index.ts";
import { ImportWizard } from "./features/imports/ImportWizard.tsx";
import { workspaceKey } from "./api/workspaces.ts";
import { upcomingHiddenKeys } from "./ui/shell/navigation.ts";
import { AppShell, ConnectGate } from "./ui/shell/index.ts";

import { AuthLinkPage } from "./features/auth/AuthLinkPage.tsx";
import type { AuthLink } from "./features/auth/link.ts";
import { SignIn } from "./features/auth/SignIn.tsx";
import { authErrorKey } from "./features/auth/errors.ts";

// Every route has a screen; only an unknown path under /app falls through to not-found.
function NotFound() {
	const { t } = useI18n();
	return <EmptyState title={t("shell.notFound")} />;
}

function Routed() {
	const { t, tx } = useI18n();
	const route = useRoute();
	const session = useSession();

	useEffect(() => {
		void sessionStore.restore();
	}, []);

	const connected = session.status === "connected" && session.info !== null;
	const actorId = connected ? (session.info?.actor ?? null) : null;
	const scope = actorId && session.workspace ? workspaceKey(actorId, session.workspace) : "disconnected";
	const previousScope = useRef<string | null>(null);
	const [announcedWorkspace, setAnnouncedWorkspace] = useState<string | null>(null);
	useEffect(() => {
		if (!connected) return;
		if (previousScope.current && previousScope.current !== scope) {
			const target = document.querySelector<HTMLElement>('[data-testid="workspace-switch"]') ?? document.getElementById("sy-main");
			target?.focus();
			setAnnouncedWorkspace(session.workspace?.tenantId ?? null);
		}
		previousScope.current = scope;
	}, [connected, scope, session.workspace?.tenantId]);
	const canImport = useImportAccess(connected, scope, session.info, Boolean(session.workspace?.grantId));
	const canReadSchema = useSchemaRead(actorId, connected ? session.info?.schema_read : undefined, scope);
	const [actorName, setActorName] = useState<string | null>(null);
	useEffect(() => {
		setActorName(null);
		if (actorId === null || scope === "disconnected") return;
		const ctrl = new AbortController();
		fetchAssignees(ctrl.signal)
			.then((list) => setActorName(list.find((a) => a.id === actorId)?.name ?? null))
			.catch(() => undefined); // name is cosmetic: the shell falls back to a neutral label
		return () => ctrl.abort();
	}, [actorId, scope]);
	if (!connected && !DEV_BEARER) return <SignIn error={session.error} checking={session.status === "checking"} />;
	return (
		<>
		<div className="sy-workspace-announcement sr-only" role="status" aria-live="polite" aria-atomic="true">{announcedWorkspace && connected ? tx("workspace.changed", { name: announcedWorkspace }) : null}</div>
		<AppShell
			key={scope}
			workspace={session.workspace}
			knownWorkspaceCount={session.knownWorkspaceCount}
			loadWorkspaces={sessionStore.listWorkspaces}
			switchWorkspace={sessionStore.switchWorkspace}
			route={route}
			actor={actorId}
			actorName={actorName}
			actorRole={connected ? roleLabel(session.info?.configure || session.info?.merge ? "manager" : null, t) : null}
			onDisconnect={() => { void sessionStore.logout(); }}
			hiddenNavKeys={[
				...(canImport ? [] : ["import"]),
				...(canReadSchema === true ? [] : ["properties"]),
				...upcomingHiddenKeys(Boolean(session.info?.configure || session.info?.merge), Boolean(sessionStore.getCredentials()?.grantId)),
			]}
		>
			{connected && session.error ? <p role="alert" className="text-danger-fg">{t(authErrorKey(session.error))}</p> : null}
			{connected ? (
				<WorkspaceContent key={scope} route={route} />
			) : (
				<ConnectGate error={session.error} checking={session.status === "checking"} />
			)}
		</AppShell>
		</>
	);
}

/** A successful scope change remounts every feature: selections, records and future import drafts are tenant-bound. */
function WorkspaceContent({ route }: { route: ReturnType<typeof useRoute> }) {
	return (
		route === "/imports" ? (
			<ImportWizard />
		) : route === "/leads" ? (
			<LeadsView />
		) : route === "/contacts" ? (
			<ContactsView />
		) : route === "/deals" ? (
			<DealsView />
		) : route === "/pipeline" ? (
			<PipelineView />
		) : route === "/reporting" || route === "/reporting-v2" ? (
			<ReportingView />
		) : route === "/settings/properties" ? (
			<PropertiesView />
		) : route === "/tasks" ? (
			<TasksView />
		) : route === "/dashboard" || route === "/" ? (
			<DashboardView />
		) : (
			<NotFound />
		)
	);
}

function Screens({ authLink }: { authLink: AuthLink | null }) {
	const route = useRoute();
	if (route === "/invite" || route === "/reset") {
		return <AuthLinkPage key={route} link={
			authLink?.kind === route.slice(1) ? authLink : {
				kind: route === "/invite" ? "invite" : "reset", secret: null,
			}
		} />;
	}
	return <Routed />;
}

export function App({ authLink = null }: { authLink?: AuthLink | null }) {
	return (
		<ThemeProvider>
			<I18nProvider>
				<ToastProvider>
					<Screens authLink={authLink} />
				</ToastProvider>
			</I18nProvider>
		</ThemeProvider>
	);
}
