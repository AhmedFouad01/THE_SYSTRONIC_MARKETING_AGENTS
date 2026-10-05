import type { MouseEvent, ReactNode } from "react";
import { href, navigate, ROUTES, type RoutePath } from "../../router.ts";
import { type MessageKey, useI18n } from "../i18n/index.ts";
import { Icon, type IconName } from "../icons/index.ts";
import { Button } from "../primitives/index.ts";
import { useTheme } from "../theme/index.ts";
import "./shell.css";


type NavItem =
	| { key: string; label: MessageKey; icon: IconName; route: RoutePath; also?: RoutePath }
	| { key: string; label: MessageKey; icon: IconName; route: null };

// Prototype NAV order. Email/Call/Import have no MVP backend (see MVP_UI_IMPLEMENTATION_MAP section 2): disabled + labelled.
export const NAV: readonly NavItem[] = [
	{ key: "dashboard", label: "nav.dashboard", icon: "home", route: "/dashboard", also: "/" },
	{ key: "leads", label: "nav.leads", icon: "leads", route: "/leads" },
	{ key: "contacts", label: "nav.contacts", icon: "contacts", route: "/contacts" },
	{ key: "deals", label: "nav.deals", icon: "deals", route: "/deals" },
	{ key: "pipeline", label: "nav.pipeline", icon: "route", route: "/pipeline" },
	{ key: "tasks", label: "nav.tasks", icon: "tasks", route: "/tasks" },
	{ key: "reporting", label: "nav.reporting", icon: "report", route: "/reporting-v2" },
	{ key: "email", label: "common.email", icon: "mail", route: null },
	{ key: "call", label: "common.call", icon: "phone", route: null },
	{ key: "import", label: "common.import", icon: "upload", route: null },
];

// Every nav route must exist in the router (guards drift).
export const NAV_ROUTES: readonly RoutePath[] = NAV.flatMap((n) => (n.route ? [n.route] : []));
export const ALL_ROUTES_HAVE_NAV = ROUTES.every((r) => r === "/" || NAV_ROUTES.includes(r));

export type AppShellProps = {
	route: RoutePath | null;
	/** null = not connected: no navigation, no actor. */
	actor: string | null;
	onDisconnect?: () => void;
	children: ReactNode;
};

function plainClick(e: MouseEvent): boolean {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export function AppShell({ route, actor, onDisconnect, children }: AppShellProps) {
	const { t, toggleLocale, dir } = useI18n();
	const { mode, toggleMode } = useTheme();
	const connected = actor !== null;
	const activeItem = NAV.find((n) => n.route !== null && (n.route === route || n.also === route));

	return (
		<div className="sy-shell" data-connected={connected}>
			<a className="sy-skip" href="#sy-main">
				{t("shell.skipToContent")}
			</a>
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
					<nav className="sy-primary-nav" aria-label={t("nav.primary")}>
						<div className="sy-nav-section" aria-hidden="true">
							{t("nav.crmSection")}
						</div>
						{NAV.map((item) => {
							const on = item === activeItem;
							const inner = (
								<>
									<Icon name={item.icon} size={17} />
									<span className="sy-nav__label">{t(item.label)}</span>
								</>
							);
							if (item.route === null) {
								return (
									<button
										key={item.key}
										type="button"
										className="sy-nav sy-nav--disabled"
										disabled
										data-testid={`nav-${item.key}`}
									>
										{inner}
										<span className="sy-nav__tag">{t("nav.notInMvp")}</span>
									</button>
								);
							}
							const target = item.route;
							return (
								<a
									key={item.key}
									href={href(target)}
									className="sy-nav sy-nav--route"
									aria-current={on ? "page" : undefined}
									data-testid={`nav-${item.key}`}
									onClick={(e) => {
										if (!plainClick(e)) return;
										e.preventDefault();
										navigate(target);
									}}
								>
									{inner}
								</a>
							);
						})}
					</nav>
				) : null}
			</aside>
			<div className="sy-content">
				<header className="sy-topbar">
					<search className="sy-search">
						<Icon name="search" size={16} />
						<input
							type="search"
							className="sy-search__input"
							aria-label={t("shell.searchLabel")}
							placeholder={t("shell.searchPlaceholder")}
							title={t("common.notAvailable")}
							disabled
						/>
					</search>
					<div className="sy-topbar__tools">
						{actor ? (
							<span className="sy-actor" data-testid="actor" title={actor}>
								<span className="sy-actor__label">{t("shell.actor")}</span>{" "}
								<bdi dir="ltr" className="sy-ltr">
									{actor.slice(0, 8)}
								</bdi>
							</span>
						) : null}
						<Button size="sm" data-testid="locale-toggle" onClick={toggleLocale} lang={dir === "rtl" ? "en" : "ar"}>
							{t("locale.switchTo")}
						</Button>
						<Button size="sm" data-testid="theme-toggle" onClick={toggleMode}>
							{mode === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
						</Button>
						{connected && onDisconnect ? (
							<Button size="sm" variant="ghost" icon="lock" data-testid="disconnect" onClick={onDisconnect}>
								{t("shell.disconnect")}
							</Button>
						) : null}
					</div>
				</header>
				<main id="sy-main" className="sy-main" tabIndex={-1}>
					{children}
				</main>
			</div>
		</div>
	);
}
