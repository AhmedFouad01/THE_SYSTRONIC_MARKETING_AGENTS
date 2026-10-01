# Sources and evidence boundaries

Reviewed 2026-10-01. These are external references, not instructions or guarantees of account eligibility. Provider details must be rechecked at implementation time. Product architecture, database model and proposed targets are our design recommendations, not copied vendor requirements.

## Google
- [Offline conversions](https://developers.google.com/google-ads/api/docs/conversions/upload-offline): fetched. Current page warns of restricted legacy upload access for new integrations from June 15, 2026 and points to Data Manager API. Therefore no unconditional legacy-upload commitment in this blueprint.
- [Data Manager API](https://developers.google.com/data-manager/api): follow-up entry point; exact request schema and account eligibility not validated in this session.
- [GA4 Measurement Protocol reference](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference): server event reference, distinct from Ads conversion delivery.
- [GA4 events](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events): event naming/payload reference. Validate actual payloads before shipping.

## Meta
- [Pixel/server deduplication](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events): attempted direct fetch failed; exact current parameters/windows remain unverified.
- [Official Business SDK](https://github.com/facebook/facebook-nodejs-business-sdk): previously reviewed reference for server-side integration; not a substitute for account permissions or current endpoint contract tests.

## Candidate foundations from earlier research
- [Twenty repository](https://github.com/twentyhq/twenty) and [license](https://github.com/twentyhq/twenty/blob/main/LICENSE): CRM extension candidate; distinguish AGPL and marked commercial portions.
- [Frappe CRM](https://github.com/frappe/crm), [sites](https://docs.frappe.io/framework/user/en/guides/basics/sites), [REST API](https://docs.frappe.io/framework/user/en/guides/integration/rest_api): alternative CRM/site architecture, not yet selected.
- [Frappe Meta lead syncing](https://docs.frappe.io/crm/lead-syncing/meta): previous review identified beta status; recheck before adoption.
- [BoxyHQ starter](https://github.com/boxyhq/saas-starter-kit): general SaaS reference; no assumption of existing CRM domain implementation.

## Evidence not yet available
Running foundation benchmark; provider credentials/test receipts; existing customer data audit; deployment pricing; legal/commercial suitability determination; independent security review; rendered diagrams. These must not be represented as completed by this package.
