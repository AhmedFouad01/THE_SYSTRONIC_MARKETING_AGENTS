# Systronic CRM — Visual Foundations Lock v0.1


Status: UX-03 / PRE-FIGMA FOUNDATION LOCK
Owner: CREATIVE_AG under TSST Lead
Sources: CRM_UI_FOUNDATIONS_v0.1 + CRM_MVP_COMPONENT_SYSTEM_BRIEF_v0.1 + accepted UX-01/UX-02 architecture.


## 1. Precedence decision


The later Component System Brief contains the explicit locked typography rule and supersedes the earlier candidate typography wording where they conflict.


Locked:
- English UI: Inter.
- Arabic primary/body: Cairo.
- Arabic headings/emphasis: Alexandria.
- Arabic alternate/system family: IBM Plex Sans Arabic.
- Noto Sans Arabic is not an approved substitute.
- If IBM Plex Sans Arabic is unavailable in the selected Figma environment, record the dependency; do not silently substitute.


## 2. Brand character


Approved product attributes:
Clean, Formal, Minimal, Light + Dark, Organized, Aligned, Systematic, Obvious, Premium.


Product DNA:
- sharp geometric signal/lightning language;
- deep navy as the main identity carrier;
- cyan as controlled interactive signal;
- red as rare brand accent, not automatic destructive color;
- neutral surfaces dominate;
- strong alignment and compact enterprise rhythm;
- border/surface separation before shadow;
- no glassmorphism, no gradient dependency, no bubbly-card language.


## 3. Brand anchor status


Current brand anchors are extracted from raster artwork and remain candidate values until a vector/master brand source confirms them:
- Brand Navy: #181D36.
- Brand Cyan: approximately #00BEF6.
- Brand Red: approximately #FF003C.
- Brand Soft Gray: approximately #F7F7F8.
- White: #FFFFFF.


Rule:
Do not manufacture extra brand colors from JPEG antialias/compression variants.


## 4. Semantic token architecture


Brand tokens and semantic tokens are separate.


Token families:
- brand.navy
- brand.cyan
- brand.red
- surface.canvas
- surface.primary
- surface.secondary
- surface.overlay
- text.primary
- text.secondary
- text.muted
- border.default
- border.strong
- action.primary
- action.primary-hover
- action.focus
- status.success
- status.warning
- status.error
- status.info
- selection.background
- selection.border


Semantic status values are design-system candidates and must pass contrast/state QA before lock. Destructive red must not be aliased directly to brand.red by default.


## 5. Light mode


- canvas: near-white/cool neutral;
- primary surfaces: white;
- secondary surfaces: subtle cool gray;
- primary text/action identity: navy;
- selection/focus: cyan-derived;
- borders: quiet cool neutral;
- red: rare signature/brand signal only where semantically safe.


## 6. Dark mode


- canvas: deep neutral navy darker than the brand mark;
- surfaces: layered navy/charcoal neutrals;
- primary text: off-white;
- secondary text: cool gray;
- borders: low-noise navy/gray;
- active/focus: cyan-derived;
- brand red remains rare;
- semantic destructive/error state is independently contrast-tested.


Dark mode must preserve hierarchy, not merely invert colors.


## 7. Typography


Core sizes:
- 12: metadata / secondary table text.
- 13: dense labels / dense body.
- 14: default UI body and controls.
- 16: strong body / section label.
- 18–20: page/record headings.
- 24–28: authoritative KPI/headline metrics only where justified.


Weights:
400 regular, 500 medium, 600 semibold.
Avoid 700+ as a default dense-interface hierarchy tool.


Mixed-direction fixture must include:
Arabic name + English company + email + international phone + EGP amount + UUID-like ID.


## 8. Spacing and layout


Base unit: 4.
Core scale: 4, 8, 12, 16, 20, 24, 32, 40, 48.


Operational density:
- default MVP: balanced compact;
- optional Comfortable;
- optional Compact where the component supports it.


Tables must not inherit marketing-level whitespace.


## 9. Geometry


Candidate radius roles:
- radius.1 = 4: chips/compact controls.
- radius.2 = 6: default controls.
- radius.3 = 8: panels/dialogs.
- radius.4 = 12: rare large containers.


Avoid ubiquitous 16–24 radius cards.


Borders are the default separation tool.
Shadows are reserved for true overlays: drawer, menu, command palette, dialog.


## 10. Iconography


- clean outline geometry;
- consistent stroke weight;
- no decorative duotone for primary navigation;
- active states may use cyan/navy emphasis;
- directional icons reviewed manually for RTL;
- Systronic lightning mark remains a brand signature, not a generic utility icon.


## 11. Motion


Micro-transition target: 120–180ms.
Use restrained opacity/background/border transitions.
Avoid decorative scale/motion that slows CRM work.


Motion principles:
- immediate;
- predictable;
- controlled;
- quiet at rest;
- obvious on interaction.


## 12. Focus / interaction states


Every interactive component must define:
default, hover, pressed, focus-visible, selected where relevant, disabled, loading where relevant, error where relevant.


Focus must be unmistakable in both themes and cannot rely on color alone.


## 13. RTL/LTR token behavior


Use logical properties and component start/end semantics.
Do not create a separate patched Arabic layout.
Arabic RTL is a first-class mode.
Mixed-direction values require bidi-safe treatment.


## 14. Foundation acceptance


These foundations are approved inputs for Figma direction exploration.
They do not certify exact brand production colors until a master/vector source is confirmed.
They do not validate SK-020–030; integrated UI evidence is still required.