import { type MouseEvent, type ReactNode, useState, useSyncExternalStore } from "react";
import { href, navigate, ROUTES, type RoutePath } from "../../router.ts";
import { Bdi, type MessageKey, personLabel, useI18n } from "../i18n/index.ts";
import { Icon, type IconName } from "../icons/index.ts";
import { Dialog, MenuButton } from "../overlays/index.ts";
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
	children: ReactNode;
};

function plainClick(e: MouseEvent): boolean {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export function AppShell({ route, actor, actorName, actorRole, onDisconnect, children }: AppShellProps) {
	const { t, toggleLocale, dir } = useI18n();
	const { mode, toggleMode } = useTheme();
	const mobile = useIsMobile();
	const [moreOpen, setMoreOpen] = useState(false);
	const connected = actor !== null;
	const activeItem = NAV.find((n) => n.route === route || n.also === route);
	const name = personLabel(actorName, t);
	const { primary, overflow } = splitMobileNav();
	const moreActive = activeItem !== undefined && overflow.includes(activeItem);

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
		<div className="sy-shell" data-connected={connected}>
			<a className="sy-skip" href="#sy-main">
				{t("shell.skipToContent")}
			</a>
			{mobile ? null : (
				<aside className="sy-sidebar">
					<div className="sy-brand">
						<div className="sy-brand__mark" aria-hidden="true">
							TS
						</div>
						<div className="sy-brand__copy">
							<div className="sy-brand__name">THE SYSTRONIC</div>
							<div className="sy-brand__sub">{t("nav.workspace")}</div>
						</div>
					</div>
					{connected ? (
						<>
							<nav className="sy-primary-nav" aria-label={t("nav.primary")}>
								<div className="sy-nav-section" aria-hidden="true">
									{t("nav.crmSection")}
								</div>
								{NAV.map((item) => link(item, "sy-nav sy-nav--route"))}
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
								<li className="sy-crumbs__item">{t("nav.crmSection")}</li>
								{activeItem ? (
									<li className="sy-crumbs__item sy-crumbs__item--current" aria-current="page">
										<Icon name="chevronRight" size={14} className="sy-crumbs__icon" />
										<span data-testid="breadcrumb-current">{t(activeItem.label)}</span>
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
					{children}
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
	);
}
