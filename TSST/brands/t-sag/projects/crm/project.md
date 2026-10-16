# crm — project manifest

> **Moved 2026-10-16 (R48):** the CRM code and all CRM docs now live in the private repo `github.com/AhmedFouad01/tsst-crm` (local: `C:\Work	sst-crm`). This file stays as the TSST checkpoint pointer.


brand: t-sag · team: build (DEV) with studio (CREATIVE) for UI fidelity
Logical location only — the physical folders stay where they are.

| pointer | value |
|---|---|
| implementation | `/CRM_APP` (Node/TS, `web/`, `migrations/` 001–007, `tests/`) |
| blueprint | `/CRM_BLUEPRINT` |
| ui handoff | `/CRM_UI_HANDOFF` — canonical UI implementation contract (see note) |
| ui source | MagicPath project `457118534846255104`; UI Design System component `457127428263931904` rev `457288478946893824`; CRM MVP component `457264765073510400` rev `457288463620911104` |
| repository | git `master`, external gitdir `C:\GitMetadata\THE_SYSTRONIC_MARKETING_AGENTS.git` |
| checkpoint | `4ff20bd` (M2 post-close hardening) · M2 closure `3bd3fcb` / `a926b9d` |
| evidence | `CRM_APP/M0_EVIDENCE.md`, `M1_EVIDENCE.md`, `M2_EVIDENCE.md` (§ post-close hardening 2026-10-04), `CRM_APP/audits/` |
| memory | `TSST/brands/t-sag/memory/source.md` (durable RM lags; repo evidence wins) |

## State (verified 2026-10-04)
- M0 CLOSED · M1 CLOSED · M2 CLOSED · M2 post-close hardening COMPLETE.
- Local dev DB aligned through migrations 001–007; dev credentials rotated.
- UI prototype passed its design/UX gate. **Not** a production-code-complete claim.
- M3: NOT STARTED, not approved. M2 scope excluded connectors/OAuth/spend/production infra.

## UI handoff note
All files in `CRM_UI_HANDOFF/` (docs + prototype `.tsx/.css`) and the CRM_APP UX docs
(`MVP_*.md`, `CRM_UI_FOUNDATIONS_v0.1.md`, …) are **Google-native Docs** (`.gdoc`).
State in Claude/Codex: `SOURCE_UNREADABLE_IN_CURRENT_RUNTIME`. ChatGPT (Drive source) will
provide verbatim repo-native exports beside each `.gdoc` per `TSST/context/bridge.md`
(manifest `CRM_UI_HANDOFF/EXPORTS.yaml`). Do not recreate their content from memory.

## do_not_repeat
M0/M1/M2 work and audits; M2 hardening; Git recovery; credential rotation; DB
alignment; UI discovery — Screen Inventory, UX Audit, IA, UI directions, design tokens,
data workspace, RTL/LTR, responsive architecture — unless a concrete defect reopens one.

## Next (user decision 2026-10-04)
PAUSED until TSST Core consolidation is accepted. Then: CRM_UI_HANDOFF → implementation
mapping → CRM_APP production UI implementation. M3 NOT approved; UI discovery not reopened.
