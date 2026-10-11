# The Systronic: house identity + way of working (analysed by Lead, 2026-10-09)

Source: Ahmed's folder `D:\Work v2\Systronic Team\` (local, not in git). Ahmed: "the folder holds my whole way of working for The Systronic". Colours are measured from the files, and font names were read from the PSD text layers.

## Identity
- **Mark:** a lightning-bolt "S" in dark navy, with offset red and cyan edge strokes. Wordmark **THE SYSTRONIC** (heavy italic) + **BUSINESS SOLUTIONS** (spaced caps) + **I M A G I N E** (wide-spaced tagline).
- **Copied to** `assets/final/logo/`: `systronic_logo_white_transparent.png` (white, alpha 1080²), `systronic_logo_navy_on-white.png`, `systronic_mark_black.png` (mark only).
- **Colours (measured):**

  | role | colour | measured in |
  |---|---|---|
  | navy (text, logo) | **#181D36** | pp.png, WE ARE.png |
  | deep navy (dark backgrounds) | **#000627 → #000D3C** gradient | Artboard 1 |
  | red accent | **#E7213A** | Poster |
  | cyan accent | **#29BCEF** | Poster |
  | white | #FFFFFF | — |
  | light grey | — | large background bolt watermark on white pages |

  `palette.png` (coolors: 012964 / ECCE8E / DBCF96 / C2C6A7 / 9AC2C5) does not match any Systronic file, so it is probably a client palette. Not used.
- **Motif:** three dots (navy · cyan · red); a red bar beside headings; a big faint bolt watermark.
- **Fonts (from the PSDs):**
  - **Raleway** (Black Italic / Medium Italic / Light / Italic): profile and poster. Not installed on the PC.
  - **Poppins** (Black/Bold/SemiBold/Regular): canvases. Installed.
  - **29LT Bukra** (Bold): Arabic headings. Installed.
  - **Myriad Arabic / Myriad Pro**: Arabic/Latin body. Installed.

## Way of working: house document formats (FileSystem Assets)
One-page **canvases** with the logo top-left and a red-barred title:
- **Marketing Plan canvas:**
  1. Planned objectives (market research → brand positioning → pre-launch → launch …)
  2. Targeting strategy
  3. Channels (checkbox list)
  4. Tactics table (task | channels | type | status | deadline)
  5. Radial calendar by phase
  6. Reporting/monitoring

  Bottom row: target audience · user persona/need · competition · products/services · brand persona/image. Filled example: CarFyt (mobile app). Template: `Marketing Plan Asset.psd`.
- **Market Research canvas:** 1 problem/objective definition → 2 … (template).
- **Business Model Canvas** (Systronic-branded).
- **Paper:** company profile ("WE ARE…": a creative marketing firm, from concept to execution: branding, marketing strategies, growth hacking, business development); a Trademark Management & Distribution contract (AR) with privacy policy, contract terms and legal terms; an introduction letter; Fiverr gig covers.

## How TSST uses this
- **Every delivery page** (`TSST/services/README.md#delivery-page-standard`) uses this theme: navy, the red accent bar, cyan as a detail only, the bolt logo and the three-dot motif. Page chrome is **English** and set in **Poppins**. Arabic appears only in verbatim client content, set in that client's brand Arabic font.
  - **Banned on delivery pages** (Ahmed, 2026-10-09): 29LT Bukra / Myriad Arabic; rounded cards with a cyan top border, pill badges and timelines; any generic "AI template" look.
  - **Target:** an editorial studio handover at or above the level of the ANVIL pilot `11_PRODUCTION_V01/PREVIEW.html`.
- **SV-02/SV-03 deliverables** follow the house canvases as their one-page summary format (market research canvas, marketing plan canvas, BMC). Long documents expand them.

## UI palette (Ahmed, 2026-10-09): official for product UI
Royal Blue `#00338D` · Impact Red `#C60C30` · Legacy Blue `#002244` · Crisp White `#F2F3F3` · a Cyan matched to their saturation and mood (to be derived and confirmed); every other UI colour is derived from these. Charts, hover and active states use only this family. Decision: `TSST/brands/t-sag/projects/crm/redesign/DECISIONS.md` D-09. The logo files keep their measured colours (`#E7213A`, `#181D36`, `#29BCEF`) until Ahmed decides otherwise.

## Vector mark (Ahmed, 2026-10-09)
`assets/final/logo/systronic_mark_vector.svg` is the bolt mark as one clean polygon (viewBox 525.81×650.06). Ahmed exported it from the source as `D:\Work v2\Systronic Team\SVG\Asset 2.svg`; its export fill is `#e51c1c`. Use it for the product UI mark, the favicon and the watermark. Approved colourways: white, navy/Legacy Blue, and black, as in the existing PNG variants. The full logo (mark + wordmark) is still PNG only.
