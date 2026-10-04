# RTL, Localization and Responsive Contract


## Languages
- English: Inter, LTR.
- Arabic: Cairo / Alexandria / IBM Plex Sans Arabic, RTL.


## RTL
- Root direction changes with locale.
- Use CSS logical properties such as margin-inline-start and border-inline-end.
- Directional arrows mirror in RTL.
- Status/object icons do not mirror simply because the page is RTL.
- Tabs reverse Left/Right navigation logic under RTL.
- Money, percentages and IDs that can break under bidi are wrapped in LTR/isolate semantics.


## Responsive breakpoints in the prototype
- <=1180px: compact desktop/tablet shell.
- <=920px: stacked data/detail and two-column reductions.
- <=720px: mobile shell; CRM route navigation becomes bottom navigation.
- <=480px: small-mobile single-column reductions.


## Mobile behavior
- Data tables remain horizontally scrollable rather than destroying column semantics.
- Filters stack.
- Master-detail becomes stacked.
- Deal stages can horizontally scroll.
- Bottom navigation exposes current available CRM routes.
- Actions reflow rather than shrink into unreadable controls.


Production code may change breakpoint values only after evidence-based QA, not arbitrarily.