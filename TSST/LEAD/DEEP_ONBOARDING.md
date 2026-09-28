# Progressive Deep Onboarding

State as of 2026-09-22: `OPERATIONAL_BASELINE_CONFIRMED_WITH_OPEN_ITEMS`. The user ended the current discovery round and asked to begin using available information. See ../TSST_OPERATING_PROFILE.md and the three linked synthesis documents. Do not restart deferred questionnaires automatically; ask only task-critical missing inputs. Full business discovery is not claimed complete. Production readiness remains `NOT_READY`.

## Conversation protocol

Read confirmed profile entries and pending questions first. Offer one stage at a time, normally 2–3 connected questions per turn. Explain the decision the answers unlock. Follow the user's pace; allow skip, defer and correction. Reuse supplied documents with provenance instead of asking answered questions again. Ask a targeted follow-up only when ambiguity materially affects a decision.

Summarize the stage back to the user, separate confirmed facts from unconfirmed interpretation and request correction. Store only supplied facts with source/date and confirmation state. A deferred answer remains UNKNOWN. Do not infer authority, budget or risk tolerance from silence. Do not request passwords or secrets; record the responsible person and access scope instead.

## Stages and exit conditions

| Stage | Topics and conversational prompts | Exit condition |
| --- | --- | --- |
| 1. Identity and intent | What company and offers should the team serve? What outcome matters first? Which markets and customer segments are in scope? | Identity, offers, markets, segments and priority recorded or explicitly deferred. |
| 2. Commercial model | How does the business earn revenue? How are products/services priced and delivered? Which margins and financial constraints govern decisions? | Revenue streams, pricing, cost/margin basis, finances and data owners recorded. |
| 3. Growth and sales | What are the growth targets and horizon? How does a lead become a customer? What channels, CRM stages and lifecycle programs exist? | Targets, baseline, sales process and marketing channels linked to available evidence. |
| 4. Market and expansion | Which competitors or substitutes matter? Which partnerships and business-development objectives are priorities? | Competitive context and expansion objectives distinguished from hypotheses. |
| 5. Brand and quality | Which brand and creative standards are approved? What does acceptable work look like? Which examples represent unacceptable work and why? | Standards, quality criteria and unacceptable-output definitions recorded with examples when supplied. |
| 6. Resources and operations | Who is available and who owns which decisions? What tools, capacity and operational constraints limit delivery? | Team/resources, dependencies, capacity and constraints recorded. |
| 7. Authority and risk | Which actions may Lead handle autonomously, under what limits? Which require explicit approval? What risk and escalation thresholds apply? | Decision-rights matrix confirmed by user; missing rights remain unresolved. |
| 8. Reporting and synthesis | What reporting format, language, detail and cadence work best? Does this profile accurately represent the business? | User confirms profile version and identifies remaining unknowns. |

At every stage record the next pending question and resume position. No stage completion starts campaign activity or validates a skill. If the user stops, save only supplied and clearly marked information; do not fill gaps.

## Persistent output

Maintain [TSST_OPERATING_PROFILE.md](../TSST_OPERATING_PROFILE.md). Each future entry uses: field, value, source or conversation reference, supplied date, confirmation state, approver where applicable, review trigger. Keep changes with previous value and reason. Conflicting evidence stays visible until resolved.

Decision rights require action, permitted scope, monetary/time limit where relevant, approver, escalation trigger and effective date. Approval for one action does not imply blanket authority. Report onboarding as complete only after user confirmation; list unresolved optional items and any blockers separately.
