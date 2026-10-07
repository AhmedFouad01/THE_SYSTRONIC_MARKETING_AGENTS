# EX-001 Real-photo layered carousel (interior fit-out brand, PILOT-002)

Brand-neutral worked example. Evidence, not copied here: `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/` (`DIRECTION_SHEET_v0.1.md`, `assets/post-01/`, `RETOUCH_REQUESTS.md`). Rules: `INTAKE_GATE.md`, `FINAL_ASSET_GATE.md`, SK-011/014/019.

## Asked
3-slide 4:5 feed carousel for an interior fit-out brand, built from the client's real photos (3:4, 1086x1448), one message, organic (no CTA).

## Asked back (INTAKE, 6 questions)
Direction? References and what to take from each? Which photos? Exact on-image text? Text zone and focal point? Format, placement, CTA channel? The work only became right after the user answered direction, references, palette, language, first format and photos.

## Built
`assets/post-01/slide-0N/`: `01_photo`, `02_tone`, `03_logo` layers, `layers.json`, flattened slide; `build.py` rebuilds all; contact sheet + 360 px previews (`tools/phone_preview.py`). Hero first (slide 1: place + sea), then one detail per slide. Max upscale 1.25x on every crop; logo on slide 1 only (no quiet zone elsewhere), variant chosen by sampled brightness.

## Score (0-3; item 5 n/a, organic)
| # | Criterion | S1 | S2 | S3 |
|---|---|---|---|---|
| 1 | thumb-stop 300-360 px | 3 | 2 | 1 |
| 2 | focal point in 1 s | 3 | 2 | 1 |
| 3 | realism / quality | 3 | 2 | 2 |
| 4 | safe zones | 3 | 3 | 3 |
| 6 | hierarchy, AR/EN | 2 | 2 | 2 |
| 7 | native to placement | 3 | 3 | 3 |
| 8 | real variation | 2 | 2 | 1 |
Slide 3 is the weak slide: flat light, niche competes with sofa and table, scale 1.25 so slightly soft, looks like slide 2. Items 1, 2, 8 are <=2, so handover is blocked or explained.

## Fix path
Relight request (RETOUCH_REQUESTS.md #3): one warm directional shaft on the niche, rest falls to warm dark; Ahmed runs it in the image tool; Creative QAs side by side (geometry unchanged), replaces `01_photo.png`, rebuilds, re-scores.

## Logo-matrix mistake
The logo usage matrix was inferred from file names. "Dark/Light" named the background theme, so petrol (dark) marks were assigned to dark photos (inverted). Rule (L2): open or sample every file before writing a usage rule; never infer from names. Choose variant by sampled brightness (contrast >=4.5 via `tools/contrast.py`).
