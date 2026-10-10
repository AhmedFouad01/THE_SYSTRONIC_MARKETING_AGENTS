# VILL raw bank fix 01: ticket for Antigravity

Owner OK (Ahmed, 2026-10-10). Small fix on top of VILL_RAW_BANK_CATALOG (done; owner liked BANK.html). Estimate: about 10 minutes.

**Antigravity prompt (ROLE B, external tool; file work only):**
```
ROLE B — external tool. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Do not commit or push.
Folder: TSST/brands/vill-studio/assets/source/portfolio/   (photos read only — never move/rename/edit them)
Python: C:\Users\10\tsst-tools\clip-venv\Scripts\python.exe. Reuse _work/embeddings.npy; do not recompute.
Keep BANK.html's current look exactly (owner approved it). Change only what is listed.

Fix 1 — stage: remove "showroom". Re-tag those rows with the remaining stages only:
  workshop/raw frame, under installation, finished/handover. Update _catalog/tag_prompts.py, CATALOG.csv,
  catalog data used by BANK.html, and STUDIO_PICKS.md text if it mentions showroom.

Fix 2 — hide _review by default in BANK.html: add a styled toggle "Show review items" (off by default).
  The counter shows the visible count. search.py: skip _review unless --include-review.

Fix 3 — near-twin shots: group photos that are near-identical takes (same folder, taken ≤ 2 minutes apart AND
  embedding cosine ≥ 0.93). Per group show ONE card (highest ai_score) with a small badge "+N similar";
  clicking the badge/inspector shows the others. Add column twin_group to CATALOG.csv (blank if none).
  STUDIO_PICKS.md: max one photo per twin group. Do not delete or move any file.

Check: open BANK.html offline; default view hides _review and twins; toggle brings _review back;
  filters/search/sort still work; no browser-native unstyled controls.
Report: TSST/handoffs/VILL_RAW_BANK_FIX_01_report.md — stage counts after fix, number of twin groups and
  hidden cards, visible card count by default, one screenshot path of the new default view.
```

## Lead review checklist (on return)
- No "showroom" anywhere; stage counts add up to 1,530.
- Default card count = 1,530 − review − hidden twins; the gold armchair pair shows as one card "+1 similar".
- Look unchanged except the toggle and badge.
