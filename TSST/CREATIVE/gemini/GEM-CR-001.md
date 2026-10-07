GEMINI REQUEST GEM-CR-001 · TSST (team-level, no brand) · CREATIVE capability · from SPARK_AG via Lead · 2026-10-07
(Team-level request, so it lives under TSST/CREATIVE/gemini/ instead of a brand project.)

OBJECTIVE:   Verify current official canvas sizes, aspect ratios and UI safe zones per placement, so CREATIVE can carry a trusted spec table.
CONTEXT:     SPARK drafted the numbers below from memory. Every one is "verify". This is public platform info only, no client data.
FILES/ASSETS: none
REFERENCES:  official sources only: Meta Business Help Center / Meta Ads Guide, Instagram Help, TikTok Ads Manager creative specs / TikTok Creative Center. Note the date of each source.
PROMPT:
  Using only official Meta, Instagram and TikTok documentation (cite each URL and its last-updated date), give me a table for 2026 with:
  placement | canvas px | aspect ratio(s) accepted | recommended ratio | safe zone (px from top / bottom / left / right where text, logo and CTA must stay) | max video length | notes.
  Placements: Meta Feed (FB+IG), Meta Stories, Meta Reels, Facebook Right Column, Instagram organic post, Instagram carousel, Instagram story, Instagram Reel cover + how it crops in the profile grid (3:4 or other?), TikTok In-Feed ad, TikTok organic.
  Then check these draft numbers and mark each CONFIRMED / CHANGED (new value) / NOT FOUND:
  - Feed 1080x1350 4:5; text-under-20% rule is no longer enforced
  - Stories 1080x1920; safe zone top ~250 px (14%), bottom ~340 px (20%), sides ~65 px
  - Reels 1080x1920; safe zone top ~250 px, bottom ~670 px (35%), sides ~65 px
  - IG profile grid shows posts/reel covers cropped to 3:4 (about 1080x1440 centre)
  - TikTok In-Feed 1080x1920; safe zone top ~130 px, bottom ~480 px, right ~140 px, left ~60 px
CONSTRAINTS: Official sources only. No blogs as the primary source (a blog may be listed only as "secondary" if official is silent). Say "not documented" rather than guessing.
OUTPUT:      One Markdown table + the CONFIRMED/CHANGED list + source URLs with dates. Save as GEM-CR-001_out.md beside this file.
ACCEPTANCE:  Lead/SPARK check that every number has an official URL; CHANGED values replace the draft; the final table goes into TSST/CREATIVE/TOOLCHAIN.md "Platform checks".
