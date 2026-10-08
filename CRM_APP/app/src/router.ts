import { useEffect, useState } from "react";

/** Client base path; must match vite `base` and APP_BASE in src/static.ts. */
export const BASE = "/app";
export const ROUTES = [
	"/",
	"/leads",
	"/contacts",
	"/deals",
	"/pipeline",
	"/tasks",
	"/dashboard",
	"/reporting",
	"/reporting-v2",
	"/settings/properties",
	"/settings/users",
	"/imports",
] as const;
export const PUBLIC_ROUTES = ["/invite", "/reset"] as const;
export type RoutePath = (typeof ROUTES)[number] | (typeof PUBLIC_ROUTES)[number];
/** Direct gated stages remain absent from live navigation until their complete workflow ships. */
export const STAGED_ROUTES: readonly RoutePath[] = [];

export function toRoute(pathname: string): RoutePath | null {
	if (pathname !== BASE && !pathname.startsWith(`${BASE}/`)) return null;
	const rest = pathname.slice(BASE.length) || "/";
	const clean = rest.length > 1 ? rest.replace(/\/$/, "") : rest;
	return ([...ROUTES, ...PUBLIC_ROUTES] as readonly string[]).includes(clean)
		? (clean as RoutePath)
		: null;
}

export function href(route: RoutePath): string {
	return route === "/" ? `${BASE}/` : `${BASE}${route}`;
}

/** `search` is an optional query string including the leading `?` (context hand-off between screens). */
export function navigate(route: RoutePath, search = ""): void {
	history.pushState(null, "", href(route) + search);
	window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useRoute(): RoutePath | null {
	const [route, setRoute] = useState(() => toRoute(location.pathname));
	useEffect(() => {
		const on = () => setRoute(toRoute(location.pathname));
		window.addEventListener("popstate", on);
		return () => window.removeEventListener("popstate", on);
	}, []);
	return route;
}
