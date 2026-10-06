# Preview slide-over (UI R4 batch 2, item C) — decisions (2026-10-06)

Inputs: PREVIEW_IMPACT_DEV.md, PREVIEW_IMPACT_CREATIVE.md. Overrides UI_R4_SPEC.md section C where they differ.

| # | Decision | By |
|---|---|---|
| D1 | AR: panel OVERLAYS sidebar + identity column; table keeps full width. Full-row selected tint, `scrollIntoView({block:"nearest"})`. Pre-wire `--sy-preview-reserve` (default 0, off). | user |
| D2 | Panel top edge = below the 56px topbar (topbar controls stay reachable). | user |
| D3 | "Open full record" omitted for Leads/Contacts/Tasks this batch; `?preview=<id>` deep link ships (accept legacy `?select=`). | user |
| D4 | Scope: Leads → Contacts → Tasks → Reporting (last). Deals out of batch 2. | user |
| D5 | Full-screen sheet below 1024px (current breakpoint), panel from 1024px. | Lead |
| D6 | In-house `PreviewPanel` on existing Dialog/nav/outside-dismiss machinery; no new deps; RAC/Tailwind stays a separate track. | Lead (DEV rec.) |

| D7 | **Supersedes D1 for AR desktop** (after PREVIEW_GATE_LEADS.md FAIL on AR 1440): desktop panel docks at the INLINE END — physical right in EN, physical LEFT in AR — overlay, no reserve. Sidebar, title and identity column stay visible in AR. Sheet <1024 stays from the physical right in both languages. | user (2026-10-06) |

Gate: Leads ships alone first; CREATIVE visual check (EN/AR × light/dark × 375/1440) is the rollback point before Contacts/Tasks/Reporting.
