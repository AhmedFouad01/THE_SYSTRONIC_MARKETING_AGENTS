GEMINI REQUEST GEM-CRM-003 · t-sag · crm (full UI redesign: theme choice) · from TSST Lead · 2026-10-09
SURFACE: Gemini app (Deep Research, NEW chat)
ROLE:            EXTERNAL TOOL — research; reply with text only in the chat, write no files (block: TSST/context/request-role.md)
OBJECTIVE:       A shortlist of 12–15 existing UI themes/kits and product looks, each with a live demo URL. Ahmed picks one to build the CRM theme on.
CONTEXT:         Inside the prompt. Public brand facts only (colours, fonts); no client data.
FILES/ASSETS:    none. Upload nothing.
OUTPUT:          One report in the chat. Share the link with the Lead. The Lead screenshots every demo URL with a script and builds one gallery page for Ahmed.
ACCEPTANCE (Lead on return):
- every option has a working live demo URL (the Lead's screenshot script is the check);
- the licence/price and stack claims carry a source URL;
- RTL support is marked "documented" only with a link, otherwise "unknown".

## Steps for Ahmed
1. Gemini app → **new chat** → **Deep Research**.
2. Paste everything inside the PROMPT block (from "ROLE" to the end). Upload nothing.
3. Approve the plan and let it run.
4. Share the report link with the Lead.

## PROMPT

```text
ROLE: EXTERNAL TOOL — research. You are not part of any team or system; reply with a report in this chat only. Do not write files or run code.

GOAL
We are redesigning a CRM web app for a marketing/ads agency in Egypt. Instead of designing a theme from scratch, we want to pick an existing, high-quality UI theme or kit and build on it. Find 12–15 strong options and give a live demo link for each, so we can screenshot and compare them visually.

OUR CONSTRAINTS
- Build stack: React + React Aria Components + Tailwind CSS (v4 preferred).
- The app is bilingual: Arabic (full right-to-left) and English. RTL support matters a lot.
- It needs light and dark mode.
- It must include data-heavy components: data tables with selection and bulk actions, select/combobox, date picker, file upload, tabs, side drawer/sheet, dialogs, charts or chart styling, and a kanban board if available.
- The look we want is premium and clean, editorial rather than generic "SaaS template": strong typography, generous whitespace, restrained lines, no heavy black slabs, and nothing childish or bubbly. It must look like a product that can stand next to HubSpot or Attio.
- Our brand (The Systronic) will be applied on top: navy #181D36, red #E7213A, cyan #29BCEF used only as a detail, and the Poppins font. A theme that accepts a navy + red brand well is a plus.

GROUPS (cover all three)
A. 5–7 UI kits or themes built on React Aria Components and/or Tailwind that we could build on directly. Examples to evaluate (not a fixed list): Untitled UI React, HeroUI, Intent UI, JollyUI, the React Aria Tailwind starter, Catalyst (Tailwind UI), shadcn/ui-based themes, Tremor. Prefer ones built on React Aria.
B. 3–4 premium admin/dashboard/CRM templates (Tailwind/React) with a distinctive, high-end look, even if not built on React Aria. These are look-and-feel references.
C. 3–4 real CRM or SaaS products whose interface is widely praised for design quality, e.g. Attio, Linear, Folk, Twenty CRM. These are inspiration only.

FOR EACH OPTION GIVE
1. Name and group (A/B/C).
2. **Live demo URL**: a direct link to a page that shows a real dashboard, table or app screen, not a marketing homepage. If there is a dark-mode demo URL, give it too.
3. Official site/docs URL.
4. Price and licence (free/MIT, paid one-time, subscription), with a source URL.
5. Stack: React Aria? Tailwind version? Radix/Headless UI? Figma file available?
6. RTL/Arabic support: "documented" (with a link), "partial" or "unknown".
7. Component coverage against our list above: Yes / Partial / No per component.
8. Maintenance: date of the latest release or commit, if shown.
9. Look in 2 lines: what makes it distinctive. Then rate its fit with our wanted look and our navy + red brand: High / Medium / Low, with one line why.

OUTPUT FORMAT
- Start with one comparison table of all options. Columns: name, group, demo URL, price, React Aria (Y/N), Tailwind version, RTL, dark mode, fit rating.
- Then one short section per option, following points 1–9.
- End with your top 3 recommendations for "the theme to build on", with reasons, and a plain list of all demo URLs, one per line.
- Give a source URL for every factual claim. Write "unknown" instead of guessing. English, plain language.
```
