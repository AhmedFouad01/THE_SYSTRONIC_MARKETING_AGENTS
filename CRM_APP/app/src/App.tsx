import { useEffect, useState } from "react";
import { sessionStore, useSession } from "./api/index.ts";
import { fetchAssignees } from "./features/leads/api.ts";
import { ContactsView, DealsView, LeadsView, PipelineView, ReportingView, TasksView } from "./features/index.ts";
import { useRoute } from "./router.ts";
import { EmptyState, I18nProvider, PageHeader, Panel, roleLabel, ThemeProvider, ToastProvider, useI18n } from "./ui/index.ts";
import { AppShell, ConnectGate, NAV } from "./ui/shell/index.ts";

// Feature screens (leads, contacts, ...) land in S4+. Until then each route shows a labelled placeholder.
function RoutePlaceholder() {
	const { t } = useI18n();
	const route = useRoute();
	if (route === null) return <EmptyState title={t("shell.notFound")} />;
	const item = NAV.find((n) => n.route === route || (n.route !== null && n.also === route));
	return (
		<div className="sy-placeholder">
			<PageHeader title={item ? t(item.label) : t("app.name")} />
			<Panel>
				<p>{t("shell.comingSoon")}</p>
				<p className="sy-ltr" data-testid="route">
					{route}
				</p>
			</Panel>
		</div>
	);
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
				) : route === "/tasks" ? (
					<TasksView />
				) : (
					<RoutePlaceholder />
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
