import type { ReactNode } from "react";
import { I18nProvider, ar } from "../i18n/index.ts";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceControl } from "./WorkspaceSwitcher.tsx";
import { workspaceName } from "./workspaceName.ts";
import { Identity, RecordDetails } from "../primitives/index.ts";
import { UpcomingNavItem } from "./AppShell.tsx";
import { describe, expect, it } from "vitest";
import { ALL_ROUTES_ACCOUNTED_FOR, ALL_ROUTES_HAVE_NAV, initials, MOBILE_PRIMARY_KEYS, NAV, splitMobileNav } from "./AppShell.tsx";

describe("shell navigation model", () => {
	it("linked leaves cover every live route; inert upcoming entries never become routes", () => {
		const keys = NAV.map((n) => n.key);
		for (const dead of ["email", "call", "segments", "journeys", "integrations"]) expect(keys).not.toContain(dead);
		expect(NAV.every((n) => typeof n.route === "string")).toBe(true);
		expect(ALL_ROUTES_HAVE_NAV).toBe(true); // Complete gated /imports now has a live leaf.
		expect(ALL_ROUTES_ACCOUNTED_FOR).toBe(true);
	});
	it("mobile bar: at most 5 tabs (4 screens + More); the remainder goes to the More sheet; nothing is lost", () => {
		const { primary, overflow } = splitMobileNav();
		expect(primary.length + 1).toBeLessThanOrEqual(5);
		expect(primary.map((n) => n.key)).toEqual([...MOBILE_PRIMARY_KEYS]);
		expect([...primary, ...overflow].map((n) => n.key).sort()).toEqual(NAV.map((n) => n.key).sort());
	});
	it("initials: first + last word, Arabic safe, empty-safe", () => {
		expect(initials("Mona Adel")).toBe("MA");
		expect(initials("  mona   adel  hassan ")).toBe("MH");
		expect(initials("Mona")).toBe("M");
		expect(initials("منى عادل")).toBe("مع");
		expect(initials("")).toBe("");
	});
});

const localized = (node: ReactNode) => renderToStaticMarkup(<I18nProvider>{node}</I18nProvider>);
const UUID = "f018c810-1de8-45c2-9021-76162be4d472";
describe("R06 identity and unavailable navigation", () => {
 it("workspace uses supplied mixed-script name, otherwise a generic localized label", () => {
  expect(workspaceName({ tenantId: UUID, name: "مكتب Ahmed" }, "CRM Workspace")).toBe("مكتب Ahmed");
  expect(workspaceName({ tenantId: UUID }, "مساحة عمل CRM")).toBe("مساحة عمل CRM");
  expect(workspaceName({ tenantId: UUID, name: UUID }, "CRM Workspace")).toBe("CRM Workspace");
 });
 it("sidebar name has no visible UUID; it remains available only as a tooltip", () => {
  const html = localized(<WorkspaceControl workspace={{tenantId: UUID}} canSwitch={false} onOpen={() => undefined} />);
  expect(html).toContain(ar["nav.workspace"]);
  expect(html).not.toContain(`>${UUID}<`);
  expect(html).toContain(`title="⁦${UUID}⁩"`);
 });
 it("technical UUID displays are labels, with existing copy behavior/value intact", () => {
  const html = localized(<RecordDetails rows={[{label: "Record ID", value: UUID, copyable: true}]} />);
  expect(html).not.toContain(`>${UUID}<`);
  expect(html).toContain('title=');
  expect(html).toContain(ar["common.copy"]);
  expect(localized(<Identity value={UUID} label="Upload.csv" />)).toContain("Upload.csv");
 });
 it("upcoming nav is inert, keyboard-focusable, with a logical-end amber dot and no badge text", () => {
  const html = localized(<UpcomingNavItem node={{kind:"upcoming",key:"segments",label:"nav.segments",icon:"contacts"}} />);
  expect(html).toContain('aria-disabled="true"');
  expect(html).toContain('tabindex="0"');
  expect(html).toContain(`title="${ar["nav.comingSoon"]}"`);
  expect(html).toContain("ms-auto");
  expect(html).toContain("bg-warning-icon");
  expect(html).not.toContain("sy-badge");
  expect(html).not.toContain("href=");
  expect(html).not.toContain(`>${ar["nav.comingSoon"]}<`);
 });
});
