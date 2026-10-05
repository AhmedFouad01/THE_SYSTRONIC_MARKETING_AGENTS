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
	"/reporting-v2",
] as const;
export type RoutePath = (typeof ROUTES)[number];

export function toRoute(pathname: string): RoutePath | null {
	if (pathname !== BASE && !pathname.startsWith(`${BASE}/`)) return null;
	const rest = pathname.slice(BASE.length) || "/";
	const clean = rest.length > 1 ? rest.replace(/\/$/, "") : rest;
	return (ROUTES as readonly string[]).includes(clean)
		? (clean as RoutePath)
		: null;
}

export function href(route: RoutePath): string {
	return route === "/" ? `${BASE}/` : `${BASE}${route}`;
}

export function navigate(route: RoutePath): void {
	history.pushState(null, "", href(route));
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
