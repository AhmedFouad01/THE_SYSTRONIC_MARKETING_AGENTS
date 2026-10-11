# TSST teams — operating hierarchy

```
TSST LEAD            (TSST/LEAD/AGENT.md)    intake · recovery · routing · conflict · review · synthesis
├── MARKETING        manager: LENS_AG        (+ performance capability: SPARK_AG assets)
├── STUDIO           manager: CREATIVE_AG    (internal worker DESIGNER_AG; static design, brand, UI, final brand check on video)
├── MOTION           manager: MOTION_AG      (AI-shots-first short-form video and motion; TSST-ADR-005)
└── BUILD            manager: DEV_AG
```

This is an **operating mapping**, not a rename. Agent records, IDs, skills, evaluations
and readiness states under `TSST/LEAD`, `TSST/LENS`, `TSST/SPARK`, `TSST/CREATIVE`,
`TSST/DEV` are unchanged and remain the evidence of record. All agents remain
`NOT_READY` per `TSST/READINESS_REPORT.md`; decision rights per `TSST/TSST_DECISION_RIGHTS.md`.

MOTION_AG was promoted from a CREATIVE internal worker to an independent team manager by TSST-ADR-005
(governance registration only; NOT_READY; skills UNVALIDATED).

Compatibility: SPARK_AG keeps its ID and skills; in routing it is the MARKETING
performance/paid-media capability rather than a separate top-level manager. Any formal
roster change requires a TSST ADR approved by the user (not done here).

Skill loading (TSST-ADR-003): one entry point `TSST/skills/index.yaml`; write a Skill Plan; load ≤3 packages unless the plan names
more. Never load a whole registry.
