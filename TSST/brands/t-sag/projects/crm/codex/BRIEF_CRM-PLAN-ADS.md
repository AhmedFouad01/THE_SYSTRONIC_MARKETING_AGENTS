# BRIEF CRM-PLAN-ADS — segments, tracking/journey, ad-platform integrations (requirements)

**Agent:** tsst-spark. **Tier:** WORK (gpt-6.1-sol · medium). **Mode:** plan only: no code, no installs, no test runs.

## Product context (from Ahmed, 2026-10-07)
- The T-SAG CRM serves two uses:
  - Ahmed's marketing agency manages its own clients.
  - The agency runs a **per-client CRM** (one tenant per client) to drive that client's ad campaigns: segments → audiences, tracking, buyer journey.
- We compete with HubSpot. Use **public information only**. Ahmed explicitly refuses to use any non-public HubSpot material.
- Market: Egypt/MENA. Arabic-first, full RTL, with English equally first-class.
- Roadmap v3:
  - (3) segments;
  - (4) tracking and buyer journey, with a consent field;
  - (5) Meta first, then Google, then TikTok.

## Read (read-only; do not edit)
- `C:\Work\tsst-crm-mvp\CRM_APP`, branch `feat/crm-mvp-ui`:
  - `P1B_CONTRACTS.md` (custom properties, filters);
  - `IMPORT_CONTRACTS.md`;
  - `CHARTS_CONTRACTS.md`;
  - `AUTH_PLAN.md` §1–3 (tenants and roles);
  - `ls migrations/` (the existing data model).

## Deliver `TSST/brands/t-sag/projects/crm/specs/ADS_REQUIREMENTS.md`
Keep it to about 2,500 words or less, and prefer tables to prose. It must contain:
1. **Segments:** a definition (dynamic saved filter over contacts and leads, including custom properties), the refresh model, the size estimate, and the use as an audience source. Give 5 example segments for an Egyptian SMB client (clinic, real estate, e-commerce).
2. **Tracking and journey data:**
   - capture of UTM, gclid, fbclid, ttclid and the first/last touch;
   - the touchpoint/event list with names and parameters;
   - lifecycle stages;
   - which CRM events become ad-platform conversions;
   - the consent model: per-contact marketing consent, its source and timestamp, aligned with Egypt PDPL Law 151/2020, and Meta/Google requirements.
3. **Meta (phase 1):**
   - Lead Ads ingestion (webhook);
   - Custom Audiences from segments (hashing and match keys);
   - Conversions API from CRM stage changes (event names, dedup, `event_id`);
   - app review, business verification and permissions Ahmed must start early, with the lead time for each.
4. **Google and TikTok (phase 2, short):** Customer Match, offline conversion import / Enhanced Conversions for Leads, TikTok Events API and Audiences. List only the deltas versus Meta.
5. **MVP cut:** what is a must-have for selling, and what is later. Include per-tenant connection (OAuth per client ad account) and the token-storage need. The dev task designs the storage itself.
6. **Open questions for Ahmed:** 5 at most.

## Budget rules (mandatory)
- Web: official docs only (developers.facebook.com, developers.google.com/google-ads, business-api.tiktok.com). Open about 12 pages at most, and cite the links you used.
- No repo-wide scans. Read only the files listed above.
- One pass, with no self-review loops. Stop after `done`.
- `done --skills-used` must list the skills you applied.
