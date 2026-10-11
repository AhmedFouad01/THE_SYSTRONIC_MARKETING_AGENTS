GEMINI REQUEST GEM-CRM-001 · t-sag · crm (full UI redesign) · from TSST Lead, for LENS_AG review · 2026-10-09
SURFACE: Gemini app (Deep Research, NEW chat)
ROLE:            EXTERNAL TOOL — research; reply with text only in the chat, write no files (block: TSST/context/request-role.md)
OBJECTIVE:       Public evidence on how best-in-class CRMs structure each screen we have, and the jobs/questions each screen serves, for an agency CRM redesign.
CONTEXT:         Inside the prompt (self-contained). No client data, no internal numbers.
FILES/ASSETS:    none. Upload nothing.
REFERENCES:      none beyond the prompt.
CONSTRAINTS:     Public sources only; a URL for every vendor claim; observations separate from inferences.
OUTPUT:          One report in the chat. Ahmed saves it as `GEM-CRM-001_out.md` beside this file (or exports to Docs and pastes).
ACCEPTANCE (LENS_AG on return):
- all 16 screens + the 4 cross-cutting topics covered, or marked "no public evidence";
- every vendor claim has a URL; LENS opens ≥10 of the load-bearing URLs live and marks dead/wrong ones;
- observation vs inference kept apart; no invented features;
- then LENS writes `../redesign/01_LENS_SCREEN_RESEARCH.md` (jobs + questions per screen mapped to our 16 screens).

## Steps for Ahmed
1. Gemini app → **new chat** → choose **Deep Research**.
2. Paste everything inside the PROMPT block below (from "ROLE" to the end). Upload nothing.
3. Approve the research plan Gemini shows you, and let it run.
4. When it finishes: copy the report (or Export to Docs → copy) into
   `TSST/brands/t-sag/projects/crm/gemini/GEM-CRM-001_out.md`, then tell the Lead.

## PROMPT

```text
ROLE: EXTERNAL TOOL — research. You are not part of any team or system; reply with a report in this chat only. Do not write files or run code.

GOAL
We are redesigning every screen of a CRM built for a marketing/ads agency. The agency uses it for its own sales, and it runs a separate workspace per client. Client staff can also log in and see only their own workspace. Roles: manager, sales rep, read-only viewer. The app is bilingual (Arabic right-to-left and English) and must work on desktop (1440px) and mobile (375px). Leads will later arrive from Meta, Google and TikTok ads.

I need evidence from public sources on how best-in-class CRMs structure each screen, which jobs each screen serves, and which questions it answers at first glance. The research covers structure and content only. Colours and branding are out of scope.

VENDORS (in priority order)
1. HubSpot (Smart CRM / Sales Hub), the main reference
2. Salesforce Sales Cloud (Lightning Experience + Salesforce Lightning Design System guidance)
3. Pipedrive
4. Zoho CRM (note its Arabic/RTL support if documented)
5. Attio
6. GoHighLevel (agency view and client sub-accounts), the agency reference
You may add one more vendor only if it is clearly stronger for a specific screen; say why.

SOURCES
- Prefer official help centres, product docs, official design-system docs and official product pages.
- Independent UX research (e.g. Nielsen Norman Group, Baymard) is welcome for general patterns.
- Public reviews (G2, Capterra, Reddit) may be used only for user complaints. Label them "user reports".
- Give a working URL for every vendor claim and the date the page was last updated, if shown. If you cannot find a source, write "no public evidence". Do not guess.

SCREENS (cover each one)
1. App shell: sidebar/navigation, top bar, global search, global "create" button, and how a user switches between client workspaces
2. Sign-in
3. Dashboard / home
4. Leads list
5. Contacts list
6. Contact record page, including the activity timeline / customer journey
7. Merge duplicate contacts
8. Deals list and deal record page
9. Pipeline (kanban board of deal stages)
10. Tasks
11. Segments / lists (saved filtered groups of contacts)
12. Import (CSV upload → column mapping → validation → review → result)
13. Reports / analytics (report list, report builder, dashboards of charts)
14. Customer journeys and tracking (touchpoints, source/attribution views)
15. Integrations (connecting ad accounts and other tools)
16. Settings: users and roles, custom properties/fields, security (2FA, sessions)

FOR EACH SCREEN, REPORT
a. Primary users (agency staff, client user, or both) and their top 3–5 jobs on this screen.
b. The 3–5 questions the screen must answer within 5 seconds.
c. Per vendor (with URL): layout regions (header, filters/toolbar, main area, side panel), the single primary action and where it sits, the default view, what is above the fold, bulk actions, empty state, and mobile behaviour.
d. Convergent patterns: what 3 or more vendors do the same way.
e. Differentiators worth noting, and documented user complaints (labelled "user reports").
f. How regions are visually separated (cards, spacing, elevation, or divider lines), as an observation only.
g. Inference: "adopt / avoid" suggestions for an agency CRM, clearly labelled INFERENCE.

CROSS-CUTTING SECTIONS
A. Agency model: how HubSpot (partner / multi-account) and GoHighLevel (agency view vs sub-accounts) let an agency run many clients, switch between them, and give clients their own login or dashboards.
B. Record-page anatomy: compare HubSpot's record layout (left properties, middle timeline, right associations) with Salesforce, Pipedrive and Attio.
C. Mobile: what each vendor keeps, drops or reorders on the mobile app or the small-screen web view.
D. Arabic/RTL: which of these vendors document Arabic UI or right-to-left support, and any documented limitations.

OUTPUT FORMAT
- Start with a one-page summary table: one row per screen, with columns for the main job, the top questions, the convergent layout, and the main primary action.
- Then one section per screen, following a–g above.
- Then cross-cutting sections A–D.
- End with a numbered source list giving the URL, vendor, page title and last-updated date (or "not shown").
- Mark every claim as OBSERVATION (with source number) or INFERENCE.
- English. Plain language. No marketing fluff.
```
