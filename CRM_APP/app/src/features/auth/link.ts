import { toRoute } from "../../router.ts";
export type AuthLink = { kind: "invite" | "reset"; secret: string | null };
/** Entry-point capture before React/bootstrap; query credentials are never accepted. */
export function readAuthLink(
	url: Pick<Location, "pathname" | "hash" | "search"> = location,
	nav: Pick<History, "replaceState"> = history,
): AuthLink | null {
	const route = toRoute(url.pathname);
	if (route !== "/invite" && route !== "/reset") return null;
	const kind = route === "/invite" ? "invite" : "reset";
	const values = [...new URLSearchParams(url.hash.slice(1)).entries()];
	nav.replaceState(null, "", url.pathname);
	const key = kind === "invite" ? "invitationId" : "token";
	const candidate =
		values.length === 1 && values[0]?.[0] === key ? values[0][1] : "";
	const valid =
		kind === "invite"
			? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
					candidate,
				)
			: /^[A-Za-z0-9_-]{24}$/.test(candidate);
	return { kind, secret: valid ? candidate : null };
}
