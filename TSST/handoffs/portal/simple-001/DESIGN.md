# DASH-SIMPLE-001: Simplified Dash Design (HTML Mocks)

Demo brand: "Zad Living" / "زاد ليفنج". Built strictly in `simple-001/`.
Proof: `node render.mjs` → 60 pages at 1440/1024/390 light+dark (all 6 checks = 0).

## 1. What was removed vs today
- Client nav: cut from 8 doors to 4 (Home · For your review · My work · Requests).
- Deliverables: 4 separate media pages merged into one list with type filters in `client-work.html`.
- Client statuses: ~30 granular statuses flattened to 3: Needs your review · In progress · Ready.
- Version clutter: v1/v2 removed from Home and My work; versions live strictly in For your review.
- Per-row decision clutter: removed per-row approve/edit on Home; rows open item in For your review.
- Team client profile: 10 stacked sections consolidated into 4 tabs (Summary, Work & plan, Package & billing, Client admin).
- Team job tabs: old Items/Files/Activity tabs removed; merged into a single integrated workspace view.
- Secondary extras: AI mark, batch hold, and early release hidden inside "⋯" menu (D4).
- Internal clutter: removed tool/internal text, assignees, and redundant chips from headers.

## 2. Key Decisions (D1–D4, R60 & Lead R1)
- D1: Legacy jobs converted to view-only history; all new work runs on items and versions.
- D2: Client navigates via 4 doors; marketing plan and package details sit inside Home.
- D3: Client sees 3 statuses only; detailed operational states remain team-only.
- D4: Secondary operational features tucked cleanly inside "⋯".
- Section headers: title + count at start, actions at end; no floating chips.
- Rows compact on 1440: item actions sit at row end on the same line.
- Fixed header button: visible "Open client portal" in Team client header (not in ⋯).
- Real addresses: client links use `https://dash.the-systronic.com/c/…`.
- Persistent client links: active links have Copy link · Renew · Revoke; expired links show Renew only.
- Guardrail 1: Approved and posted versions cannot be deleted (locked in UI).
- Guardrail 2: Invoices and documents cancel instead of delete (audit trail preserved).
- Client reversal: "Change my decision" enabled on approved items until scheduled or posted.
- Schedule gate: Schedule post is enabled only after client approval (R59).
- Open Q1 answered: "Approve all" on Client Home includes an explicit confirmation step.
- Open Q2 answered: Auto-notifications out of scope; client tracks request status in My requests.

## 3. Open Questions for Ahmed
1. None pending: all Lead R55 look requirements and D1–D4/R60 decisions are fully resolved.
