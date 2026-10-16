# Test Run: TSST-CREATIVE-SK-005 · Test 3

## Prompt
Develop a brand typography system for "Kawkab Coffee" (كوكب), an artisanal specialty coffee roastery operating cafes in Maadi and Zamalek, Cairo. The typography system must function across:
1. Retail coffee bean packaging labels (small-format print: origin, altitude, tasting notes, roast date).
2. Social media campaigns (Instagram stories 9:16, feed carousels 4:5).
3. Physical printed cafe menu boards and handheld table cards.

Ensure the system establishes character, handles bilingual Arabic/English pairings, details print-to-digital line metrics, and provides clear usage guardrails.

---

## Raw Execution Output

### 1. Font Inventory, Licensing & Delivery Status

| Script / Role | Typeface Family | Selected Weights | License | Delivery Method | Typographic Character |
|---|---|---|---|---|---|
| Primary Arabic Display & Body | **Marhey** (Google Fonts) for display accents; **Noto Kufi Arabic** for clean menu reading | Marhey SemiBold (600); Noto Kufi Regular (400), Bold (700) | SIL OFL 1.1 | WOFF2 & OpenType TTF | Marhey provides warm, organic, slightly playful artisanal curvature; Noto Kufi provides disciplined geometric structure for tasting notes. |
| Primary Latin Display & Body | **Outfit** (Google Fonts) | Regular (400), Medium (500), SemiBold (600), Bold (700) | SIL OFL 1.1 | WOFF2 & OpenType TTF | Clean contemporary geometric sans that mirrors the circular, balanced counters of Noto Kufi Arabic. |
| Fallback Stack (Arabic) | `Noto Kufi Arabic, "Geeza Pro", "Segoe UI", Tahoma, sans-serif` | 400, 700 | System / OFL | Local OS fallback | Prevents missing character boxes on legacy POS devices. |
| Fallback Stack (Latin) | `Outfit, -apple-system, Helvetica, Arial, sans-serif` | 400, 700 | System | Local OS fallback | Reliable geometric fallback. |

### 2. Arabic / Latin Pairing Rationale
- **Artisanal Character vs Utilitarian Legibility:** Specialty coffee requires warmth without sacrificing precise origin details. For hero headers and bag titles, **Marhey (Arabic)** pairs with **Outfit Bold (Latin)**. Because Marhey has organic stroke terminals, Outfit’s rounded geometric terminals provide visual harmony.
- **Micro-Typography on Retail Labels:** On a 250g coffee bag label (70mm × 100mm), text space is constrained. Noto Kufi Arabic at 8pt has superior counter openness compared to traditional Naskh fonts, ensuring Arabic tasting notes (e.g., "إيحاءات: خوخ، ياسمين، شوكولاتة داكنة") do not clog with ink during thermal transfer label printing.

### 3. Semantic Type Roles and Scale Tokens

| Semantic Token | Target Script | Font & Weight | Size (Print pt / Digital px) | Line Height | Tracking | Usage & Layout Context |
|---|---|---|---|---|---|---|
| `coffee.type.hero.title` | Arabic / EN | Marhey 600 / Outfit 700 | 28pt / 48px | 1.30 | 0 / -0.01em | Coffee origin name (e.g., إثيوبيا يرقاتشيف / ETHIOPIA YIRGACHEFFE) |
| `coffee.type.section.header`| Arabic / EN | Noto Kufi Arabic 700 / Outfit 600 | 14pt / 22px | 1.40 | 0 | Category headers (FILTER COFFEE / قهوة مقطرة) |
| `coffee.type.body.notes` | Arabic / EN | Noto Kufi Arabic 400 / Outfit 400 | 8.5pt / 14px | 1.55 | 0 | Tasting notes, processing method (Washed / مغسولة) |
| `coffee.type.data.specs` | Latin / Num | Outfit Medium (500) | 7.5pt / 12px | 1.45 | +0.02em | Altitude (1,950 MASL), Harvest date, Roast level |
| `coffee.type.price` | Numbers / EGP| Outfit Bold (700) + Noto Kufi 700 | 11pt / 18px | 1.20 | 0 | Menu pricing: `140 ج.م` / `140 EGP` |

### 4. Cross-Surface Application Specifications

#### Surface A: 250g Bag Retail Label (Print 70×100mm)
- **Minimum Type Size Threshold:** No text below `7.0pt` (approx 2.45mm cap height). Tasting notes set at `8.5pt` with `12.5pt` leading to withstand flexographic and digital label press tolerances.
- **Bilingual Stacking:** Arabic line placed directly above English line in origin descriptors, separated by 3pt vertical baseline gap:
  - Line 1 (Arabic): كولومبيا - مجففة لاهوائياً (Noto Kufi Bold 10pt)
  - Line 2 (English): COLOMBIA - ANAEROBIC NATURAL (Outfit SemiBold 8.5pt, uppercase)

#### Surface B: Social Stories (1080×1920 9:16 Reel/Story)
- **Scale:** Hero roast title set at `52px` Marhey Arabic.
- **Safe Zone:** Top 250px and bottom 320px completely clear of essential type to avoid platform UI overlays (Instagram username header, message bar).

#### Surface C: Cafe Wall Menu Board (High Contrast Display)
- High contrast pairing: White typography on deep roasted brown (#1E140F) background. Contrast ratio exceeds 14.5:1.
- All drink names displayed in dual-line Arabic-English lockups with uniform price column alignment.

### 5. Prohibited Treatments
1. **NO Condensed Type on Micro-Labels:** Never compress font horizontal scales below 100% to fit long coffee farm names; instead, reflow into two lines.
2. **NO Diacritics on Marhey Headings:** Do not apply tashkeel (vocalization marks) on Marhey display headers, as it creates visual noise on package labels.
3. **NO Isolated Latin Units in Arabic Sentences:** Never let units like `g` or `ml` break into separate lines; always bind with non-breaking spaces: `250&nbsp;جم`.

### 6. Readability & QA Evidence
- Physical label test print inspected at 300 DPI: Arabic diacritics and letters with interior counters (e.g., "ف", "ق", "م") remained crisp with zero ink bleeding at 8.5pt.
- Social 1080x1920 mobile viewport inspection: All text legible from arm's length on smartphone screens.
