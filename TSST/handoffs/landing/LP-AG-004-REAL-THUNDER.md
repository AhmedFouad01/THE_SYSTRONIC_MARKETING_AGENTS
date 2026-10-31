# LP-AG-004: real thunder + glow-only round (Codex, step 2 round 4)

ROLE A (team runtime) — `tsst-creative` on Codex (owner's pick, 2026-10-31). Work as the `.codex/agents/tsst-creative` contract
(native agent, or explicit-contract mode: open it and record path). Same Skill Plan as LP-AG-001: TEAM studio · SKILLS
TSST-CREATIVE-SK-008, TSST-CREATIVE-SK-004, TSST-CREATIVE-SK-010 · NOT_SELECTED SK-014, SK-027 · SKILL_GAP none.
Rounds 1–3 were built by Antigravity in the same folder; continue from that code. Lead judges → Ahmed.
Cost rules R52: read only what is named, reply in 3 lines, plain Egyptian Arabic. Effort: High.

## Where (strict)
Job folder `C:\Work\TSST\TSST\brands\t-sag\projects\landing-page\`. Edit only `work\site\`. The source clip in `work\ref\lightning\`
is read only (licensed Freepik premium footage on Ahmed's account). No commit, no deploy.
Keep the `FORM_ACCESS_KEY` value in `main.js`. Never send a real form submission: mock fetch in every test.

## Ahmed's notes on v3 (all must be fixed)
1. The drawn lightning (canvas arcs, form strike) looks primitive → delete every procedural lightning drawing.
2. The intro still shows `IMAGINE` at the flash → it must say `CHARGE YOUR DREAMS`.
3. The cyan fill that changes the logo colour ("filling with water") → delete. The logo pointer split effect → delete entirely.
   The logo stays as in the artwork: light bolt, thin cyan / red edges, still. Motion = glow only.
4. The big bolt behind the form → delete.

## New top section: real thunder + glow
- **Source** `work\ref\lightning\lightning-strike-night-sky_1920x1080.mp4` (real footage, 5.0 s, 24 fps). Strike peak at 0.88 s,
  second flash at 1.04 s. The bolt is in the right third, upper part. A dark hill / tree silhouette sits bottom right: mask it out,
  no horizon line may show.
- **ffmpeg** (installed): crop the bolt, trim ~0.5–1.6 s, no audio, keep the white-hot core real and tint the glow slightly toward
  brand cyan. Encode `assets\strike.webm` (VP9) + `assets\strike.mp4` (H.264), ≤ 700 KB each, plus a mobile pair ≤ 350 KB.
  Blacks stay pure black so `mix-blend-mode: screen` leaves no box edge.
- **Placement**: the lower end of the real bolt lands on the top of the logo. Muted, playsinline, no controls, loaded after first paint.
- **The strike moment**: the whole page lights up for an instant (soft full-page light, background and all text lit; ~120 ms up,
  ~600 ms decay; a smaller second flash at the re-strike). Never more than 2 flashes per strike; strikes ≥ 8 s apart.
- **After the strike, glow only**: the logo's cyan / red edge glow surges, then settles. The glow travels as plasma contact to nearby
  words (`CHARGE YOUR DREAMS`, headline words, `CLIENT LOGIN`): each word gets a short electric glow (text-shadow bloom, slight
  flicker), one after another, then calm. No colour fills, no drawn lines.
- **Loop**: a strike every ~10–12 s while the top is on screen. Between strikes the logo edge glow breathes very gently.
- **Intro**: dark page → the real strike → the flash lights the scene → the logo appears glowing with `CHARGE YOUR DREAMS` → settle.

## Form: clean and calm (keep the v3 sentence layout)
- A blank's underline lights softly (cyan → red glow) when its value is valid.
- `CHARGE IT` glow builds in 3 gentle steps.
- On send: one soft light sweep across the sentence (left to right, ~600 ms) and a button glow pulse; the success line fades in.
  On error: the line shows inline and the button glow drops. No lightning, no flash.

## Keep
Everything else from v3: layout, uppercase, IMAGINE wave and panel, colours, copy.

## Limits
Reduced motion: no video, no flash, still logo with a steady edge glow, form states without animation. Whole page ≤ 3 MB with video.
Video pauses when the top is off screen or the tab is hidden. No horizontal scroll at 1440 / 1024 / 390. 0 console errors.

## Done when
- `work\site\shots\v4\` (R52, changed areas only): top at the flash 1440 · glow on a word 1440 · top 390 · form success 390.
- `work\site\shots\v4\top-1440.mp4`: a ~12 s Playwright video of the top section (intro + one loop strike) so the Lead can judge motion.
- Checks run once at the end: 0 console errors, no horizontal scroll at 1440 / 1024 / 390, page weight.
- `DESIGN.md` updated (≤30 lines). Reply 3 lines: what changed · shots path · open questions · `Skills used:` · `skill_friction:`.
