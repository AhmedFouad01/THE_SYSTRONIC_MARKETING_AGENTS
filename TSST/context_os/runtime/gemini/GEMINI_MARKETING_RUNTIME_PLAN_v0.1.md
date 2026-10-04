# TSST Gemini Marketing Runtime Plan v0.1

Status: PROPOSED / CONTROLLED PILOT
Purpose: Make Gemini/Antigravity the primary marketing-production runtime for TSST while preserving existing TSST roles, Context OS, decision rights and Real Memory authority.

## Runtime role

Gemini hosts TSST Lead orchestration for marketing work and invokes the existing LENS / CREATIVE / SPARK operating logic. Gemini is a runtime, not a new TSST agent.

## Recommended surfaces

1. Gemini / Gemini Enterprise: interactive marketing command center and connected business data.
2. Antigravity 2.0: multi-agent orchestration and parallel workflows.
3. Antigravity CLI: terminal/headless automation, skills and MCP.
4. Gemini API media models: image/video generation pipelines.

## P0 skills

- TSST Context OS recovery and isolation.
- Marketing orchestration / handoff discipline.
- LENS research/evidence/positioning/planning.
- CREATIVE art direction and production.
- Image generation/editing and reference fidelity.
- Video generation/editing/continuity.
- SPARK paid-media/measurement.
- Final asset QA.

All adapter wrappers start UNVALIDATED. Existing TSST specialist validation states are not promoted.

## P0 connectors / capabilities

1. Canonical TSST project source (repo/local-synced Drive) — mandatory.
2. Google Search grounding — research/freshness.
3. Google Drive — briefs, brand assets, plans, handoffs, final assets.
4. Native Gemini image generation/editing — still production.
5. Native Veo/Omni video generation — video production.

If using Gemini Enterprise, Google Workspace data connectors require an eligible Workspace organization; do not assume consumer Gmail supports the Enterprise connector path.

## P1 connectors

- Gmail — client/internal correspondence, approvals and intake; start read/draft before send.
- Google Calendar — campaign/production schedule and meetings.
- Google Chat or Slack — team/project updates.
- HubSpot — CRM/VOC/lead quality/revenue-feedback data; initial scope read-only unless separately authorized.
- GitHub — repository/configuration/version evidence when needed.
- Google Ads MCP — performance/account reads first; mutation tools remain disabled unless explicitly approved.

## P1 creative extensions / handoffs

- Adobe/Figma/Magnific or equivalent production tools can remain specialist finishing surfaces when native Gemini generation is insufficient for exact compositing, layout, timeline editing or delivery QA.
- Do not call unsupported third-party tooling a native Gemini connector. Use a verified MCP/extension or explicit cross-runtime handoff.

## P2 marketing-data integrations

Prefer read-only first:
- Meta Ads / Insights via approved API or MCP adapter.
- TikTok Ads via approved API or MCP adapter.
- GA4 / Search Console.
- YouTube Analytics.
- Shopify / ecommerce.
- first-party CRM/data warehouse.
- BigQuery / Data Agent Kit if/when TSST centralizes marketing data in Google Cloud.

## Native Google media capability mapping

At the time of this plan, Google documents:
- Gemini 3.1 Flash Image / Nano Banana 2 for high-volume image generation/editing.
- Gemini 3 Pro Image / Nano Banana Pro for professional high-quality/4K, complex layouts and text.
- Veo 3.1 for cinematic video with reference/style/character controls, camera controls, first/last frame, extension and native audio.
- Veo 3.1 Lite for lower-cost iteration.
- Gemini Omni Flash for fast video generation/editing/extension with audio.
- Lyria family for music generation; usage rights still require project-specific review.

Runtime model IDs are volatile and must be rechecked when executing.

## Connector security defaults

- No credentials in Context OS, GEMINI.md or skills.
- Read-only first for CRM/ad/analytics connectors.
- User approval required for publication, spend, customer communication, account mutation or release.
- Scope connectors per client/project to preserve isolation.
- Log evidence, source and action result in checkpoint/handoff.

## First controlled pilot

Pilot task should be one real marketing package with no publication:
1. recover TSST state;
2. LENS builds evidence/creative brief;
3. CREATIVE produces 3 visual directions;
4. generate one still set (1:1, 4:5, 9:16);
5. generate one short video concept/render candidate;
6. run Final Asset QA;
7. SPARK adds test hypothesis and measurement requirements;
8. Lead returns one review pack;
9. checkpoint captures completed, defects, do_not_repeat and next action.

Success criteria:
- no project-context leakage;
- no unsupported claims;
- correct skill activation;
- brand/reference fidelity;
- actual media outputs, not only prompts;
- clear QA state;
- no unauthorized external action.
