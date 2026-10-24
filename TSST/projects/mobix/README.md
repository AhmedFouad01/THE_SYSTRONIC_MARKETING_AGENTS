# MOBIX — TSST project onboarding pointer

Date: 2026-10-24
Owner instruction: "اعمل Setup لمشروع Mobix على TSST و REAL MEMORY وهشتغل بيهم بعد كده الفترة الجاية"
Project ID: `mobix`
Status: `SETUP_STAGED / NO DEVELOPMENT STARTED`
Routing: TSST Lead -> `DEV_AG` only after an approved scoped development assignment; `DEV_AG` remains `NOT_READY` under current TSST governance.
Skills used: none (administrative onboarding only; no specialist execution).

## Source-of-truth map

| Product | Real Memory project key | Code repository | Source boundary |
|---|---|---|---|
| Mobix Desktop (legacy) | `MOBIX` | [Do7a193/Mobix](https://github.com/Do7a193/Mobix) | Preserve verified legacy behavior, especially finance and client data |
| Mobix Web | `MOBIX_WEB` | [Do7a193/Mobix.Web](https://github.com/Do7a193/Mobix.Web) | Independent application, auth, persistence and migrations |
| Mobix One | `MOBIX_ONE` | [Do7a193/Mobix-One](https://github.com/Do7a193/Mobix-One) | Separate successor product/repo/database; reuse proven Mobix behavior through tests |

The three repositories are private and owned by Do7a193. GitHub is authoritative for code, branches, and commits; build and Windows QA evidence is authoritative for passing gates. Never infer production state from default branches or conversational summaries.

## Real Memory intake (proposed, not durable-applied)

Each project has an isolated source packet in the `AhmedFouad01/real-memory-os` repository:
- [MOBIX](https://github.com/AhmedFouad01/real-memory-os/blob/main/05_GLOBAL_SYNC_INBOX/chatgpt/pending/2026-10-24_MOBIX_TSST_SETUP.rm-sync.md)
- [MOBIX_WEB](https://github.com/AhmedFouad01/real-memory-os/blob/main/05_GLOBAL_SYNC_INBOX/chatgpt/pending/2026-10-24_MOBIX_WEB_TSST_SETUP.rm-sync.md)
- [MOBIX_ONE](https://github.com/AhmedFouad01/real-memory-os/blob/main/05_GLOBAL_SYNC_INBOX/chatgpt/pending/2026-10-24_MOBIX_ONE_TSST_SETUP.rm-sync.md)

Packets are only source evidence. Canonical `01_PROJECTS/<PROJECT_KEY>/` statuses and decisions must not be created/overwritten without review, source reconciliation, exact targets, and controlled apply.

## First work-session boot

1. Read [status.md](status.md); choose exactly one of Desktop/Web/One by project key.
2. Read that product's latest GitHub ref and accepted builds/tests; fetch relevant existing Real Memory checkpoints and older Drive evidence before making a state claim.
3. Resolve outstanding gates, `do_not_repeat`, branches and prerequisites. Do not restart finished work or merge product memories.
4. Route any scoped engineering assignment through TSST Lead / DEV_AG with a bounded plan, validation criteria and approval rights.
5. Use `OBSERVE -> VERIFY REF -> PLAN -> ISOLATE -> EXECUTE -> BUILD -> TEST -> VERIFY -> UPDATE RM` when working on Mobix Desktop. Apply equivalent evidence gates to Web and One.
6. On completion, update only the corresponding project checkpoint via governed RM review/apply, and keep this TSST pointer/status short.

## Current owner-reported continuation anchors (NOT automatically verified)

- Desktop: maintenance of Mobix V15.5.x; Windows login/update/reset/DB/package issues and paging behaviors must be cross-checked against newer artifacts; preserve purchase and sale price rules and manual closure.
- Web: previously reported disappearing customers after refresh and authentication issues; re-check latest fixes before a new work package. Deferred `MBX-WEB-MKT01` is a roadmap item, not activated.
- One: latest conversational thread `MO-002 reversal pair`; parity with Mobix, full accounting screens, visibly new UI, and installation without Visual Studio remain acceptance goals until verified.
- Do not run GitHub Actions unless materially necessary and explicitly approved for the affected repo.

## TSST governance

This is a project pointer in the existing `TSST/projects/` area, not a TSST Core change. The TSST system remains frozen until 2026-11-15; this onboarding neither changes `TSST/core/portfolio.yaml` nor grants any autonomous access, readiness or permission. Portfolio auto-discovery and RM durable activation remain `PENDING` and require the existing governed workflow. No code, customer database, deployment or financial history changed.
