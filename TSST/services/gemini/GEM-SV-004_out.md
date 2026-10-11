# GEM-SV-004 · out — MagicPath plugin security review
Source: Gemini app Deep Research, shared 2026-10-09 (https://share.gemini.google/3bfKJUcjyTn7). Lead-verified against the live repo the same day.

## Gemini verdict: INSTALL WITH LIMITS
- Install commands match official docs (magicpath.ai/documentation/features/external-agents).
- Capabilities fit: UI components (React/HTML/CSS/SVG export, zip), flowcharts/diagrams/wireframes. PDF export not confirmed. Pro $21/mo: unlimited external-agent calls, 600 UI credits/month.
- Risks: docs say the agent uses local files/code as context; retention terms gated to Enterprise; model-training use of inputs **not confirmed**. No known CVEs/incidents found.

## Lead verification (github.com/MagicPathAI/magicpath-agent-plugin, read 2026-10-09)
- Gemini partly reviewed a different repo (`magicpathai/agent-skills`, 91★). The real install repo: same org, MIT, 7 commits, 2★.
- Contents: `plugin.json`, `mcp.json` (remote MCP over Streamable HTTP), `skills/magicpath/` (SKILL.md + 4 references), `.claude-plugin/` shim, assets. **No hooks, no local scripts.**
- Auth: OAuth via Claude Code `/mcp`; scopes `magicpath:read`, `magicpath:write` (api.magicpath.ai).
- Data leaves only through MagicPath tool calls the agent makes → controllable by our rules.

## Install limits (TSST)
1. Send only: TSST system structure, project roadmaps/flows, our own UI kit. Never: client Real Memory, customer data, credentials, `.env`, ad-account data.
2. Brand projects: generalised node names unless the owner approves client names.
3. Plugin = UNVALIDATED external skill (rules.md R8) until first round reviewed.
