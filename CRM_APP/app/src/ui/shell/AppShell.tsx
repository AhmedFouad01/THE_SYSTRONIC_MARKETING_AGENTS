import { Button as AriaButton } from "react-aria-components";
import {
	type MouseEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import { href, navigate, type RoutePath } from "../../router.ts";
import { Bdi, personLabel, useI18n } from "../i18n/index.ts";
import { Icon } from "../icons/index.ts";
import { Dialog, MenuButton } from "../overlays/index.ts";
import { type RecordCrumb, RecordCrumbContext } from "./RecordCrumb.tsx";
import { useTheme } from "../theme/index.ts";
import { Focusable, Tooltip, TooltipTrigger } from "react-aria-components";
import {
	filterNavigation,
	linkedLeaves,
	NAV_TREE,
	navigationTrail,
	type NavLink,
	type NavNode,
	splitMobileNav,
} from "./navigation.ts";
export {
	ALL_ROUTES_ACCOUNTED_FOR,
	ALL_ROUTES_HAVE_NAV,
	MOBILE_PRIMARY_KEYS,
	NAV,
	NAV_ROUTES,
	splitMobileNav,
} from "./navigation.ts";
import {
	disclosureStorageKey,
	expandActiveBranch,
	restoreDisclosures,
	type Disclosures,
} from "./disclosures.ts";
import { readPref, writePref } from "../storage.ts";
import {
	WorkspaceControl,
	type WorkspaceControls,
	WorkspaceSwitchDialog,
} from "./WorkspaceSwitcher.tsx";
import { shellClass } from "./styles.ts";

/** Up to two initials from a display name (first letter of the first and last word). */
export function initials(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "";
	const first = [...(words[0] ?? "")][0] ?? "";
	const last =
		words.length > 1 ? ([...(words[words.length - 1] ?? "")][0] ?? "") : "";
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

export type AppShellProps = WorkspaceControls & {
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

type NavigationTreeProps = {
	nodes: readonly NavNode[];
	route: RoutePath | null;
	link: (item: NavLink, className: string) => ReactNode;
	disclosures: Disclosures;
	onToggle: (key: string) => void;
};

function NavigationTree({
	nodes,
	route,
	link,
	disclosures,
	onToggle,
}: NavigationTreeProps) {
	return (
		<>
			{nodes.map((node) => (
				<NavigationBranch
					key={node.key}
					node={node}
					route={route}
					link={link}
					disclosures={disclosures}
					onToggle={onToggle}
				/>
			))}
		</>
	);
}

/** Inert, focusable unavailable link: TooltipTrigger supplies pointer/focus/Escape behavior without navigation. */
export function UpcomingNavItem({ node }: { node: NavNode }) {
 const { t } = useI18n();
 return <TooltipTrigger delay={300}>
  <Focusable>
  {/* biome-ignore lint/a11y/useSemanticElements: unavailable navigation has no valid href; keep a focusable, disabled link for its explanatory tooltip */}
  <span role="link" aria-disabled="true" tabIndex={0} title={t("nav.comingSoon")} className={shellClass("sy-nav sy-nav--upcoming")} data-testid={`nav-${node.key}`}>
   <Icon name={node.icon} size={17} />
   <span className={shellClass("sy-nav__label")}>{t(node.label)}</span>
   <span aria-hidden="true" className="sy-nav__upcoming-dot ms-auto shrink-0 h-6 w-6 rounded-pill bg-warning-icon" />
  </span></Focusable>
  <Tooltip placement="top" className="z-[1200] rounded-8 border border-solid border-border bg-raised px-10 py-8 text-data text-text shadow-menu">{t("nav.comingSoon")}</Tooltip>
 </TooltipTrigger>;
}

function NavigationBranch({
	node,
	route,
	link,
	disclosures,
	onToggle,
}: Omit<NavigationTreeProps, "nodes"> & { node: NavNode }) {
	const { t } = useI18n();
	const expanded = disclosures[node.key] === true;
	if (node.kind === "upcoming") return <UpcomingNavItem node={node} />;
	const children = node.children ?? [];
	if (!children.length && node.kind === "link")
		return link(node, "sy-nav sy-nav--route");
	const childId = `nav-children-${node.key}`;
	const disclosure = (
		<AriaButton
			type="button"
			className={shellClass(
				`sy-nav sy-nav--disclosure${node.kind === "link" ? " sy-nav--toggle" : ""}`,
			)}
			aria-expanded={expanded}
			aria-controls={childId}
			aria-label={node.kind === "link" ? t("nav.pipeline") : undefined}
			data-testid={`nav-disclosure-${node.key}`}
			onPress={() => onToggle(node.key)}
		>
			{node.kind === "group" ? (
				<>
					<Icon name={node.icon} size={17} />
					<span className={shellClass("sy-nav__label")}>{t(node.label)}</span>
				</>
			) : null}
			<Icon name={expanded ? "chevronDown" : "chevronRight"} size={14} />
		</AriaButton>
	);
	return (
		<div className={shellClass(`sy-nav-branch sy-nav-branch--${node.kind}`)}>
			<div className={shellClass("sy-nav-branch__row")}>
				{node.kind === "link" ? link(node, "sy-nav sy-nav--route") : null}
				{disclosure}
			</div>
			<div
				id={childId}
				className={shellClass("sy-nav-branch__children")}
				hidden={!expanded}
			>
				<NavigationTree
					nodes={children}
					route={route}
					link={link}
					disclosures={disclosures}
					onToggle={onToggle}
				/>
			</div>
		</div>
	);
}

export function AppShell({
	route,
	actor,
	actorName,
	actorRole,
	onDisconnect,
	hiddenNavKeys = [],
	workspace,
	knownWorkspaceCount = 0,
	loadWorkspaces,
	switchWorkspace,
	children,
}: AppShellProps) {
	const { t, toggleLocale, dir } = useI18n();
	const { mode, toggleMode } = useTheme();
	const mobile = useIsMobile();
	const [moreOpen, setMoreOpen] = useState(false);
	const moreTrigger = useRef<HTMLButtonElement>(null);
	const workspaceTrigger = useRef<HTMLElement>(null);
	const [workspaceOpen, setWorkspaceOpen] = useState(false);
	const [recordCrumb, setRecordCrumb] = useState<RecordCrumb | null>(null);
	const connected = actor !== null;
	const visibleTree = filterNavigation(NAV_TREE, hiddenNavKeys);
	const visibleNav = linkedLeaves(visibleTree);
	const activeItem = visibleNav.find(
		(n) => n.route === route || n.also === route,
	);
	const trail = navigationTrail(visibleTree, route);
	const name = personLabel(actorName, t);
	const disclosureKey = actor
		? disclosureStorageKey(actor, workspace?.tenantId ?? "", workspace?.grantId)
		: null;
	const [disclosures, setDisclosures] = useState(() =>
		expandActiveBranch(
			restoreDisclosures(
				disclosureKey ? readPref(disclosureKey) : null,
				NAV_TREE,
				null,
			),
			visibleTree,
			route,
		),
	);
	useEffect(() => {
		setDisclosures((current) =>
			expandActiveBranch(
				current,
				filterNavigation(NAV_TREE, hiddenNavKeys),
				route,
			),
		);
	}, [route, hiddenNavKeys]);
	useEffect(() => {
		if (disclosureKey) writePref(disclosureKey, JSON.stringify(disclosures));
	}, [disclosureKey, disclosures]);
	const onToggle = (key: string) =>
		setDisclosures((current) => ({ ...current, [key]: !current[key] }));
	const workspaceControl = workspace ? (
		<WorkspaceControl
			workspace={workspace}
			canSwitch={
				knownWorkspaceCount > 1 && Boolean(loadWorkspaces && switchWorkspace)
			}
			onOpen={() => {
				workspaceTrigger.current =
					document.activeElement instanceof HTMLElement
						? document.activeElement
						: null;
				setWorkspaceOpen(true);
			}}
		/>
	) : null;
	const { primary, overflow } = splitMobileNav(visibleNav);
	const moreActive = activeItem !== undefined && overflow.includes(activeItem);

	const goDashboard = (e: MouseEvent) => {
		if (!plainClick(e)) return;
		e.preventDefault();
		navigate("/dashboard");
	};

	const link = (
		item: NavLink,
		className: string,
		afterNavigate?: () => void,
		shortLabel = false,
	) => (
		<a
			key={item.key}
			href={href(item.route)}
			className={shellClass(className)}
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
			<span className={shellClass("sy-nav__label")}>
				{t(shortLabel && item.tab ? item.tab : item.label)}
			</span>
		</a>
	);

	const actorBlock = (
		<div className={shellClass("sy-actor")} data-testid="actor">
			<span className={shellClass("sy-actor__avatar")} aria-hidden="true">
				{initials(actorName ?? "") || initials(t("common.unknownUser"))}
			</span>
			<span className={shellClass("sy-actor__copy")}>
				<span className={shellClass("sy-actor__name")}>
					<Bdi>{name}</Bdi>
				</span>
				{actorRole ? (
					<span className={shellClass("sy-actor__role")}>{actorRole}</span>
				) : null}
			</span>
		</div>
	);

	return (
		<RecordCrumbContext.Provider value={setRecordCrumb}>
			<div className={shellClass("sy-shell")} data-connected={connected}>
				<a className={shellClass("sy-skip")} href="#sy-main">
					{t("shell.skipToContent")}
				</a>
				{mobile ? null : (
					<aside className={shellClass("sy-sidebar")}>
						{connected ? (
							<a
								className={shellClass("sy-brand")}
								href={href("/dashboard")}
								aria-label={t("shell.brandHome")}
								data-testid="brand-link"
								onClick={(e) => goDashboard(e)}
							>
								<div
									className={shellClass("sy-brand__mark")}
									aria-hidden="true"
								>
									TS
								</div>
								<div className={shellClass("sy-brand__copy")}>
									<div className={shellClass("sy-brand__name")}>
										THE SYSTRONIC
									</div>
									<div className={shellClass("sy-brand__sub")}>
										{t("nav.workspace")}
									</div>
								</div>
							</a>
						) : (
							<div className={shellClass("sy-brand")}>
								<div
									className={shellClass("sy-brand__mark")}
									aria-hidden="true"
								>
									TS
								</div>
								<div className={shellClass("sy-brand__copy")}>
									<div className={shellClass("sy-brand__name")}>
										THE SYSTRONIC
									</div>
									<div className={shellClass("sy-brand__sub")}>
										{t("nav.workspace")}
									</div>
								</div>
							</div>
						)}
						{connected ? (
							<>
								{workspaceControl}
								<nav
									className={shellClass("sy-primary-nav")}
									aria-label={t("nav.primary")}
								>
									<NavigationTree
										nodes={visibleTree}
										route={route}
										link={link}
										disclosures={disclosures}
										onToggle={onToggle}
									/>
								</nav>
								<div className={shellClass("sy-sidebar__foot")}>
									{actorBlock}
								</div>
							</>
						) : null}
					</aside>
				)}
				<div className={shellClass("sy-content")}>
					<header className={shellClass("sy-topbar")}>
						{connected ? (
							<nav
								className={shellClass("sy-crumbs")}
								aria-label={t("shell.breadcrumb")}
							>
								<ol className={shellClass("sy-crumbs__list")}>
									{trail.slice(0, -1).map((node, index) => (
										<li
											className={shellClass("sy-crumbs__item")}
											key={node.key}
										>
											{index > 0 ? (
												<Icon
													name="chevronRight"
													size={14}
													className={shellClass("sy-crumbs__icon")}
												/>
											) : null}
											{node.kind === "link" ? (
												<a
													className={shellClass("sy-crumbs__link")}
													href={href(node.route)}
													onClick={(e) => {
														if (!plainClick(e)) return;
														e.preventDefault();
														navigate(node.route);
													}}
												>
													{t(node.label)}
												</a>
											) : (
												<span>{t(node.label)}</span>
											)}
										</li>
									))}
									{activeItem ? (
										<li
											className={shellClass(
												`sy-crumbs__item${recordCrumb ? "" : " sy-crumbs__item--current"}`,
											)}
											aria-current={recordCrumb ? undefined : "page"}
										>
											<Icon
												name="chevronRight"
												size={14}
												className={shellClass("sy-crumbs__icon")}
											/>
											{recordCrumb ? (
												<a
													className={shellClass("sy-crumbs__link")}
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
												<span data-testid="breadcrumb-current">
													{t(activeItem.label)}
												</span>
											)}
										</li>
									) : null}
									{activeItem && recordCrumb ? (
										<li
											className={shellClass(
												"sy-crumbs__item sy-crumbs__item--current",
											)}
											aria-current="page"
										>
											<Icon
												name="chevronRight"
												size={14}
												className={shellClass("sy-crumbs__icon")}
											/>
											<span
												className={shellClass("sy-crumbs__record")}
												data-testid="breadcrumb-current"
												title={recordCrumb.name}
											>
												<bdi dir="auto">{recordCrumb.name}</bdi>
											</span>
										</li>
									) : null}
								</ol>
							</nav>
						) : (
							<span className={shellClass("sy-topbar__brand")}>
								THE SYSTRONIC
							</span>
						)}
						{mobile && connected ? (
							<div className={shellClass("sy-topbar__workspace")}>
								{workspaceControl}
							</div>
						) : null}
						<div className={shellClass("sy-topbar__tools")}>
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
										label:
											mode === "dark"
												? t("theme.switchToLight")
												: t("theme.switchToDark"),
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
					<main id="sy-main" className={shellClass("sy-main")} tabIndex={-1}>
						<div className={shellClass("sy-page")}>{children}</div>
					</main>
				</div>
				{mobile && connected ? (
					<>
						<nav
							className={shellClass("sy-bottomnav")}
							aria-label={t("nav.primary")}
						>
							{primary.map((item) =>
								link(item, "sy-nav sy-nav--route", undefined, true),
							)}
							<AriaButton
								type="button"
								className={shellClass("sy-nav sy-nav--route sy-nav--more")}
								ref={moreTrigger}
								aria-haspopup="dialog"
								aria-expanded={moreOpen}
								aria-current={moreActive ? "page" : undefined}
								data-testid="nav-more"
								onPress={() => setMoreOpen(true)}
							>
								<Icon name="more" size={20} />
								<span className={shellClass("sy-nav__label")}>
									{t("nav.more")}
								</span>
							</AriaButton>
						</nav>
						<Dialog
							open={moreOpen}
							onClose={() => setMoreOpen(false)}
							title={t("nav.moreTitle")}
							placement="side"
							dock="right"
							returnFocusRef={moreTrigger}
							testId="more-sheet"
						>
							{workspaceControl}
							<nav
								className={shellClass("sy-sheet-nav")}
								aria-label={t("nav.moreTitle")}
							>
								<NavigationTree
									nodes={visibleTree}
									route={route}
									link={(item, className) =>
										link(item, `${className} sy-nav--sheet`, () =>
											setMoreOpen(false),
										)
									}
									disclosures={disclosures}
									onToggle={onToggle}
								/>
							</nav>
						</Dialog>
					</>
				) : null}
				{workspace && loadWorkspaces && switchWorkspace ? (
					<WorkspaceSwitchDialog
						open={workspaceOpen}
						onClose={() => setWorkspaceOpen(false)}
						workspace={workspace}
						loadWorkspaces={loadWorkspaces}
						switchWorkspace={switchWorkspace}
						returnFocusRef={workspaceTrigger}
					/>
				) : null}
			</div>
		</RecordCrumbContext.Provider>
	);
}
