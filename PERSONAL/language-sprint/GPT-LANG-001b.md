# GPT-LANG-001b · Fix round for English booklet (same ChatGPT chat)
Claude review of English_7Day_Booklet.pdf (27 pages, 2026-10-16): design base good (cover, day headers, word tables, script/prompt boxes, survival sheet). Missing parts + text-direction bugs below.

---
Fix the English booklet and resend the full PDF. Keep the current design — it's good. Fix ONLY these:

1. MISSING SECTIONS (were required):
   a. Day 15 (English half): its 10 [EN] golden phrases table, the English video (pFXooKFoaNw, 10:00–19:28), English listening, the bilingual speaking script + AI prompt, and the English parts of the final test + answers. Put it after Day 7 as "اليوم 8 · مراجعة نهائية".
   b. A real Table of Contents PAGE (page 3) with page numbers, clickable.
   c. Progress tracker page: table 8 rows (Day 1–7 + review) × 6 columns (كلمات · فيديو · استماع · تحدث · اختبار · Anki) with empty tick boxes.
   d. Anki plan table (rows for days 1–7) + 3 lines how to import agency_study_cards.csv.
2. TEXT DIRECTION BUG: English sentences inside Arabic (RTL) lines show punctuation on the wrong side (".We specialize in...", "?Sorry to interrupt", "!It's a pleasure"). Every English or French sentence must be its own LTR run (wrap it in <span dir="ltr"> / unicode isolate) so the period/question mark stays at its end. Applies to the answer key AND quiz items. English-only answer lines should be left-aligned.
3. Quizzes: add a blank writing line under each question.
4. Avoid near-empty pages: let the quiz start right after the speaking section when it fits; don't start a new page for each section — only each DAY starts on a new page.
5. Self-check again by rendering pages: ToC, tracker, one Day page, Day 15 page, answer key page — confirm no punctuation on the wrong side.

Then build the French booklet with the SAME design and all the same sections (Day 8–14 renumbered 1–7 + French half of Day 15 + French survival sheet + French answers + Anki rows), applying all fixes above from the start.
---
