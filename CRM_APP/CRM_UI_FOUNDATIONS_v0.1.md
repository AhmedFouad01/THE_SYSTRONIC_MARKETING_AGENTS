Systronic CRM — UI Foundations v0.1
Date: 2026-10-03 Owner: CREATIVE_AG under TSST Lead State: BRAND-ALIGNED FOUNDATION / COMPONENT-FIRST Source: user-supplied THE SYSTRONIC branding artwork and explicit style direction.
Approved visual attributes
* Clean
* Formal
* Minimal
* Light + Dark
* Organized
* Aligned
* Systematic
* Obvious
* Premium
Brand DNA observed from supplied assets
The supplied identity uses:


* a sharp geometric lightning / double-strike symbol;
* dominant deep navy;
* controlled cyan and red edge accents;
* large white / near-white negative space;
* restrained pale-gray oversized symbol/background usage;
* assertive but highly organized composition;
* strong horizontal alignment and generous spacing.


The product UI must preserve this DNA without using the marketing logo treatment as a literal UI layout.
Candidate brand color anchors
These values are derived from the supplied raster assets and remain candidate tokens until a vector/master brand file confirms exact production values.


* Brand Navy: #181D36 — primary brand anchor / primary text / primary action in light mode.
* Brand Cyan: approx. #00BEF6 — controlled accent, selection, focus, progress, active indicators.
* Brand Red: approx. #FF003C — controlled accent; use sparingly. Do not treat every branded red use as semantic error.
* Brand Soft Gray: approx. #F7F7F8 — background / subtle surfaces.
* White: #FFFFFF


JPEG artwork contains antialias/compression variants around cyan/red; do not create multiple brand accents from those variants.
Product color strategy
Light mode
* App canvas: near-white / cool neutral.
* Primary surface: white.
* Secondary surface: subtle cool gray.
* Primary text: Brand Navy.
* Secondary text: neutral slate.
* Border/divider: very low-contrast cool gray.
* Primary action: Brand Navy.
* Selection / focus / interactive accent: Brand Cyan.
* Brand Red: reserved accent and carefully separated from destructive semantic red.
Dark mode
* App canvas: deep neutral-navy, darker than the brand mark.
* Surfaces: layered navy/charcoal neutrals.
* Primary text: off-white.
* Secondary text: cool gray.
* Borders: subtle cool navy/gray.
* Brand Cyan: active/focus accent.
* Brand Red: rare brand signal; destructive states use a semantic token with independent accessibility testing.
Color behavior rules
1. Do not make the application cyan/red-heavy.
2. Cyan and red should usually appear in small controlled areas: active state, focus, chart highlight, indicator, tiny brand signature.
3. Navy carries most of the identity.
4. Neutral surfaces should do most of the visual work.
5. Status colors (success, warning, error, info) must be semantic tokens, not direct brand-color reuse by default.
6. Every semantic color must have accessible text/icon pairings and a non-color cue where needed.
7. Charts may use brand hues, but must use a controlled data-viz palette and direct labels where practical.
Typography direction
UI typography must be separate from the logo/display treatment.


Primary goals:


* highly readable at dense CRM sizes;
* strong Arabic and Latin parity;
* clear numerals;
* stable table alignment;
* formal, neutral and modern;
* usable in both light and dark modes.


Initial candidate pairing for testing:


* Arabic: IBM Plex Sans Arabic
* Latin: Inter


Alternative Arabic candidates may be tested only if they improve metrics/legibility and licensing is clear.


Do not force the italic/logo display personality into body UI text.
Type scale direction
Use a compact enterprise scale, approximately:


* 12 — metadata / table secondary
* 13 — dense labels / table body
* 14 — default body / controls
* 16 — strong body / section labels
* 18–20 — page/record headings
* 24–28 — dashboard headline metrics only where justified


Weights:


* 400 regular
* 500 medium
* 600 semibold Avoid overuse of 700+ in dense interfaces.
Spacing system
Base: 4px. Preferred rhythm:


* 4
* 8
* 12
* 16
* 20
* 24
* 32
* 40
* 48


Dense CRM controls may use 4/8/12 spacing; major layout separation should use 16/24/32.
Geometry
Product character:


* structured, not bubbly;
* small/moderate radius;
* crisp alignment;
* minimal shadow;
* borders preferred over floating cards;
* pills used only where semantic/status behavior needs them.


