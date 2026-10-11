# GEM-SV-004 · MagicPath plugin security review
SURFACE: Gemini app (Deep Research, new chat)
ROLE B — external research. Paste everything between the lines into a NEW chat. Save the answer as `GEM-SV-004_out.md` next to this file.

---
ROLE B — external research only. No local files. Every claim needs a live working URL; write "not confirmed" instead of guessing.

A small agency wants to install the MagicPath (magicpath.ai) plugin into Claude Code on Windows, using:
`claude plugin marketplace add MagicPathAI/magicpath-agent-plugin` then `claude plugin install magicpath@magicpath`, then sign-in via OAuth in the browser.

Review it for safety and give a verdict:
1. Publisher: is GitHub repo MagicPathAI/magicpath-agent-plugin official (linked from magicpath.ai)? Stars, last commit, maintainers, license.
2. What the plugin installs: list every component in the repo (MCP server URL or local command, skills, slash commands, hooks, agents). Flag any hooks or local scripts that run automatically.
3. Permissions/data: what the OAuth grant allows; what data leaves the machine (prompts, local files, code?); where it is stored; privacy policy + data-retention + training-use terms (quote section titles + URLs).
4. Known issues: security advisories, GitHub issues about security/data, incidents.
5. Capabilities for our use: can an agent create/edit canvases for (a) a UI component library, (b) flowcharts / system diagrams / roadmaps? Export formats (code, images, PDF)? Pro-plan limits.
6. Verdict: INSTALL / INSTALL WITH LIMITS (state them) / DON'T INSTALL — with 3–5 reasons.
Output: short structured report, ≤ 1.5 pages, sources listed per section.
---
