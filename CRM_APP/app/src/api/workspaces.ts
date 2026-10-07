import type { Credentials } from "./client.ts";

export type Workspace = { tenantId: string; grantId?: string };
export const WORKSPACE_HISTORY_KEY = "sy.workspaces";
export const WORKSPACE_HISTORY_LIMIT = 20;

export function workspaceKey(actor: string, workspace: Workspace): string {
	return JSON.stringify([actor, workspace.tenantId, workspace.grantId ?? ""]);
}
export function sameWorkspace(left: Workspace, right: Workspace): boolean {
	return left.tenantId === right.tenantId && left.grantId === right.grantId;
}
export function workspaceCredentials(token: string, workspace: Workspace): Credentials {
	return { token, tenantId: workspace.tenantId, ...(workspace.grantId ? { grantId: workspace.grantId } : {}) };
}

/** History is a convenience, never an authorization source. No tokens are stored here. */
export function readWorkspaceHistory(raw: string | null, actor: string): Workspace[] {
	try {
		const parsed: unknown = JSON.parse(raw ?? "null");
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
		const history = parsed as { actor?: unknown; contexts?: unknown };
		if (history.actor !== actor || !Array.isArray(history.contexts)) return [];
		const result: Workspace[] = [];
		for (const value of history.contexts.slice(0, WORKSPACE_HISTORY_LIMIT)) {
			if (!value || typeof value !== "object" || Array.isArray(value)) continue;
			const context = value as Record<string, unknown>;
			if (typeof context.tenantId !== "string" || !context.tenantId || context.tenantId.length > 200) continue;
			if (context.grantId !== undefined && (typeof context.grantId !== "string" || !context.grantId || context.grantId.length > 200)) continue;
			const workspace: Workspace = { tenantId: context.tenantId, ...(typeof context.grantId === "string" ? { grantId: context.grantId } : {}) };
			if (!result.some((item) => sameWorkspace(item, workspace))) result.push(workspace);
		}
		return result;
	} catch {
		return [];
	}
}

export function rememberWorkspace(items: readonly Workspace[], workspace: Workspace): Workspace[] {
	return [workspace, ...items.filter((item) => !sameWorkspace(item, workspace))].slice(0, WORKSPACE_HISTORY_LIMIT);
}
