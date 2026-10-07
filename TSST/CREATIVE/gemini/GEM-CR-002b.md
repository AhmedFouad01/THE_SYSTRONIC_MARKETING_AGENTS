GEMINI REQUEST GEM-CR-002b · TSST (team-level, no brand) · CREATIVE capability · follow-up to GEM-CR-002 · from Lead · 2026-10-08
(Send in the SAME Gemini chat as GEM-CR-002.)

ROLE:         EXTERNAL TOOL — research. Not a TSST agent; no TSST roles, teams, skills or boot.
              WRITE: only TSST/CREATIVE/gemini/GEM-CR-002_out_fix.md (or reply with text only).
              DO NOT: edit, move or delete any other file; create bus tasks; commit.
OBJECTIVE:    Fix the gaps the Lead found in GEM-CR-002_out.md (dates, unconfirmed claims, unsourced AE/Motion values).
WHY:          Lead review 2026-10-08: all source dates were today's date; no "not confirmed" anywhere; AE influence % unsourced; Motion "easeIn" wrongly mapped to Quad.
PROMPT:
  Follow-up on GEM-CR-002 (same role: EXTERNAL TOOL — research, write only GEM-CR-002_out_fix.md):
  1. Sources: for each source, give the page's own "last updated" date if shown, otherwise write "no date shown". Do not use today's date.
  2. Part 5 plugins and Part 3 licences: re-check each price, licence and "maintained?" claim on the official page. For each one write CONFIRMED (URL) or NOT CONFIRMED. Include GSAP free licence terms (any restrictions?) and Remotion company licence thresholds.
  3. Part 2, After Effects column: the "influence %" values have no source. Either cite a source that maps cubic-bezier to AE keyframe influence, or write "not documented".
  4. Part 2, Motion column: give Motion's documented values for "easeIn", "easeOut", "easeInOut", "backIn", "backOut" (cubic-bezier) from motion.dev, with URL.
  Output: only the corrected rows/tables, not the whole document.
OUTPUT:       GEM-CR-002_out_fix.md beside this file.
ACCEPTANCE:   CREATIVE merges the fixes into its distillation of GEM-CR-002_out.md; anything still NOT CONFIRMED stays marked in ref/.
