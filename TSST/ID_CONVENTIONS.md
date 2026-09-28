# TSST identifiers

Skills: `TSST-LEAD-SK-###`, `TSST-CREATIVE-SK-###`, `TSST-LENS-SK-###`, `TSST-SPARK-SK-###`.
Evaluations: corresponding `TSST-<ROLE>-EV-###`. Evaluation numbers are unique per role, not a claim that the matching skill has run. Retests get a new evaluation ID; record the skill ID and prior run explicitly. CREATIVE evaluation 011 is the existing remediation run stored in the append-only evaluation 008 file.
Shared work packages: `TSST-WP-###`. Handoffs: `TSST-HO-###`. Architecture/operating decisions: `TSST-ADR-###`. Pilots: `TSST-PILOT-###`.

Reserve the next unused number in the appropriate index before creating a record. Never recycle an ID. Read [evaluation index](EVALUATION_INDEX.md) and [historical map](../LEGACY_ID_MAP.md). Lead evaluation 001–030 are reserved but not designed or run. Specialist evaluation IDs correspond to the existing 19 record files plus remediation 011. Pilot 001 is proposed only. No work-package or handoff instance was created during migration; templates are not active instances. ADR 001 records this migration.

Use lowercase canonical skill folder names with the same role and number. Official agent names are TSST Lead, CREATIVE_AG, LENS_AG, SPARK_AG and DEV_AG; canonical directories are LEAD, CREATIVE, LENS, SPARK and DEV under TSST.


## Registered DEV namespace — 2026-09-28

Reserve `TSST-DEV-SK-001`–`TSST-DEV-SK-016` for the [DEV core catalog](DEV/SKILL_REGISTRY.md). Registered official name: DEV_AG; directory: `TSST/DEV/`; package folders: lowercase `tsst-dev-sk-###-<slug>`. These IDs do not create evaluations or authorize execution. [TSST-ADR-002](decisions/TSST-ADR-002.md) records governance registration approval only. Future DEV evaluation records would follow `TSST-DEV-EV-###` only when separately authorized and reserved in the evaluation index.
