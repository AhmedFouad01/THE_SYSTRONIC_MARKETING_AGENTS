# TSST Gemini Connector & Skill Matrix v0.1

| Capability | TSST owner | Gemini mechanism | Priority | Initial authority |
|---|---|---|---|---|
| Project/current-state recovery | Lead / Context OS | GEMINI.md + tsst-context-os | P0 | Read |
| Research & evidence | LENS | Search grounding + Drive | P0 | Read |
| Strategy/content planning | LENS / Lead | tsst-lens-strategy | P0 | Draft |
| Social/key visual production | CREATIVE | Gemini image models | P0 | Draft/render |
| Image editing/reference fidelity | CREATIVE | Gemini image editing + references | P0 | Draft/render |
| Short-form/cinematic video | CREATIVE | Veo/Omni | P0 | Draft/render |
| Creative QA | CREATIVE | tsst-final-asset-qa | P0 | Internal review |
| Paid-media planning | SPARK | tsst-spark-performance | P0 | Draft |
| Drive asset/project access | Lead/CREATIVE/LENS | Google Drive connector/local sync | P0 | Read/write internal |
| Gmail | Lead | Workspace connector | P1 | Read/draft first |
| Calendar | Lead | Workspace connector | P1 | Read/draft first |
| HubSpot CRM/VOC | Lead/LENS/SPARK | Gemini Enterprise connector | P1 | Read-only first |
| Google Ads | SPARK | Google Ads MCP | P1 | Read-only first |
| GitHub | DEV/Lead | Gemini Enterprise connector / MCP | P1 | Read-first |
| Slack/Google Chat | Lead | Enterprise connector | P1 | Read/draft first |
| Meta Ads | SPARK | custom approved API/MCP | P2 | Read-only first |
| TikTok Ads | SPARK | custom approved API/MCP | P2 | Read-only first |
| GA4/Search Console | SPARK/LENS | API/MCP | P2 | Read-only |
| YouTube Analytics | SPARK/LENS | API/MCP | P2 | Read-only |
| Shopify/ecommerce | Lead/SPARK | API/MCP | P2 | Read-only first |
| BigQuery/Data Cloud | LENS/SPARK | Data Agent Kit / MCP | P2 | Read-only first |
| Figma/Adobe/Magnific finishing | CREATIVE | verified MCP/extension or cross-runtime handoff | P1/P2 | Internal production |

## Notes

- “Plugin” is not the primary Gemini integration concept here. Prefer native Workspace/Enterprise connectors, Agent Skills, Extensions and MCP servers.
- Unsupported integrations must stay labeled as proposed until a real connector/MCP path is verified.
- Connector availability depends on Gemini product edition and account type.
