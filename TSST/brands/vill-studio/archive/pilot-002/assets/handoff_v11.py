from pathlib import Path
import json,hashlib
p=Path('TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE');a=p/'assets'
review='''# Studio review — C7-VILL-11

2026-10-05 · CREATIVE_AG / tsst-creative · bounded identity/colour revision, not campaign acceptance. Original files retained. All listed documents, seven actual PNGs, phone/RTL/crop evidence reviewed.

| File / group | Logo palette? | Findings and disposition |
|---|---|---|
| BRAND_LOOK_DIRECTION_v0.1.md | No | Retire proposed material hues/type; preserve restraint. MAJOR proof/Arabic gaps addressed by later rules. |
| BRAND_LOOK_DIRECTION_v0.2.md | No | Retire proposed palette/type; keep approved RTL, proof record and optional whole-home containment. |
| BRAND_LOOK_DIRECTION_v0.3.md | Partial | Logo navy/orange mixed with obsolete VI neutrals; broken Markdown and inconsistent distribution. Supersede, preserve history. |
| BRAND_LOOK_v1.0.md | Yes | Keep base colours/derivations/OFL; missing explicit aliases and complete actual-pair matrix. Supersede with v1.1; never overwrite. |
| REVIEW_BRAND_LOOK_v0.1.md | Historical | Keep R1–R10 Arabic/contrast/proof checks; old palette calculations are historical only. |
| REVIEW_STRATEGY_v0.1.md | n/a | Keep kitchen masterbrand/content-scope findings; media/economics outside this revision. |
| REVIEW_TEAM_2026-10-05.md | Yes | HIGH concept/soft imagery/type/copy findings stay open; PREVIS rejection retained. New brief authorizes colour render and CONCEPT labels. |
| LEAD_NOTES_v0.3.md | Partial | Exact logo sampling retained; VI/Raleway instructions superseded by latest brief. |
| assets/README.md | Yes | Fix authority path, prior self-QA/gate conflict and stale reproduction instructions; preserve provenance. |
| sources/carousel-01.html + renders/carousel-01.png | Yes | Tokenize background/text/index/rule; native/logo/phone pass; generic slogan/AC focal distraction remain HIGH concept issues. |
| sources/carousel-02.html + renders/carousel-02.png | Yes | Tokenize muted support; AA pass, shaping intact; 335px joinery softness and weak copy remain HIGH. |
| sources/carousel-03.html + renders/carousel-03.png | Yes | Tokenize copy/index/disclosure; crop/RTL pass; separated languages/internal optional-step copy remain HIGH. |
| sources/reel-cover.html + renders/reel-cover.png | Yes | HIGH logo crop loss fixed: logo/index integrated above headline in single navy panel; continuous hero; square/feed pass. Weak concept/soft photo remain. |
| sources/single-post.html + renders/single-post.png | Yes | Semantic light text/muted support; navy footer preserved, AA pass. Soft diptych/generic line remain MEDIUM; orange bar decorative only. |
| sources/kitchen-ad.html + renders/kitchen-ad.png | Yes | Tokenize navy-on-orange CTA and muted Arabic; AA/phone pass; missing channel/proof remain HIGH. |
| sources/whole-home.html + renders/whole-home.png | Yes | Tokenize masterbrand/heading/disclosure; export pass; generic montage/small thumbs remain MEDIUM. |
| assets/qa/SELF_QA.md + render/pixel checks | Yes | Preserve v1.0 evidence in history; refresh actual font/decode/overflow, 40 text-pair checks and gate limitations. |
| assets/qa/contact-sheet.png + seven phone PNGs | Yes | Actual inspection confirms legible hierarchy/Arabic and sameness; no colour-only meaning; new grayscale evidence included. |
| assets/qa/bidi-test.png + cover square/feed crops | Yes | Joining, diacritics, number/unit/date/currency isolation intact; cover logo/title/CONCEPT retained after fix. |

Skills used: TSST-CREATIVE-SK-001 (authority/brand audit), TSST-CREATIVE-SK-006 (semantic roles/contrast), TSST-CREATIVE-SK-010 (actual render defects). Skills skipped: SK-003 folded into SK-006; SK-005 existing typography retained, concept criticism recorded; SK-014 no generation. skill_friction: no colour-vision simulation tool in SK-006. Next: independent Lead acceptance of bounded identity; campaign key-visual/proof/source/rights work stays open.
'''
(p/'REVIEW_STUDIO_C7-VILL-11.md').write_text(review,encoding='utf-8',newline='\n')
notes={
'carousel-01':('living','All dark text/index/aperture rules now aliases; logo authority fixed. AA/RTL/native/360 pass. Generic slogan and AC distraction remain.'),
'carousel-02':('joinery','Muted support uses navy-tint-80; all colour aliases. AA/RTL/native/360 pass. Low-resolution joinery and weak copy remain.'),
'carousel-03':('kitchen','Navy/white/index/disclosure aliases; approved logo. AA/RTL/native/360 pass. English-first/internal optional-step line remains.'),
'reel-cover':('kitchen','Continuous tall hero; original logo and index integrated above headline in one navy panel. Native/360/square/feed pass; logo/headline/CONCEPT retained. Softness/weak concept remain.'),
'single-post':('joinery + dining','Light panel navy text and navy-tint-20 muted support; footer remains navy/white. AA/RTL/native/360 pass. Decorative orange bar has no semantic boundary role; soft imagery remains.'),
'kitchen-ad':('kitchen','CTA orange/navy and muted Arabic role mapped. AA/RTL/native/360 pass; kitchen-only scope retained. Contact channel/proof pending.'),
'whole-home':('living + dining + kitchen + joinery','Shared semantic tokens and approved logo applied. AA/RTL/native/360 pass. Montage and small soft thumbs remain.')}
rows='\n'.join(f'| [{n}](sources/{n}.html) | [PNG](renders/{n}.png) / [phone](qa/{n}-phone.png) | {src} | {note} |' for n,(src,note) in notes.items())
readme=f'''# VILL Studio — v1.1 identity and rendered template pack

2026-10-05 · C7-VILL-11 · [Brand Look v1.1](../BRAND_LOOK_v1.1.md) · [one-page Studio review](../REVIEW_STUDIO_C7-VILL-11.md).

**Creative state: PREVIS.** Seven actual rendered PNG template drafts and seven editable HTML masters complete the bounded identity/token revision. `REVIEW_TEAM_2026-10-05.md` campaign-quality rejection remains open; actual PNG format alone does not promote the gate. Historical C7-VILL-10 PRODUCTION_DRAFT provenance remains in [history](history/c7-vill-10/README.md). CONCEPT / SOURCE VISUAL stays on every asset per the newer brief. Unknown image type/rights and soft screenshot crops prevent final-production claims. No generated imagery or release approval.

The palette uses only approved navy #040136, orange #EE8C01, white #F3F4F6 and derived mixtures; [tokens](tokens.json) separates palette/semantic aliases. Every master references `TSST/brands/vill-studio/assets/final/Logo.png` unchanged (1080×1080). Its SHA-256 matches the historical input: `F743A268847ED6E278274B43FD3DDB0B02BEAD64662F45BE57CDA4FE7AE697C7`. PSD read-only; no logo retyping/recolouring. Barlow Condensed/Cairo and bundled OFL licences retained without new downloads.

## Per-asset change and actual QA

| Editable master | Actual export / phone | Image crop | v1.1 changes and result |
|---|---|---|---|
{rows}

Six feed PNGs are 1080×1350; cover is 1080×1920 still (no video). Actual PNGs inspected at native size and the 360px phone board. Every logo is unchanged and visible; Arabic joining/line breaks are intact. Labels are supporting ~10–12px at phone scale; fine STUDIO descriptor is secondary. Cover simulations: [square](qa/reel-cover-square-crop.png), [4:5](qa/reel-cover-feed-crop.png) retain logo/title/CONCEPT. These are internal crop checks, not current-platform overlay certification.

## Evidence and limitations

- [Actual contact sheet](qa/contact-sheet.png), [grayscale](qa/contact-sheet-grayscale.png), [logo regions](qa/logo-evidence.png), [RTL specimen](qa/bidi-test.png), [QA record](qa/SELF_QA.md).
- [Render checks](qa/render-checks.json): seven masters, all bundled fonts/images loaded, zero text canvas overflow; image decode/two-frame safeguard preserved.
- [Contrast checks](qa/contrast-checks.json): 40 actual text elements, six resolved foreground/background pairs all normal AA ≥4.5:1; failed reserve pairs and fixes documented in v1.1.
- [Pixel checks](qa/pixel-checks.json): visible logo light pixels ≥6492 in every export, including corrected cover-specific region.
- [Inventory](qa/inventory.json): SHA-256/bytes for active files; [history manifest](qa/history-manifest.json) separately preserves prior sources/renders/QA/build/tokens/README. BRAND_LOOK_v1.0.md unchanged.
- Coordinator internally inspected v1.1 and integrated cover square crop on this run; this is bounded QA feedback, not formal user/Lead acceptance. Campaign key visual, Arabic-first art direction/type criticism, proof, original hi-res image records/rights, contact CTA, live placement overlays and strategic review remain open.
- Grayscale inspected: headline/CTA shape/index/disclosure stay readable; full colour-vision simulation unavailable in existing pipeline. No chart/interactive UI delivered, so those aliases require later actual UI testing.

## Source provenance

Crops from supplied profile screenshots, unretouched and unchanged: kitchen `inputs/company-profile/Port_ (1).png` [457,38,1084,753] 627×715; joinery same page [748,781,1083,1106] 335×325; living `inputs/company-profile/CP (4).png` [763,39,1640,580] 877×541; dining same page [763,595,1188,900] 425×305. [Crop manifest](crop-manifest.json). Supplied pages do not prove completed-project status or permission for external release. Private review use is an assumption. Replace screenshot crops with original licensed photo/render evidence before production acceptance; no fabricated execution/QC/price/location claims.

## Reproduce

Run from repository root: `python .../assets/build.py`, `node .../assets/render.cjs`, `python .../assets/preview.py`, then `python .../assets/document_v11.py` and `python .../assets/handoff_v11.py` (the prefix is `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE`). Build regenerates only crop files/token JSON/seven HTML masters, never historical v1.0. Edit build for durable layout changes; renderer injects token aliases from tokens.json, waits for actual fonts/decode and writes PNGs. Preview creates actual phone/crop/colour QA; document refreshes measured contrast/grayscale/spec; handoff refreshes review/README/inventory. Renderer uses installed local Playwright/Edge; no install, upload or publishing. Before recreating output, retain required new evidence under history; existing C7-VILL-10 snapshot is immutable.

## Skill packet

Agent: CREATIVE_AG / runtime role `tsst-creative` (canonical generated instructions loaded; collaboration label tsst_creative). Runtime/model: Codex child worker; routed/claimed gpt-6.1-sol medium, no independent runtime introspection beyond inherited session configuration. Skills used: TSST-CREATIVE-SK-006 — logo-only palette, semantic roles, actual contrast/grayscale; TSST-CREATIVE-SK-001 — historical audit/authority/logo/system rules; TSST-CREATIVE-SK-010 — actual PNG/native/phone/RTL/logo/crop inspection, fix/recheck and gate dispositions. Skills skipped: SK-003 folded into SK-006; SK-005 typography retained and unresolved direction defect recorded; SK-014 no generation. skill_friction: SK-006 has no concrete colour-vision simulator; limitation disclosed. Next: Lead independently inspects scoped outputs and judges identity acceptance; separate evidence-backed key-visual production needed before final campaign review. Readiness NOT_READY; no publication, spend, contacts, Real Memory or git changes.
'''
(a/'README.md').write_text(readme,encoding='utf-8',newline='\n')
qa='''# Actual render QA — C7-VILL-11

CREATIVE_AG / tsst-creative · creative gate PREVIS. Actual PNG template renders exist; campaign-quality rejection from REVIEW_TEAM remains unresolved. CONCEPT/rights/source-quality limitations persist. No self Lead close or release approval.

Inspected all seven native PNGs, 360px contact sheet, final integrated cover square/feed crops, logo-region evidence and Arabic bidi/diacritics specimen. Cairo/Barlow loaded in every export, all images decoded, zero text bounding-box canvas overflow. Six actual text pairs / 40 elements pass normal AA. Single-post muted text is derived navy-tint-20 on white; navy footer preserved. Cover logo is inside one existing headline panel with original-square geometry; continuous kitchen photo retains one hero. Full logo, headline, CONCEPT visible in both central crops. Fine logo descriptor remains supporting; main service descriptor supplied elsewhere.

Fixed and re-inspected: semantic inheritance briefly resolved main text to black during migration; main now explicitly inherits semantic text and all rendered foregrounds are checked against allowed palette. Cover old top-logo crop loss fixed; attempted standalone navy band rejected by coordinator and replaced with integrated panel. The old kicker was obscured by the continuous photo and is now integrated alongside logo, all text on opaque navy. Renderer decode safeguards retained. Logo pixel region updated for actual cover placement. History/c7-vill-10 retains original evidence; v1.0 untouched.

Native inspection confirms soft source crops (joinery most visible), generic slogans/English-first hierarchy/sameness/proof/channel deficiencies remain as prior review records. These are not silently passed by palette compliance. Grayscale board inspected: visible titles/CTA shape/numbers/disclosure remain intelligible without colour alone. Full colour-vision simulation unavailable; no interaction/chart tests claimed. Mobile labels supporting, primary Arabic joins/diacritics intact; synthetic date/currency/unit samples confined to QA.

Coordinator internally reviewed v1.1 and accepted bounded integrated-cover correction; formal Lead/user identity acceptance still separate. Rights, original high-resolution sources/type, proof, key visual and channel CTA block final-production acceptance. Current platform overlays unverified. No generation/downloads/publishing/spend/contact/Real Memory/git edits.

Skills used: TSST-CREATIVE-SK-010 actual native/phone/RTL/crop QA; TSST-CREATIVE-SK-006 resolved text pairs/grayscale; TSST-CREATIVE-SK-001 approved master geometry/authority. skill_friction: colour-vision simulation tool unavailable in selected workflow.
'''
(a/'qa/SELF_QA.md').write_text(qa,encoding='utf-8',newline='\n')
def entries(root):
 return [{'path':str(f.relative_to(a)).replace('\\','/'),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(root.rglob('*')) if f.is_file() and f.name!='desktop.ini']
(a/'qa/history-manifest.json').write_text(json.dumps(entries(a/'history'),indent=2)+'\n',encoding='utf-8',newline='\n')
inv=[x for x in entries(a) if not x['path'].startswith('history/') and x['path']!='qa/inventory.json']
(a/'qa/inventory.json').write_text(json.dumps(inv,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Review, README, QA and manifests complete.')
