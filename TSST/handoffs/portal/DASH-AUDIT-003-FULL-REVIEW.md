# DASH-AUDIT-003 — Full UX/UI + workflow review of the Dash, screen by screen, real data (Codex)

ROLE A (team runtime, product UX review). READ-ONLY: no code changes, no commits to code, no deploy, no push, never
write to `G:\My Drive` (client folders are read-only). Effort: High. Cost rules R52: ONE step per message (Ahmed sends
"Step 1" … "Step 6"); notes and screenshots go to files; the chat reply per step is 3 lines in plain Egyptian Arabic.

## Ahmed's words (2026-10-21)
"حوار المزامنة ده فاشل جدا … أنا عايز السيستم يبقى مستقل بذاته … عايزين نشوف الزراير اللي بايظة والزراير الكويسة …
يفتح كل إعداد ويراجع الشكل واليو اكس والخطوات، هل مظبوطة ولا لا، هل مفيدة لماركتينج إيجنسي ولا لا، هل سريعة في الشغل
ولا معقدة … شاشة العميل الحاجات مش بتظهر فيها … المايلستونز في حاجات للجوبس لوحدها وفي حاجات للشركة كلها، الدنيا
داخلة في بعض. السيستم ده لازم يتفنط ويتراجع ويتقسم ويتظبط."

## Where
Work in `C:\Work\tsst-portal-web` (do not switch branches; you only write files under `web/qa/AUDIT-003/`).

## The copy you review (real data, local only)
- Start it (if http://localhost:8799 does not answer), in a terminal:
  `cd C:\Work\tsst-portal` then `npx tsx --env-file=C:/Work/tsst-portal/.data/review/review.env scripts/dev.ts`
- It reads the REAL client folders (`G:\My Drive\TSST-Clients`, read-only) and a copy of the live database (jobs, job
  settings, milestones, decisions, client items; no real accounts). Sign in with the owner in
  `C:\Work\tsst-portal\.data\review\login.txt`. Create any client links / team users you need inside this copy only.
- Known symptoms already seen (verify, explain the cause in UX terms, do not stop at them):
  1. Ahmed uploaded ANVIL folders to Drive; they reached the server but "did not show": folders appear only after
     "Create job"; PDFs / Word / Excel are "other" files and are not review items nor visible to the client.
  2. "anvil/Logo Variations" and "anvil/Visual Identity" show as jobs with 0 files; ANVIL's older jobs
     (campaign-01, rollup-pre-hell, marketing-week-01, switch-pilot) do not show at all.
  3. Milestones: job milestones vs company-wide milestones are mixed.
  4. The client screen does not show things Ahmed expects.

## How to review every screen (apply to each step)
For EVERY screen, tab, modal, menu and setting: open it, use every button / control once, at 1536 and 390, light and
dark. Record in the step notes, one row per finding:
`ID · screen · what you did · what happened · expected · severity P1 (broken / blocks work) | P2 (wrong / confusing) |
P3 (polish) · screenshot file`.
Also per screen: (a) does it help a marketing agency run client work, yes / partly / no, why; (b) clicks and seconds
for its main task; (c) which buttons are broken, which are good; (d) what should be split, merged, renamed or removed.

## Step 1 — Shell, Home, Jobs, Create job
Notes `web/qa/AUDIT-003/step-1.md`, screenshots `web/qa/AUDIT-003/s1-*.png` (≤ 8).

## Step 2 — Job page, every tab, posts, New post
On 4 real jobs: `anvil/@locked-assets` (PDF / Word / Excel), `anvil/@visual-assets`, `vill-studio/social-setup-01`
(big), `vill-studio/showcase-01-reel` (video). Overview, Posts, Deliverables, Log, Edit job, milestones, decisions,
show-to-client, New post (all 3 steps). Notes `step-2.md`, ≤ 10 screenshots.

## Step 3 — Review, Reports, Clients, Client detail
Notes `step-3.md`, ≤ 8 screenshots.

## Step 4 — Settings, every tab and every control
Team & roles, Clients (profile, logo picker), Workspace, Client access (create a link with and without PIN),
Visibility, Packages & billing (create a package, a payment). Notes `step-4.md`, ≤ 10 screenshots.

## Step 5 — The client side
Open the link from step 4 in a private window: PIN gate, client Home, client Job, approve / request edit, what the
client can and cannot see vs what the team set to "shown". List every item Ahmed would expect the client to see that
is missing, and why (setting, file type, post rule, visibility). Notes `step-5.md`, ≤ 8 screenshots.

## Step 6 — The verdict and the new structure (no screenshots)
`web/qa/AUDIT-003/REPORT.md` (≤ 3 pages), for Ahmed and the Lead:
1. Top 15 problems, ordered by how much they hurt daily agency work (each with the finding IDs).
2. Drive dependence: what breaks because the Dash reads Drive (folders, file types, timing); what an independent Dash
   needs (upload in the Dash, its own job / post / asset storage, Import plan = `docs/IMPORT-PLAN.md`) and what Drive
   would still be useful for, if anything.
3. Milestones model: proposal for job milestones vs client (company-wide) milestones vs agency-wide dates, where each
   is created and shown (team and client).
4. Information architecture: the proposed navigation and screens (split / merge / rename / remove), with a one-line
   reason each; the 5 main agency tasks (create a client job, add content, get internal approval, send to client,
   track client feedback) with today's clicks vs proposed clicks.
5. Buttons: a table of broken / confusing / good buttons.
6. A phased fix plan (P1 first) the Lead can turn into rounds.
7. Sizes and proportions (Ahmed 2026-10-22: "أحجام الكاردز ضخمة جدا، المفروض تكون منطقية … الأبعاد والنسب محسوبة
   وبصريًا صح"). Measure, from the step screenshots and the DOM, every card / tile / panel / modal / KPI / list row:
   width × height at 1536 and 390, and how much of it is real content vs empty space. Then propose ONE size system:
   layout grid (columns, gutters, page max width), spacing scale, card types with min / max sizes driven by their
   content, image ratios inside cards, type scale and line lengths, touch targets. Table: element · today · proposed ·
   why.
8. References (Ahmed, 2026-10-22): the free patterns of UX Engine at https://designmotionhq.com/patterns/<slug> (no
   login; do NOT buy or install the paid plugin, do NOT give any email for the Blueprint). Read only the ones that
   match a finding, and name the pattern next to each proposal / fix. Start with: perfect-card, grid-system,
   golden-ratio, proximity-rule, design-tokens, visual-hierarchy, depth-layers (sizes, Section 7); data-table,
   filter-chips, bulk-actions, pagination (Jobs, Review); undo-ux, destructive-actions, disabled-buttons,
   behind-the-button (Review, Remove package, Archive / Restore); settings-system, autosave-ux, form-validation-timing,
   form-field-states (Settings, New post draft); modal-hierarchy, stepper-wizard, file-upload-ux (Create job, New post,
   Import plan); empty-states, error-states, charts-that-lie (Home, Reports); navigation-patterns, tabs-system,
   search-experience-system (shell, search). Also any images Ahmed drops into `web/qa/AUDIT-003/ux-engine/`.

## Reply (3 lines per step, Egyptian Arabic)
Step n done · biggest 2 findings · notes file path.
