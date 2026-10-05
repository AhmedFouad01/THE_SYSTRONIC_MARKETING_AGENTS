# Review: VILL Studio Strategy Baseline v0.1

| Severity | Section | Issue | Fix |
|---|---|---|---|
| MAJOR | §5 / SPARK | Historical media allocation treats non-channel dimensions (Geo 10%, Testing 10%) as channels without operational execution spec | Specify primary channel split (e.g. Search vs Meta) with geo & testing as campaign layers, not top-level budget buckets |
| MAJOR | §7 / SPARK | Unit economics model uses assumed whole-home contract (EGP 2.5M) while entry acquisition is kitchen-only | Explicitly disconnect kitchen media CAC targets from EGP 2.5M whole-home GP until kitchen contract size is baselined |
| MAJOR | §3 / CREATIVE | Transition mechanism from kitchen ad to whole-home landing page risks visual & positioning dissonance | Define clear creative containment: kitchen entry ads must retain whole-home studio branding, cues, and typography |
| MINOR | §6 / SPARK | CRM stages lack a distinct "Deposit Pending" buffer between Contract Signed and Deposit Received | Add explicit payment clearance window stage to avoid miscounting signed commitments as cash-ready execution |
| MINOR | §4 / CREATIVE | Content pillars lack concrete asset formats (Reels, carousels, stills) tailored to design/fit-out proof | Map each of the 6 pillars to 2-3 specific visual asset formats (e.g., site logs to carousel, details to macro photo) |
| MINOR | §6 / SPARK | Event map lists `service_view` without distinguishing high-intent kitchen assessment page from generic blog/info | Split into `view_service_kitchen` and `view_service_whole_home` with separate conversion weighting |
| INFO | §1 / Citations | FACT citation format uses informal S1-S6 keys rather than direct canonical file names | Retain file path references alongside shorthand keys for provenance verification |
| INFO | §2 / CREATIVE | Message hierarchy claims lack tone-of-voice descriptors for design studio authority | Add 3-4 tone keywords (e.g. restrained, architectural, precise) to guide copywriters and designers |

## FACT Verification Table

| FACT in v0.1 (Section & Claim) | Cited Source | Status | Source Evidence (Quote ≤15 words) |
|---|---|---|---|
| §1 Brand frame: premium interior design / fit-out; look pending; New Cairo & Zayed | S1, S2 §2, S3 | Verified | "premium interior design / fit-out / execution brand... Brand Look are still being finalized" [S1] |
| §1 Scope instruction: whole-scope content; kitchen-first acquisition only | B, S4 ADR-003 | Verified | "company scope = full interior design / fit-out. Content strategy covers the whole scope." [B] |
| §1 Evidence limit: strategy exists; no live web, CRM, campaigns; 2 uninspected PDFs | S2 §1, §13, §17, S3, S6 | Verified | "No source currently proves that the full 8-week launch system, CRM... have already been implemented." [S2 §1] |
| §1 Milestone gate: requires strategic baseline + operating numbers before completion | S5 | Verified | "Do not mark VILL-001 complete until the strategic baseline and real operating numbers... approved" [S5] |
| §2 Working pillars: design intelligence, execution control, transparency, detail, accountability | S1, S2 §3 | Verified | "Design Intelligence, Execution Control, Transparency, Detail, Accountability" [S2 §3] |
| §3 Stored proposal: three kitchen packages, 4-6 design families, clear material matrix | S2 §5 | Verified | "Three kitchen packages, Four to six signature design families, Clear material matrix" [S2 §5] |

Review completed by SPARK + CREATIVE (Gemini). Baseline v0.1 citations verified against canonical .md files.
