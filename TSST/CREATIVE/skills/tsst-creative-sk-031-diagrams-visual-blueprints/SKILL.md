---
name: tsst-creative-sk-031-diagrams-visual-blueprints
description: Use when asked for a system diagram, flowchart, roadmap, blueprint or to "visualise our system/plan/process" - choose the diagram type, size and budget it, spec nodes and arrows, preview cheaply, then draw in MagicPath and QA.
version: 0.1
---

# TSST-CREATIVE-SK-031 Diagrams & Visual Blueprints

Status: `UNVALIDATED`
Owner: CREATIVE_AG
Origin: lesson L-005; evidence `TSST/handoffs/visual-blueprints/` (VB-1..VB-3), `TSST/services/gemini/GEM-SV-004_out.md`, friction rows dated 2026-10-09.
Scope: static structure diagrams (system, flow, roadmap) for TSST, projects, services and processes. Not for dashboards/charts (SK-029), app navigation (SK-020) or brand direction boards (SK-008).

## Objective
Turn a "show me the system/plan" request into a readable, factual, owner-approved diagram with the fewest tokens and redraws.

## Trigger
System diagram, flowchart, roadmap, blueprint, map, or "visualise our system/plan/process" requests.

## Workflow
1. **Decide purpose** (1 line): who reads it, what decision it supports. No purpose = no diagram.
2. **Choose type** (table below). One diagram answers one question.
3. **Inventory + size** the subject: list candidate nodes with source paths; size S/M/L; apply the budget.
4. **Write the spec** (nodes, arrows, labels, legend, sources) as plain text. Get Lead/owner OK on the spec if it is L or contested.
5. **Rough preview** for owner OK (see below). Do not draw the final before this.
6. **Draw** in MagicPath on the approved layout.
7. **Readback + QA**, then Lead visual review in the browser.

## Type choice
| Type | Use when | Must show |
|---|---|---|
| System diagram | parts and how they relate (who talks to whom, what is kept where) | named components grouped by role, directed relationships, boundaries, inputs and outputs of the system |
| Flowchart | one process with an order and decisions | single start, ordered steps, labelled decision branches, end states, loops back as explicit arrows |
| Roadmap | stages or phases over time/priority | stage order, owner or dependency per stage; dates only if sourced; say whether it is a product release roadmap or a production roadmap |
| Lifecycle inset | a state machine inside a bigger map (e.g. task states) | states as small nodes, allowed transitions only, one entry and one exit; an inset, not part of the main flow |

If the subject needs two types, draw two views, not one hybrid.

## Inventory and sizing rubric
- S: one flow, one actor group, up to 8 nodes.
- M: several stages or 2-3 actor groups, 9-16 nodes.
- L: multiple interacting subsystems, over 16 nodes.

Budget (fixes the LENS-SK-001 friction: no page/node rubric):
- Max **16 nodes per view** (arrows excluded; an inset counts its nodes). Max about 24 arrows.
- Over budget: split into one **overview** (groups as single nodes, up to 10) plus one **detail view per group**. Never shrink text to fit.
- One page per view. Plans list views as rounds (one dispatchable round per view, or a pair of S views).
- Inventory row fields: area, type (system / project / service / process), existing visuals (path or none), missing diagram type, source paths, size S/M/L.

## Spec before drawing
The spec contains:
- **Nodes**: id, exact label, group, source path. No node without a source, unless marked "Proposed".
- **Arrows**: from -> to, meaning (relationship, sequence or "informs"), solid or dashed. Branches are separate arrows. No hidden sub-nodes.
- **Labels**: short (about 4 words max), sentence case, in the audience language; detail goes in a footnote, not in the node.
- **Colors**: at most 3, each with a meaning (e.g. people deciding / records kept / runtimes and tools). Neutral gray for the rest.
- **Legend**: small corner swatches (about 30 px squares) plus text, outside the flow area. Never legend boxes that look like nodes, never arrows touching them.
- **Fact vs proposal**: documented structure is plain; editorial or unverified structure carries the label "Proposed blueprint". Arrows from inventories mean proposed progression, not integration, unless a source says so.
- No dates, KPIs or numbers that are not in a source. No invented stages.

## Rough preview first
The owner prefers seeing to reading, and a wrong final drawing wastes tokens. Before the real drawing:
- Produce the cheapest visual: boxes in chat, or a small HTML/SVG sketch (gray boxes, correct topology, no styling).
- Show topology, groups, direction and legend position; ask one question: "Is this the right map?".
- After approval, redraws are for readability only; layout changes need a new owner OK.

## Drawing in MagicPath
- Who: only a **main session** with the MagicPath plugin connected (Claude Lead or Codex, owner signed in). Subagents cannot call it: they return the approved spec and request the main session.
- Follow the plugin guide (open a code/canvas session before creating or editing); use native shapes (rounded rectangles, arrows, text).
- **Edit the existing canvas** for corrections: no redraw, no rearranging beyond the request (edits are not in undo history). Keep ids, connectors and strings unchanged unless the fix says otherwise.
- Layout: left-to-right, grouped by role, equal node size per role, generous spacing, frame tightened to content.
- **Readability at fit-to-screen**: labels must stay legible when the whole frame is fit to screen. Rule of thumb: a frame wider than about 2500 px, or label text under about 1.5 percent of frame width, means enlarge text and nodes or split the views.
- **Readback checks**: report counts of frame / geo / text / arrow / line shapes; confirm every spec label string is present, every arrow has both endpoints, no node overlaps or overflow, legend swatches separate from flow. Rendered text bounds need a browser view; if the browser fails, report "readability unverified".
- Export PNG/SVG is optional; skip when the browser fails and say so.

## Data limits (GEM-SV-004)
Structure only. Send to MagicPath: TSST system structure, project roadmaps and flows, our own UI kit. Never: client Real Memory, customer data, credentials, `.env`, ad-account data. Brand projects use generalised node names unless the owner approves client names. The plugin stays an UNVALIDATED external tool until reviewed.

## QA checklist
- Purpose line exists and the type matches it.
- Within node/arrow budget; overview + detail if not.
- Every node has a source or the "Proposed" label; no invented facts.
- Labels short, sentence case, spelled as in the spec.
- At most 3 colors with meaning; legend is corner swatches only.
- Readback counts match the spec; no overlaps.
- Fit-to-screen readable (Lead browser check); gaps stated.
- Report (at most 10 lines): link, what is drawn, gaps, skills used, `skill_friction`.

## Stop conditions
- Over budget and the owner has not approved a split.
- Sources conflict on a fact: list the conflict, do not choose.
- Needs private data or an unapproved client name.
- MagicPath not connected, or caller is a subagent: return the spec and request the main session.
- Two failed readability fix rounds: `ESCALATE_TO_DEEP` with screenshot and counts.
- Readiness stays `NOT_READY`.

## Output contract
Spec (nodes, arrows, legend, sources); rough preview; MagicPath link; readback counts; gaps; skill_friction.

## Changelog
- v0.1 (2026-10-09): created from VB-1..VB-3 evidence and lesson L-005; UNVALIDATED.
