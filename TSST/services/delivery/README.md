# The Systronic Delivery System v1.1

One manifest per job -> two pages in the job folder, one template, two languages in each file.

- `DELIVERY.html`: formal client page. Omits everything marked `internal: true`, all checks and sources, every `int_note`, internal about/next text. Media is copied to `<job>/files/<id>.<ext>` and linked from there (neutral names). Send the page together with `files/`.
- `DELIVERY_INTERNAL.html`: full detail for the team (checks, sources, rejected items, tool links, who approved, internal notes), same design plus a red "Internal copy" band.
- Each file holds English and Arabic. The header switch (EN | ع) flips `lang`/`dir` on `<html>` with no reload (full RTL mirror, the contents nav enters from the right). Opening language: `?lang=en|ar` override, then the visitor's saved choice (localStorage, per job), then the manifest `default_lang` (the client's language: ANVIL = ar, VILL = en).

## Files
- `sync_jobs.py` (stdlib only): `python TSST/services/delivery/sync_jobs.py <brand-id>|--all` scans `TSST/brands/<id>/projects/**/DELIVERY.json` and writes the generated `TSST/brands/<id>/JOBS.md` (job, service, title, status, date, page links, job_check result). Run it after every status change; `job_check.py` check f) fails when JOBS.md is missing, does not list the job, or shows another status.
- `build_delivery.py` (stdlib only; `VERSION` constant, schema in its docstring)
- `i18n/en.json`, `i18n/ar.json`: every chrome string (same keys). No sentences are concatenated; placeholders like `{n}` are filled by the generator.
- `systronic.json`: the agency footer data (website, email, phone, whatsapp, address, social, copyright). Empty fields are hidden on the client page and shown as "not set" on the internal page. Never invent data here.
- `fonts/`: Poppins (Latin) and IBM Plex Sans Arabic (Arabic), embedded in every page. `assets/`: iconic-mark tints and favicon (made from `TSST/brands/t-sag/assets/final/logo/systronic_iconic-mark_*`).

## Start a job (new_job.py)
- `python TSST/services/delivery/new_job.py <brand-id> <job-path> --service "<SV-.. name>" --title "<title>" [--lang en|ar] [--dry-run]`
- `<job-path>` is relative to `TSST/brands/<brand-id>/projects/`, may be nested (`campaign-01/marketing-week-02`), lowercase slugs `[a-z0-9-]+`. `--lang` is read from the brand's existing DELIVERY.json when omitted, else required.
- Creates `README.md`, `00_BRIEF.md` (headings only) and a `DELIVERY.json` stub (status `progress`); appends a line to the brand `status.md` (`## New jobs (new_job.py)`) and, for a nested job, to the parent `project.md`; runs `sync_jobs.py` and `job_check.py`. Top-level jobs: the Lead adds the job to the brand `project.md`. Fresh job: check c) fails until `build_delivery.py` has run; fill the Arabic title in the `ar` block.
- Refuses (exit 1): unknown brand, existing folder, PILOTS / `TSST/projects/` path, bad slug, no `--lang` with no earlier DELIVERY.json. `--dry-run` writes nothing. `--root` (tests only) points at a scratch tree.

## Add a job
1. Create `<job>/DELIVERY.json` (copy `social-setup-01/DELIVERY.json` or ANVIL `TSST/brands/anvil/projects/campaign-01/DELIVERY.json`). English fields come from LENS `CLIENT_COPY.md`; Arabic fields go in the `"ar"` block from `CLIENT_COPY_AR.md`. Set `default_lang`.
2. Every item and text needs a stable `id` (also the client file name). Internal-only entries: `"internal": true`. Internal-only detail: `int_note`, `internal_*`, `checks`, `sources`.
3. Verbatim copy (bios, captions, hashtags) goes in `texts[].body` untouched: `dir: "ltr"` or `"rtl"`. It is shown identically in both languages.
4. Build: `python TSST/services/delivery/build_delivery.py <job_folder> [--audience client|internal|both]`. It prints structure check, missing files, missing Arabic fields and a leak scan of the client page (exit 1 on a leak).
5. QA before sending: screenshots at 1280 and 390, English and Arabic, client and internal, plus a visual bidi check (punctuation, numbers, hashtags). Never hand-edit the HTML.

