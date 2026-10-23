# DASH-R8 — plan: package v2 (credits, hours, bonus), time tracking, milestones model, client side

Status: PLAN for Ahmed's OK (2026-10-23). Sources: `DASH-OWNER-NOTES-001.md` N8–N12; AUDIT-003 REPORT §1 #10 #14, §3.
R8A (brand, search, client header frame, heading system) runs first in its own Codex session; R8 web starts after
R8A is merged (both touch the client header).

## What R8 adds
| Part | What | Notes |
|---|---|---|
| P1 Package v2 | Plan gains `hours` (internal), `edit_credits` (per month), `services` (short list, e.g. "Social media management") | numbers stay editable per plan (N12 open) |
| P2 Edit credits | 1 client **Request edit** on one item (a post = 1 item) = 1 credit, counted in the package month window. Team-internal edit requests are free. At 0 left the client can still ask; it shows as "extra" to the team | default, Ahmed may change |
| P3 Bonus | Per client: kind (edit credits / ads / campaigns / hours / free text), amount, start, end, note. Active bonuses add to the package numbers and show with their end date | |
| P4 Time tracking | Time entries per job or item: minutes, `manual` or `estimate`, `ai` or `human`, who, when, note. Default estimates per item type in Settings (image, carousel, video, copy, document; AI-made factor). Spent vs package hours, per job and per client | hours = team only by default |
| P5 Milestones model | `scope` job / client / agency, owner, due, done, client_visible. Client milestones live in the client hub (no fake job); agency ones are team only. Home shows all with a scope badge | AUDIT §3 |
| P6 Feedback | Client hub "Feedback": every open Request edit with its reason next to the item thumbnail + link; changes-requested items stay in the team's work list | AUDIT #10 |
| P7 Client side | Client header = package infographic (N11): plan, used / included (campaigns, ads, edit credits), bonus + end date, delivered count, next milestone; almost no sentences. Client Timeline: done + upcoming client-visible milestones | design approved before build |

## Steps, runtime, order
| # | Step | Runtime | Parallel? |
|---|---|---|---|
| 0 | Contract v1.12 (`docs/DASH-API.md`): types, endpoints, migration 015 rules | Lead | first |
| 1 | Design proposal: client header infographic + package/bonus/time forms, 1440 + 390, light + dark, static HTML mock | tsst-creative | with 2 |
| — | Ahmed approves or corrects the design | Ahmed | |
| 2 | Backend AG-011: migration 015, endpoints, usage math, tests | Antigravity | with 1 |
| 3 | Web DASH-R8-WEB, 3 steps: Settings (plan fields, bonus, estimates) + time entry · client header + Timeline + Feedback · milestones scope editor + Home | Codex High | after R8A + design OK |
| 4 | Integrate, test on the real-data copy, deploy (backup, migration 015, counts) | Lead | Ahmed's OK to deploy |

## Cost (estimate)
- Money: none (no new server, service or storage).
- Claude: contract + review + integration/deploy ≈ one long Lead session; design proposal = 1 tsst-creative round.
- Codex: 3 messages (High), 3–4 screenshots each. Antigravity: 1 request in ~4 parts.
- Time: about 2 working days after the go, plus Ahmed's design review.

## Decisions for Ahmed (Lead default in brackets)
1. What uses an edit credit? [1 client Request edit per item; team ones free]
2. At 0 credits? [client can still ask; marked "extra" for the team]
3. Hours visible to the client? [no, team only; client sees campaigns, ads, credits, bonus]
4. AI-made items' time? [estimate per item type from Settings; a manual entry overrides]
