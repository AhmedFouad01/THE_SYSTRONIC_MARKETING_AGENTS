YKMS-02G progress saved on 2026-07-11.


Current verified baseline
Local branch: ykms-02f-ui-ux-operational-completion
Applied commits: 44d13f5, 4d23754, 6cfdc7b
Local verification: API tests 54/54 passed and admin build passed.
YKMS-02F and YKMS-02G are not yet confirmed on GitHub remote.


YKMS-02G scope
02G-A Navigation and POS product cards
02G-B Kitchen and Order Details
02G-C Menu, Product Images, Excel Import and Export
02G-D CRM and Users/RBAC


02G-A local progress
Claude reported checkpoint 5f73ff7.
Reported changes: duplicate header cleanup, RTL navigation correction, Product Card redesign, structured size and bread options, migration 009, tests 58/58, and admin build passed.
This checkpoint is not confirmed on GitHub remote.


02G-B current progress
A Kitchen metric bug was identified: stale open orders polluted average preparation time.
Correct completed preparation time must use submitted_at to ready_at.
Planned endpoint: GET /kitchen/metrics.
Required metrics: average, median, within SLA, late, preparing, and ready waiting.
Stale orders must be tracked separately and excluded from completed-order averages.
No confirmed 02G-B commit yet.
