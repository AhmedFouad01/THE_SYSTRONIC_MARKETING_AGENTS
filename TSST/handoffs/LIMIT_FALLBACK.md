# LIMIT FALLBACK: open tracks for Antigravity / Gemini while Claude is rate-limited

Owner rule (Ahmed, 2026-10-09): if Claude's usage limit runs out, hand these tracks to Antigravity (file work in this repo) or to the Gemini app (research, in a NEW chat). Copy the prompt block as is. When Claude returns, the Lead reviews every output before it counts.

Backup Lead (owner, 2026-10-09): while Claude is limited, Codex is Lead (`roles: [lead]` in runtimes.yaml; DEEP model gpt-6-astra sparingly); Antigravity = ROLE B file-work tool (not a bus runtime), Gemini app = research/image/video; Claude resumes Lead on return.

Never hand off: ad spend, publishing or posting, account or settings actions, Magnific generation, git push.

Last updated: 2026-10-09 by the Lead.

---

## T1 · Delivery System v1 (bilingual): DONE 2026-10-09 (CREATIVE; Lead-reviewed). Skip this track.
**State:**
- CREATIVE is building the AR/EN switch, the iconic-mark placeholder and the v1 docs into `TSST/services/delivery/build_delivery.py`.
- Check `TSST/services/delivery/README.md`: if it already says "The Systronic Delivery System v1.0", T1 is done and you can skip it.

**Antigravity prompt (ROLE B, external tool; file work only):**
```
ROLE B — external tool. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Do not commit or push.
Goal: finish "The Systronic Delivery System v1.0" — bilingual (Arabic + English) client delivery pages.
Read first: TSST/services/delivery/README.md, TSST/services/delivery/build_delivery.py (docstring = manifest schema),
TSST/services/delivery/i18n/en.json + ar.json, and CLIENT_COPY_AR.md in these two job folders:
  TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/social-setup-01/
  TSST/brands/anvil/projects/campaign-01/
Also read C:\Users\10\.claude\projects\G--My-Drive-THE-SYSTRONIC-MARKETING-AGENTS\memory\feedback-delivery-pages-client-formal.md (hard rules).
Do:
1. All UI strings come from i18n/{en,ar}.json, with no hard-coded English. Each job has default_lang: ANVIL=ar, VILL=en.
2. One HTML file per audience, holding both languages, with an EN | ع switch in the header. The switch flips <html lang/dir> without a reload and stores the choice in localStorage inside try/catch.
3. Arabic layout is a full RTL mirror. Use logical CSS properties. The contents nav slides in from the right in Arabic.
   Wrap Latin runs in <bdi dir="ltr">. Write dimensions as "عرض X وارتفاع Y بكسل", never "×".
4. Arabic font: IBM Plex Sans Arabic from TSST/services/delivery/fonts/, embedded. No letter-spacing on Arabic. Use Western digits.
5. "In production" placeholder: keep its design, and replace the outline bolt icon with the Systronic iconic mark.
   Source: TSST/brands/t-sag/assets/final/logo/systronic_iconic-mark_black_on-white.jpg. Key the white to alpha and do not change the geometry.
6. Rebuild: python TSST/services/delivery/build_delivery.py <job_folder>, for both jobs. Keep the client-page leak scan passing.
7. README: add the "The Systronic Delivery System v1.0" header and a changelog.
BANNED: the 29LT Bukra or Myriad Arabic fonts; rounded cards with a cyan top border; pill badges; timelines.
Report: the files you changed, plus any problem you could not solve. Write the report to TSST/handoffs/LIMIT_FALLBACK_T1_report.md.
```

## T2 · ANVIL Post 2 final video, only after Ahmed drops the files
**State:** waiting for Ahmed to download two Magnific files into `TSST/brands/anvil/projects/campaign-01/post-2-reveal/`: the HD master (1080×1920, silent .mov) and the music version (608×1080).

**Antigravity prompt (ROLE B):**
```
ROLE B — external tool. Repo: G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS. Do not commit or push.
In TSST/brands/anvil/projects/campaign-01/post-2-reveal/ there are 2 files: an HD master (1080x1920, no audio) and a low-res music version (608x1080).
Make reveal-final.mp4. Video comes from the HD master, re-encoded to H.264 High, yuv420p, 1080x1920, same fps, CRF 18, +faststart. Audio is the music version's track as AAC 192k, trimmed to the video length, with a 0.3 s fade out.
ffmpeg: C:\Users\10\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe. Do not upscale or use the low-res video.
Check the duration and the A/V sync (first beat vs first camera move); note any offset.
Then rebuild the page: python TSST/services/delivery/build_delivery.py TSST/brands/anvil/projects/campaign-01
Report to TSST/handoffs/LIMIT_FALLBACK_T2_report.md (ffprobe summary + sync note).
```

## T3 · Skill-gap research (optional, Gemini app, NEW chat)
**Why:** the friction log shows that the CREATIVE SK-004/005/006/010 references are social-format only. There is no web-page type or spacing ladder, no HTML QA recipe, and no guidance for formal Arabic UI chrome.

**Gemini app prompt (ROLE B, research):**
```
ROLE B — external research. No shell, no local files. Every claim needs a live, working URL. Write "not confirmed" instead of guessing.
Research brief for a design studio's internal skill library:
1) Web typography scale for editorial client-handover pages (desktop + mobile): modular scale ratios, body sizes,
   line-length, line-height, spacing systems (8pt), with sources (e.g., Material, Apple HIG, Butterick's Practical Typography, Utopia fluid type).
2) Arabic web typography for formal UI: size relative to Latin (x-height matching), line-height, no letter-spacing,
   bidi isolation (<bdi>, dir=auto), numerals, writing dimensions/ratios in RTL, plural strings in UI (CLDR plural rules for Arabic).
3) A QA checklist for static HTML deliverables: WCAG 2.2 contrast incl. non-text contrast (1.4.11) for status dots,
   reduced motion, keyboard focus, print styles.
Output: a structured report, each section ending with 5–10 concrete rules + source URLs.
```
Save the answer to `TSST/CREATIVE/gemini/` under the next free GEM-CR number (run `ls` first).

## Open owner items (no external tool can do these)
- **ANVIL:**
  - Download the 2 Magnific files (T2).
  - Eye check of the product labels and the 3D logo in the reveal.
  - Pick caption A or B and the wording of the offers line.
  - The 3 offer details.
  - Publish dates.
- **Footer contact data:** fill `TSST/services/delivery/systronic.json`.
- **Native review** of the Arabic page copy, especially "اللقطات المميزة" and "قالب منشور الصفحة الرئيسية".
