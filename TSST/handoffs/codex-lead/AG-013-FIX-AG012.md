# AG-013 — Fix AG-012 review findings (Antigravity, 1 commit)

TEAM: build · AGENT: tsst-dev · SKILLS: TSST-DEV-SK-003 · TIER: CODE · Model: Gemini Pro · high
Read only: the files named below. Reply in 3 lines.

1. `AG-012-PROBE.md`: skills TSST-LENS-SK-011/012/013 and their folder paths do not exist under `TSST/LENS/skills/`. Run `python TSST/skills/build_index.py --team marketing` and use only real IDs/paths. Then actually run the sample task (3 ANVIL creatine-week captions) and append the output + which files were really opened. A probe is a run, not a description.
2. `GEMINI.md` (116 lines): the old body is still there. Make it a pointer only (≤10 lines: banner + boot chain). Remove the old "CONTROLLED PILOT / UNVALIDATED" body and the "CREATIVE does motion/video" text (Motion AG owns video, ADR-005).
3. Naming: use ADR-007 only. Fix `adapters/gemini.md` heading ("ADR-005/007" → "ADR-007"). ADR-007 line "the Lead approves" → "Ahmed approves".
4. `bus/runtimes.yaml#gemini`: set `status: pilot` and `verified:` empty until fix 1 passes; then restore.
5. `rules.md` §4: change the line to say "Gemini app, ChatGPT… = ROLE B (Antigravity = ROLE A, ADR-007)".
6. Do not touch R54 or other files. Commit: `fix(tsst): AG-012 review fixes`.
