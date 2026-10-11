# The Systronic Delivery System v1.0

One manifest per job -> two pages in the job folder, one template, two languages in each file.

- `DELIVERY.html`: formal client page. Omits everything marked `internal: true`, all checks and sources, every `int_note`, internal about/next text. Media is copied to `<job>/files/<id>.<ext>` and linked from there (neutral names). Send the page together with `files/`.
- `DELIVERY_INTERNAL.html`: full detail for the team (checks, sources, rejected items, tool links, who approved, internal notes), same design plus a red "Internal copy" band.
- Each file holds English and Arabic. The header switch (EN | ع) flips `lang`/`dir` on `<html>` with no reload (full RTL mirror, the contents nav enters from the right). Opening language: `?lang=en|ar` override, then the visitor's saved choice (localStorage, per job), then the manifest `default_lang` (the client's language: ANVIL = ar, VILL = en).

## Files
- `build_delivery.py` (stdlib only; `VERSION` constant, schema in its docstring)
- `i18n/en.json`, `i18n/ar.json`: every chrome string (same keys). No sentences are concatenated; placeholders like `{n}` are filled by the generator.
- `systronic.json`: the agency footer data (website, email, phone, whatsapp, address, social, copyright). Empty fields are hidden on the client page and shown as "not set" on the internal page. Never invent data here.
- `fonts/`: Poppins (Latin) and IBM Plex Sans Arabic (Arabic), embedded in every page. `assets/`: iconic-mark tints and favicon (made from `TSST/brands/t-sag/assets/final/logo/systronic_iconic-mark_*`).

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

## Add a language
Add `i18n/<code>.json` with the same keys as `en.json`, add the code to `LANGS` and a `<code>` block in each manifest, add a button to the header switch, and extend the CSS overrides (`html[lang=<code>]`). Only `en` and `ar` exist today.

## Rules built in
- Arabic: IBM Plex Sans Arabic, no letter-spacing, no uppercase labels, Western digits, leading 1.8-2.0. Measured: Plex Arabic body letters have about the same x-height as Poppins and equal ink weight at the same size, so the Arabic size ratio is 1.04.
- Every Latin run inside Arabic text is wrapped in `<bdi dir="ltr">`; Arabic runs inside English text in `<bdi dir="rtl">`. Hashtag/brand lines in RTL copy blocks get a display-only LTR isolate (copied text is unchanged).
- AA contrast; no boxes or pills; status = dot + word. Banned: the old Arabic stack (29LT Bukra / Myriad Arabic), slang chrome, rounded grey cards, timelines.

## Changelog
- v1.0 (2026-10-09): bilingual single file with header switch, full RTL mirror, i18n dictionaries, per-job default language, iconic-mark placeholder and favicon, agency footer (`systronic.json`), contents rail/sheet, client and internal audiences, leak scan.
- v0.x: Arabic-only RTL pages (rejected); English editorial redesign; footer and contents nav.
