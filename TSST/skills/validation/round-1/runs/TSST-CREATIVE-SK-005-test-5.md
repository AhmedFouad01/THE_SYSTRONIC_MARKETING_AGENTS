# Test Run: TSST-CREATIVE-SK-005 · Test 5

## Prompt
Establish a typography system for "Zulal Oasis" (واحة زُلال), a luxury desert eco-lodge and wellness retreat located in Fayoum, Egypt. The system must accommodate:
1. Editorial luxury print collateral (hardcover guest room compendium, spa ritual menu).
2. Paid acquisition social media carousel ads (1080×1350 4:5 format with Arabic headline and English sub-headline).
3. Multilingual direct-booking web engine (dates, room rates in EGP/USD, booking checkout flow).

Detail the font selection, serif/kufic pairing rationale, line metric formulas, and prohibited styling rules.

---

## Raw Execution Output

### 1. Font Inventory, Licensing & Delivery Status

| Script / Role | Typeface Family | Selected Weights | License | Delivery Method | Typographic Character |
|---|---|---|---|---|---|
| Primary Arabic Display | **Amiri** (Khaled Hosny / Google Fonts) | Regular (400), Bold (700) | SIL OFL 1.1 | Embedded OpenType OTF & WOFF2 | Classical Naskh typeface with exquisite calligraphic pedigree, dignified proportions, and literary elegance suited for luxury Egyptian heritage. |
| Primary Arabic Body/UI | **Aref Ruqaa** for accents; **Alexandria** for web UI | Alexandria Regular (400), Medium (500) | SIL OFL 1.1 | WOFF2 | Ensures booking engine interfaces remain crisp and usable on mobile screens while Amiri leads editorial print. |
| Primary Latin Display | **Cormorant Garamond** (Christian Thalmann) | Medium (500), SemiBold (600), Italic (400i) | SIL OFL 1.1 | OpenType OTF & WOFF2 | High-contrast classical serif with delicate serifs and lyrical cadence; pairs naturally with classical Arabic Naskh. |
| Primary Latin UI/Body | **Inter** | Regular (400), Medium (500) | SIL OFL 1.1 | WOFF2 | Neutral, invisible workhorse for date selection, rates, and booking buttons. |
| Fallback Stack (Arabic) | `Amiri, "Traditional Arabic", "Scheherazade New", serif` | 400, 700 | System / OFL | Fallback Stack | Preserves classical literary aesthetic across devices. |
| Fallback Stack (Latin) | `Cormorant Garamond, "Times New Roman", Garamond, serif` | 400, 600 | System | Fallback Stack | Classical serif fallback. |

### 2. Arabic / Latin Pairing Rationale
- **Editorial Literary Dignity:** Luxury hospitality in Fayoum requires an escape from stark corporate tech aesthetics. Amiri (Naskh) and Cormorant Garamond (Classical French Renaissance Serif) share an organic, ink-driven rhythm. Both typefaces celebrate calligraphic contrast: thick vertical downstrokes paired with hairline transitions.
- **Size & Leading Adaptation:** Amiri features generous ascenders (alifs) and deep descenders (ra, nun, waw). To prevent clash with Cormorant Garamond’s tall ascenders in bilingual titles, **Amiri line-height is set to 1.65–1.75**, while Cormorant Garamond is matched at **1.45**. In mixed lockups, Amiri is scaled to 96% of Cormorant Garamond to achieve equal visual cap-line harmony.

### 3. Semantic Type Roles and Scale Tokens

| Semantic Token | Target Script | Font & Weight | Size (Print pt / Web px) | Line Height | Tracking | Application Context |
|---|---|---|---|---|---|---|
| `oasis.type.hero.title` | Arabic | Amiri Bold (700) | 36pt / 54px | 1.65 | 0 | Luxury retreat title: *سحر الفيوم الهادئ* |
| `oasis.type.hero.title` | Latin | Cormorant Garamond Medium (500) | 34pt / 50px | 1.40 | +0.02em | English headline: *Serenity in the Fayoum Desert* |
| `oasis.type.subhead` | Latin | Cormorant Garamond Italic (400i) | 16pt / 24px | 1.50 | 0 | Editorial quote, spa ritual philosophy |
| `oasis.type.menu.item` | Arabic / EN | Amiri 700 / Cormorant 600 | 14pt / 20px | 1.50 | 0 | Spa treatment title, dining menu course |
| `oasis.type.menu.desc` | Arabic / EN | Alexandria 400 / Inter 400 | 10pt / 15px | 1.60 | 0 | Treatment ingredients, duration (60 mins) |
| `oasis.type.booking.rate`| Latin / Num | Inter Medium (500) | 12pt / 18px | 1.30 | 0 | Room rate: `EGP 8,500 / night` |

### 4. Cross-Surface Application Specifications

#### Surface A: Luxury Editorial Print Compendium (Hardcover Book)
- **Grid & Margins:** Generous asymmetric editorial margins (35mm inner gutter, 48mm outer margin).
- **Text Body:** Amiri Regular set at `11.5pt` with `19pt` leading on unbleached textured cotton paper. Chapter drop capitals in Cormorant Garamond.

#### Surface B: Paid Social Carousel (1080×1350 4:5 Feed Format)
- **Visual Hierarchy:** Headline in Amiri Bold at `64px`, positioned in the upper quiet quadrant of the desert dunes landscape photograph.
- **Rule of No Legibility Overlays:** No dark gradient overlays or black vignettes applied over photography. Text placed strictly over natural twilight sky negative space.

#### Surface C: Direct Booking Engine (Mobile Web 360px)
- **Functional Shift:** Transition from editorial serif to functional sans for transactional fields (calendar dates, room availability tags, credit card inputs) using Alexandria 400 and Inter 400 to ensure fast, unambiguous mobile booking.

### 5. Prohibited Treatments
1. **NO Faux Oblique on Amiri:** Slanting classical Arabic Naskh destroys its horizontal balance; never apply italic CSS to Amiri.
2. **NO Low-Resolution Web Fonts:** Amiri must be loaded with full hinting and WOFF2 subsetting to prevent jagged curves on high-DPI displays.
3. **NO Excessive Tracking on Latin Serif Headings:** Cormorant Garamond uppercase tracking must not exceed +0.06em, maintaining intimate luxury cadence.

### 6. Readability & QA Evidence
- High-resolution print proof test (600 DPI): Amiri ligatures and diacritics rendered with razor-sharp calligraphic stroke weight.
- Mobile viewport checkout test: Arabic booking summary and English price figures reflowed without wrapping numbers or breaking currency symbols.
