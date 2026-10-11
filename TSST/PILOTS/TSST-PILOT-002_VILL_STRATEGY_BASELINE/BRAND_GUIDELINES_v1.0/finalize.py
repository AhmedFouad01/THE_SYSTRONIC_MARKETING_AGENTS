from pathlib import Path
import json,hashlib,re
from PIL import Image
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE'); g=p/'BRAND_GUIDELINES_v1.0'
def write(path,text): path.write_text(text.strip()+'\n',encoding='utf-8',newline='\n')
write(g/'BRAND.md','''# VILL guidance v1.0 — private review, 2026-10-05

Owner: TSST Lead. Visual execution: CREATIVE_AG. Verbal source: LENS_AG.

The original [logo](../../../brands/vill-studio/assets/final/Logo.png) and [palette-v1.1.json](../../../brands/vill-studio/assets/final/palette-v1.1.json) are authoritative and read-only. Navy organizes, white clarifies, orange points to a decision. Do not recolour, retype, redraw or distort the logo. Its existing navy square is a holding block; preserve it on a light background. No alternate logo artwork is authorized. Clear space/minimum-size guidance and misuse examples are on pages 07–09; this draft guidance needs user acceptance.

Source precedence: current user instruction → approved logo/palette and accepted [strategy](../STRATEGY_BASELINE_v0.2.md)/[acceptance](../ACCEPTANCE.md) → draft [LENS verbal identity](../VERBAL_IDENTITY_v1.0.md) → this guide and examples. Draft words are laid out exactly, never promoted to approved claims. Resolve contradictions with TSST Lead; do not silently invent company facts.

The Decision cut direction is documented in [ART_DIRECTION.md](ART_DIRECTION.md). The edge is measured from the original logo: 19.2617° from vertical, horizontal displacement = height × 0.3494. Use it to separate question and decision, not to decorate every edge. One focal point; asymmetric twelve-column alignment; reserve orange for a specific relationship or decision. Use the approved JSON rather than making a second token authority. Page 11 records actual text/background contrast and fixes for prohibited orange-on-white text.

Arabic first: bundled OFL Cairo variable 900 display, 800 heading, 500 support. Latin Cairo keeps shared support tone; Barlow Condensed Bold is label-only. The condensed Barlow is not claimed to match the wide angular mark. Wider Latin alternatives are proposals in text, not installed or used. Isolate LTR values inside RTL with bdi; pair languages by meaning. Actual PNG/PDF, desktop, phone and Tahoma/Arial fallback checks are recorded in QA.

Photography must be rights-cleared, high-resolution, controlled in light, verticals and materials, with an intentional focal point. The current soft screenshots on page 16 are CONCEPT — BELOW STANDARD. They are not a prescribed look or proof. Application diagrams are educational, not measured plans, built work or QC records. Existing campaign work retains PREVIS. This guide is a rendered review draft, not campaign release approval.

Public phone/email/website/channel and image rights remain open. Never invent contact information, completed-project proof, prices, scope, timelines or guarantees. Version rules through review: increment version when logo/palette, type, device or verbal authority changes; re-render and inspect affected pages, native applications and crops. Revalidate after any font, source, geometry, platform overlay or claims change. Independent Lead inspection and user acceptance precede any release decision.
''')
write(g/'AGENT_GUIDE.md','''# Agent use — VILL v1.0

Read [BRAND.md](BRAND.md), approved palette JSON, original logo and relevant current verbal/strategy sections before authoring. This file is guidance, not permission to publish or change authorities. Do not use historical v0.x colours or rejected campaign templates as the visual standard.

Choose by task intent: social application → native aspect ratio and question/detail/decision hierarchy; proposal/deck → white clarifying rules; website → responsive Arabic-first hierarchy. Select the section explicitly; do not paste all guide rules indiscriminately. Use JSON tokens directly. Keep original logo, clear space and measured cut geometry. Layout exact LENS source strings; label hypotheses/concepts and unresolved contacts. Escalate ambiguity to Lead while proceeding with independent safe layout work.

| Request test | Selection | Ambiguity resolved / open |
|---|---|---|
| Navy website hero | 12–15 and 22; Arabic-first Cairo, original logo, white support, orange decision | Existing contact channel unknown: show internal TBC only, no fabricated CTA destination |
| White proposal | 07–14 and 23; logo navy holding square, navy text, semantic JSON | Orange body on white fails: change to navy; no proof claim without actual evidence |
| Arabic paid kitchen ad | 05–06, 16–18; exact LENS question, native 4:5 | Diagram CONCEPT only; image rights, project proof and placement overlays open; no release authority |

After changes: run local build/render/preview; inspect actual images at native/phone sizes and PDF raster, not source alone. Check all text against authority, logo decode, bidi, contrast, crop essentials, labels and footer separation. Record defects, fixes and remaining limitations. Keep before evidence. Versioned review is required before turning draft guidance into approved brand rules. Owner TSST Lead; execution CREATIVE_AG and verbal LENS_AG.
''')
write(g/'qa/SELF_CRITIQUE.md','''# Self-critique and correction round

Compare the first renders with the higher craft brief: ownable measured device, Arabic-first hierarchy, one focal point, meaningful diagrams and generous space. Preserve first HTML/PNG evidence in [before/](before/). Three weakest pages were 01, 06 and 15; [before-after-three.png](before-after-three.png) is regenerated from current final PNGs, not a proposed mockup.

| Page | First defect / severity | Implemented correction | Actual recheck |
|---|---|---|---|
| 01 cover | HIGH: display wrapped/clipped; logo slab looked detached | Cairo 900 display 112/1.25; repositioned whole logo holding square inside measured cut | Full PNG and actual PDF: title, logo, subtitle and footer contained; one diagonal focal field |
| 06 language | HIGH: dense table/cards crossed lower note/footer | Smaller 28px card support, 26px table, lower padding; exact LENS paragraph restored | Full PNG and PDF page 06: Arabic shaping/bidi and full notes visible; no collision |
| 15 device | HIGH: navy edge disappeared on navy; empty frame taught little | White construction canvas, original measured edge, dashed height and orange delta annotation | Full PNG and actual PDF: angle/displacement relationship legible, no claim of project measurement |

Additional corrections from independent coordinator review: page 10 long title clipping and dense colour/footer spacing; page 14 replaced empty frame with actual 12 columns, gutters and anchored reading order; pages 19/21 shortened application previews away from footers; application diagrams replaced empty nested frames with kitchen path and opening-clearance relationships. Page 08 clear-space guide tag moved outside clearance. Story native English/disclosure separated above complete diagram; original logo survives centre crop; right diagonal slab keeps one continuous field. Native logo decode race avoided by awaiting fonts/image.decode/two animation frames before screenshot.

All 24 PNGs and four actual-PDF raster boards inspected after correction. Native phones and crop previews rebuilt from the same final application PNGs. The coordinator independently inspected corrected guide sheets, PDF page 06, before/after strip and native phones; this is internal inspection, not formal user acceptance or release. No broader concept/proof or source-rights finding is declared closed.
''')
checks=[
'Arabic title and original navy holding logo contained; measured cut focal field; review label visible.',
'Personality cards and source hypothesis statement readable; no promoted guarantee.',
'Two directions and selection rationale visible; visual execution explicitly draft.',
'Message hierarchy fits; source statement and proof boundary retained.',
'Voice traits and avoid examples separated; no invented proof.',
'Exact LENS language paragraph, Arabic shaping and notes clear after density correction.',
'Original logo on navy/light holding block; no edited alternate logo.',
'Clear-space H guide and minimum-size note readable; tag outside zone.',
'Misuse diagrams clearly marked instructions; original source never edited.',
'Short title and colour proportion chart clear; approved palette authority linked.',
'Actual contrast matrix readable; orange-on-white prohibited/fix stated.',
'Cairo Arabic-first hierarchy and Barlow label-only roles readable; bundled-font boundary explicit.',
'AR/EN pairing and isolated LTR values render correctly; no disconnected language slabs.',
'Actual 12-column/gutter reading guide, asymmetric anchors and footer separated.',
'Measured 19.26-degree construction visible on white; orange displacement has a purpose.',
'Current images visibly CONCEPT / BELOW STANDARD; rights/high-resolution findings open.',
'Status/icon labels readable; educational diagram distinguished from actual evidence.',
'Native 4:5 kitchen decision diagram visible; conceptual status, original logo and footer separated.',
'Native carousel opening-clearance relationships visible; shortened preview clears footer.',
'Complete native story diagram visible; EN/disclosure separated; phone and central crops refreshed.',
'Original avatar holding logo visible; circular preview retains mark; page footer clear.',
'Web/deck hierarchy shown; 1440/390 and fallback actual screenshots checked.',
'Source precedence and do/dont rules visible; no authority or claim invented.',
'Version, owner and open contact information visible; no fabricated phone/channel.'
]
pages=json.loads((g/'pages.json').read_text(encoding='utf-8-sig'))
rows=[]
for entry,note in zip(pages,checks):
 stem=f"{entry['page']:02}-{entry['name']}"
 rows.append(f"| {entry['page']:02} / {entry['name']} | [PNG](../renders/{stem}.png) / [PDF raster](pdf-pages/{entry['page']:02}.png) | {note} | Internal QA pass; review draft |")
