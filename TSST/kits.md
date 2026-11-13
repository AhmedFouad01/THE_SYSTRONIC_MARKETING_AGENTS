# Kits — reusable work built outside TSST

Pointers only (Mac paths, 2026-11-13). Nothing is copied here. Secrets stay in their `.env` files and are never printed.
Start new client work from these instead of from scratch; promote one into TSST (tool + skill) only with Ahmed's OK.

| Kit | Where | What it does | Run | Notes |
|---|---|---|---|---|
| Order landing | `~/Work/yakebda-landing` | Static menu + cart page, checkout = WhatsApp message with order code and ad code, Meta Pixel events, first/last touch | edit `menu.json` / `src.html` → `python3 build.py` → `dist/` | local git `main`; admin in `admin/` (`docs/ADMIN_SPEC.md`); first use: Ya Kebda |
| Landing gate checklist | `~/.claude/skills/landing-page-build/SKILL.md` | Issues found by design/QA gates on client landing pages | load before building or reviewing (R65) | Claude-only path; referenced by TSST-LENS-SK-014 |
| QR stands | `~/Work/yakebda-qr/build.py` + `LINKS.md` | One A6 print image per message, each QR with its own `utm_content`, every QR decoded | `python3 build.py` | local git `main`; food hero + QR at the bottom |
| Meta campaign builder | `~/Work/meta-ads/build/make_web.py`, `make_ads.py` | Builds campaigns, ad sets and ads PAUSED, idempotent through `*_created.json` | needs `.env` in the folder (the `meta` CLI reads only the current folder) | activation = Ahmed |
| Meta reports | `~/Work/meta-ads/report.sh` | Daily + platform insights to JSON | `./report.sh` | per-ad loops are slow: use Graph `/insights?level=ad` |
| Code-made video ad | `~/Work/yakebda-video` | Remotion copy of the TSST kit + page recording from a local build + video QA | see `remotion/` and `qa/` | renders leave ~139 MB in `$TMPDIR` |
| Plan PDF as post cards | `~/Work/yakebda-plan` | Client content plan shown as posts | `./build.sh` | captions in `copy.json` |
| Dash import | `~/Work/dash-plan-kit` | `plan.json` + `posts.csv` + `media/` → Dash import, dates, media | `./push.sh` (Ahmed types his own login) | `import` is not idempotent |
| Invoice hub | `~/Work/invoice-hub` | Spec for a generic POS-invoice ingest | spec only, no code | |
