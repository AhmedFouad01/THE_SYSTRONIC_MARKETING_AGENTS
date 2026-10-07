import { type MouseEvent, type ReactNode, useState, useSyncExternalStore } from "react";
import { href, navigate, ROUTES, type RoutePath } from "../../router.ts";
import { Bdi, type MessageKey, personLabel, useI18n } from "../i18n/index.ts";
import { Icon, type IconName } from "../icons/index.ts";
import { Dialog, MenuButton } from "../overlays/index.ts";
import { type RecordCrumb, RecordCrumbContext } from "./RecordCrumb.tsx";
import { useTheme } from "../theme/index.ts";
import "./shell.css";

type NavItem = {
	key: string;
	label: MessageKey;
	/** Short label for the 5-tab mobile bottom bar (UX-R3-05); falls back to `label`. */
	tab?: MessageKey;
	icon: IconName;
	route: RoutePath;
	also?: RoutePath;
	/** `settings` items sit under their own sidebar heading and can be hidden per user (`hiddenNavKeys`). */
	section?: "settings";
};

// Only screens that exist. Email/Call/Import have no MVP backend, so they are not shown at all (no fake affordances).
export const NAV: readonly NavItem[] = [
	{ key: "dashboard", label: "nav.dashboard", icon: "home", route: "/dashboard", also: "/" },
	{ key: "leads", label: "nav.leads", tab: "nav.tab.leads", icon: "leads", route: "/leads" },
	{ key: "contacts", label: "nav.contacts", tab: "nav.tab.contacts", icon: "contacts", route: "/contacts" },
	{ key: "deals", label: "nav.deals", tab: "nav.tab.deals", icon: "deals", route: "/deals" },
	{ key: "pipeline", label: "nav.pipeline", icon: "route", route: "/pipeline" },
	{ key: "tasks", label: "nav.tasks", tab: "nav.tab.tasks", icon: "tasks", route: "/tasks" },
	{ key: "reporting", label: "nav.reporting", icon: "report", route: "/reporting", also: "/reporting-v2" },
	{ key: "properties", label: "nav.properties", icon: "settings", route: "/settings/properties", section: "settings" },
];

// Every nav route must exist in the router (guards drift).
export const NAV_ROUTES: readonly RoutePath[] = NAV.flatMap((n) => (n.also ? [n.route, n.also] : [n.route]));
export const ALL_ROUTES_HAVE_NAV = ROUTES.every((r) => r === "/" || NAV_ROUTES.includes(r));

/** Mobile bottom bar: 4 screens + More (UX-24, max 5 tabs). The rest live in the More sheet. */
export const MOBILE_PRIMARY_KEYS: readonly string[] = ["leads", "contacts", "deals", "tasks"];
export function splitMobileNav(items: readonly NavItem[] = NAV): { primary: NavItem[]; overflow: NavItem[] } {
	return {
		primary: MOBILE_PRIMARY_KEYS.flatMap((k) => items.filter((n) => n.key === k)),
		overflow: items.filter((n) => !MOBILE_PRIMARY_KEYS.includes(n.key)),
	};
}

/** Up to two initials from a display name (first letter of the first and last word). */
export function initials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "";
	const first = [...(words[0] ?? "")][0] ?? "";
	const last = words.length > 1 ? ([...(words[words.length - 1] ?? "")][0] ?? "") : "";
	return (first + last).toUpperCase();
}

const MOBILE_QUERY = "(max-width: 720px)";
function subscribeMobile(cb: () => void): () => void {
	const mq = window.matchMedia(MOBILE_QUERY);
	mq.addEventListener("change", cb);
	return () => mq.removeEventListener("change", cb);
}
function useIsMobile(): boolean {
	return useSyncExternalStore(
		subscribeMobile,
		() => window.matchMedia(MOBILE_QUERY).matches,
		() => false,
	);
}

export type AppShellProps = {
	route: RoutePath | null;
	/** null = not connected: no navigation, no actor. */
	actor: string | null;
	/** Display name of the actor (never the id); falls back to a neutral label. */
	actorName?: string | null;
	/** Already-localised role label shown under the name. */
	actorRole?: string | null;
	onDisconnect?: () => void;
	/** Nav items the user may not open (e.g. `properties` without schema.read); they stay out of the sidebar and the More sheet. */
	hiddenNavKeys?: readonly string[];
	children: ReactNode;
};

