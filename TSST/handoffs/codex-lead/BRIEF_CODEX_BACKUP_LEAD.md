# BRIEF · CODEX-LEAD-ROLE — Codex = backup Lead
ROLE A — team runtime (Codex, TEAM build). Owner decision 2026-10-09.

**Goal:** `TSST/bus/runtimes.yaml` → codex `roles: [lead]` (comment: backup Lead only while claude is limited; claude resumes Lead on return). Keep `lead_order: [claude]`.

**Why it failed before:** tests use `codex` as the example *non-lead* actor, so 4 checks break:
- `test_runtime_agents.py`: "limit kept other runtimes untouched", "limit --clear … byte-identical", "non-lead cannot limit another runtime"
- `test_bus.py`: "other runtime cannot set limit"

**Do:**
1. In those tests, switch the non-lead actor to a runtime with no lead role (e.g. `chatgpt`, or a temp-copy runtime without roles). Keep every assertion's strictness.
2. Edit `runtimes.yaml` with a targeted line edit. Preserve the file's existing line endings (LF) and the other uncommitted lines (codex `status: available`).
3. Add one line to `TSST/handoffs/LIMIT_FALLBACK.md`: when Claude is limited, Codex is Lead (DEEP model sparingly); Antigravity = file-work tool, Gemini app = research/image/video.

**Done when:** all scripts in `TSST/context/tests/` pass; `python TSST/bus/bus.py ls --me codex` shows `roles=['lead']`; report ≤12 lines at `TSST/handoffs/codex-lead/REPORT.md` with `Skills used:` + `skill_friction:`. No commit.
