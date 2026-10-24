# DASH-R9 — plan: client accounts, Client → Projects → Jobs, Dash-first (no Drive sync), marketing plan, bulk review

Status: PLAN, owner-approved decisions 2026-10-24. Sources: `DASH-OWNER-NOTES-001.md` N16–N25. Replaces the old
"R9 sizes + navigation" (the size system is folded in here). R10 reports stays after it. Live = 75afd1b3d.

## Owner decisions (2026-10-24)
1. **Client sign-in:** each person at the client has an account (email); sign-in by a one-time code sent to the email
   (no password). One permanent address per client; every change shows at once; no new links. Old links keep working
   until they expire. The owner can open "View as client" (read-only) and see an activity log per person.
2. **Drive:** automatic sync / auto-created jobs stop. Manual "Import from Drive" only. Existing jobs are kept.
3. **Projects:** each project has a type: Ongoing (lifetime, e.g. Social media management) or Campaign (start–end dates
   + one goal: Awareness / Acquisition / Activation / Conversion). Existing jobs move into a "General" project per
   client; Ahmed re-files them.
4. **Design first:** a visual blueprint (model + client profile + marketing-plan infographic + admin client pages) is
   approved before any code, as in R8.

## Model
Client (profile, branding, visibility, package, people) → Projects (Ongoing | Campaign: dates, goal stage, status) →
Jobs (deliverables, posts, files, time) → Items. Milestones attach to client / project / job. Package, bonus and
billing move into the client profile (redesigned, N22).

## Parts
| Part | What | Notes |
|---|---|---|
| A Model | `projects` table, `jobs.project_id`, migration moves every job into "General"; API by project | Drive-free |
| B Drive | stop the mirror-driven job discovery for new folders; "Import from Drive" action; mirror timer kept read-only or off (Lead decides at build after measuring) | N17 |
| C Client accounts | client people (email, name, role viewer/approver), email one-time code sign-in, sessions, permanent client address, invite / remove, activity log (sign-in, views, decisions, downloads), owner "View as client" | email sender: price quoted to Ahmed before use |
| D Client profile control | per-client visibility of sections / projects / package / billing / plan, edited on the client hub | N20 |
| E Marketing plan | per client: funnel board (Awareness → Acquisition → Activation → Conversion), campaigns placed by goal + dates, "we are here" | N21 |
| F Review bulk | multi-select → bulk Approve / bulk Edit (one note), status filters incl. Approved | N23 |
| G Fixes | admin Clients page, workspace name optional (logo = title), clean titles on cards, size system | N18 N24 N25 |

## Steps and runtimes
| # | Step | Runtime |
|---|---|---|
| 0 | Contract v1.13 (types, endpoints, migration 016) | Lead |
| 1 | Design blueprint: model diagram, client profile (team + client view), marketing-plan infographic, admin Clients page, sign-in by code, bulk review — 1440 + 390 | tsst-creative (cloud credit if confirmed) |
| — | Ahmed approves the design | Ahmed |
| 2 | Backend AG-012 (Parts A–F server) | Antigravity |
| 3 | Web R9 (4 steps) | Codex High (or a cloud session) |
| 4 | Integrate, real-data copy test (move into "General" checked on a copy), deploy with backup | Lead, Ahmed's OK |

## Cost (estimate)
Money: none, except the email sender for sign-in codes (quoted before use; free tiers likely enough).
Claude: contract + reviews + integration; design round on cloud credit if it does not use the weekly limit.
Antigravity ~5 parts; Codex 4 messages. Time: about 3–4 working days after the design is approved.
