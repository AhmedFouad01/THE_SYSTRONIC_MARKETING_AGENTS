# DASH-POST-ADS-001: posts and ads, create + show (spec, Lead)

Status: SPEC, owner answers in (2026-10-27). Not dispatched. Flow = R57 Design Gate.
Builds on: `DASH-POST-FORMATS-001.md` (formats, ratios, frames: keep), contract v1.8 (`format`, `ratio`),
v1.13b (`publish_on`). Platforms stay Instagram, Facebook, LinkedIn (owner).

## Owner decisions (2026-10-27)
1. Every post is **Organic** or **Ad**. Only Ad posts count as ads (package `used.ads`, campaign ads, delivery "Ads done").
   One Ad post = 1 ad, whatever its platforms or placements. `JobMeta.ads` (manual number) stops being typed in.
2. Ads are **preview + manual entry**: the Dash shows the ad in each placement; the team sets status, goal and funnel by hand.
   No Meta Ads API now (later roadmap item).
3. Ad goal = Meta objectives: Awareness, Traffic, Engagement, Leads, App promotion, Sales. Funnel stage = AARRR
   (same list as the marketing plan), suggested from the goal, editable.
4. Client settings hold one **social profile per platform**: profile picture, page name, username / channel. Every frame uses it.

## Create flow (team), owner's order
1. Organic / Ad.
2. Type: Single image · Carousel · Album · Video / Reel · Story (· Document = LinkedIn). Type maps to the stored
   `format` (`single · multi · video · story · document`); Album = `multi` on Facebook. Video on IG/FB shows as a Reel.
3. Size: ratio chips allowed by the type (1:1 · 4:5 · 9:16 · 1.91:1), per FORMATS-001 table.
4. Platform + placement: platforms that lack the type/size are disabled with the reason.
   Organic placements = frames: IG Feed, IG Profile grid, Reels, Stories; FB Feed, Reels, Stories; LinkedIn Feed.
   Ad placements (preview only, see Facts): FB Feed, IG Feed, IG Explore home, Stories, Reels, FB Marketplace,
   FB Right column. Ad also asks: goal, funnel stage, start / end date.
5. Media + caption (FORMATS-001 step 2–3 rules, warnings never block).
6. Frame preview per chosen placement, with the client's social profile (avatar, page name, @username).

## Facts (G1, `GEM-DASH-001_out.md`, Lead opened the sources 2026-10-27)
A = Meta page checked live. B = secondary source, soft (preview only, never blocks).
| Placement (ad) | Frame | Ratio (recommended) | Text / safe zone | Grade |
|---|---|---|---|---|
| FB Feed | feed | 4:5, 1440x1800 (also 1.91:1, 16:9, 1:1); desktop shows video 1:1 | primary 50–150, headline 27 | A |
| IG Feed | feed | images 4:5; videos 9:16 (also 1.91:1, 16:9, 1:1, 2:3) | 1:1 / 4:5 keep bottom + sides clear; 9:16 = story zone | A |
| IG Explore home | feed | images 4:5; videos 9:16 | as IG Feed | A |
| FB / IG Stories | phone | 9:16, 1440x2560 (others shown smaller with padding) | keep 14% top, 35% bottom, 6% sides clear; primary 125 | A |
| FB / IG Reels | phone | 9:16 (also 1.91:1–2:3) | same zone; bottom 40% when the ad has a disclaimer | A |
| FB Marketplace | small card | 1:1 (also 16:9, 9:16) | primary 125, headline 40 | A |
| FB Right column (desktop) | small card | Help Centre 1.91:1, Ads Guide 1:1: CONFLICT → offer both, default 1:1 | headline 40, no text on image | A |
Not previewed, listed only ("also runs on"): FB profile feed, FB business explore, search results, in-stream reels,
ads on FB Reels, Threads, WhatsApp status, Messenger Stories, Audience Network. Messenger Inbox = retired.
Frames show the label **"Ad"** (Meta replaced "Sponsored"; A). Objectives: the six above (A).
Organic (B): IG profile grid tile = 3:4 (4:5 loses ~3% each side); IG app takes 3:4 portrait, API caps 4:5;
IG carousel up to 20, mixed ratios allowed; FB multi-photo layouts by count + first photo orientation (2 / 3 / 4 / 5, 6+ = "+N").
Still unknown: organic caption limits, FB multi-photo max, FB organic Reel length (keep the `?` soft warnings).