Candidate radii:


* 4px — small chips/compact controls where appropriate
* 6px — default controls
* 8px — panels/dialogs
* 12px — rare large containers


Avoid ubiquitous 16–24px rounded SaaS cards.
Elevation
Prefer:


1. border + surface contrast;
2. slight overlay shadow only for drawers, menus, command palette and dialogs;
3. no heavy dashboard-card shadows.
Density
Provide at least:


* Comfortable
* Compact


Default MVP target: balanced compact density suitable for real sales operations.


Tables must not inherit marketing whitespace.
Iconography
* clean outline icons;
* consistent stroke weight;
* simple geometry;
* no decorative duotone icon set for core navigation;
* directional icons must follow RTL semantics intentionally, not global mirroring;
* selected/active icons can use Cyan or Navy emphasis.


The lightning mark is a brand signature, not a general-purpose icon.
Interaction signatures
The Systronic CRM should feel:


* immediate;
* predictable;
* controlled;
* quiet at rest;
* obvious on interaction.


Use:


* 120–180ms micro-transitions;
* restrained opacity/background/border transitions;
* minimal scale animation;
* strong visible focus ring, preferably Cyan-derived;
* no decorative motion that slows task execution.
Product shell direction
* compact collapsible sidebar;
* low-noise top/context bar;
* content-first workspace;
* minimal chrome;
* no oversized hero dashboard inside operational screens;
* table/list/kanban/record detail dominate the working area;
* user always understands current object/view/context.
Component-first implementation order
UI-01 Foundations
Tokens:


* color
* typography
* spacing
* radius
* borders
* elevation
* iconography
* motion
* density
* RTL/LTR
UI-02 Primitives
* Button
* IconButton
* Input
* Textarea
* Checkbox
* Radio
* Switch
* Select
* Combobox
* SearchInput
* Badge
* Status
* Avatar
* Tooltip
* Divider
UI-03 Navigation
* AppShell
* Sidebar
* Workspace switcher
* Context header
* Tabs
* Breadcrumb where justified
* Global search
* Command palette
* Mobile navigation
UI-04 Data
* DataTable
* Grid behavior where required
* Column header
* Sort
* Filters
* Saved views
* Pagination / virtualized states
* Row selection
* Bulk action bar
* Inline status/cell patterns
UI-05 Overlays
* Drawer / SidePanel
* Dialog
* Popover
* Dropdown
* ContextMenu
* Confirmation
* Toast
UI-06 CRM domain components
* Contact identity block
* Lead row
* Deal card
* Pipeline column
* Task item
* Activity item
* Timeline
* Record header
* Assignment control
* Stage control
UI-07 Feedback/states
* Skeleton
* Loading
* Empty
* Error
* Permission denied
* Stale/conflict
* Offline/retry where required
* Success/undo
UI-08 Reporting
* KPI
* Chart container
* Legend
* Date range
* Comparison
* Drill-down
* Attribution labels
* Empty/no-data states
UI-09 Responsive / RTL variants
* 360px
* tablet/narrow
* desktop
* large desktop
* Arabic RTL
* English LTR
* mixed-direction test fixtures
UI-10 Component QA
Every component must define:


* anatomy
* sizes
* variants
* interaction states
* disabled/loading behavior
* keyboard behavior
* focus behavior
* RTL/LTR
* responsive behavior
* accessibility annotation
* implementation notes
Approval model
No CRM screen is visually finalized before the foundational/primitives/navigation component set is approved.


Application screens are compositions of approved components, not one-off redesigns.


A screen-specific component is allowed only when:


* it represents a genuine reusable domain pattern; or
* the existing component model cannot express the product requirement without harming usability.
Immediate build batch
Batch 1:


1. Color/token sheet — light/dark.
2. Typography specimen — Arabic/English + numerals + mixed bidi.
3. Spacing/radius/elevation sheet.
4. Buttons and IconButtons.
5. Inputs / Search / Select / Combobox.
6. Badge / Status / Avatar / Tooltip.
7. Sidebar shell.
8. Context header + Tabs.
9. Command palette.
10. Component state sheet (hover/focus/pressed/disabled/loading/error).


This batch defines the visual character before tables, pipelines and CRM records are built.