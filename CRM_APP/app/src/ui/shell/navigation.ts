import { ROUTES, STAGED_ROUTES, type RoutePath } from "../../router.ts";
import type { MessageKey } from "../i18n/index.ts";
import type { IconName } from "../icons/index.ts";

export type NavLink = {
	kind: "link";
	key: string;
	label: MessageKey;
	tab?: MessageKey;
	icon: IconName;
	route: RoutePath;
	also?: RoutePath;
	children?: readonly NavNode[];
};
export type NavNode = NavLink | {
	kind: "group" | "upcoming";
	key: string;
	label: MessageKey;
	icon: IconName;
	expanded?: boolean;
	children?: readonly NavNode[];
};

/** Reserved screens are deliberately text only: no route until the screen and gates ship. */
export const NAV_TREE: readonly NavNode[] = [
	{ kind: "group", key: "overview", label: "nav.overview", icon: "home", expanded: true, children: [
		{ kind: "link", key: "dashboard", label: "nav.dashboard", icon: "home", route: "/dashboard", also: "/" },
	] },
	{ kind: "group", key: "crm", label: "nav.crmSection", icon: "contacts", expanded: true, children: [
		{ kind: "link", key: "leads", label: "nav.leads", tab: "nav.tab.leads", icon: "leads", route: "/leads" },
		{ kind: "link", key: "contacts", label: "nav.contacts", tab: "nav.tab.contacts", icon: "contacts", route: "/contacts" },
		{ kind: "link", key: "deals", label: "nav.deals", tab: "nav.tab.deals", icon: "deals", route: "/deals", children: [
			{ kind: "link", key: "pipeline", label: "nav.pipeline", icon: "route", route: "/pipeline" },
		] },
		{ kind: "link", key: "tasks", label: "nav.tasks", tab: "nav.tab.tasks", icon: "tasks", route: "/tasks" },
		{ kind: "upcoming", key: "segments", label: "nav.segments", icon: "contacts" },
		{ kind: "link", key: "import", label: "nav.import", icon: "more", route: "/imports" },
	] },
	{ kind: "group", key: "insights", label: "nav.insights", icon: "report", expanded: true, children: [
		{ kind: "link", key: "reporting", label: "nav.reporting", icon: "report", route: "/reporting", also: "/reporting-v2" },
		{ kind: "upcoming", key: "journeys", label: "nav.journeys", icon: "route" },
	] },
	{ kind: "group", key: "administration", label: "nav.administration", icon: "settings", children: [
		{ kind: "upcoming", key: "integrations", label: "nav.integrations", icon: "route" },
		{ kind: "upcoming", key: "users", label: "nav.users", icon: "contacts" },
		{ kind: "group", key: "settings", label: "nav.settings", icon: "settings", children: [
			{ kind: "link", key: "properties", label: "nav.properties", icon: "settings", route: "/settings/properties" },
			{ kind: "upcoming", key: "security", label: "nav.security", icon: "lock" },
		] },
	] },
];

export function linkedLeaves(nodes: readonly NavNode[]): NavLink[] {
	return nodes.flatMap((node) => [
		...(node.kind === "link" ? [node] : []),
		...linkedLeaves(node.children ?? []),
	]);
}
export const NAV = linkedLeaves(NAV_TREE);
export const NAV_ROUTES: readonly RoutePath[] = NAV.flatMap((n) => n.also ? [n.route, n.also] : [n.route]);
export const ALL_ROUTES_HAVE_NAV = ROUTES.every((route) => NAV_ROUTES.includes(route));
export const ALL_ROUTES_ACCOUNTED_FOR = ROUTES.every((route) => STAGED_ROUTES.includes(route) || NAV_ROUTES.includes(route));

/** Use the same denied keys for desktop, mobile and breadcrumbs; prune empty disclosures. */
export function filterNavigation(nodes: readonly NavNode[], hiddenKeys: readonly string[]): NavNode[] {
	return nodes.flatMap((node): NavNode[] => {
		if (hiddenKeys.includes(node.key)) return [];
		const children = node.children ? filterNavigation(node.children, hiddenKeys) : undefined;
		if (node.kind === "group" && !children?.length) return [];
		return [{ ...node, ...(children ? { children } : {}) }];
	});
}

export function navigationTrail(nodes: readonly NavNode[], route: RoutePath | null): NavNode[] {
	for (const node of nodes) {
		if (node.kind === "link" && (node.route === route || node.also === route)) return [node];
		const child = navigationTrail(node.children ?? [], route);
		if (child.length) return [node, ...child];
	}
	return [];
}

export const MOBILE_PRIMARY_KEYS: readonly string[] = ["leads", "contacts", "deals", "tasks"];
export function splitMobileNav(items: readonly NavLink[] = NAV): { primary: NavLink[]; overflow: NavLink[] } {
	return {
		primary: MOBILE_PRIMARY_KEYS.flatMap((key) => items.filter((node) => node.key === key)),
		overflow: items.filter((node) => !MOBILE_PRIMARY_KEYS.includes(node.key)),
	};
}

/** Role defaults affect inert badges only. Screen authority remains server enforced. */
export function upcomingHiddenKeys(manager: boolean, agencyGrant: boolean): string[] {
	return manager && !agencyGrant ? [] : ["integrations", "users", "security"];
}
