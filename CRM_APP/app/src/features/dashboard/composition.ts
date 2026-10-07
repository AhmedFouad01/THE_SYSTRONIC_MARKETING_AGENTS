import type { ChartScope } from "./charts/model.ts";
export type DashboardChart = "pipeline" | "leads" | "outcomes" | "tasks" | "activity";
/** Scope comes from server aggregates; session capabilities do not identify a membership role. */
export function dashboardChartOrder(scope?: ChartScope): DashboardChart[] {
	return scope === "assigned" ? ["tasks", "pipeline", "leads", "outcomes", "activity"] : ["pipeline", "leads", "outcomes", "tasks", "activity"];
}
