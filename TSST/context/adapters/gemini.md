# Runtime adapter — Gemini / Antigravity

Bus runtime id: `gemini`. First bus task is its cold-start probe (`PROBE-001`); until it is
closed, all its capabilities stay `unverified`. Near a usage limit: `release` with a resume
note, then `limit gemini --until <UTC>` (`TSST/context/bus.md`).

Entry: root `GEMINI.md` → `TSST/context/boot.md`. Existing marketing/creative detail in
`GEMINI.md` and `TSST/context_os/runtime/gemini/` remains valid; boot.md wins on
operating order.

## Tier → model
Antigravity picks the model in its UI per conversation (menu: Gemini Flash, Gemini Pro,
Claude Opus 5.5 — each low/high); it cannot switch itself. Mapping
(`TSST/bus/runtimes.yaml#gemini.tier_*`): FAST → Gemini 3.8 Flash · low · WORK/CODE →
Claude Opus 5.5 · high (user decision 2026-10-05: Flash under-performed on creative work in
C7) · DEEP stays with lead. Claim with
`--model <current model>`; on a mismatch follow `TSST/context/bus.md#model-per-tier`. IMAGE / VIDEO → native Gemini image
and video generation (e.g. Veo) where enabled; outputs still pass
`TSST/CREATIVE/FINAL_ASSET_GATE.md`.

## Memory access
- `.gdoc`: **not readable** in Antigravity without a Drive API extension (PROBE-001,
  2026-10-04) → `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`. With such an extension it may act
  as a bridge per `TSST/context/bridge.md` once `drive_docs_read` is verified in
  `TSST/bus/runtimes.yaml`.
- Resolve `drive:<path>` against the user's My Drive.
- Skills: `.agents/skills/*` (Antigravity skill format).

Status: CONTROLLED PILOT / UNVALIDATED. Cold-start not yet executed in this runtime.
