YAKEBDA MS — FULL CHAT SYNC
Date: 2026-07-17
Project: YAKEBDA_MS
Status: Reporting PR #44 under corrective work; no merge authorized


1. Current verified GitHub state
- Repository: AhmedFouad01/yakebda-ms
- main saved/live base for PR #44: 58d60152d4b0eba43a0a4c3a521b9a2a44f16f7a
- PR #42: Inventory Sprint 1, Draft
- PR #43: Inventory Sprint 2, Draft
- PR #44: Reporting Foundation, Open / Draft / Mergeable
- PR #44 branch: feature/reporting-foundation
- PR #44 head at audit start: bbd70d709dc941753ca1c6d6bfcfe3130e21b4a5
- PR #44 CI run 29593995302 passed on the exact audited head.
- No deployment.


2. Team split
- Claude: Inventory Sprint 3 — Operations on feature/inventory-admin-operations, stacked above PR #43.
- ChatGPT: Reporting Foundation corrections on PR #44, independent from Inventory stack.
- Kimi/Graphify experiment was stopped after excessive Claude usage; no further full semantic Graphify scan is authorized.


3. Permanent cancelled scopes
- Old Inventory UI recovery.
- Legacy Inventory adoption and schema repair.
- Rescue UI reuse.
- Work on ykms_main_qa_clone.
- Any modification of the original ykms database.


4. Reporting PR #44 audit decision
Decision: REQUEST CHANGES. Keep Draft. Do not merge or mark Ready before local review.


Nine corrective work items authorized by the user:
1) Expand ReportDefinition/Registry contracts, including dimensions, measures, supported outputs, default template key, typed filters and per-report permissions.
2) Introduce a real Report Run identity/contract or accurately rename metadata; include run/version/scope identity needed for deterministic future screen/export parity.
3) Align catalog and API by separating sales trend, branch and source reports into distinct report runs/endpoints or one explicit composite definition.
4) Fix historical source snapshot semantics and define top-product measures/grouping with stable product identity and explicit gross/net semantics.
5) Define and implement all-branches timezone policy accurately.
6) Fix stale-result UI behavior and make bootstrap/catalog/branches retryable.
7) Add missing scope, timezone, snapshot, duplicate-name, refund/unpaid and stale-state tests.
8) Remove the obsolete reportRoutes implementation from restaurant.ts.
9) Add the ECharts adapter and complete local real-browser visual QA before Ready; no visual-QA success may be claimed from code inspection.


5. Audit findings that must remain visible
- Current ReportDefinition is too narrow and hardcodes reports.view.
- Current ReportRunMeta is not a persistent or uniquely identified run.
- /reports/sales mixes three catalog definitions under sales.trend metadata.
- Source report prefers current source name over order snapshot.
- All-branches mode currently defaults to Africa/Cairo.
- Top-products uses name_ar grouping and unclear sales semantics.
- Applying a failing filter can leave old data visible under new controls.
- Bootstrap retry does not reload catalog/branches.
- Invalid API numeric data is coerced to zero.
- Report timestamp is formatted in browser timezone.
- unpaid handling differs between reports.
- Legacy report routes remain as dead code.
- SVG chart layer is insufficient as the final reporting visualization layer.
- Manual visual QA is still pending.


6. User authorization and gates
Authorized:
- Modify feature/reporting-foundation.
- Create focused commits for the nine corrections.
- Update PR #44 while keeping it Draft.
- Run CI and produce a commit-by-commit report.


Not authorized:
- Merge.
- Mark Ready.
- Retarget/rebase published branches.
- Force push.
- Deployment.
- Destructive cleanup.


7. Required end state
- All corrections pushed to PR #44 as auditable commits.
- Exact head and CI reported.
- Local visual QA remains a user review gate.
- A final commit report is appended to this document after implementation.




8. Final implementation result
- Nine audit corrections implemented on feature/reporting-foundation.
- Final exact head: b3559c4973eacac949ebc13b6fdc3b7e2bd762a2
- PR #44 remains Open / Draft / Mergeable.
- Final exact-head CI: run 29598268332, run #400, SUCCESS.
- Passed: contracts, API TypeScript, migration idempotency, full API tests, global color contract, Admin tests and Admin production build.
- No merge, Ready transition, deployment, rebase or force push.
- Local real-browser visual QA remains pending on the exact final head.
- ECharts production gate remains: vendor the pinned asset or add it through the normal npm/package-lock workflow before deployment.


9. Corrective commit ledger
- 3a6c8fe092a88c43ed92eda5a6ffb1fd377cd5d6 — expand registry and response metadata contracts.
- bc586790c71d3f68970323d1e3551080f1fda4a4 — typed catalog permissions, dimensions and measures.
- f7c92e8ab16073e772ad6ed458f74f9f99d79d7e — split report runs and enforce scope/timezone/snapshot semantics.
- ac18b1cdb91ff0d9699ae03d5bdc2c247de44699 — call distinct report endpoints from Admin.
- 04891a3af54cfb1326b08465c7328f316e32dc3d — prevent stale results and separate bootstrap retry.
- 76a75fdbff928be3816c1821a97e125d6398b0f4 — format timestamps in the effective timezone.
- 0f15c5d32cd50adf23e944e5019c1e071ef8a6ee — clarify gross/net, timezone and response metadata labels.
- c5d10302e251ddaf616b7a61a43a1f319fae78af — API tests for scope, snapshots, refunds and product identity.
- 32350b55ff26b4394d16b89e504350c778ab275f — Admin tests for split endpoints, retry and stale-state clearing.
- fc82b98d75ed61b53f64142efcb17972d365d663 — remove obsolete restaurant report routes.
- f403a8dc0dcefb6598af18136088346332bb0848 — add isolated Apache ECharts SVG adapter.
- 806bd643a657d7388de47c295e2ad29b3d955148 — render charts through ECharts SVG.
- dd7fd0ffb6739e80a11b54bf38cf01ab17bf54a8 — add visualization fallback copy.
- 5a91f7607e8caff2281bd6cd94e0c497392ae99f — style ECharts and accessible fallback states.
- 3dd4043bbe4a1367838700de756c7f0ce7b5afaa — define exact local visual QA gate.
- ef3e05eefbf02490f95a00050345fb5f6590da30 — align documented scope and production dependency gate.
- e6f6aaa11c6c38ffa0e366525f0b8ada5192c666 — document distinct scoped API endpoints.
- a7db0694d59ee9dfeb96af2ad5d7a22078a7fb37 — record corrected architecture decisions.
- d0322e2a081743db98aabcb79786f278e072d98a — separate CI evidence from browser acceptance.
- bb6a540b0ef92f6670c2bc9895cc831bc8b9d9f6 — make ECharts lifecycle and cleanup safe.
- 989b9e6cfbe24da8d0501f546062384eb8fef345 — test ECharts SVG adapter, fallback and disposal.
- b3559c4973eacac949ebc13b6fdc3b7e2bd762a2 — publish audit remediation report and commit ledger.


10. Local review gate
Review PR #44 locally at exact head b3559c4973eacac949ebc13b6fdc3b7e2bd762a2 using docs/reviews/REPORTING_FOUNDATION_MANUAL_QA.md. Validate Arabic RTL, Light/Dark, 1920×1080, 1366×768, 728×900, account-wide and branch-scoped roles, ECharts/table fallback, loading/empty/errors/retry, stale-state protection, focus, overflow and console/network state. Do not mark Ready or merge until the user approves this local evidence.
