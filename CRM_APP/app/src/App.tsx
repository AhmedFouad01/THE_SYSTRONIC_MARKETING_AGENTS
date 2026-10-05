import { useEffect } from "react";
import { sessionStore, useSession } from "./api/index.ts";
import { ContactsView, DealsView, LeadsView, PipelineView, ReportingView, TasksView } from "./features/index.ts";
import { useRoute } from "./router.ts";
import { EmptyState, I18nProvider, Panel, ThemeProvider, ToastProvider, useI18n } from "./ui/index.ts";
import { AppShell, ConnectGate, NAV } from "./ui/shell/index.ts";

// Feature screens (leads, contacts, ...) land in S4+. Until then each route shows a labelled placeholder.
function RoutePlaceholder() {
	const { t } = useI18n();
	const route = useRoute();
	if (route === null) return <EmptyState title={t("shell.notFound")} />;
	const item = NAV.find((n) => n.route === route || (n.route !== null && n.also === route));
	return (
		<Panel title={item ? t(item.label) : t("app.name")}>
			<p>{t("shell.comingSoon")}</p>
			<p className="sy-ltr" data-testid="route">
				{route}
			</p>
		</Panel>
	);
}

function Routed() {
	const route = useRoute();
	const session = useSession();

	useEffect(() => {
		void sessionStore.restore();
	}, []);

	const connected = session.status === "connected" && session.info !== null;
	return (
		<AppShell
			route={route}
			actor={connected ? (session.info?.actor ?? null) : null}
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
