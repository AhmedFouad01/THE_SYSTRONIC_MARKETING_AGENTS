# HANDOFF · ANVIL Lead → Codex (2026-10-10)
ROLE A — Lead session (Codex = Lead for ANVIL, owner decision 2026-10-10). Follow AGENTS.md → TSST/context/boot.md. Team work only via `.codex/agents/tsst-*` with a Skill Plan.

**Git:** the working tree is on branch `anvil/campaign-01-reveal` (pushed, commit 6bf8516; not merged into master). Big media (plates, clips, QA shots) is on Drive only (.gitignore), not in git.

## Read first (in order, nothing else)
1. `TSST/brands/anvil/projects/campaign-01/project.md`: campaign folder map + state.
2. `TSST/handoffs/ANVIL_NEXT_SESSION.md`: open items.
3. `TSST/brands/anvil/STATE_2026-10-09.md`: brand rules, bundles (SYNC 2), Drive asset paths.
4. `post-2-reveal/REVEAL_V2_PACK.md` section G only (revision log = what was tried and rejected).

## State
- Post 1 published. Post 3 (3 bundles 1,499 / 2,499 / 2,799 EGP) not started; only 2 real packshots exist.
- Post 2 reveal video: our tower rebuild was REJECTED (`final/ANVIL_reveal_FINAL_15s.mp4`: flat pasted logos, 9 s static). Ahmed's own Magnific drafts are the quality floor.
- Agreed route (not yet run): keyframes from his drafts `post-2-reveal/refs/draft_keys/K1–K4` → ONE ChatGPT pass on Magnific (1080p clips between keyframes + strong 120 BPM trailer music, one credit quote, max 1 re-roll) → MOTION (`tsst-creative`) cuts locally with kinetic Arabic text scenes between shots.
- Text scenes: After Effects script `post-2-reveal/text_scenes/build_text_scenes.jsx` (T1 مرحلة/جديدة, T2 8 سنين/ثقة, T3 شكل جديد/اسم جديد, T4 SHARK → official SVG wordmark). Run 1 crashed at the logo (fixed, not re-run). `build_log.txt` holds the run log.

## Next (one track at a time, ask Ahmed before each)
1. Ahmed re-runs the AE script (File → Scripts → Run Script File; `AfterFX.exe -r` from a shell does not reach the open instance). QA the renders: Arabic letters joined and RTL, wipe covers the full frame, logo = SVG paths.
2. Write the ChatGPT request (ROLE A, CREATIVE in the TSST ChatGPT Project) for the K1→K4 clips + music. Ahmed downloads 2 files (clips joined, music) into `post-2-reveal/final/`.
3. `tsst-creative`: final cut (≈15 s: covered tower 0–2.5 → text/shot alternation on beats → hero → end card), −14 LUFS, 1080x1920.
4. Rebuild the client page: `python TSST/services/delivery/build_delivery.py TSST/brands/anvil/projects/campaign-01` then republish the artifact (Claude only) or hand Ahmed the HTML.

## Ahmed's rules (from Claude memory; follow them)
- Reply in plain Egyptian Arabic, short, exact; translate jargon. Ask + confirm cost before any dispatch or spend.
- Client package is small: one pass, one credit quote; no shot-by-shot review loops.
- Build ON his drafts; never strip what he already accepted (integrated logo, products, camera energy).
- Logo/packaging fidelity is judged by his eye; never invent packaging for missing products.
- Magnific/ChatGPT generation is manual via Ahmed (ChatGPT cannot export Magnific files; Ahmed downloads).
- Delivery page = client-facing, formal, one language, no internal names/tools/rejected work.
- After every team report: log non-none `skill_friction` in `TSST/core/friction-log.md` + run `friction_check.py`.
