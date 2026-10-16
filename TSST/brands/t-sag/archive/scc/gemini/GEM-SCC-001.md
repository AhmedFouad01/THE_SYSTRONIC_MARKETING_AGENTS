GEMINI REQUEST GEM-SCC-001 · t-sag · scc (Systronic Control Center) · from DEV_AG via Lead · 2026-10-07

> للتنفيذ: افتح Gemini Desktop ← موديل Pro ← محادثة عادية (مش Deep Research) ← ارفع **فولدر `docs` بس** ومعاه `README.md` و`START_HERE.md` من الريبو ← انسخ اللي تحت "PROMPT" كله والصقه.
> ممنوع ترفع `apps/` أو `packages/` أو `infrastructure/` أو `.env.example` أو الريبو كله: فيهم كلمات سر افتراضية، وقاعدتنا إن مفيش أي كلمة سر تطلع برا.
> لو فولدر الريبو مش عندك على الجهاز: من GitHub ← Code ← Download ZIP، فك الضغط، وارفع `systronic-control-center/docs` بس.
> احفظ النتيجة جنب الملف ده باسم `GEM-SCC-001_out.md`.

OBJECTIVE:   Map SCC's 109 documentation files against the new hybrid plan and say what to keep, merge, drop or defer.
CONTEXT:     SCC docs only (product, architecture, ADRs, audit). Checked 2026-10-07: no credentials, prices or customer data in docs/.
FILES/ASSETS: systronic-control-center/docs/ + README.md + START_HERE.md (nothing else)
REFERENCES:  TSST report https://claude.ai/artifact/QD25wzNdddHGEEpuh63VZW (summary pasted in the prompt)
CONSTRAINTS: Analysis only; Gemini proposes, DEV executes and verifies. Never recommend deleting the 20 ADRs outright; mark them keep / superseded.
OUTPUT:      One Markdown report, Arabic, file paths in English.
ACCEPTANCE:  DEV checks: every one of the 109 files appears exactly once in the table; each "merge" names its target; contradictions cite both file paths.

PROMPT:
```
Attached are the documentation files of my project "Systronic Control Center" (SCC). It was designed as a big multi-tenant SaaS control plane to manage the software I sell (licensing, devices, telemetry, errors, updates, remote config, support, backups, audit). An engineering review found it is about 10x bigger than I need: I am a solo seller in Egypt with a few products and tens to low hundreds of customer installations. There are ~109 doc files and only ~5k lines of code.

NEW PLAN (hybrid), use it as the yardstick:
- I BUILD (keep in SCC): customer/branch/device registry with version + last-seen; licensing (signed offline grants with grace, revoke); manual payment records (cash, Instapay, Vodafone Cash); one dashboard with action buttons; alerts to my phone; a small heartbeat/signal client in each product.
- I PLUG IN (no longer custom-built): error tracking = GlitchTip (Sentry SDK); uptime/heartbeat alerts = Uptime Kuma; remote support = RustDesk or MeshCentral; Windows updates = Velopack. Licensing fallback = Keygen.
- DROPPED or DEFERRED: multi-tenant customer portal, reseller-grade SLA tiers, staged rollout cohorts, two-person approvals, OIDC/MFA for now, complex reports.
- Phases: 0 fix signing keys + default secrets; 1 actionable dashboard; 2 phone alerts; 3 error tracking; 4 remote support; 5 updates (notify first).

TASKS:
1. Inventory table of EVERY file (path | one-line purpose | verdict: KEEP / MERGE into <target file> / DEFER (park in an archive folder) / DROP | reason). Every file exactly once.
2. ADRs: for each ADR say KEEP as-is, KEEP but mark "superseded by hybrid plan" (and why), or still valid. Do not drop ADRs.
3. Contradictions and stale facts between files (e.g. status files that disagree, numbers that differ, OpenAPI vs API catalog). Cite both file paths for each.
4. Proposed new lean docs structure (max ~20 files) with the target folder tree, and which current files feed each new file.
5. A one-page "what SCC already decided that is still worth keeping" summary: the design decisions that remain valid under the hybrid plan (device enrollment, offline grant format, typed remote config only, telemetry privacy/redaction, audit).
6. A list of open questions in the docs that still need my decision under the new plan.

Write the report in simple Egyptian-friendly Arabic; keep file paths, IDs and technical names in English. Start with a 10-line Arabic summary (how many files keep/merge/defer/drop, top 5 contradictions).
```
