# R10 lead contact contract
Lead create and update require at least one normalized, active email or E.164 phone on the linked contact. Names and UUIDs alone do not qualify.
API and import call `requireLeadContact` inside the transaction after channel writes and before evidence; future Lead Ads ingress must use this same gate and existing normalized/encrypted channel writers.
No Lead Ads connector exists yet. The gate needs no sensitive.read and never decrypts. Lead row authorization still applies.
Scalar null/blank clears a channel by deactivating its encrypted history; valid replacement activates only the chosen value. Historical ciphertext/digests/provenance remain for identity/import matching.
Existing leads remain intact. `missing_contact` is a derived boolean on authorized lead reads, with the boolean `eq`/`neq` list filter and Missing contact preset.
Import lead rows require a valid email or phone even when contact_name is supplied; errors use CONTACT_REQUIRED and are localized by the AR/EN clients. Reused contacts reactivate valid incoming historical identifiers before the gate.
CONTACT_REQUIRED uses an English safe_message by default or Arabic when Accept-Language starts with ar. UI/import row errors use AR/EN translation keys. CONTACT_REQUIRED (422, contact_channels) rejects the whole API write atomically; invalid format is VALIDATION_FAILED. Idempotent replay returns the committed result without another mutation.
