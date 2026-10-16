# Awareness measurement — TSST-PILOT-001

2026-09-22 | SPARK_AG | خطة قياس فقط؛ لا توجد نتائج حملة حتى الآن.

## Decision and metric dictionary

Question: did delivered creative make the Shark X Store → ANVIL SUPPS relationship understandable and worth remembering/following? Exposure is the primary delivery result; understanding signals qualify that exposure. Reach is not awareness lift. Sales/ROAS are not this pilot's success criteria.

All formulas below are reporting definitions, not benchmarks. Blank or unavailable stays blank/NA; denominator zero returns NA. Owner SPARK exports paid metrics, LENS codes responses, Lead signs interpretation. Report daily and at week end. Native metric labels/definitions must be captured from the authorized export because surfaces and definitions can differ.

| Metric | Definition / formula | Source of truth | Use and limits |
| --- | --- | --- | --- |
| Spend EGP | Amount spent in platform export; reconcile phase + campaign totals | Meta Ads Manager campaign/ad-set export | Budget control, not invoice total. Record currency, fees separately if any. |
| Reach | Platform-reported estimated unique accounts reached in selected period | Campaign-level Meta export; organic platform insights separately | Primary paid delivery measure. Never add daily/ad/placement reach to construct week reach; no deduplication across TikTok/Meta. |
| Impressions | Platform-reported displays | Same-period Meta export | Delivery volume, not unique people. |
| Frequency | Same-scope impressions / reach | Prefer campaign aggregate native field; compute reconciliation | Exposure concentration; do not average ad frequencies. No exposure order guaranteed. |
| CPM EGP | Spend / impressions × 1000 | Computed from same-scope paid fields | Diagnostic, never sole creative winner criterion. |
| Cost per 1000 reached | Spend / period reach × 1000 | Computed separately from CPM | Unique reach efficiency within same period/platform; no forecast target. |
| 3-second video views | Native Meta count, preserve exact export definition | Meta video reporting if available | Early watch signal; plays can repeat. Not compatible with TikTok's view definition. |
| Video starts and 100% plays | Native counts with video length and exact definition recorded | Meta export; TikTok native analytics separately | Completion proxy = 100% plays / starts for the SAME asset and source when comparable counts exist. NA if denominator not provided. Do not divide by reach. |
| Average watch time | Native average with duration stated | Platform analytics if exposed | Compare same-length assets only; loops/replays can affect it. |
| Saves / shares / substantive comments | Counts, paid/organic scope explicitly labeled | Post insights + manual comment coding | Attention quality; not purchases or unique people. Saves/shares may overlap users. |
| Profile/page visits | Native visits with platform/period/paid attribution label preserved | FB/IG/TikTok insights separately | Intent to learn more; never assume every visit came from paid. |
| Net followers | End followers minus pre-D1 followers, per platform | Profile snapshots at fixed cutoff | Directional account growth, not attributed or incremental followers. No cross-platform sum as unique people. |
| Correct bridge responses | Unique coded responses explicitly linking old and new name as continuity | Manual response log | Qualitative comprehension evidence; prompted polls and unsolicited comments separated. |
| Confusion rate | Confused responses / all classifiable transition responses | Same log | Include correct, confused, mixed in denominator. Unrelated/unclassifiable excluded, count reported. Sparse self-selected sample, not population estimate. |

## Data map and attribution

No purchase, add-to-cart, lead, CRM, browser or server event is deployed. No primary conversion event is selected. Existing revenue/traffic data, if later volunteered, is context only. This avoids inventing a functioning store or tracking stack.

| Observation | Trigger / fields | Identity / handling | QA |
| --- | --- | --- | --- |
| Paid delivery record | Export completed reporting interval; date range, timezone, platform, campaign/adset/ad ID, asset ID, currency, spend, impressions, reach, native video fields | One record per explicit scope + period + source; distinguish daily from aggregate rows | Totals reconcile; spend ≤ approved ceiling; never sum overlapping reach |
| Organic observation | Authorized insights export/snapshot per post; platform, post ID, asset ID, date, reach/views/engagement if available | Post ID + platform + period; keep gross post numbers separate from paid-only reports if boosts overlap | Record “combined paid+organic” when separation unavailable; no fabricated organic subtraction |
| Transition response | Public response about identity; platform, asset ID, response key, timestamp, prompted/unsolicited, code, paraphrase | Code each comment/poll response once; replies by same identifiable responder within a single thread count once for headline response count | LENS codes all relevant responses; SPARK checks ambiguous cases; no usernames/health details in report |
| Baseline snapshot | Immediately before D1; followers per platform and available prior comparable 7-day activity | Fixed snapshot, timezone and source | Missing baseline means NA; do not backfill zero |

