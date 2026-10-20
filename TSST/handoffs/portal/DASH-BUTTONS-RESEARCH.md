# DASH button system: research and spec (2026-10-20)

Agent: tsst-lens. Skills: TSST-LENS-SK-001 (bounded question), SK-003 (observed/inferred labels). Fetched 2026-10-20; docs change.

## 1. Evidence (OBSERVED = read on the page/source)

| Product | Observed | Source |
|---|---|---|
| HeroUI v3 (our base) | Weight `font-medium`, `text-sm`, radius `rounded-3xl`. Heights sm 36/32, md 40/36, lg 44/40 (mobile/desktop). Only `outline` has a border. `primary`/`danger` use `*-foreground` text. `secondary` text is `accent-soft-foreground` (coloured, not white). Ships `danger-soft` (tinted). Hover bg swap; pressed scale .97 (sm .98, lg .96). | raw.githubusercontent.com/heroui-inc/heroui/v3/packages/styles/components/button.css |
| shadcn/ui | Weight `font-medium`, `text-sm`, gap-2. Heights xs 24, sm 32, default 36, lg 40. Destructive: `text-white`, `dark:bg-destructive/60`. Secondary uses `secondary-foreground` (dark text). Only outline has a border. Focus: 3px ring at 50%. | raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx |
| GitHub Primer | `.btn` weight semibold (600). Primary is green, white text, plus a translucent border (rest and hover). Danger is outlined/neutral at rest and fills red only on hover, white text. | raw.githubusercontent.com/primer/css/main/src/buttons/button.scss ; raw.githubusercontent.com/primer/primitives/main/src/tokens/component/button.json5 |
| Primer guidance | "Never put more than one [primary] in a group of buttons". Danger "sparingly... typically with a confirmation dialog". | primer.style/product/components/button/ |
| IBM Carbon | Label Regular 400, 14px. Filled labels use `$text-on-color` (one token). Heights 24/32/40/48/64/80. Focus = 1px inset shadow. Group: primary outside, secondary inside, 16px gap, "avoid mixing button sizes within a group". No dark-theme guidance on the page. | carbondesignsystem.com/components/button/style/ |
| Atlassian | Appearances default/primary/subtle/warning/danger/discovery. Danger = "final confirmation for a destructive and irreversible action". Primary once per area. Subtle pairs with primary. Heights and weight not stated. | atlassian.design/components/button/examples |
| Shopify Polaris (web components) | Variants primary/secondary/tertiary; tone critical only "for destructive actions that are difficult or impossible to undo". Prefer `loading` over `disabled`. | shopify.dev/docs/api/app-home/polaris-web-components/actions/button |
| Stripe Apps | Types primary/secondary/destructive; sizes small/medium/large; "Avoid having more than one primary button"; secondary is the default. Colours/weight not stated. | docs.stripe.com/stripe-apps/components/button.md?app-sdk-version=9 |
| Radix Themes | Variants classic/solid/soft/surface/outline/ghost, sizes 1-3, `highContrast` option. Text colour on solid not documented. | radix-ui.com/themes/docs/components/button |
| Vercel Geist | Variants default/secondary/tertiary/error/warning, sizes tiny-large. No styling values published. | vercel.com/geist/button |
| Linear | Article only: contrast raised, text darker in light mode and lighter in dark mode, themes generated in LCH. No button specifics. | linear.app/now/how-we-redesigned-the-linear-ui |

NOT VERIFIED (pages did not load or are closed): Apple HIG, Notion, Figma, Linear's actual button CSS. I make no claim about them.

## 2. Pattern summary

Agree: one primary per group; destructive style reserved and usually confirmed; same size inside a group (Carbon); filled buttons have one foreground token; heights cluster 32/36/40; weight 400-500 in most (Carbon 400, HeroUI/shadcn 500).
Differ: Primer uses 600 and a border on primary; Primer shows danger outlined until hover; HeroUI/shadcn secondary is a light neutral with dark text.

