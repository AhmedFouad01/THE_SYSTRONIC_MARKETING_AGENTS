import type { BadgeTone, MessageKey } from "../../ui/index.ts";
import type { LeadStatus } from "./model.ts";

export const STATUS_KEY: Record<LeadStatus, MessageKey> = {
	open: "leads.status.open",
	qualified: "leads.status.qualified",
	closed: "leads.status.closed",
};

export const STATUS_TONE: Record<LeadStatus, BadgeTone> = {
	open: "info",
	qualified: "success",
	closed: "neutral",
};