## Status
Review track stays R49 (Pending review / Approved / Changes requested), shown as its own chip.
Life status, set after approval: Organic = Draft → Scheduled (`publish_on`) → Posted.
Ad (S1) = Draft · In Meta review · Active · Paused · Completed · Rejected by Meta. Client sees all but Draft.
No "Scheduled" for ads: an In review / Active ad shows "Starts <date>" from `ad.start`. Draft = not yet approved.
UI Arabic: the live client Arabic style (CX-R99: plain Egyptian, clear, no slang), owner Q3.
IG organic Post / Carousel get a soft **3:4** chip (S1; default stays 4:5); not for video, story, FB, LinkedIn or ads.

## Show (team and client)
Post card: thumbnail (slide 1 / video poster / page 1), title, Organic|Ad chip, type · ratio, platform icons,
life status, date; Ad adds goal + funnel stage. Same card in the job page and in a new client-level **Posts** list
(all jobs), filters: All / Organic / Ads, status, platform. Client side = same cards, formal words, no internal fields (R55-6).
Package tile "Ads" = count of Ad posts in the period (used / max / left).

## Data (draft for DEV; contract v1.22, migration 026: pkg4 holds 025 / v1.21)
```
Post      += kind: "organic" | "ad";                       // default organic; old rows organic
             life: "draft" | "scheduled" | "posted" | "in_review" | "active" | "paused" | "completed" | "rejected";
             // ratio adds "3:4" (IG organic single / multi only)
             placements: Partial<Record<PostPlatform, Placement[]>>;   // ids from post-formats.json
             ad?: { objective: AdObjective; funnel: FunnelStage; start: string | null; end: string | null };
AdObjective = "awareness" | "traffic" | "engagement" | "leads" | "app_promotion" | "sales";
SocialProfile { brand; platform: PostPlatform; avatar: image | null; page_name: string; handle: string }   // team edits, client reads
```
Default goal → funnel (S1 confirmed; no retargeting flag): awareness, traffic → acquisition; engagement, leads, app_promotion →
activation; sales → revenue. retention / referral = manual (retargeting, referral ads).
Ads count = Ad posts (not deleted, life in_review / active / paused / completed) with `ad.start` (else `publish_on`) in the window. Profile missing = brand logo + brand name.

## Steps (R57)
| # | Who | Work | Done when |
|---|---|---|---|
| G1 ✔ | Gemini request `GEM-DASH-001.md` (Ahmed) | Meta ad placements: names, ratios, safe zones, which formats each takes; FB album layouts | table with sources, `?` items closed |
| S1 ✔ | SPARK (`DASH-POST-ADS-001-S1-SPARK.md`) | goal → funnel map; ad status words (Meta now says "Off" for paused, and has In review / Rejected: keep or add?); IG organic 3:4 chip yes/no | 1 short table, Skills used |
| D1 | CREATIVE (strong tier) | redraw in `post-ads-001/`: create wizard, post card + Posts list, frames per placement, client Social profiles settings | gate = `pkg-link-004/render.mjs` (6 checks) all 0, style baseline `pkg-redraw-003/`, Lead R55 pass |
| D1 ✔ | CREATIVE | `post-ads-001/` 5 pages, 24 PNG; gate 0 (Lead re-ran: 30 pages, all 0) | Lead R55 look review: 6 fixes below |
| D1b ✔ | CREATIVE | Lead fixes + owner answers, one pass | gate 0 (Lead re-ran: 30 pages, all 0), Lead looked at post page + AR client list: pass. Open: owner OK of the Arabic goal words (DESIGN.md) |
| A1 ✔ | Ahmed | approved D1b designs + Arabic goal words (2026-10-27, in chat) | Approved |
| B1 ✔ | DEV backend, branch `post-ads-001` (`07e69e4`, `19d517c`, worktree `C:/Work/tsst-portal-post1`) | migration + contract v1.21 + ads count from posts + profiles | tests green, old posts load as organic |
| B1b ✔ | DEV `34d3f4c` | Lead follow-ups below (+ owner answer on counting) | Lead re-ran posts / ads / packages / plan / summary: 40/40; kind change resets approval + life to draft |
| W1a ✔ | DEV `9647ccc` `aadccf9` `d1105a6` | v1.22 types + mock, all frames, card + team Posts list (job tab + `/clients/view?view=posts`), ⋯ menu | 5 web gates green (lint errors only in untouched `qa/PKG/*.mjs`); Lead looked at the list in the mock app: matches |
| W1b ✔ | DEV `1ea86be` `1beabb2` | New post wizard at `/jobs/post`, old PostEditor removed | 5 gates green (test:api 108/108); Lead clicked through Ad → Single image in the mock app: matches |
| W1c ✔ | DEV `e38fb4d`…`ec46978` (9 commits) | brand-wide posts read (team + client), team title row + New post + search, client Posts EN + AR at `/client/posts`, post page header + chosen placements only, social profiles in settings/clients, ad start required (web), ad carousel 2–10, dead CSS removed | gates green (backend posts 29/29, web test:api 110/110). New post with several jobs opens a job picker (Lead OK). |
| W1d ✔ | DEV `bc05d67` `d2ec379` `a2dd459` | backend 422 without ad start; `web/qa/POST/gate-live.mjs`; compare images in `post-ads-001/build/` | gate-live: 24 pages, all 6 checks 0 (global `--text-xs` 12→13px per R55: re-gate other pages after merge) |
| W1e ✔ | DEV `3d53bdd` `210f265` | lock tiles, post page header row (title 2 lines, actions in the row, no Select bar), crop note EN + AR; `tokens.ts` synced to 13px (DS1 was broken by d2ec379) | gate-live 24 pages all 0; ds:check pass; Lead looked: fixed |
| M1 | Lead (owner OK) | after pkg4 merges to main: rebase `post-ads-001`, full vitest + gate-live + PKG proof re-run (13px token), PR, deploy | owner OK on deploy |
| W1 | DEV web | build from approved designs | Design Gate live = 0 + compare images, Lead, Ahmed |

