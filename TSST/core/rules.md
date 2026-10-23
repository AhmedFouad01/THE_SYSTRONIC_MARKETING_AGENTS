# TSST core rules (global)

Every brand, project and runtime. A brand `rules.md` may be stricter, never looser.
R-numbers are stable IDs. Full original wording, dates and sources: `TSST/decisions/rules-history.md`.
Task packs below hold the task-specific rules; load only the one the task needs.
`[code]` = a tool enforces it; follow the tool, don't re-explain it.

## 1. Talking to Ahmed
- **R23** Plain Egyptian Arabic. English only for identifiers (paths, IDs, commands) in code spans.
- **R15** Verdict first, short, exact. Nothing unverified stated as fact.
- **R16 / R24** Ask open questions and confirm scope + cost before dispatching any agent or runtime.
  A proposed audit/fix round = numbered list (item, done-when, rough cost), never open-ended.
  Ahmed's direct OK of a scope covers it: don't ask again inside it; expansion is a new decision.
- **R25** End a track with a short state + one next step, not a menu.
- **R27** Systems, plans, roadmaps: diagram first.

## 2. How work gets done
- **Team + skills, never ad hoc** (Must 9, R1–R5, R7, R10). Deliverables come only from
  LENS / SPARK / CREATIVE / MOTION / DEV under the Lead; `tsst-reader` only reads (R2).
  Each dispatch has one plan: TEAM / AGENT / SKILLS / NOT_SELECTED / TIER / ACCEPTANCE / SKILL_GAP;
  ≤3 skills found via `TSST/skills/index.yaml`; no match = `SKILL_GAP` → `TSST-CTX-SK-023`.
  Every deliverable lists `Skills used:`; the Lead rejects work without it.
  `[code]` dispatch hook, `TSST/context/preflight.py`, bus `done --skills-used`.
- **R6 / R14 / R26** The Lead understands, decides, reviews and talks to Ahmed; doable work goes
  to the team; cheapest reader first. Generic or retired agents are never dispatched.
- **Must 2–4** One brand at a time. Recover the latest checkpoint, respect `do_not_repeat`.
  Never guess missing state; source access is resolved per runtime (`TSST/context/boot.md`).
- **R11–R13 / Must 6** One-pass batches; resume an unfinished agent, don't restart it; end with
  one evidence-backed checkpoint; close the Lead session at each phase end.
- **Must 7–8** Lowest sufficient tier (`TSST/context/models.yaml`); provider model names only in adapters.
- **Must 5 / R8 / R9 / R35** Incoming sync packets are proposals. External skills: security review →
  owner OK → `UNVALIDATED`. Skills change by version; non-`none` skill_friction →
  `TSST/core/friction-log.md` `[code]` `friction_check.py`.

## 3. Workspace, branches, files
- **R21 One branch: `master`** (owner rule 2026-10-16, replaces branch-per-track). All work is on
  `master`. A short-lived branch only for risky code, merged or dropped the same day. Old branch
  heads are kept as tags `backup/2026-10-16/*`.
- **R42 One workspace** (updated 2026-10-17). TSST system = `C:/Work/TSST` (GitHub
  `AhmedFouad01/THE_SYSTRONIC_MARKETING_AGENTS`, `master`). Client work = `G:/My Drive/TSST-Clients`,
  reached in the clone as `TSST/brands` (a folder link; not in git). CRM = `C:/Work/tsst-crm`
  (private repo `AhmedFouad01/tsst-crm`). No side copies or worktrees; the old G: repo folder is a
  backup only. Check `git branch --show-current` = `master` before any commit. Same method in every runtime.
- **R46 System freeze until 2026-11-15** (owner rule 2026-10-16). No new tools, layers, rule files,
  folder systems or process steps unless real client work is blocked; Ahmed OKs each exception.
  Exceptions: 2026-10-17 owner review board (`TSST/services/review`, REVIEW-001); 2026-10-18 online
  portal + CRM hosting on Ahmed's AWS EC2, free DuckDNS domain (PORTAL-001).
  A new owner rule = one line here.
- **R47 No per-task process files** (owner rule 2026-10-16). The job brief is the plan;
  `DELIVERY.json` is the record. Plan/preflight/observation/handoff files only when work moves to
  another runtime or changes TSST code. Agents write only inside their job's `work/` and `final/`.
- **R48 Three boxes** (owner direction 2026-10-16, rounds 2–3 pending): TSST system on GitHub
  (`C:\Work`); client work on Drive `TSST-Clients/<brand>/` with one template
  (brand.md, status.md, photos/, approved/, jobs/<job>/{brief.md, work/, final/}, archive/);
  products (CRM, SCC) each in its own repo. Nothing is deleted; old material goes to archive.
