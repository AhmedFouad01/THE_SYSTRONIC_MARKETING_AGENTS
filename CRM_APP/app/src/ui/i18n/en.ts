// English dictionary. Strings come from the prototype (CRMMVPSharedArchitecture.tsx copy(en, ar) pairs and
// NAV) where present. Keys marked `// new` have no prototype string and are S1 additions.
// Placeholders use {name}. AR (ar.ts) must define exactly the same keys (enforced by i18n.test.ts + types).
export const en = {
	"app.name": "Systronic CRM", // brand name: not translated (existing shell test expects it in AR too)
	"nav.primary": "Primary navigation",
	"nav.workspace": "CRM Workspace",
	"nav.inbox": "Inbox",
	"nav.tasks": "My tasks",
	"nav.contacts": "Contacts",
	"nav.leads": "Leads",
	"nav.deals": "Deals",
	"nav.pipeline": "Pipeline",
	"nav.journey": "Journey",
	"nav.reports": "Reports",
	"nav.settings": "Settings",
	"locale.switchTo": "العربية", // label = the language you switch to (prototype)
	"locale.label": "Language", // new
	"theme.switchToLight": "Switch to Light mode",
	"theme.switchToDark": "Switch to Dark mode",
	"common.all": "All",
	"common.cancel": "Cancel",
	"common.working": "Working…",
	"common.clearFilters": "Clear filters",
	"common.clearSelection": "Clear selection",
	"common.filters": "Filters",
	"common.columns": "Columns",
	"common.rows": "Rows",
	"common.rowsPerPage": "Rows per page",
	"common.previousPage": "Previous page",
	"common.nextPage": "Next page",
	"common.of": "of",
	"common.selected": "selected",
	"common.unassigned": "Unassigned",
	"common.import": "Import",
	"common.email": "Email",
	"common.call": "Call",
	"common.phone": "Phone",
	"common.company": "Company",
	"common.owner": "Owner",
	"common.stage": "Stage",
	"common.source": "Source",
	"common.value": "Value",
	"common.score": "Score",
	"common.created": "Created",
	"common.lastActivity": "Last activity",
	"common.activity": "Activity",
	"common.tasks": "Tasks",
	"common.notAvailable": "Not available yet", // new
	"state.loading": "Loading…", // new
	"state.empty": "Nothing here yet", // new
	"state.error": "Something went wrong", // new
	"state.retry": "Retry", // new
	"state.noResults": "No leads found",
	"state.noResultsHint":
		"Try another search, saved view, or filter combination.",
	"action.newLead": "New lead",
	"action.newDeal": "New deal",
	"action.convertToDeal": "Convert to deal",
	"action.markWon": "Mark won",
	"action.markLost": "Mark lost",
	"action.assignToMe": "Assign to me",
	"action.workspaceActions": "Workspace actions",
	"action.openContact": "Open contact",
	"stage.new": "New",
	"stage.qualified": "Qualified",
	"stage.proposal": "Proposal",
	"stage.negotiation": "Negotiation",
	"stage.won": "Won",
	"stage.lost": "Lost",
	"time.today": "Today",
	"time.tomorrow": "Tomorrow",
	"time.yesterday": "Yesterday",
	"format.matching": "{count} matching",
	"format.selectedCount": "{count} selected",
} as const satisfies Record<string, string>;

export type MessageKey = keyof typeof en;
