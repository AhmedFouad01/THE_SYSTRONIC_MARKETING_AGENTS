# R08 single user-content fields

Registry labels and descriptions are scalar strings in requests/responses (NFC trimmed, bounded, control characters rejected). The registry retains JSONB storage for additive compatibility, containing a JSON string rather than an AR/EN object. Pipelines and stages already use one text name. Import target labels and property search use the same canonical string. User names keep their script in either UI locale and use auto direction with bidi isolation on display.

Migration 027 preserves the original label/description in recovery columns. Tenant primary_language selects en/ar when both nonempty; existing tenants default to en because no prior tenant language exists. Empty preferred values fall back to the other. Alternate labels are saved in content_audit_note. Earlier owner-only seeds normalize through the same trigger; repeat seeds preserve counts and tenant edits. Application versions must be upgraded with 027: old paired API requests are rejected. Forward recovery uses the saved originals; no destructive down migration is supplied.

System labels that still match the seeded default expose a chrome label_key for bilingual display. Renamed labels remain one user string. Recovery/audit fields are excluded from public schema and import projections. RLS remains enabled/forced, and new helper/definer functions have PUBLIC privileges revoked.