- **R49 Review words** (owner rule 2026-10-19): work is Jobs; review statuses are Pending review / Approved / Changes requested (button Request edit), never Reject/Decline; changes requested = not shippable as is, redo per the note. Status colours (owner 2026-10-20): Approved = royal #00338D in light / neon cyan #00BEF6 in dark; Pending review = orange; Changes requested = neon red #FF003C.
- **R50 HeroUI only** (owner rule 2026-10-20): Dash and CRM UI use only HeroUI v3 components (or our thin wrappers built from them) for every control, form field, button, chip, card, tab, modal, menu and table, at their documented sizes and spacing; no hand-built look-alikes, no raw HTML controls (R39). Charts stay Chart.js. A missing component = ask the Lead before building one. Every screen is checked at 1440 / 1024 / 390, light + dark, with real-length data before review.
- **R51 Buttons and colours** (owner rule 2026-10-20): ACTION buttons only (they do something: Approve, Request edit, Save, Create, Delete, Revoke, Cancel) are a flat fill with NO border, outline, stroke or shadow (light and dark); text always white, weight Regular 400 (never semi-bold); pairs in one row = same height and width; 3 sizes only (sm in lists and cards). Never filled: segmented choices and tabs (selected = white surface + royal text in light, raised navy surface + light-blue text in dark; others plain text), toggles (switch), icon buttons (no fill, light hover tint), nav links (text + underline). Fills (Ahmed's own mock, exact colours, his call over contrast advice): Approve = royal #00338D in light, neon cyan #00BEF6 in dark; Request edit = neon red #FF003C in both; Primary cyan #007DA3 (hover #006B8C); Danger/Delete #E0003A; Secondary #475569. Royal also = identity (sidebar, headings, header, selected segment text). Neon #00BEF6 / #FF003C otherwise = accents (pulse, focus, selection, alerts, charts). Only exception: keyboard focus-visible ring in #00BEF6.
- **R52 Cheap requests to other runtimes** (owner rule 2026-10-20): every request to Codex or any external runtime is one step per message and says which section to read (never a whole growing file); screenshots only of the changed area (2–4, no full size/theme matrices, no recordings unless needed); UI steps run only the front-end typecheck + build, full test suites once at the end; reply in 3 lines, full report only at the end. The Lead estimates the cost before sending and cuts what is not needed to judge the step.
- **R53 No borders anywhere** (owner rule 2026-10-20): Dash and CRM components have NO stroke or border: buttons, text fields, selects, date pickers, checkboxes, radios, switches, cards, tables, modals, chips. Shapes are told apart by pure colour: fields and unchecked boxes use a filled surface tint that differs clearly from the background (light and dark); checked = solid colour; cards and modals = surface colour + soft shadow; dividers only where a list needs them. Focus: fill change, plus the keyboard focus-visible ring (R51) as the one exception.
- **R53 Motion AG = AI video only** (owner rule 2026-10-20): MOTION_AG makes video by AI generation (story, shot list, start frames, AI video/music/voice prompts and generation, AI tools for edit/finish). It never uses After Effects again: no AE projects, no JSX/ExtendScript, no aerender, no "Ahmed runs the script" steps. Text, logos and transitions come from AI generation or from the AI tools themselves.
- **R54 Product photo edits = ChatGPT, intent only** (owner rule 2026-10-23): professional edits of product photos (RAW → Edited) are made in ChatGPT by Ahmed, never by CREATIVE_AG. The team sends Ahmed, per product: the original RAW photo, one existing Edited photo as reference, and a short note of WHAT we want (goal, use, what must stay true, e.g. the real pack unchanged). Never an explicit or detailed prompt: it changes ChatGPT's direction; ChatGPT decides how.
- **R22** An owner rule given in any runtime is written here in the same turn; runtime-private
  memory only points to the R-number.
- **R33** Before creating a request/handoff file, list the folder and take the next free number.
- **R34** Handoff and bus files are pointer-first, no recaps `[code]` bus size limits.
- **R32** Near a usage limit keep `TSST/handoffs/LIMIT_FALLBACK.md` current; never hand off
  spend, publishing, account actions or paid generation.
- **R43 Status = current only** (owner rule 2026-10-16). Brand `status.md` holds only the current
  state, every open job's name, next action and `do_not_repeat`, ≤250 words. Durable brand facts
  → `brand.md`; past checkpoints → `status-history.md` verbatim. Template: `TSST/brands/_template/status.md`.
- **R44 Don't search generated pages** (owner rule 2026-10-16). Never search inside
  `DELIVERY*.html`; job state is in `DELIVERY.json`. `[code]` root `.ignore` (ripgrep skips them).
- **Naming** Folders lowercase-kebab-case; daily files short (`status.md`, `project.md`).
- **R17** The daily board starts only when Ahmed says "ابدأ اليوم"; while locked, work only on
  board rows and park new requests (`TSST/daily/README.md`).

## 4. Never without Ahmed's explicit OK in chat
- publish, post, spend budget, contact clients, deploy
- durably apply Real Memory changes; move, merge, duplicate or delete Real Memory roots or historical evidence
- expose or store credentials/secrets
- claim PILOT_READY / PRODUCTION_READY beyond `TSST/READINESS_REPORT.md`
- redesign approved work without a concrete defect
- external tools (Gemini app, ChatGPT…) are ROLE B: bounded request, no spend/publish (R41)

## 5. Task packs (load only the matching one)
| Task | Pack | Rules |
|---|---|---|
| Client job, delivery page | `TSST/core/rules/delivery.md` | R18–R20, R40, R45 |
| Design, images, video, external production | `TSST/core/rules/creative.md` | R31, R36–R38, R41, Creative |
| Products, code, UI | `TSST/core/rules/build.md` | R30, R39 |
| Marketing, research | `TSST/core/rules/marketing.md` | R28, R29 |
