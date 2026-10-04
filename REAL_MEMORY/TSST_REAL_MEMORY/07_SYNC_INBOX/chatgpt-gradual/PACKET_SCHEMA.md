# TSST — Gradual Sync Packet Schema

Required fields:
- `packet_id`
- `project_key` = `TSST`
- `timestamp`
- `source_chat`
- `current_milestone`
- `current_gate`
- `confirmed_changes[]`
- `decisions[]`
- `files_links[]`
- `pending[]`
- `risks_blockers[]`
- `memory_targets[]`
- `uncertainty_notes[]`
- `reviewer_status`

Validation rules:
- Reject wrong project key.
- Reject silent cross-project targets.
- Flag missing source/uncertainty for claims that cannot be verified.
- Do not convert proposals into accepted decisions without explicit approval.
