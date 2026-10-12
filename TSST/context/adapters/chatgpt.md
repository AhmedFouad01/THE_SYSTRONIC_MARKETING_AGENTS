# Runtime adapter — ChatGPT

ChatGPT does **not** auto-load repository files. The portable core must be supplied
through **Project Instructions** and/or **connected sources** (Google Drive connector /
Project Sources).

Request role: every request to ChatGPT states ROLE A (team runtime) or ROLE B (external tool) — `TSST/context/request-role.md`. A TSST ChatGPT Project is ROLE A; a plain chat or image edit is ROLE B.

## Required setup (user-performed)
1. Project Instructions: paste the short block below.
2. Connect sources: `TSST/context/boot.md`, `TSST/context/router.yaml`,
   `TSST/context/models.yaml`, `TSST/core/portfolio.yaml`, `TSST/core/rules.md`, and the
   active brand folder `TSST/brands/<brand>/` only.

```
You are a TSST runtime. Before any task, follow TSST/context/boot.md exactly:
resolve brand → project → status/checkpoint → rules → minimum context → team → skill →
tier. Load only the active brand. Read Google-native sources directly via Drive; if a
source has no authorised access path, answer MEMORY_SOURCE_UNAVAILABLE and do not guess. Never publish, spend, contact clients
or durably write Real Memory without explicit approval. Sync packets go to
REAL_MEMORY/TSST_REAL_MEMORY/07_SYNC_INBOX/chatgpt-gradual/incoming/ as proposals.
```

## Tier → model
Map tiers to the ChatGPT models available on the user's plan; IMAGE → native image
generation; final assets still pass the CREATIVE final asset gate.

## Memory access
Google Drive connector can read Google-native Docs → `SOURCE_AVAILABLE` for `.gdoc`.
ChatGPT is the authorised **Drive-read / export bridge** for filesystem runtimes: it
reads the `.gdoc` original and produces the verbatim repo-native export plus its
`EXPORTS.yaml` row per `TSST/context/bridge.md`. Repo-native `.md` must be added as
sources or synced to Drive (the working tree already lives in Drive).

Bus: `chatgpt` is `off` in `TSST/bus/runtimes.yaml` — it cannot run `bus.py` or write the
repo, so any output it produces must be relayed by the user. Last-resort bridge only.

Shared method: `TSST/context/workflow.md`. This manual surface prepares and reviews the same bounded task packet; it does not claim to execute the shell preflight. A receiving file-capable TSST host runs `preflight.py` before applying relayed repository changes, checks the original source/branch and uses the same authority and delivery gates. No new packet is required for a quick read-only answer.

Status: structural contract only; runtime launch cannot be automated from here.
