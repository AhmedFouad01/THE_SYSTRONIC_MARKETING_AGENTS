CREATIVE_AG Brief — CRM MVP Component System v0.1
Date: 2026-10-03 Owner: TSST Lead Assigned specialist: CREATIVE_AG Execution support: DESIGNER_AG State: READY FOR SUPERVISED EXECUTION
User direction
Build the Systronic CRM UI as a component-first product system before applying it to product screens.


Approved brand/style attributes:


* Clean
* Formal
* Minimal
* Light + Dark
* Organized
* Aligned
* Systematic
* Obvious
* Premium


Use the user-supplied THE SYSTRONIC branding as the product identity anchor.
Source document
Read and follow:


* CRM_APP/CRM_UI_FOUNDATIONS_v0.1.md
* CREATIVE/CRM_MVP_UIUX_EXECUTION_PLAN_v0.1.md
* existing Product UI/UX skills SK-020–SK-030.
Locked typography rule
* English UI: Inter.
* Arabic UI primary/body: Cairo.
* Arabic headings/emphasis: Alexandria.
* Arabic alternate/system family: IBM Plex Sans Arabic.
* Do NOT use Noto Sans Arabic as a substitute.
* If IBM Plex Sans Arabic is unavailable in Figma, mark the dependency explicitly rather than silently substituting another family.
Component-first rule
Do not start by styling complete CRM screens.


First produce:


1. foundation tokens;
2. primitives;
3. navigation;
4. interaction states;
5. component lab;
6. data components;
7. CRM domain components;
8. reporting components;
9. responsive/RTL variants;
10. QA.


Only after component approval compose product screens.
Batch 1 — Foundation + Core Controls
Deliver:


* Light theme token sheet.
* Dark theme token sheet.
* Brand/semantic color mapping.
* Arabic/Latin typography sheet.
* Mixed Arabic/English/number specimen.
* Spacing / grid / radius / border / elevation rules.
* Iconography rules.
* Motion/focus rules.
* Button family.
* IconButton family.
* Input family.
* Textarea.
* Search field.
* Select / Combobox.
* Checkbox / Radio / Switch.
* Badge / Status / Avatar / Tooltip.
* Sidebar shell.
* Context header.
* Tabs.
* Command palette.
* full component-state matrix.


Each component must show:


* default
* hover
* pressed
* focus-visible
* selected where relevant
* disabled
* loading where relevant
* error where relevant
* light
* dark
* Arabic RTL
* English LTR
Visual guardrails
* Deep navy carries the brand.
* Cyan/red are controlled accents, not page-filling colors.
* Neutral surfaces dominate.
* Borders > excessive card shadows.
* Moderate/small radii; avoid bubbly SaaS styling.
* No gradient dependency.
* No glassmorphism.
* No decorative oversized cards without a task.
* No copied Linear/Attio component geometry.
* Strong baseline/grid alignment.
* Dense enterprise controls must remain readable.
* Marketing logo typography must not be used as body/interface typography.
UX guardrails
* Every keyboard shortcut has a visible UI path.
* Focus is always visible.
* Arabic is first-class, not a mirrored afterthought.
* Mixed bidi content must be tested.
* Component behavior must remain obvious without relying only on color.
* Destructive actions and brand red must be semantically separated.
* Do not invent backend/product behavior.
Review Gate — Batch 1
TSST Lead/user review asks:


1. Does this feel recognizably Systronic without logo dependence?
2. Is it premium without being decorative?
3. Is density suitable for daily CRM use?
4. Does dark mode preserve the same hierarchy?
5. Is Arabic visually equal to English?
6. Are interaction states obvious?
7. Could the same component system scale to tables, pipelines and reporting?


Status after creation: PRODUCTION_DRAFT / READY FOR USER REVIEW


Do not promote SK-020–SK-030 based only on Batch 1. Validation comes after integrated component and task-flow evidence.