# C4 VOC Reference Implementation

Reference only.

The tests prove basic safeguards:
- repeated notes from one account do not become a verified strength;
- duplicate source records do not inflate evidence;
- three independent accounts + outcomes can promote a candidate to VERIFIED_STRENGTH;
- CLAIM_READY is stricter;
- contradictory evidence blocks claim readiness;
- PII-bearing observations are excluded from derived durable memory;
- cause-based routing sends UX, measurement and expectation issues to the right domain owners.
