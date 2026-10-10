# TSST skill friction log

Every `skill_friction` other than `none` from an agent report packet, appended by the Lead. Generalised wording only — no client names, private facts, prices, or customer data (same rule as `lessons.md`).
Repeats surface as lesson candidates: `python TSST/context/friction_check.py` (read-only). Promotion follows the `lessons.md` promotion_gate.

| date | team | skill_id | friction | task |
|------|------|----------|----------|------|
| 2026-10-09 | build | TSST-DEV-SK-015 | no guidance for verifying files under concurrent edit by another session | validate_spine fixes |
| 2026-10-09 | marketing | TSST-LENS-SK-002 | no method to grade claims on JavaScript-rendered vendor help pages that the fetch tool cannot read; claims stay unverified | CRM screen research review |
| 2026-10-09 | marketing | TSST-LENS-SK-003 | competitor field set is built around ads, offer and pricing; no dimensions for product UI or screen-layout comparison | CRM screen research review |
| 2026-10-09 | marketing | TSST-LENS-SK-004 | no guidance for screen-level jobs-to-be-done when no user interviews or usage data exist | CRM screen research review |
| 2026-10-09 | marketing | TSST-LENS-SK-002 | no rule to take official URLs from search results before fetching; guessed URLs returned 404 and burned a capped fetch budget | CRM competitor study |
| 2026-10-09 | marketing | TSST-SPARK-SK-001 | principle checklist only; no output template for a screen-level data spec or a KPI tree split by user tier | CRM screen data spec |
| 2026-10-09 | marketing | TSST-SPARK-SK-003 | no guidance on cohort view vs period view for CRM funnel rates; agent set the rule itself | CRM screen data spec |
| 2026-10-09 | marketing | TSST-SPARK-SK-002 | no method for finding official platform developer docs when web search returns none (fell back to a dated blog) | CRM screen data spec |
| 2026-10-09 | marketing | TSST-LENS-SK-011 | no guidance for formal client-facing delivery documents (register, what to omit as internal) | delivery page copy |
| 2026-10-09 | studio | TSST-CREATIVE-SK-004 | refs written for 1080x1350 social; no web-page type/spacing ladder | delivery page redesign |
| 2026-10-09 | studio | TSST-CREATIVE-SK-005 | type ladder and floors are social-format only; web scale translated by hand | delivery page redesign |
| 2026-10-09 | studio | TSST-CREATIVE-SK-006 | no tool for non-text contrast of status dots; contrast tool takes hex pairs only | delivery page redesign |
| 2026-10-09 | studio | TSST-CREATIVE-SK-010 | no web/HTML QA recipe; no internal-term leak scan or client-vs-internal diff step | delivery page redesign |
| 2026-10-09 | marketing | TSST-LENS-SK-012 | no formal-MSA UI-chrome guidance; no rule for dimensions/ratios in RTL (× swaps order) or UI plural strings | delivery page Arabic copy |
| 2026-10-09 | studio | TSST-CREATIVE-SK-010 | no RTL mirror checklist or bidi test fixtures for HTML pages; dates next to Latin runs scrambled | delivery system v1 bilingual |
| 2026-10-09 | studio | TSST-CREATIVE-SK-005 | font_metrics.py lacks IBM Plex Sans Arabic; measured with raw PIL | delivery system v1 bilingual |
| 2026-10-09 | build | TSST-DEV-SK-005 | bus requires citing every listed skill even when API scope is unchanged (CRM-F3) | CRM review fix batch 1 |
| 2026-10-09 | build | TSST-DEV-SK-011 | no guidance when TypeScript 7 lacks the legacy parser API for lint/guard tests; used Rolldown AST (CRM-F4) | CRM review fix batch 1 |
| 2026-10-09 | build | TSST-DEV-SK-005 | DEV skills have no product-basics checklist (core CRM fields/types/naming, native controls); misses caught only by Ahmed's visual review (R08–R12) | CRM visual review 2026-10-08 |
| 2026-10-09 | marketing | TSST-LENS-SK-001 | no inventory taxonomy or size rubric for scoping inventories | VB-1 |
| 2026-10-09 | studio | TSST-CREATIVE-SK-020 | planning round applied skills from index one-line triggers without opening SKILL.md bodies; no per-screen report block template | CRM page redesign report |
| 2026-10-09 | studio | TSST-CREATIVE-SK-006 | no method for checking that a brand colour pair stays inside an intended hue band; agent scripted its own check | CRM house theme |
| 2026-10-09 | studio | TSST-CREATIVE-SK-010 | bounded QA loop does not say how to count an extra micro-fix re-shoot after the single fix batch | CRM house theme |
| 2026-10-09 | marketing | TSST-LENS-SK-001 | no diagram or page-count rubric for visual planning outputs | VB-2 |
| 2026-10-09 | studio | TSST-CREATIVE-SK-008 | art-direction workflow assumes multi-format campaigns; no single-diagram path | VB-3 |
| 2026-10-09 | studio | TSST-CREATIVE-SK-014 | no guidance for start/end-frame editing in composited-plate workflows or the cloth cut-on-motion case; agent improvised both | ANVIL reveal v2 pack |
| 2026-10-09 | studio | TSST-CREATIVE-SK-020 | IA skill assumes app navigation; no guidance for static system diagrams | VB-3 r2 |
| 2026-10-09 | studio | TSST-CREATIVE-SK-020 | SKILL.md has no frontmatter unlike other skills; template mismatch for new skills | SK-031 creation |
| 2026-10-09 | studio | TSST-CREATIVE-SK-014 | ChatGPT runtime cannot move Magnific outputs to Drive or view them; QA (SK-010) blocked until owner downloads by hand | ANVIL reveal v2 Master Plate M (ChatGPT) |
| 2026-10-09 | studio | TSST-CREATIVE-SK-006 | no rule on whether non-text contrast (3:1 UI parts) is measured automatically; agent measured by hand and did not use TSST/CREATIVE/tools/contrast.py | Systronic theme on HeroUI |
| 2026-10-09 | studio | TSST-CREATIVE-SK-021 | no checklist for mobile bottom bar and More sheet patterns | Systronic theme on HeroUI |
| 2026-10-09 | studio | TSST-CREATIVE-SK-005 | social-oriented; no guidance for pairing Latin and Arabic fonts in product UI via font fallback | Systronic theme on HeroUI |
| 2026-10-09 | studio | TSST-CREATIVE-SK-023 | no pattern for a full record page with an activity timeline (people vs system events, sticky mobile action bar); only master-detail and drawers | CRM contact record wireframe |
| 2026-10-09 | studio | TSST-CREATIVE-SK-028 | no rule for horizontal-scroll highlight strips or sticky action bars above a bottom navigation | CRM contact record wireframe |
| 2026-10-09 | studio | TSST-CREATIVE-SK-005 | no rule for a wordmark set as live text versus the supplied logo file | CRM sidebar brand block |
| 2026-10-09 | studio | TSST-CREATIVE-SK-026 | no rule that brand lockups keep their order and do not mirror in RTL | CRM sidebar brand block |
| 2026-10-09 | studio | TSST-CREATIVE-SK-005 | no method for fitting a fixed-width wordmark set as live text; agent measured with a DOM range | CRM sidebar brand block (mock match) |
| 2026-10-09 | studio | TSST-CREATIVE-SK-026 | no rule on which parts of a brand block mirror in RTL (lockup vs status row) | CRM sidebar brand block (mock match) |
| 2026-10-09 | studio | TSST-CREATIVE-SK-014 | no rule for outpainting or edit-prompt structure; agent extended the staging rule into a multi-pass edit fallback | ANVIL reveal v2 M edit round 3 |
| 2026-10-10 | studio | TSST-CREATIVE-SK-014 | ChatGPT runtime again could not export Magnific video files to Drive/ffmpeg (signed URLs only), so the composite was built on stills instead of the real clips; owner must download by hand | ANVIL reveal v2 final (ChatGPT) |
| 2026-10-10 | studio | TSST-CREATIVE-SK-019 | no large-format print section (bleed, ICC/ink limit, dpi targets, CMYK soft-proof); agent used general judgement and flagged items for the printer | ANVIL roll-up Pre-Hell spec |
| 2026-10-10 | studio | TSST-CREATIVE-SK-016 | SK-013/016/017/019 give no concrete export/loudness numbers or ffmpeg recipes; agent derived them | ANVIL reveal final local edit |
