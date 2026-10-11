# YAKEBDA_MS — MEMORY PACKET


Date: 2026-07-12
Type: Quick Memory Packet
Topic: Full System Audit Program with Claude
Storage target: Google Drive / Yakebda_MS


## 1. Confirmed repository state


- Repository: AhmedFouad01/yakebda-ms
- PR #14 is already merged into main.
- Current main baseline referenced by the active planning PR: 4df57964ef0dacddbbaca2b723849dd4afe055c0.
- PR #16 is open, Draft, mergeable, and not merged.
- PR #16 branch: docs/ykms-11-sources-finance-roadmap.
- PR #16 head: 2686c4607694cbe8a29537b3c58deaed8448604e.
- PR #16 is documentation/planning only; no runtime code, migration, endpoint, or schema change for YKMS-11+.
- CI run #179 for the PR #16 head completed successfully.


## 2. User decision


The user wants Claude to perform a complete audit of the whole YAKEBDA MS system, not only the UI.


The audit must be split into focused, read-only sessions to control token usage and avoid shallow repository-wide output.


No implementation, patch, commit, or branch creation is allowed during the audit passes.


## 3. Audit program


The approved audit structure is:


- A0 — Repository Map, Architecture and Risk Map.
- A1 — Security, Authentication, RBAC, Tenant and Branch Isolation.
- A2 — Menu, Orders, Quote, Pricing, Discounts, Taxes and Order State.
- A3 — Payments, Refunds, Shifts, Cash and Financial Integrity.
- A4 — Database, Migrations, Constraints, Transactions and Indexes.
- A5 — KDS, Printing, Hardware Bridge, Realtime and Operational Reliability.
- A6 — Admin UI, POS, RTL, Light/Dark, Responsive and Accessibility.
- A7 — API Contracts, Validation, Error Handling, Performance and Observability.
- A8 — Tests, CI, Dependencies and Release Readiness.
- A9 — Documentation Drift and Readiness for YKMS-11 through YKMS-16.
- A10 — Final Synthesis, Deduplication and Remediation Roadmap.


Approved execution order:


A0 → A1 → A2 → A3 → A4 → A5 → A7 → A8 → A6 → A9 → A10


## 4. Rules for every audit pass


Before each pass Claude must:


- git switch main
- git pull --ff-only origin main
- git status --short
- git rev-parse HEAD
- stop when the working tree is not clean.


Every pass is read-only.


Claude must not:


- edit files;
- generate patches;
- commit;
- create branches;
- run formatters;
- inspect node_modules, dist, build, coverage, uploads, or generated files;
- print full files;
- review outside the assigned scope;
- repeat the same issue in multiple findings;
- provide generic best practices without repository evidence;
- recommend rewrites without a proven critical architectural defect.


Method requirements:


- use rg or git grep before opening files;
- open minimal line ranges;
- trace runtime paths before declaring defects;
- prove reachability for security defects;
- prove the final winning CSS rule for UI findings;
- provide a numeric traced example for financial findings;
- distinguish confirmed defects, architectural risks, missing tests, and maintainability debt;
- maximum 12 findings and approximately 1200 words per pass.


Every finding must include:


- ID;
- Severity;
- Confidence;
- Category;
- Affected flow;
- file:line evidence;
- Root cause;
- Runtime or business impact;
- Minimal remediation direction;
- Required tests;
- Release-blocker status.


## 5. UI audit and stale patch decision


Claude previously produced a UI-only audit and generated the file:


YKMS-UI-CONSISTENCY-FIXES.patch


That patch is not approved and must not be applied.


Review showed it was built against stale source files and did not inspect the complete CSS import chain.


The live admin CSS order includes later authority layers after styles.css / ykms-02d.css / ykms-02f.css, including:


- pos-operational.css
- pos-final.css
- pos-card-layout-fix.css
- ui-cleanup.css
- theme.css
- theme-interactions.css
- ui-polish.css
- ui-polish-final.css
- final-closure.css


Consequences found during patch review:


- some reported findings were already fixed or obsolete in current main;
- the POS product card already has keyboard activation;
- the old three-dot card menu no longer exists;
- global focus-visible handling already exists;
- OrderDetail theme colors are already controlled by semantic theme layers;
- the proposed KDS breakpoint was added to a non-winning CSS layer;
- the patch tried to force dark color-scheme for POS and would regress Light theme;
- several hunks target stale versions of Pos.tsx and Menu.tsx;
- the focus trap implementation was incomplete and did not cover ad-hoc modal-back overlays.


Therefore the full-system audit must restart from current clean main and treat the previous patch as rejected historical evidence only.


## 6. A10 synthesis requirements


After A0–A9, Claude must run A10 using the reports rather than rereading the entire repository unless reports conflict.


A10 must:


- deduplicate overlapping findings;
- reject unsupported or contradicted findings;
- group root causes instead of symptoms;
- produce P0 immediate blockers, P1 pre-YKMS-11 blockers, and P2 planned hardening;
- define no more than eight small implementation PRs;
- list dependencies, tests, and regression risks.


No fixes begin before A10 is reviewed and approved by the user.


## 7. Next action


Start Claude with A0 — Repository Architecture and Risk Map on the latest clean main.


Each subsequent audit runs in a separate Claude session. Use only the A0 repository map as shared context where needed, not all previous reports. Preserve every report for the final A10 synthesis.