Codes: CORRECT = explicitly connects both names as evolution; CONFUSED = treats ANVIL as unrelated/asks whether Shark closed; MIXED = partial link plus unresolved misunderstanding; UNCLASSIFIABLE = praise, emoji, unrelated or ambiguous. Multiple reactions by one commenter do not create multiple independent comprehension observations. Report actual numerator/denominator and representative paraphrases; avoid storing personal identifiers. Poll correct answer recognition is prompted and cannot establish unaided recall. Retention/access arrangements need owner approval before collecting any nonpublic data; use aggregate exports and deidentified codes by default.

Reporting time basis: Africa/Cairo calendar days for narrative; record the ad account timezone separately and reconcile boundaries. Export D1–D7 aggregate after D7 closes; initial report D8, refresh D10 for late adjustments. These are reporting dates relative to the approved campaign start, not scheduled automations. Record export timestamp. Delivery metrics belong to their reporting period; no click/view conversion window applies to the primary reach result. If a secondary platform-attributed field is used, save its actual model/window/time basis and label it platform-attributed. No assumed 7-day-click/1-day-view default. Organic exposure, preexisting awareness, repeat views and offline conversation confound attribution. Do not sum platform reach, followers, views or credited outcomes as deduplicated business outcomes.

## Names and optional links

Use the campaign/ad set names in [MEDIA_PLAN](../06_MEDIA_STRATEGY/MEDIA_PLAN.md). Preserve native immutable IDs alongside names and `SW-Dxx-C01` asset IDs so renames do not break reconciliation. Export filenames: `TSST-PILOT-001_META_<scope>_<YYYYMMDD-YYYYMMDD>_<exporttimestamp>.csv`.

Default campaign path is on-platform. UTMs **do not** measure profile follows and are not attached to invented social URLs. Only if a working approved website is later supplied, use lowercase static per-platform values:

`?utm_source=instagram&utm_medium=paid_social&utm_campaign=tsst_pilot_001_anvil_switch&utm_content=sw_d03_c01_reveal_v01`

For Facebook use `utm_source=facebook`; organic links use `organic_social`; TikTok organic uses `tiktok`. If placement-level static sources cannot be routed accurately from one shared Meta ad, use `utm_source=meta` and retain placement in the platform report, rather than falsely labeling traffic. No PII or health information in UTMs. Verify destination, query preservation and analytics session capture with approved consent before use. Website analytics sessions will not equal clicks or views and are not this pilot's optimization goal.

## Practical review and week-end rules

These are **internal decision heuristics**, not researched performance targets or statistical significance thresholds.

1. **Validity first:** if exports are missing, scopes mixed, creatives late or geography/rights/policy wrong, classify the pilot as inconclusive/operationally compromised. Resolve that issue before comparing creative. Unspent funding stays unspent.
2. **Promising comprehension:** at least 10 classifiable unsolicited unique thread responses, at least 80% correct and no recurring material closure/unrelated-company misunderstanding is a directional positive signal to carry forward the bridge. Report exact n. Under 10: qualitative observations only, even if all positive. This threshold is a conservative planning rule, not a population result. Prompted poll responses are reported separately and cannot satisfy it.
3. **Change the explanation:** two independent confused unsolicited threads expressing the same misunderstanding trigger copy/FAQ review immediately, regardless of positive reactions. At week end, >20% confused or mixed among at least 10 classifiable responses means revise the first frame/caption bridge before further spend. With fewer responses, investigate wording without estimating a robust confusion rate.
4. **Change the hook/pace:** repeated early-drop evidence on comparable length/placement video, together with weak substantive responses, supports a next-pilot hook edit. Show raw counts, duration and exposure. If delivery is unequal or counts sparse, carry the hypothesis forward unranked; do not crown a creative winner.
5. **Watch repetition:** campaign frequency >3 plus slowing period-unique reach and repetition complaints warrants reviewing concentration/creative. Frequency alone does not prove fatigue. Do not add daily reach to infer new people; use native period aggregates or report the limitation.
6. **Carry forward:** approved identity bridge, best-understood wording, recurring questions, platform-native edits, cost/delivery observations with source and scope. Do not automatically raise budget, widen audience or launch a sales stage. Propose the next bounded test for approval.
7. **Do not conclude:** incremental brand lift, national awareness, long-term CPM/CPA, sales demand, ROAS, audience superiority, statistically reliable platform superiority, or mastered TSST skills from 1,500 EGP and seven days.

No promised minimum reach or completion rate. Even meeting the comprehension heuristic means “promising among respondents,” not “campaign proved successful for the market.” See [DAILY_REPORT_TEMPLATE.csv](DAILY_REPORT_TEMPLATE.csv) and [RESPONSE_LOG_TEMPLATE.csv](RESPONSE_LOG_TEMPLATE.csv); they contain schemas only, no fictional observations.
