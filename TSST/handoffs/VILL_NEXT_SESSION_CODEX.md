# VILL Studio: Codex takes the Lead (owner, 2026-10-11)

ROLE A — team runtime (Codex, `roles: [lead]` in `TSST/bus/runtimes.yaml`). You are the Lead for brand **vill-studio** only. Claude stays Lead for other brands; do not touch them.

## Boot (read these, nothing else first)
0. `AGENTS.md` → `TSST/context/boot.md`; your runtime map: `TSST/context/adapters/codex.md`. Core rules: `TSST/core/rules.md` (R15 clear/short/exact, R16 ask the owner before every dispatch).
1. `TSST/brands/vill-studio/status.md` + `projects/strategy-baseline/project.md` — NOTE: status.md is stale (last 2026-10-08). The state below is newer and wins.
2. `TSST/brands/vill-studio/assets/ASSETS.yaml` — brand truth (colours, fonts, logo files).
3. The service playbooks `TSST/services/SV-0*.md` (VILL = social setup line; social-setup-01 is done).

## State (2026-10-11)
- **Strategy Baseline v0.2 + Brand Look v0.2:** delivered + approved (2026-10-05).
- **Identity:** C7-VILL-11 accepted. Main colour **PETROL `#01304A`** (not navy). Fonts **Alexandria (AR) + Inter (EN)**. The `BRAND_GUIDELINES_v1.0` draft is wrong on both (says navy, Cairo/Barlow).
- **social-setup-01 (SV-01):** all 13 items APPROVED, handover done 2026-10-09 (`PILOTS/.../social-setup-01/DELIVERY.json`).
- **showcase-01 carousel:** v3 APPROVED. Open: AR caption lines, the LinkedIn "most clients" claim (unverified), CTA channel.
- **showcase-01-reel (New Alamein):** AI route paused; Ahmed finishes it by hand in After Effects. Do not restart the AI run unless he asks.
- **dresser-01 product render:** method CLOSED AS WORKING. True approved file = `brands/vill-studio/assets/source/products-rendered/dresser-01_P1f_TRUE-APPROVED.webp` (Drive only). `..._P1f_v1_APPROVED.png` is NOT the truth. Next stage (studio set) only on the true file and only with Ahmed's go. See `PILOTS/.../products/dresser-01/RECIPES.md` header.
- **Raw photo bank (new):** 1,583 client past-work photos sorted into 54 project folders: `brands/vill-studio/assets/source/portfolio/` (`INDEX.md`, `CATALOG.csv`, `STUDIO_PICKS.md`, `_catalog/BANK.html`). Studio/campaign images START here → pick → upgrade with AI → use per campaign. Tool: `TSST/CREATIVE/tools/photo-bank/README.md` (`photobank.py search|fidelity`, Python `C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe`). Trust piece tags + text search; material/stage tags are weak.

## Open items (ask Ahmed which one first; one track at a time)
1. **C7-VILL-12 round 2** — brand guidelines book: fix list in `PILOTS/.../LEAD_REVIEW_C7-VILL-12.md` + correct petrol/fonts. Not issued yet.
2. **Verbal identity** — `VERBAL_IDENTITY_v1.0.md` waits for Ahmed's native review.
3. **showcase-01 leftovers** — AR captions, verify or drop the LinkedIn claim, choose the CTA channel.
4. **Next content from the raw bank** — e.g. a project-based post series built from `STUDIO_PICKS.md`; LENS story first → SPARK formats → CREATIVE.
5. **dresser-01 studio set** — on the true approved file; max 3 rounds; owner confirms the approved file side by side with the real photo first.
6. **Data for VILL-001** — `OPEN_DATA_REQUESTS.md` waits for the client (economics, capacity).

## How to lead here
- Every dispatch names TEAM + skill IDs (Skill Plan); reports cite `Skills used:` + `skill_friction:`; log non-none friction to `TSST/core/friction-log.md`.
- Order: LENS → SPARK → CREATIVE/MOTION. Video: AI shots first; raw media = reference only.
- Ahmed's own drafts = quality floor; raise them, never strip them.
- Measure brand facts against `ASSETS.yaml` before saying "on brand".
- Delivery pages: follow `TSST/services/delivery/README.md` (v1.0) + R18–R20 (`TSST/core/rules.md`); run `job_check.py` before calling a job done.
- New VILL jobs go in `TSST/brands/vill-studio/projects/<job>/`; moving the active PILOTS jobs is a separate approved track (B) — do not move files now.
- Before any audit/fix round: show the exact list + cost, get OK.
- Replies to Ahmed: plain Egyptian Arabic, short; English only for file names/IDs.

## Never
Spend, publish/post, change account settings, generate on Ahmed's Magnific account, git push, or edit other brands. Commits only when Ahmed asks.

## First action
Sync `TSST/brands/vill-studio/status.md` to the State above (short), then ask Ahmed which open item to start.
