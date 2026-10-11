# YAKEBDA_MS — Project Work Instructions v1.5 — Audit Remediation Freeze


## Real Memory sync contract — correction 2026-07-14


- A full chat sync must preserve the user messages verbatim and in chronological order; an execution summary is not a substitute for the transcript.
- Each full chat sync must produce or update three artifacts: a literal CHAT_TRANSCRIPT, a CURRENT_STATUS, and a CHAT_HANDOFF.
- Assistant replies may be included in the transcript, but user messages must never be replaced by paraphrases.
- Exclude secrets, passwords, tokens, private credentials, hidden reasoning, and raw tool internals.
- Confirm the save by reading or searching the first and last preserved user messages in Google Drive before claiming success.
- The literal transcript is the primary record. After preserving it, derive and organize the requested decisions, execution plans, constraints, approvals, risks, open questions, status, and handoff artifacts from that transcript.
- Derived artifacts must link back to the relevant transcript and must not overwrite, replace, or reinterpret the user’s original wording.
- Clearly separate: user decisions, assistant recommendations, verified facts, reported-but-unverified results, pending approvals, and future work.
- Any requested Real Memory artifact—decision log, execution plan, checklist, status, handoff, ADR note, or backlog item—must be generated from the preserved conversation and stored in the correct project location.






## Mandatory startup


1. Read the latest Current Status.
2. Read the Audit Remediation Execution Plan v1.0.
3. Read the uploaded audit report and the P0–P3 source briefs.
4. Verify live GitHub `main`, open PRs, current phase branch, head SHA, and CI.
5. Continue only the active remediation phase.


## Feature freeze


No new feature or core module is allowed before P0–P4 completion and explicit user approval.


This prohibition includes:
- Channel Menus;
- Inventory and Recipes;
- Delivery/Driver expansion;
- Finance Control;
- Accounting Bridge/COGS;
- Online/QR connectors;
- e-Receipt/compliance;
- loyalty;
- unrelated UI redesign.


## Phase discipline


- Serial branches only; each phase starts from merged current `main`.
- Do not stack phases without explicit approval.
- Do not begin the next phase before post-merge validation of the prior phase.
- Every finding must be revalidated against the current SHA before code changes.
- If the audit brief conflicts with code, migrations, tests, or newer evidence, record the correction; do not implement stale instructions.
- No merge, Ready status, retarget, rebase, or branch deletion without explicit direction.
- Keep PRs Draft until all automated and manual gates pass.


## Active sequence


Gate 0
P0
P1
P2A
P2B
P3
P4


## Current baseline


`main @ d52ab28c928e57a75aff249f57032f18f379f27f`


## Non-regression rules


- Backend remains final pricing authority.
- Tenant, branch, permission, and audit boundaries remain enforced.
- Payment and refund records are immutable; corrections use reversal records.
- Print failure never invalidates a successful payment/order.
- `theme.css` remains semantic token source.
- `global-colors.css` remains final color authority and last import during/after consolidation.
- Preserve accepted Product Grid, KDS, AppShell, Arabic RTL, and 1920×1080 cashier geometry.
- Never reduce test coverage or delete a failing test to pass CI.


## Required completion evidence


Each phase must report:
- base/head SHA;
- files changed;
- migrations and rollback;
- test-count delta;
- CI result;
- manual QA;
- unresolved risks;
- confirmation that no feature work was included.
