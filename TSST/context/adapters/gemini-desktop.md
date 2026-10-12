# Tool adapter — Gemini Desktop (manual external tool)

TSD-018 (2026-10-06). Gemini Desktop is an **external tool**, not a TSST runtime or agent.
It is not Antigravity (retired, ADR-004) and there is no GEMINI_AG. No roster, routing or
governance change.

Request role: every request to this tool states ROLE A (team runtime) or ROLE B (external tool) — `TSST/context/request-role.md`.

Setup (Gem + Real Memory link): `REAL_MEMORY/TSST_REAL_MEMORY/06_HANDOFF/GEMINI_GEM_INSTRUCTIONS.md`.

## Which surface runs the request (user, 2026-10-08) — write the request for that surface
The same "Gemini request" behaves very differently depending on where Ahmed runs it:

| | **Gemini app** (Pro, Deep Research) | **Antigravity** (agentic IDE, external tool only, never a TSST runtime per ADR-004) |
|---|---|---|
| Local files (G:\, repo paths) | **cannot read them.** Paths in the prompt are dead text. | reads and writes them |
| GitHub / local CSV / repo index | no; paste the text or upload the file | yes |
| Shell commands | no | **yes, by default.** It ran URL checks and read boot.md despite "no shell" (GEM-SV-001/003). |
| Research depth | real Deep Research (many pages, citations) | a handful of quick searches → weak or dead URLs (GEM-CR-003/005/006, GEM-SV-001/003) |
| Output | stays in the chat; Ahmed exports it to Docs or pastes it into `<REQ-ID>_out.md` | writes `<REQ-ID>_out.md` itself |
| Chat context | reuses old chats; GEM-CR-007 was read as an "email draft" in a stale chat | per-conversation |

Rules:
- **Research → Gemini app Deep Research, in a NEW chat.** The prompt must be self-contained and paste-ready: no local paths, no "write file X", no "read the repo". Any file it needs is uploaded by Ahmed (named in the request). The output comes back as text or an export, and Ahmed saves it as `<REQ-ID>_out.md`.
- **File/repo work → Antigravity**, with ROLE B and an exact read list + one output path. Expect it to run commands; any edit outside the output path is reviewed and reverted (request-role.md rule 2).
- Every request names its surface on line 2: `SURFACE: Gemini app (Deep Research, new chat)` or `SURFACE: Antigravity`.
- Whatever the surface, facts that can block a launch (ad policies, legal, platform specs) are verified on the live official page by a team agent or the Lead before use.

## When
Any TSST agent may recommend it when it is the best tool for the task — typically
IMAGE/VIDEO generation (no native path in Claude/Codex), very long inputs (large docs,
video) or deep web research. The recommendation goes in the agent's return packet.

## Flow
`agent → Lead → Ahmed → Gemini Desktop → Ahmed → Lead/agent QA`
1. The responsible agent prepares the handoff (template below).
2. The Lead packages it for Ahmed — one file per request:
   `TSST/brands/<brand>/projects/<project>/gemini/<REQ-ID>.md`.
3. Ahmed runs it manually and saves the output beside it (`<REQ-ID>_out.*`).
4. The responsible agent reviews; the Lead accepts, rejects or iterates.

## Handoff template
```
GEMINI REQUEST <REQ-ID> · brand · project · from <agent> · <date>
ROLE:            EXTERNAL TOOL — <one job>; write only <REQ-ID>_out.md (block: TSST/context/request-role.md)
OBJECTIVE:       one sentence
CONTEXT:         minimum memory/facts needed (no other brands)
FILES/ASSETS:    paths to attach (exact approved logo files where identity matters)
REFERENCES:      links/paths
PROMPT:          exact text to paste
CONSTRAINTS:     brand, language/RTL, sizes, what must not change
OUTPUT:          format, count, file names
ACCEPTANCE:      checks the agent will run on return
```

## Rules
- Output is **input, not a deliverable** (as R2): the responsible agent reviews it and the
  Lead accepts it. Images/video pass `TSST/CREATIVE/FINAL_ASSET_GATE.md`; approved logos
  are composited, never regenerated.
- Data: no credentials/secrets ever. Sensitive client data needs explicit user approval
  and a privacy check per request before it goes to Gemini. (Keep Activity is not a
  required setting: turning it off disables most Connected Apps, incl. Workspace/Drive.)
  Public/marketing material (posts, images, video, logos, brand guidelines, copy, published
  product info) needs no per-request approval. Sensitive = customer lists/CRM data,
  contracts, internal prices, internal sales/ad numbers, embargoed campaigns.
- Gemini output never writes Real Memory directly; facts in it are proposals.

## Approved two-stage production bridge — 2026-10-12
For bounded creative execution via Ahmed, follow `TSST/context/external-production.md` (core R41): English request, production/report first, owner review, then a separate delivery-only request with explicit write scope. Antigravity remains an external tool; the Gemini app and file-capable Antigravity surfaces are not interchangeable. Preserve readable request/report/review files.
