import type { Workspace } from "../../api/workspaces.ts";
import { isUuid } from "../primitives/Identity.tsx";

/** Use existing display metadata if supplied; the approved session surface otherwise provides identifiers only. */
export function workspaceName(workspace: Workspace & { name?: string }, fallback: string): string {
 const name = workspace.name?.trim();
 return name && !isUuid(name) ? name : fallback;
}
