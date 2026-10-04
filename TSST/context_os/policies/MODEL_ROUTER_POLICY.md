# TSST Model Router Policy v0.1

Status: PROPOSED

## Principle

Use the cheapest model that can reliably satisfy the acceptance criteria.
Escalate because of reasoning difficulty, ambiguity, risk or failed verification — not because the input is large.

## Routing Dimensions

Score:
- decision impact;
- ambiguity;
- cross-domain coupling;
- reversibility;
- evidence conflict;
- implementation complexity;
- security/privacy risk;
- prior failure count.

## FAST

Typical work:
- extraction;
- classification;
- entity/tag normalization;
- dedup triage;
- simple summaries;
- format conversion.

Not allowed as final authority for:
- architecture;
- high-risk security decisions;
- strategic positioning;
- unresolved cross-agent conflict.

## EXECUTION

Default tier.

Typical work:
- implementation;
- research synthesis;
- routine debugging;
- CRM workflow analysis;
- standard UI/UX reasoning;
- experiment design;
- reporting.

## EXECUTIVE

Use when at least one trigger applies:
- irreversible/high-impact decision;
- material source conflict;
- architecture boundary change;
- cross-agent disagreement affecting acceptance;
- two materially failed execution-tier attempts;
- strategic synthesis requiring multiple domains;
- final review explicitly designated critical.

## Escalation Packet

Never send all prior raw context automatically.

Send:
- task;
- failed attempt summary;
- evidence;
- unresolved decision;
- constraints;
- acceptance criteria;
- exact reason for escalation.

## Cost Audit

For every executive-tier call in evaluation:
- record reason;
- input size;
- result;
- whether executive tier changed the decision;
- whether a lower tier could have sufficed in hindsight.
