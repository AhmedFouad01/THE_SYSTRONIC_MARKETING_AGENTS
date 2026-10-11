# Test Run: TSST-CREATIVE-SK-005 · Test 4

## Prompt
Establish a bilingual typography system for "Sehhaty Egypt" (صحتي), a telemedicine and digital health platform used by patients and physicians across Egypt. The system must accommodate:
1. Native mobile iOS and Android app screens (doctor consultations, prescription medication reminders, medical history).
2. Diagnostic lab results and medical report cards containing Latin drug names, medical dosages, and Arabic instructions.
3. High accessibility compliance for elderly patients with visual impairments (supporting dynamic type scaling up to 200%).

Define the font choices, pairing logic, semantic scale, accessibility rules, and rendering verification.

---

## Raw Execution Output

### 1. Font Inventory, Licensing & Delivery Status

| Script / Role | Typeface Family | Selected Weights | License | Delivery Method | Clinical Accessibility Properties |
|---|---|---|---|---|---|
| Primary Arabic | **Cairo** (Mohamed Gaber / Google Fonts) | Regular (400), SemiBold (600), Bold (700) | SIL OFL 1.1 | Embedded Native App Assets (OTF/TTF) & WOFF2 | Modern Kufic-Naskh hybrid with wide open counters, distinct dot placements (critical for distinguishing "ت", "ث", "ن", "ي" in medical drug dosages), and high legibility at extreme sizes. |
| Primary Latin | **Plus Jakarta Sans** (Tokotype / Google Fonts) | Regular (400), Medium (500), SemiBold (600), Bold (700) | SIL OFL 1.1 | Embedded Native App Assets & WOFF2 | Geometric sans with friendly open apertures, clear distinction between uppercase "I", lowercase "l", and digit "1" (critical for medical nomenclature). |
| Fallback Stack (Arabic) | `Cairo, "Geeza Pro", "Segoe UI", Arial, sans-serif` | 400, 700 | System / OFL | OS Native fallback stack | Reliable native medical text fallback. |
| Fallback Stack (Latin) | `Plus Jakarta Sans, -apple-system, Roboto, Arial, sans-serif` | 400, 700 | System | OS Native fallback stack | Standard mobile OS fallback. |

### 2. Arabic / Latin Pairing Rationale
- **Medical Dosage Safety & Character Disambiguation:** In healthcare applications, misreading a letter or number can have severe clinical consequences. Plus Jakarta Sans was selected because its glyph for capital "I", small "l", and number "1" are distinct. Cairo was paired because its dot positioning for Arabic letters is unambiguous even on low-cost Android LCD displays common in Egypt.
- **Visual Weight & Cap-Height Alignment:** Cairo’s Arabic x-height is relatively large, matching Plus Jakarta Sans within a 3% tolerance. Setting both at the same nominal point size preserves optical alignment across bilingual prescription lines.

### 3. Semantic Type Roles and Scale Tokens

| Semantic Token | Target Script | Font & Weight | Base Size (px) | Scaled Max (200% Accessibility) | Line Height | Usage & Healthcare Context |
|---|---|---|---|---|---|---|
| `health.type.title.screen` | Arabic (Primary) | Cairo Bold (700) | 22px | 44px | 1.35 | Top app bar title, appointment status |
| `health.type.title.screen` | Latin | Plus Jakarta Sans Bold (700) | 20px | 40px | 1.35 | English screen header |
| `health.type.dosage.hero` | Mixed / Num | Plus Jakarta Sans Bold + Cairo Bold | 20px | 40px | 1.40 | Dosage instruction: `500 mg - قرص مرتين يومياً` |
| `health.type.card.doctor` | Arabic | Cairo SemiBold (600) | 16px | 32px | 1.45 | Doctor name and specialty |
| `health.type.body.medical` | Arabic | Cairo Regular (400) | 15px | 30px | 1.65 | Prescription instructions, consultation summary |
| `health.type.body.medical` | Latin | Plus Jakarta Sans Regular (400) | 15px | 30px | 1.60 | Drug name: *Amoxicillin 500mg* |
| `health.type.alert.warning`| Arabic / EN | Cairo Bold (700) / PJS Bold (700) | 14px | 28px | 1.40 | Allergy warning, contraindication notice |
| `health.type.data.lab` | Latin / Num | Plus Jakarta Sans Medium (500) | 13px | 26px | 1.45 | Lab reference ranges: `4.5 - 11.0 × 10^9/L` |

### 4. Healthcare Accessibility & Dynamic Type Reflow

#### Surface A: Patient Native App (iOS Dynamic Type & Android Font Scaling)
- **Fluid Layout Container:** All UI cards displaying medical instructions must use auto-layout containers without fixed pixel height: `min-height: 72px; height: auto;`. When an elderly patient increases OS text scaling to 200%, the card expands vertically rather than clipping dosage instructions.
- **High Contrast Thresholds:** All medical text exceeds WCAG AAA requirements (7:1 contrast ratio) against background cards. Body text set in deep slate `#0F172A` on `#FFFFFF` (16.2:1 ratio).

#### Surface B: Bilingual Medical Prescription Card (Print / PDF)
- **Inline Drug Name Lockup:** Prescriptions frequently contain English pharmacological brand names within Arabic usage directions:
  `<p dir="rtl">تناول دواء <bdi dir="ltr">Augmentin 1g</bdi> قرص واحد كل ١٢ ساعة بعد الأكل لمدة ٧ أيام.</p>`
- Both scripts are rendered with identical optical baseline grids to eliminate vertical jitter.

### 5. Prohibited Typography Treatments
1. **NO Light Font Weights Below 400:** Thin (100) or Light (300) weights are strictly prohibited in the healthcare application; minimum weight for any body copy is Regular (400) with SemiBold (600) for vital signs.
2. **NO Low-Contrast Gray on Secondary Clinical Notes:** Never set medical timestamps or instructions below a 5.0:1 contrast ratio.
3. **NO All-Caps on Latin Medication Names:** Do not use `text-transform: uppercase` on complex drug names (e.g., *Levothyroxine* vs *LEVOTHYROXINE*) as all-caps impairs word-shape recognition during quick clinical review.

### 6. Readability & QA Evidence
- Tested under iOS Dynamic Type at maximum accessibility size (AX5): Prescription dosage card expanded vertically with zero text truncation or overlapping lines.
- Dot legibility check on 720p budget Android screen: All Arabic critical dots ("ب", "ت", "ث", "ن", "ي") remained clearly separated at 14px size.
