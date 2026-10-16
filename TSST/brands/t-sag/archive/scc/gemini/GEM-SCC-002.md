GEMINI REQUEST GEM-SCC-002 · t-sag · scc (Systronic Control Center) · from LENS_AG via Lead · 2026-10-07

> للتنفيذ: افتح Gemini Desktop ← موديل Pro ← اختار **Deep Research** من زرار (+) ← انسخ اللي تحت "PROMPT" كله والصقه.
> مفيش ملفات ترفعها. احفظ التقرير اللي يطلع جنب الملف ده باسم `GEM-SCC-002_out.md` (أو صدّره Google Doc وحط اللينك).

OBJECTIVE:   Close the evidence gaps in the SCC build-vs-buy research, with sourced, dated facts.
CONTEXT:     Public tools and prices only. No client data, no code, no credentials.
FILES/ASSETS: none
REFERENCES:  LENS packet 2026-10-07 (gaps listed in the prompt)
CONSTRAINTS: Every claim gets a source URL + access date + grade. Unknown stays UNKNOWN, never guessed.
OUTPUT:      One Markdown report, Arabic (Egyptian-friendly), tool/product names in English.
ACCEPTANCE:  LENS checks: each table row has URL + date + grade; no invented prices; disputed items shown both ways.

PROMPT:
```
I am a solo software developer in Egypt. I sell my own software to small businesses (a Windows restaurant POS-style system, and a web CRM). I am building a small "control center" to manage my customer installations: licensing (with offline grace), error/crash tracking, uptime/heartbeat monitoring, remote support, Windows app updates, and alerts to my phone. My plan is HYBRID: I build the customer/device registry, licensing and dashboard myself, and plug in open-source or cheap tools for the rest.

Research the following and give me a detailed, sourced report. For EVERY claim give: source URL, date accessed, and a grade (A = official vendor/project docs, current; B = reputable secondary source 2025-2026; C = single blog/forum). If you cannot find something, write UNKNOWN. Do not estimate prices you did not find.

1. Keygen (keygen.sh):
   a. Keygen CE (self-hosted community edition): exact license terms. Can I use it commercially to license software I sell? Any limits?
   b. Paid plan prices (Std / Ent) and what the free Dev tier includes.
   c. Offline / air-gapped license files: how they work, cryptography used, grace periods.
2. Cryptlex and LicenseSpring: current prices for the smallest paid tier, offline activation support.
3. Uptime Kuma: does it support push/heartbeat monitors (the client pings the server, alert if silent)? Notification channels (Telegram, WhatsApp, email). Resource needs.
4. GlitchTip (self-hosted): current system requirements, supported SDKs (Sentry SDK compatibility for .NET, Electron/Node, browser JS), limitations versus Sentry.
5. Remote support for unattended Windows PCs in restaurants: compare RustDesk (self-hosted server) vs MeshCentral. Features (unattended access, file transfer, terminal, address book, per-device IDs), license (AGPL / Apache) and what that means if I self-host it for my own customers, server requirements, any known security incidents 2024-2026. Also AnyDesk and TeamViewer smallest commercial plan prices.
6. Velopack: requirements, supported app types (.NET, Electron, others), how updates/rollback/delta work, hosting the update feed on cheap storage.
7. Windows code-signing certificates available to an individual/small company in Egypt: OV vs EV, Microsoft Trusted Signing (Azure Artifact Signing) availability for Egypt, current prices from 2-3 vendors, and SmartScreen reputation behavior.
8. Phone alerts from my server: Telegram Bot API (cost, limits) vs WhatsApp Business Cloud API pricing for Egypt (per-message/conversation categories in 2026) vs email.
9. How do small POS / business software vendors in Egypt and MENA (e.g. Foodics, and smaller local vendors) handle remote support, licensing, and monitoring of customer installations? Only public evidence (job posts, docs, articles).

Format:
- Start with a 10-line summary in Arabic: the key answers and anything that changes my plan.
- Then one section per numbered item, with a comparison table where useful.
- End with a "Claim ledger" table: claim | status (supported / qualified / disputed / unknown) | source | date | grade.
Write the report in simple Egyptian-friendly Arabic; keep product names, prices, and technical identifiers in English.
```
