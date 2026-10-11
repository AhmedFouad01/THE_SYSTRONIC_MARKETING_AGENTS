# YAKEBDA MS — Real Memory Google Docs → Markdown

**Export date:** 2026-10-08  
**Project:** `YAKEBDA_MS`  
**Source files:** 69 native Google Docs  
**Output files:** 69 `.md` files

## What's included

- `markdown/`: 69 separate Markdown files, one per Google Doc.
- `INDEX.md`: topic-based links to all converted files.
- `MANIFEST.csv`: source-group, original Drive folder, classification, byte count, SHA-256.
- `SHA256SUMS.txt`: checksums of the normalized Markdown outputs.

## Source folders

- Main YAKEBDA MS memory (57): https://drive.google.com/drive/folders/1G0YuMANM3jpX7vMUyxex4w2WMT-toAe2
- Audit remediation (8): https://drive.google.com/drive/folders/1iXefTrET2bMGaVeqJH7S9mTLEkBg-ZKs
- Engineering (1): https://drive.google.com/drive/folders/1fUaJW_LJVzH_j_ziMzd951GzsnVrsr-S
- Project memory (2): https://drive.google.com/drive/folders/1C2VSbmXbyJsiEvAGtI5Y02m_MD5IA2sL
- Project timeline (1): https://drive.google.com/drive/folders/1exzLT-o7-Cwe8pwA-jbV9X757m09NMrb

## Drive copies

Exported Markdown files are also saved, separately from the originals, here:

https://drive.google.com/drive/folders/1f4SGcAwVsk2OeN_-lcah9vbS59DObZ9n

## Conversion method

Docs were exported as **plain UTF-8 text** and saved as `.md` because the Google Docs
`text/markdown` export escaped literal Markdown markup (`#`, `_`, backticks) present in
these documents. The export keeps the author's literal Markdown syntax instead of
the escaped rendering. Only UTF-8 BOM and line ending normalization were applied
to local archive copies; no summarization or factual rewriting was performed.

This is a **text-only archival conversion**. Embedded images, Google Docs comments,
suggestions, links carried only as rich-text annotations, and rich styling might not
survive. Historic PR/SHA/CI statements are preserved as written and have **not**
been rechecked against GitHub.

Pre-existing `.md` / `text/markdown` / `text/plain` files in Real Memory were **not**
duplicated in this archive. The scope is conversion of the **69 native Google Docs**
found in the YAKEBDA MS Real Memory areas.