Your constraints against the evidence:
- White text on every fill: SUPPORTED for primary/success/danger (Carbon, Primer, shadcn, HeroUI). CONTRADICTED as an industry norm for Secondary: every system I read gives neutral buttons dark text. A dark slate secondary with white text is workable (below) but is your own choice, not a convention.
- "Tint plus coloured text is generic": this is taste, not a finding. HeroUI and Radix both ship it; it is common, so avoiding it does differentiate. No evidence it is worse for usability.
- Regular/medium default: SUPPORTED (Carbon 400, HeroUI/shadcn 500). Semi-bold only for Danger: NO evidence any system does this; Primer is semibold everywhere. Variable weight changes label width, so it breaks equal-width pairs unless widths are fixed. Recommendation: 500 for all; 600 on Danger is optional and low risk if widths are fixed.
- No border on filled: SUPPORTED (HeroUI, shadcn, Carbon). Primer is the exception (translucent edge). Keep focus as an offset ring, not a rest border.
- Colour by meaning and equal-size pairs: Carbon supports equal sizing and 16px gap. I found no source documenting an approve/reject pair; the colour map is original design. Polaris/Atlassian support keeping red for irreversible actions only, so Request edit must not be red-adjacent: orange vs red at 4.87 vs 5.32 contrast is distinguishable by hue, but always pair with icon plus label (colour-blind safety).

## 3. Recommended spec

All labels white (#FFFFFF), weight 500, 14px, sentence case, no rest border, radius 10px (HeroUI default 3xl pill is the "generic" look; set `--radius` explicitly), `transition` 100ms colour, pressed `scale(.98)`. Ratios computed with WCAG 2.x relative luminance.

| Variant | Light fill | White text | Dark-theme fill | White text | Hover / pressed (both themes) |
|---|---|---|---|---|---|
| Primary | #00338D | 11.30 | #2563EB | 5.17 | one step darker: #002A75 / #1E56BE |
| Approve | #15803D | 5.02 | #1A7F3E | 5.06 | #126A33 / #166A34 |
| Request edit | #B45309 | 5.02 | #B85410 | 4.87 | #9A4507 / #9F450C |
| Secondary | #475569 | 7.58 | #4A5D78 | 6.71 | #3A4658 / #3F5170 |
| Danger | #C62828 | 5.62 | #C93030 | 5.32 | #A91F1F / #AE2626 |

All pass AA 4.5:1; none fail. Hover is deliberately darker in dark mode too, because lighter fills would drop below 4.5 against white (e.g. #198A44 = 4.41, #C2570C = 4.50).

Caveats:
- Brand #00338D on dark navy #0F2340 is 1.39:1, effectively invisible. Dark theme must use the lifted blue #2563EB (3.04 vs navy). Raise this with Ahmed: the brand colour cannot be the dark-mode primary fill.
- Fill vs surface, light #F4F6F9: green 4.63, orange 4.64, red 5.19, slate 7.0 (all above 3:1). Dark navy: green 3.11, orange 3.23, red 2.96, slate 2.34, blue 3.04. WCAG 1.4.11 is not triggered when the white label identifies the button, but slate and red read soft on navy; a 1px inner highlight is NOT allowed under your no-stroke rule, so accept this or raise the red to #D13438 (4.93 white, 3.19 navy).
- Light-theme hover step is darker; disabled below.

| Property | sm | md | lg |
|---|---|---|---|
| Height | 32 | 36 | 44 (40 desktop) |
| Padding X | 12 | 16 | 20 |
| Icon / gap | 16 / 6 | 16 / 8 | 20 / 8 |

States: focus-visible = 2px ring, 2px offset, colour #2563EB (light) / #93B4F8 (dark), never a fill change; disabled = fill at 40% opacity, text white 70%, cursor not-allowed, and a nearby reason (Polaris); loading replaces disabled for async (Polaris), label kept, spinner left. Pairs: same size token, `min-width: 120px` (or 1fr each), 12-16px gap (Carbon 16), primary action on the outer edge in LTR and mirrored in RTL.

## 4. Neutral Secondary working with white text on both surfaces

Slate #475569 (light, 7.58 with white, 7.0 vs #F4F6F9) and #4A5D78 (dark, 6.71 with white, 2.34 vs #0F2340). One token cannot be best on both: on navy the light-theme slate (#475569) is only 2.08 vs the surface, so use the lifted slate-blue above in dark. If a single value is mandatory, #52627A: white 6.20, light surface 5.73, navy 2.54.

## 5. Open questions for Ahmed
1. Accept a lifted blue for dark-mode Primary?
2. 600 weight on Danger only, or 500 everywhere?
3. Should Approve/Request edit also carry an icon (colour-blind safety)?
