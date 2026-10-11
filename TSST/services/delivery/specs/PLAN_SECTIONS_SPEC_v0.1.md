# Plan sections for The Systronic Delivery System - SPEC v0.1 (round 1: spec + sketch, no code)

Date 2026-10-09. Owner decisions: 4 sections inside the existing page: Milestones, Roadmap, Marketing plan, Tasks. Pilot ANVIL (`default_lang: ar`). Client page = only what the client must do. Status = dot + word; no timelines, boxes, pills, grey cards.
Skills: SK-020 (IA, labels, click depth), SK-026 (RTL/bidi), SK-031 (roadmap type = **production roadmap**, not product release; cheap preview = the sketch, before any drawing).

## 1. Manifest schema additions (all optional; absent = section hidden)
Every entry has a stable `id` (slug, never reused). EN fields at top level, Arabic in the existing `"ar"` block keyed by id. `internal: true` = internal page only.
```json
"marketing_plan": {
  "objective": "Brand awareness for the ANVIL SUPPS name change",
  "audience": "Existing traders and customers of Shark X Store",
  "channels": [{"id": "ch_fb", "name": "Facebook", "role": "Main reach"}],
  "messages": [{"id": "msg_1", "text": "..."}],
  "kpis": [{"id": "kpi_reach", "name": "Reach", "target": "", "source": "Meta Insights",
            "status": "planned", "int_note": ""}],
  "int_note": "", "internal_paragraphs": []
},
"roadmap": [{"id": "rm_concept", "title": "Concept and copy", "desc": "",
             "status": "approved|review|progress|production|published|planned",
             "owner": "client|team", "depends_on": ["rm_intake"], "window": "",
             "internal": false, "int_note": ""}],
"milestones": [{"id": "ms_post1", "title": "Post 1 published", "date": "2026-10-09",
                "date_basis": "confirmed|planned", "status": "...", "stage": "rm_concept",
                "gate": "client approval", "internal": false, "int_note": ""}],
"tasks": [{"id": "tk_approve_p2", "title": "Approve the reveal video", "owner": "client|team",
           "due": "2026-10-12", "status": "open|done|blocked", "ref": "item:post2_reveal",
           "internal": false, "int_note": ""}],
"ar": { "marketing_plan": {"objective": "", "audience": "",
          "channels": {"<id>": {"name": "", "role": ""}}, "messages": {"<id>": ""},
          "kpis": {"<id>": {"name": "", "target": "", "source": ""}}},
        "roadmap": {"<id>": {"title": "", "desc": "", "window": ""}},
        "milestones": {"<id>": {"title": "", "gate": ""}},
        "tasks": {"<id>": {"title": ""}} }
```
Notes: `window` (e.g. "Week 2") and `date` are filled only when sourced; `date_basis` says which. `ref` links a task to an item/text id (renders as an anchor). Empty KPI `target` renders "To be agreed" (never a guess). `status` reuses the existing `st_*` words plus `planned`, and `open|done|blocked` for tasks.

**Leak rules (extend the existing leak scan):**
- Client page drops: every `internal: true` entry; every task with `owner: "team"` (even if the flag is missing); all `int_note` and `internal_paragraphs`.
- A team-owned roadmap stage, if shown, uses only the neutral word "The Systronic" (no person, tool, service ID).
- Client task titles and all client-visible plan text go through the LEAK term scan (spend gates, tool names, people). Hit = exit 1, as today.
- Dependencies on internal entries are not rendered on the client page.
- KPI `source` is a public measurement source name (e.g. "Meta Insights"), never a file path (paths go in `int_note`).
- Internal page shows everything; team tasks sit under a visible "Team tasks" label plus the existing internal flag.

## 2. Section order and contents rail
Order: 1 Overview (existing) · 2 **Marketing plan** · 3 **Roadmap** · 4 **Milestones** · 5 Deliverables · 6 Copy · 7 **Tasks** ("What we need from you" on the client page) · 8 Next steps · 9 Approvals log (internal also: Checks, Sources).
Rationale (SK-020): why (plan) -> how it runs (roadmap) -> checkpoints (milestones) -> the work -> what is asked of the client. Tasks come after the work they refer to, but the Overview status line shows "N tasks need your action" as a link to that section, so action is one click away.
Rail: new entries `sec_plan`, `sec_roadmap`, `sec_milestones`, `sec_tasks`, with plain-number counts (no pills), in the same order. A section with no visible data has no heading and no rail entry (no "none" placeholders on the client page). On the internal page a section whose manifest key exists but is empty shows "not set".
Roadmap vs Milestones (no duplication): Roadmap = ordered stages (what happens, who, depends on). Milestones = checkpoints inside those stages (what is reached, date if sourced, which approval point). A milestone points to a stage by id and does not repeat its text.