write(g/'qa/PER_PAGE_QA.md','''# Per-page actual render QA — 24 pages

Actual final PNGs and all four PDF raster contact boards inspected; full-size weakest 01/06/15 and corrected geometry/native previews reviewed. Machine checks are supporting evidence, not substitutes for visual inspection. [render-checks.json](render-checks.json): all24 Cairo/Barlow checks true, every referenced image loaded, no detected text overflow. [pdf-checks.json](pdf-checks.json): all24 1440×810pt, raster1920×1080, extractable Arabic present. PDFium fallback rendered actual PDF, not reused page PNGs.

| Page | Actual output | Visual / authority finding | Status |
|---|---|---|---|
'''+ '\n'.join(rows)+'''

Native application images: kitchen/carousel1080×1350, story1080×1920, avatar1080×1080. Phones are 360px resamples; logo presence/Arabic/EN/disclosure/full native diagram inspected. Story centre square y420–1500 and feed y285–1635 are regenerated from final right-slab native PNG. Logo/title/CONCEPT survive; square intentionally crops lower secondary detail, so it is not a promise that the entire diagram survives every crop. Avatar circle preview masks display only; it never edits approved logo source. Platform UI overlays remain unverified.

Responsive actual screenshots: web1440 and390; bundled Cairo and Tahoma/Arial fallback each tested; no horizontal overflow. Image rights/type/high-resolution proof, public contacts and LENS verbal approval remain open. Educational illustrations are not project evidence. Existing campaign work remains PREVIS; guide/applications are private rendered guidance review drafts. Coordinator internal inspection is recorded, not user acceptance. PNG export format does not advance the creative gate.
''')
write(g/'README.md','''# VILL Brand Guidelines v1.0

24-page 1920×1080 guide with editable HTML, page PNGs, actual browser PDF, native educational applications and render QA. See [index](../BRAND_GUIDELINES_v1.0.md), [BRAND.md](BRAND.md), [AGENT_GUIDE.md](AGENT_GUIDE.md), [per-page QA](qa/PER_PAGE_QA.md) and [self-critique](qa/SELF_CRITIQUE.md). Approved logo/palette unchanged. Strategy accepted; LENS verbal and this execution remain drafts. No publication, contact or release approval.

Reproduce from canonical repository root: `python TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/build.py`, then `node .../BRAND_GUIDELINES_v1.0/render.cjs`, then `python .../BRAND_GUIDELINES_v1.0/preview.py`. Run `verify_pdf.py` with bundled workspace Python (see script) for actual PDF raster checks. Keep qa/before unchanged as first-pass evidence. All new text uses UTF-8 LF.

Pipeline copied/adapted inside this new scope; previous assets/specs untouched. Edge/Playwright awaits font and image decoding; applications render before guide pages that embed them. Cairo and Barlow reference existing bundled OFL files. PDF created by browser to preserve Arabic/vector typography; bundled pypdfium2 rasterized all24 pages. No font/assets downloaded or generated.

Skills used: TSST-CREATIVE-SK-002 (BRAND/agent/version/source rules); TSST-CREATIVE-SK-008 (two directions, measured Decision cut, native guidance); TSST-CREATIVE-SK-005 (Arabic-first Cairo roles, bidi and fallback); TSST-CREATIVE-SK-010 (actual render defects/fixes, phones/crops/all-page PDF QA). PDF skill loaded and operation marker run once before first authoring. SK002/008 LAB_VALIDATED; SK005/010 remain UNVALIDATED, task QA is not skill validation.

Skills skipped:006 approved palette;014 no generation;001 prior audit. Agent/runtime: canonical tsst-creative role executed through collaboration task tsst_creative, Codex WORK dispatch/claim gpt-6.1-sol medium; no claim of native role auto-loading or model introspection. skill_friction: four skills justified by brief; Poppler/fitz absent, available bundled PDFium used; no wider Latin font available/installed, Barlow limited to labels. Skill gap none in bounded deliverable.

Next: independent Lead/user review of guide craft and draft verbal; confirm contact channel, image rights/high-res/proof and platform overlays before any release. No self Lead close.
''')
indexrows=[]
for e in pages:
 stem=f"{e['page']:02}-{e['name']}";base='BRAND_GUIDELINES_v1.0'
 indexrows.append(f"| {e['page']:02} | {e['name']} | [PNG]({base}/renders/{stem}.png) | [HTML]({base}/sources/{stem}.html) |")
