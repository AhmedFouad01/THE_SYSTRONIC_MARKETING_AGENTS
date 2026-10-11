# TSST Service Catalogue (Lead-owned) · v0.1 SKELETON · 2026-10-08

User direction 2026-10-08: the Lead must know every service we sell and move the whole team through a fast, clean, high-quality workflow for each one. The team has to know how to produce, decide, fix its own mistakes and pick the right thing from the start. The marketing department comes first, because two clients are waiting: **VILL Studio** (next: social media setup) and **ANVIL SUPPS** (next: campaigns). Software and app development will be covered in a later phase.

Status: SKELETON. Each playbook gets filled in from research (`gemini/GEM-SV-*`) plus team drafts, then tested on a real client job. One job = one deliverable + one lesson back into the playbook and skills (as in TSD-019/021).

## Services

| ID | Service | Variants | Main teams | Playbook |
|---|---|---|---|---|
| SV-01 | Visual identity | new from scratch / rebrand (fix a weak logo or colours) | CREATIVE (+ LENS for brand personality and voice) | [SV-01](SV-01_visual-identity.md) |
| SV-02 | Market research | quick scan / full study | LENS | [SV-02](SV-02_market-research.md) |
| SV-03 | Marketing plan | short-term / long-term | LENS lead, SPARK (funnel + paid), Lead (approach and results) | [SV-03](SV-03_marketing-plan.md) |
| SV-04 | Content strategy + content plan | strategy / monthly plan | LENS, CREATIVE (formats), SPARK (what gets boosted) | [SV-04](SV-04_content-strategy.md) |
| SV-05 | Campaigns | inside the content plan / standalone | SPARK lead, LENS (message), CREATIVE (assets) | [SV-05](SV-05_campaigns.md) |
| SV-06 | Website + e-commerce | WordPress / Shopify, design + build, store management | DEV, CREATIVE (UX/UI), LENS (copy/CRO), SPARK (tracking) | [SV-06](SV-06_website-ecommerce.md) |
| later | Software / apps | — | DEV | not in this phase |

**Order between services.** Research (SV-02) comes before the plan (SV-03). The plan comes before content (SV-04), and content comes before campaigns (SV-05). Identity (SV-01) runs from the start, in parallel. The website (SV-06) needs SV-01, and needs SV-03 for its goals and tracking. A client can buy one service on its own; the playbook then lists the minimum inputs it needs from the missing upstream services.

## How the Lead runs any service (orchestration)

1. **Service intake.** Read the playbook, ask its blocking intake questions, and confirm the variant. No team starts work before the intake is answered. This is how we choose the right thing from the start.
2. **Job plan.** Copy the playbook stages into the job's plan file in `TSST/brands/<id>/projects/<job>/` (R18; layout and content file names: [delivery/JOB_LAYOUT.md](delivery/JOB_LAYOUT.md)), with owners, skills, client gates and dates. Present the cost and get a go per round (R11–R14, one track at a time).
3. **Dispatch in order.** LENS (story/message) → SPARK (formats/funnel/measurement) → CREATIVE (production). DEV works on the web track. Every dispatch carries a Skill Plan (team + skill IDs). Run teams in parallel only when their questions do not overlap.
4. **Client gates.** Stop at each gate the playbook marks. The client's approval is recorded in `03_DECISIONS.md`.
5. **QA before showing the client.** Run the playbook's quality gates, plus the team gates (e.g. CREATIVE FINAL_ASSET_GATE). The Lead opens the real output; it never approves from the report alone.
6. **Fix loop.** On rejection, write down the measured cause, then fix it. A stage gets at most 3 rounds; after that the best version goes to the user to decide. The owner may accept below a numeric gate.
7. **Lesson.** Every job ends with a lesson written into the playbook and/or skills (R9 version + changelog). Real Memory is synced when the user asks.

## Delivery page standard (user direction 2026-10-09)
Every job is shown to the user as **one HTML delivery page that lives in the job folder** (`<job>/DELIVERY.html`), and the Lead sends that link. The model is the ANVIL pilot `11_PRODUCTION_V01/PREVIEW.html`: organised, explains everything, previews images and videos inline. The changes:
- **The Systronic theme for every client**, never the client's brand theme (the client's work shows inside it).
- **A status dot on every item:** 🟢 approved · 🟡 in review · ⚪ draft · 🔴 rejected, plus the decision date and who decided.
- The explanation is part of the page: what this is, the decisions, the texts to paste and the checks, in organised sections. Bilingual v1.0 (EN | ع switch, one file), see `delivery/README.md`.
- Built from a small manifest (`<job>/DELIVERY.json`) by one shared generator, so every job looks the same and the page updates when a status changes.

## Playbook template (each SV file)
What it is · variants · client deliverables (format) · blocking intake questions · stages table (stage | owner | skills | output | client gate) · quality gates · dependencies · common mistakes · skill gaps · research sources · lessons log.