**Layout (rule-compliant):**
- Roadmap: ordered list. Start column: stage number (Western digits). Then title + one-line description, then `dot + word` status and owner word at the end. Thin rule between rows. Current stage in bold weight (not colour only). No connecting line.
- Milestones: same rule-list pattern: title and stage, date (or "Date to be set"), approval point, dot + word.
- Marketing plan: label/value rows (like existing facts); channels and messages as plain lists; KPIs as a rule table: Indicator | Target | Measured by | Status.
- Tasks: rule list: title, due date, dot + word (Open / Done / Waiting on you). Overdue = the word "Overdue" plus the date, never colour alone. Owner word shown on the internal page only.

**AR (RTL):** full mirror with logical properties: number column at the right, status at the left end. Western digits. Dates keep the existing `<bdi dir="rtl">` wrapper; Latin names (Meta Insights, Facebook, TikTok, ANVIL SUPPS) in `<bdi dir="ltr">`; KPI targets with units ("2,799 EGP", "%") as LTR isolates. No arrows or directional icons used (if one is added it must point to the logical end). Line-height 1.8-2.0, no letter-spacing, Cairo for ANVIL. Verbatim `messages[].text` shown unchanged in both languages.
**EN:** same structure, LTR.

## 3. New i18n keys (en | ar), formal Arabic chrome
| key | en | ar |
|---|---|---|
| sec_plan | Marketing plan | الخطة التسويقية |
| sec_roadmap | Roadmap | خارطة الطريق |
| sec_milestones | Milestones | المحطات الرئيسية |
| sec_tasks | What we need from you | المطلوب منكم |
| sec_tasks_internal | Tasks | المهام |
| tasks_team_label | Team tasks | مهام الفريق |
| tasks_client_label | Client tasks | مهام العميل |
| plan_objective | Objective | الهدف |
| plan_audience | Audience | الجمهور المستهدف |
| plan_channels | Channels | القنوات |
| plan_messages | Key messages | الرسائل الرئيسية |
| plan_kpis | Key performance indicators | مؤشرات الأداء |
| th_kpi | Indicator | المؤشر |
| th_target | Target | المستهدف |
| th_source | Measured by | مصدر القياس |
| th_due | Due | الموعد |
| th_task | Task | المهمة |
| th_stage | Stage | المرحلة |
| th_owner | Responsible | المسؤول |
| th_gate | Approval point | نقطة الاعتماد |
| target_tbd | To be agreed | يُحدَّد بالاتفاق |
| date_tbd | Date to be set | الموعد يُحدَّد لاحقاً |
| owner_client | You | أنتم |
| owner_team | The Systronic | The Systronic (brand name, never translated) |
| st_planned | Planned | مخطط |
| st_open | Open | مفتوحة |
| st_done | Done | مكتملة |
| st_blocked | Waiting on you | بانتظار ردكم |
| st_overdue | Overdue | متأخرة |
| tasks_pending_one | One task needs your action | مهمة واحدة تتطلب إجراءً منكم |
| tasks_pending_n | {n} tasks need your action | {n} مهام تتطلب إجراءً منكم |
| plan_current_stage | Current stage | المرحلة الحالية |

## 4. Content ownership (no invented numbers)
- **LENS** writes: marketing_plan objective, audience, key messages, channel roles (EN copy, AR block from CLIENT_COPY_AR.md); titles/descriptions for roadmap stages and milestones; wording of client tasks.
- **SPARK** writes: KPIs (name, target, source), channel mix, roadmap stage structure and dependencies (from the SV-05 stages table), milestone approval points and dates (production schedule), test-plan notes in `int_note`.
- **Lead** fills: `tasks[]` state and due dates (live), all `status` fields, client-vs-team `owner`, all `internal` flags, final leak review; confirms any date with the client before `date_basis: "confirmed"`.
- Rule: a KPI target, budget, date or number without a source stays empty and renders "To be agreed". Prices/budgets appear only if in the approved brief. The builder warns on empty target/date instead of filling it.

## 5. Open questions for the owner
1. May the client see a roadmap stage owned by the team (shown as "The Systronic"), or only stages that involve the client?
2. Show dates on milestones to the client, or only stage/week windows until each date is confirmed?
3. KPI targets: show metric names with "To be agreed" from day one, or hide the KPI table until targets are agreed?
4. Overdue client tasks: visible on the page, or kept internal and chased by message?
5. Visual alternative to decide (NOT adopted): a thin single-rule progress mark above the stage list, with one small solid square per stage and a text line "Stage 2 of 3". Or a ruled stage table where each row has a thin bar (square ends, no pill) whose width shows the share of stages done. Both keep dot + word as the status and add no timeline or card. The current proposal is the plain ordered list.

## Round-2 build notes (not done now)
Touch: `build_delivery.py` (schema docstring, renderers, rail, leak scan), `i18n/en.json` + `ar.json` (same key set), README, ANVIL manifest. QA: 1280 / 390, EN / AR, client / internal, bidi check, empty-state check (a manifest with no plan keys must produce the same page as v1.0).