write(p/'BRAND_GUIDELINES_v1.0.md','''# VILL Brand Guidelines v1.0 — private review

2026-10-05 · C7-VILL-12 · CREATIVE_AG / tsst-creative · Codex WORK gpt-6.1-sol medium dispatch.

[24-page PDF](BRAND_GUIDELINES_v1.0/VILL_Brand_Guidelines_v1.0.pdf) · [editable combined HTML](BRAND_GUIDELINES_v1.0/sources/book.html) · [human guidance](BRAND_GUIDELINES_v1.0/BRAND.md) · [agent guidance](BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md) · [production/skills packet](BRAND_GUIDELINES_v1.0/README.md).

Direction A Decision cut chosen over Scope ledger before implementation: logo-measured19.2617° boundary turns question/detail into a visible decision. Navy organizes, white clarifies, orange points. Cairo900 Arabic-first display,800heading,500support; Barlow label-only. Original logo and approved palette are read-only; source JSON is read directly by build. Two directions/reasons in [ART_DIRECTION](BRAND_GUIDELINES_v1.0/ART_DIRECTION.md), measurement in [geometry.json](BRAND_GUIDELINES_v1.0/geometry.json).

| Page | Section | Render 1920×1080 | Editable source |
|---|---|---|---|
'''+ '\n'.join(indexrows)+'''

[Per-page actual QA](BRAND_GUIDELINES_v1.0/qa/PER_PAGE_QA.md) · [self-critique](BRAND_GUIDELINES_v1.0/qa/SELF_CRITIQUE.md) · [three weakest before/after strip](BRAND_GUIDELINES_v1.0/qa/before-after-three.png) · [PDF sanity](BRAND_GUIDELINES_v1.0/qa/pdf-checks.json) · [integrity](BRAND_GUIDELINES_v1.0/qa/integrity.json) · [SHA256 inventory](BRAND_GUIDELINES_v1.0/qa/inventory-sha256.json).

Native applications are educational CONCEPT diagrams: [kitchen4:5](BRAND_GUIDELINES_v1.0/applications/kitchen-ad.png), [carousel4:5](BRAND_GUIDELINES_v1.0/applications/carousel-cover.png), [story9:16](BRAND_GUIDELINES_v1.0/applications/story-cover.png), [avatar](BRAND_GUIDELINES_v1.0/applications/avatar.png). Refreshed [story phone](BRAND_GUIDELINES_v1.0/qa/story-cover-phone.png), [square](BRAND_GUIDELINES_v1.0/qa/story-square.png) and [feed](BRAND_GUIDELINES_v1.0/qa/story-feed.png) share final source PNG. Square retains identity/title/status and crops lower secondary detail; full native diagram complete.

Acceptance boundary: direction/colours/logo approved; guide execution and LENS verbal draft. Current images are labelled CONCEPT — BELOW STANDARD; no fabricated completed projects, plan/built/QC proof, claims or contacts. Historical campaign PREVIS rejection remains authoritative. Internal coordinator inspection found final guide/correction and native QA acceptable for this bounded handoff; formal user acceptance and release are separate.

Open: LENS/user verbal review; high-resolution rights-cleared imagery and real proof; public phone/email/website/channel; live placement overlays. No contact invented. No generation/download/publication/spend/contact/Real Memory/git changes. Previous assets and brand-look specs remain untouched.

Skills used: TSST-CREATIVE-SK-002 guidelines/version/source precedence;008 art direction/measurement;005 Arabic-first typography/bidi/fallback;010 all-page actual render QA. PDF skill applied. Skills skipped:006 approved palette;014 no generation;001 previous audit. skill_friction: four-skill exception explicit in brief; unavailable Poppler/fitz replaced by bundled PDFium actual raster; wider Latin alternatives text-only. No bounded skill gap. Next: independent Lead/user review; no self Lead close.
''')
# Normalize scoped text files, excluding preserved first-pass historical evidence.
for f in g.rglob('*'):
 if f.is_file() and f.suffix in ['.py','.cjs','.html','.md','.json'] and 'before' not in f.parts:
  txt=f.read_text(encoding='utf-8-sig').replace('\r\n','\n').replace('\r','\n'); f.write_text(txt,encoding='utf-8',newline='\n')