## Job standard (R18–R20, `TSST/core/rules.md`)
- Home: `TSST/brands/<id>/projects/<job>/`, listed in the brand's project.md. Never `TSST/PILOTS/` (archive) or `TSST/projects/`.
- Required to call a job delivered: `DELIVERY.json` + `DELIVERY.html` + `DELIVERY_INTERNAL.html` (built, not older than the JSON) and `python TSST/services/delivery/job_check.py <job>` passes.
- Same-round sync: DELIVERY.json statuses, brand project.md, brand `status.md`, brand line in `TSST/core/portfolio.yaml`.
- Layout and content file names (plan, copy, decisions): [JOB_LAYOUT.md](JOB_LAYOUT.md).

## Plan sections (v1.1)
Four optional manifest keys, absent = section hidden: `marketing_plan`, `roadmap`, `milestones`, `tasks` (schema in the `build_delivery.py` docstring, design in `specs/PLAN_SECTIONS_SPEC_v0.1.md`). Order on the page: Overview, Marketing plan, Roadmap, Milestones, Deliverables, Copy, Tasks ("What we need from you" on the client page), Next steps, Approvals. Arabic text goes in the `ar` block keyed by entry `id`.
- Client page drops `internal: true` entries, every task whose `owner` is not `client`, all `int_note` and `internal_paragraphs`; all client-visible plan text goes through the leak scan (hit = exit 1). The internal page shows everything, with "Client tasks" / "Team tasks" groups, and shows "not set" for a key that exists but is empty.
- An empty KPI target renders "To be agreed", an empty date "Date to be set"; the builder prints a one-line count of these, it never guesses. A task `ref` is `item:<id>` or `text:<id>` and renders as an anchor to that card/text; an unknown ref prints a warning and no link. Overdue (open or waiting task past its date) shows the word "Overdue" with the date.
- Items with no `file`/`href` render as a text card with no media box; only status `production` keeps the "In production / Preview to follow" placeholder.
- The status line of the Overview links to "N tasks need your action" when client tasks are pending.

## Brand and job sync (v1.1)
- Brand id comes from the job path (`TSST/brands/<id>/...`). If the manifest omits `client`, the display name is `name:` from `TSST/core/portfolio.yaml`; if it omits `job`, the folder name. Manifest values always win. The build prints a "brand sync" line when it fills a value. Not synced: `arabic_font` (see skill_friction in the D1 report: `ASSETS.yaml` has no structured font field, and the builder does not apply a manifest `arabic_font` override).
- The internal page lists the job's layout files (README, 00-08, `files/`, `work/`, `observations/`) in a "Job files" section with relative links. It is never on the client page.

## Add a language
Add `i18n/<code>.json` with the same keys as `en.json`, add the code to `LANGS` and a `<code>` block in each manifest, add a button to the header switch, and extend the CSS overrides (`html[lang=<code>]`). Only `en` and `ar` exist today.

## Rules built in
- Arabic: IBM Plex Sans Arabic, no letter-spacing, no uppercase labels, Western digits, leading 1.8-2.0. Measured: Plex Arabic body letters have about the same x-height as Poppins and equal ink weight at the same size, so the Arabic size ratio is 1.04.
- Every Latin run inside Arabic text is wrapped in `<bdi dir="ltr">`; Arabic runs inside English text in `<bdi dir="rtl">`. Hashtag/brand lines in RTL copy blocks get a display-only LTR isolate (copied text is unchanged).
- AA contrast; no boxes or pills; status = dot + word. Banned: the old Arabic stack (29LT Bukra / Myriad Arabic), slang chrome, rounded grey cards, timelines.

## Changelog
- v1.1 (2026-10-11): plan sections (marketing_plan, roadmap, milestones, tasks) with leak rules, brand sync from `portfolio.yaml`, internal "Job files" section, fileless items as text cards, `sync_jobs.py` + brand `JOBS.md`, `job_check.py` checks f) (JOBS.md in sync) and e) legacy WARN (`layout: legacy` in README), Arabic table-label fix on wide screens.
- v1.0 (2026-10-09): bilingual single file with header switch, full RTL mirror, i18n dictionaries, per-job default language, iconic-mark placeholder and favicon, agency footer (`systronic.json`), contents rail/sheet, client and internal audiences, leak scan.
- v0.x: Arabic-only RTL pages (rejected); English editorial redesign; footer and contents nav.
