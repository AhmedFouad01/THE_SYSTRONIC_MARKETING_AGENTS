import { useEffect, useState } from "react";
import { sessionStore, useSession } from "./api/index.ts";
import { fetchAssignees } from "./features/leads/api.ts";
import { ContactsView, DashboardView, DealsView, LeadsView, PipelineView, PropertiesView, ReportingView, TasksView, useSchemaRead } from "./features/index.ts";
import { useRoute } from "./router.ts";
import { EmptyState, I18nProvider, roleLabel, ThemeProvider, ToastProvider, useI18n } from "./ui/index.ts";
import { AppShell, ConnectGate } from "./ui/shell/index.ts";

// Every route has a screen; only an unknown path under /app falls through to not-found.
function NotFound() {
	const { t } = useI18n();
	return <EmptyState title={t("shell.notFound")} />;
}

function Routed() {
	const { t } = useI18n();
	const route = useRoute();
	const session = useSession();

	useEffect(() => {
		void sessionStore.restore();
	}, []);

	const connected = session.status === "connected" && session.info !== null;
	const actorId = connected ? (session.info?.actor ?? null) : null;
	const canReadSchema = useSchemaRead(actorId, connected ? session.info?.schema_read : undefined);
	const [actorName, setActorName] = useState<string | null>(null);
	useEffect(() => {
		setActorName(null);
		if (actorId === null) return;
		const ctrl = new AbortController();
		fetchAssignees(ctrl.signal)
			.then((list) => setActorName(list.find((a) => a.id === actorId)?.name ?? null))
			.catch(() => undefined); // name is cosmetic: the shell falls back to a neutral label
		return () => ctrl.abort();
	}, [actorId]);
	return (
		<AppShell
			route={route}
			actor={actorId}
			actorName={actorName}
			actorRole={connected ? roleLabel(session.info?.configure || session.info?.merge ? "manager" : null, t) : null}
			onDisconnect={() => sessionStore.disconnect()}
			hiddenNavKeys={canReadSchema === true ? [] : ["properties"]}
		>
			{connected ? (
				route === "/leads" ? (
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
			) : (
				<ConnectGate error={session.error} checking={session.status === "checking"} />
			)}
		</AppShell>
	);
}

export function App() {
	return (
		<ThemeProvider>
			<I18nProvider>
				<ToastProvider>
					<Routed />
				</ToastProvider>
			</I18nProvider>
		</ThemeProvider>
	);
}
