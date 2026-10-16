ROLE: TEAM RUNTIME — CREATIVE_AG (MOTION_AG) in the TSST ChatGPT Project, ANVIL Post 2 "Reveal video v2" FINAL (one pass). No bus task; Ahmed relays results.
Follow AGENTS.md → TSST/context/boot.md. TEAM: studio. SKILLS: TSST-CREATIVE-SK-014, SK-015, SK-016, SK-013, SK-017, SK-019.
WRITE: only Drive `THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/campaign-01/post-2-reveal/final/` (new files only).
RETURN: the standard packet with Skills used / skill_friction + the final file path.

## Budget rule (owner, 2026-10-10)
The client package is small. Finish the WHOLE video in this one pass:
- Before spending, give Ahmed ONE total credit quote for everything below and wait for his single OK. No other check-ins.
- Cheapest model that outputs ≥1080x1920. ONE generation per clip. At most ONE re-roll in total, only for a hard fail (letters/logo invented, tower collapses or changes shape).

## Read
1. `post-2-reveal/REVEAL_V2_PACK.md`: storyboard, prompts (sections B, C, E). Use its prompts; this file overrides where they differ.
2. Approved assets in `post-2-reveal/plates/`: `M_master.png` (2160x3840, the tower; LOCKED), `S1a.png` (covered, wide), `S1b_v2.png` (covered, close on the tag), `S2a.png` (cloth lifting). `S1_clip.mp4` = motion reference only (608 px, blocks morph mid-clip).
3. Logos: Drive `Real Memory/real-memory-os/USERS/AHMED_FOUAD/PROJECTS/ANVIL_SUPPS/10_ASSETS/02_LOGO_VARIATIONS/` (ANVIL Iconic Mark + Wordmark, light versions on dark) and `10_ASSETS/VI/Old/شارك-اكس.png` (Shark logo, remove the white background cleanly).
4. Products: real photos in `10_ASSETS/01_PRODUCT_IMAGES_MASTER/RAW` (Edited = AI renders, do not use as packaging).

## Do (in order)
1. **Composite stills (no AI on logos or packs):**
   - `S1b_tag.png` = `S1b_v2.png` + the official Iconic Mark placed flat on the orange tag.
   - `M_shark.png` = `M_master.png` + the Shark logo on the pale base face (engraved/printed look, perspective-matched, muted).
   - `M_hero.png` = `M_shark.png` + the ANVIL mark on the large upper-middle blank face + real product cutouts on the 4 ledges: lower-left Bundle 1 (Furiux Mass 3kg + Tractor Creatine), lower-right shaker, upper-left Bundle 2 (whey + Premium Creatine 500g + Premium Pre-Hell), upper-right Bundle 3 (Farah Secrets GainSecret 5kg + Marvelous Creatine). Contact shadows + orange underlight on the packs. A product with no real photo is left OUT (never AI-drawn) and listed in the report.
2. **Clips (image-to-video, start→end frames, the rigid-shape line in every prompt: "The tower stays perfectly still and rigid: every block, setback and ledge keeps its exact shape for the whole shot."):**
   - Shot 1: `S1a.png` → `S1b_tag.png`, slow dolly-in + gentle tilt up (pack shot 1 prompt). Use 3 s.
   - Shot 2: `S2a.png` → `M_master.png`, cloth pulled straight up by the cables, bottom-to-top reveal (pack shot 2). Use 2 s.
   - Shot 3+4 as ONE clip: `M_shark.png` close low on the base → tilt up the tower; ledges' orange underlights brighten from bottom to top. Use 5–6 s.
   - Shot 5: push-in toward the upper face → end frame `M_hero.png`. Use 2 s.
   - Shot 6: `M_hero.png` still, 2 s hold with a very slow push (in edit), end card over it: Wordmark file + "Shark is now ANVIL SUPPS" in Inter (English only).
3. **Edit (15 s, 1080x1920, 24/30 fps, H.264):** cut on motion between shots, light grade so the background lamps stay neutral and orange stays thin, keep Reels top/bottom safe zones clear. Music: ONE generated track, dark cinematic, 120 BPM, hits at 3 s / 5 s / 11 s; if generation is not available, export silent and say so (Ahmed adds licensed music at upload).
4. **Export:** `final/ANVIL_reveal_v2_15s.mp4` + `final/frames/` (one still per shot) + `final/REPORT.md` (credits spent, what was composited, missing products, known flaws).

## Hard rules
- The AI never draws a logo, a letter or product packaging. Logos and packs come only from the real files.
- No prices, no claims, no origin wording in the video.
- No publishing. Spend only what Ahmed OKs in the single quote.