logo=Path('TSST/brands/vill-studio/assets/final/Logo.png');palette=logo.parent/'palette-v1.1.json'
source=(p/'VERBAL_IDENTITY_v1.0.md').read_text(encoding='utf-8-sig');snap=(g/'VERBAL_SOURCE.md').read_text(encoding='utf-8-sig')
assert source==snap,'Verbal source snapshot mismatch'
assert hashlib.sha256(logo.read_bytes()).hexdigest()=='f743a268847ed6e278274b43fd3ddb0b02bead64662f45be57cda4fe7ae697c7'
reports=json.loads((g/'qa/render-checks.json').read_text(encoding='utf-8'));apps=json.loads((g/'qa/application-checks.json').read_text(encoding='utf-8'));pdf=json.loads((g/'qa/pdf-checks.json').read_text(encoding='utf-8'))
assert len(reports)==len(pdf)==24 and all(not r['overflow'] and all(r['fonts']) and all(i['loaded'] for i in r['images']) for r in reports)
assert all(not r['overflow'] and all(r['images']) for r in apps)
assert all(r['arabic_present'] and r['raster_px']==[1920,1080] for r in pdf)
assert len(list((g/'renders').glob('*.png')))==24
assert all(Image.open(f).size==(1920,1080) for f in (g/'renders').glob('*.png'))
assert len([f for f in (g/'sources').glob('*.html') if re.match(r'\d\d-',f.name)])==24
integrity={'verbal_snapshot_equals_source_normalized_LF':True,'verbal_source_sha256':hashlib.sha256((p/'VERBAL_IDENTITY_v1.0.md').read_bytes()).hexdigest(),'approved_logo_sha256':hashlib.sha256(logo.read_bytes()).hexdigest(),'approved_palette_sha256':hashlib.sha256(palette.read_bytes()).hexdigest(),'pdf_sha256':hashlib.sha256((g/'VILL_Brand_Guidelines_v1.0.pdf').read_bytes()).hexdigest(),'page_png_count':24,'page_html_count':24,'pdf_page_count':24,'all_png_1920x1080':True,'all_page_fonts_images_loaded_no_detected_overflow':True,'all_application_images_loaded_no_detected_overflow':True,'visual_inspection':'24 PNG and 24 actual PDF raster pages via contact boards, full-size weakest pages and native phones/crops. Coordinator internal inspection; not user acceptance.'}
write(g/'qa/integrity.json',json.dumps(integrity,ensure_ascii=False,indent=2))
inventory={str(f.relative_to(p)).replace('\\','/'):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(g.rglob('*')) if f.is_file() and f.name!='inventory-sha256.json'}
inventory['BRAND_GUIDELINES_v1.0.md']=hashlib.sha256((p/'BRAND_GUIDELINES_v1.0.md').read_bytes()).hexdigest()
write(g/'qa/inventory-sha256.json',json.dumps(inventory,ensure_ascii=False,indent=2))
print(json.dumps(integrity,ensure_ascii=False,indent=2))