Design Gate = the package gate (`pkg-link-004/render.mjs`), usable now; `DG-001` only generalises it. B1 can start after S1, parallel to D1.

## D1 Lead review (2026-10-27) → D1b
Fixes: (1) client list 390: Approve / Edit are a medium pair under the title → sm on the title row (R51);
(2) post page needs its header: title row with Organic|Ad, life + review chips, review actions sm; real page shows only
the post's kind + chosen placements (the mock is the frame catalogue, label it so); (3) LinkedIn section = one card in a
full-width panel → one grid for all sections; (4) FB Feed ad: headline wraps beside the button → headline row layout;
(5) wizard: disabled tiles look almost open → clearer sunk state; (6) Stories / Reels safe-zone tint unclear on light
images → clearer bands. Lead decisions on CREATIVE's questions: Rejected by Meta and Changes requested may share red
(both = needs a fix); life status set from the card ⋯ menu "Set status"; stepper = thin wrapper on HeroUI primitives (R50 OK).
Owner answers (2026-10-27): Q1 add ad `headline` + `cta` (button) to the contract (B1); Q2 the client sees goal + funnel;
Q3 Arabic words = the live Dash style (CX-R99: plain Egyptian, no slang), not formal.

## B1 Lead review (2026-10-27) → B1b
Checked: both commits on `post-ads-001`; Lead re-ran 8 post / package / plan / migrate test files = 65/65 pass, typecheck clean.
DEV's full run: 463 / 470, the 7 others crashed on a Windows worker exit and pass alone (not a real failure; rerun before merge).
Contract notes kept: `placements` change resets approval, `life` / `ad` fields don't; ad on LinkedIn refused; 3:4 never on ads;
campaign `ads` counts all its ads (any date) as before; `PATCH job/meta ads` accepted and ignored.
Follow-ups: (1) drop CTA `see_menu`: not in Meta's call-to-action list (developers.facebook.com ad-creative-link-data-call-to-action,
v26.0, opened live); the other 16 are there; (2) an ad needs ≥ 1 placement; (3) `kind` editable after create (organic → ad =
"boost", owner: "inside every post I choose organic or ad"), change resets approval and checks ad fields; (4) package count (owner 2026-10-27):
only ads with life in_review / active / paused / completed count; Draft and Rejected never count (package, delivery, campaign). Merge: pkg4 first, then rebase (expected conflicts: migrate.test.ts, types.ts, packages.ts).
