# Tool adapter — Gemini Desktop (manual external tool)

TSD-018 (2026-10-06). Gemini Desktop is an **external tool**, not a TSST runtime or agent.
It is not Antigravity (retired, ADR-004) and there is no GEMINI_AG. No roster, routing or
governance change.

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
- Data: no credentials/secrets ever. Before client or private data, Ahmed confirms the
  Gemini account does not use activity for training (Gemini Apps Activity off).
- Gemini output never writes Real Memory directly; facts in it are proposals.