function plainClick(e: MouseEvent): boolean {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export function AppShell({ route, actor, actorName, actorRole, onDisconnect, hiddenNavKeys = [], children }: AppShellProps) {
	const { t, toggleLocale, dir } = useI18n();
	const { mode, toggleMode } = useTheme();
	const mobile = useIsMobile();
	const [moreOpen, setMoreOpen] = useState(false);
	const [recordCrumb, setRecordCrumb] = useState<RecordCrumb | null>(null);
	const connected = actor !== null;
	const activeItem = NAV.find((n) => n.route === route || n.also === route);
	const name = personLabel(actorName, t);
	const visibleNav = NAV.filter((n) => !hiddenNavKeys.includes(n.key));
	const crmNav = visibleNav.filter((n) => n.section !== "settings");
	const settingsNav = visibleNav.filter((n) => n.section === "settings");
	const { primary, overflow } = splitMobileNav(visibleNav);
	const moreActive = activeItem !== undefined && overflow.includes(activeItem);

	const goDashboard = (e: MouseEvent) => {
		if (!plainClick(e)) return;
		e.preventDefault();
		navigate("/dashboard");
	};

	const link = (item: NavItem, className: string, afterNavigate?: () => void, shortLabel = false) => (
		<a
			key={item.key}
			href={href(item.route)}
			className={className}
			aria-current={item === activeItem ? "page" : undefined}
			data-testid={`nav-${item.key}`}
			onClick={(e) => {
				if (!plainClick(e)) return;
				e.preventDefault();
				navigate(item.route);
				afterNavigate?.();
			}}
		>
			<Icon name={item.icon} size={mobile ? 20 : 17} />
			<span className="sy-nav__label">{t(shortLabel && item.tab ? item.tab : item.label)}</span>
		</a>
	);

	const actorBlock = (
		<div className="sy-actor" data-testid="actor">
			<span className="sy-actor__avatar" aria-hidden="true">
				{initials(actorName ?? "") || initials(t("common.unknownUser"))}
			</span>
			<span className="sy-actor__copy">
				<span className="sy-actor__name">
					<Bdi>{name}</Bdi>
				</span>
				{actorRole ? <span className="sy-actor__role">{actorRole}</span> : null}
			</span>
		</div>
	);

	return (
		<RecordCrumbContext.Provider value={setRecordCrumb}>
		<div className="sy-shell" data-connected={connected}>
			<a className="sy-skip" href="#sy-main">
				{t("shell.skipToContent")}
			</a>
			{mobile ? null : (
				<aside className="sy-sidebar">
					{connected ? (
						<a
							className="sy-brand"
							href={href("/dashboard")}
							aria-label={t("shell.brandHome")}
							data-testid="brand-link"
							onClick={(e) => goDashboard(e)}
						>
						<div className="sy-brand__mark" aria-hidden="true">
							TS
						</div>
						<div className="sy-brand__copy">
							<div className="sy-brand__name">THE SYSTRONIC</div>
							<div className="sy-brand__sub">{t("nav.workspace")}</div>
						</div>
						</a>
					) : (
						<div className="sy-brand">
						<div className="sy-brand__mark" aria-hidden="true">
							TS
						</div>
						<div className="sy-brand__copy">
							<div className="sy-brand__name">THE SYSTRONIC</div>
							<div className="sy-brand__sub">{t("nav.workspace")}</div>
						</div>
						</div>
					)}
					{connected ? (
						<>
							<nav className="sy-primary-nav" aria-label={t("nav.primary")}>
								<div className="sy-nav-section" aria-hidden="true">
									{t("nav.crmSection")}
								</div>
								{crmNav.map((item) => link(item, "sy-nav sy-nav--route"))}
								{settingsNav.length > 0 ? (
									<div className="sy-nav-section" aria-hidden="true">
										{t("nav.settings")}
									</div>
								) : null}
								{settingsNav.map((item) => link(item, "sy-nav sy-nav--route"))}
							</nav>
							<div className="sy-sidebar__foot">{actorBlock}</div>
						</>
					) : null}
				</aside>
			)}
			<div className="sy-content">
				<header className="sy-topbar">
					{connected ? (
						<nav className="sy-crumbs" aria-label={t("shell.breadcrumb")}>
							<ol className="sy-crumbs__list">
								<li className="sy-crumbs__item">
									<a
										className="sy-crumbs__link"
										href={href("/dashboard")}
										data-testid="breadcrumb-crm"
										onClick={(e) => goDashboard(e)}
									>
										{t("nav.crmSection")}
									</a>
								</li>
								{activeItem ? (
									<li
										className={`sy-crumbs__item${recordCrumb ? "" : " sy-crumbs__item--current"}`}
										aria-current={recordCrumb ? undefined : "page"}
									>
										<Icon name="chevronRight" size={14} className="sy-crumbs__icon" />
										{recordCrumb ? (
											<a
												className="sy-crumbs__link"
												href={href(activeItem.route)}
												data-testid="breadcrumb-list"
												onClick={(e) => {
													if (!plainClick(e)) return;
													e.preventDefault();
													recordCrumb.back();
												}}
											>
												{t(activeItem.label)}
											</a>
										) : (
											<span data-testid="breadcrumb-current">{t(activeItem.label)}</span>
										)}
									</li>
								) : null}
								{activeItem && recordCrumb ? (
									<li className="sy-crumbs__item sy-crumbs__item--current" aria-current="page">
										<Icon name="chevronRight" size={14} className="sy-crumbs__icon" />
										<span className="sy-crumbs__record" data-testid="breadcrumb-current" title={recordCrumb.name}>
											<bdi dir="auto">{recordCrumb.name}</bdi>
										</span>
									</li>
								) : null}
							</ol>
						</nav>
					) : (
						<span className="sy-topbar__brand">THE SYSTRONIC</span>
					)}
					<div className="sy-topbar__tools">
						{mobile && connected ? actorBlock : null}
						<MenuButton
							label={t("action.workspaceActions")}
							testId="workspace-actions"
							items={[
								{
									id: "locale",
									label: t("locale.switchTo"),
									lang: dir === "rtl" ? "en" : "ar",
									testId: "locale-toggle",
									onSelect: toggleLocale,
								},
								{
									id: "theme",
									label: mode === "dark" ? t("theme.switchToLight") : t("theme.switchToDark"),
									testId: "theme-toggle",
									onSelect: toggleMode,
								},
								...(connected && onDisconnect
									? [
											{
												id: "disconnect",
												label: t("shell.disconnect"),
												icon: "lock" as const,
												testId: "disconnect",
												onSelect: onDisconnect,
											},
										]
									: []),
							]}
						/>
					</div>
				</header>
				<main id="sy-main" className="sy-main" tabIndex={-1}>
					<div className="sy-page">{children}</div>
				</main>
			</div>
			{mobile && connected ? (
				<>
					<nav className="sy-bottomnav" aria-label={t("nav.primary")}>
						{primary.map((item) => link(item, "sy-nav sy-nav--route", undefined, true))}
						<button
							type="button"
							className="sy-nav sy-nav--route sy-nav--more"
							aria-haspopup="dialog"
							aria-expanded={moreOpen}
							aria-current={moreActive ? "page" : undefined}
							data-testid="nav-more"
							onClick={() => setMoreOpen(true)}
						>
							<Icon name="more" size={20} />
							<span className="sy-nav__label">{t("nav.more")}</span>
						</button>
					</nav>
					<Dialog
						open={moreOpen}
						onClose={() => setMoreOpen(false)}
						title={t("nav.moreTitle")}
						placement="sheet"
						testId="more-sheet"
					>
						<nav className="sy-sheet-nav" aria-label={t("nav.moreTitle")}>
							{overflow.map((item) => link(item, "sy-nav sy-nav--route sy-nav--sheet", () => setMoreOpen(false)))}
						</nav>
					</Dialog>
				</>
			) : null}
		</div>
		</RecordCrumbContext.Provider>
	);
}
