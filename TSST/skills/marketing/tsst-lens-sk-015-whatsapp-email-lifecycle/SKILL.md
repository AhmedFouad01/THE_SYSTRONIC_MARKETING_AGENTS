---
name: tsst-lens-sk-015-whatsapp-email-lifecycle
description: Use when designing WhatsApp and email lifecycle flows: stage map, triggers, templates, consent, deliverability, Egypt/MENA tone, metrics, CRM handoff. Drafts only; never sends.
id: TSST-LENS-SK-015
team: marketing
owner: LENS_AG
status: UNVALIDATED
version: 0.1
---

# TSST-LENS-SK-015 WhatsApp & Email Lifecycle Messaging

Status: `UNVALIDATED`

## Objective

Design consent-based lifecycle messaging across WhatsApp and email — from lead to first purchase, repeat, and win-back — with clear triggers, templates, tone, and metrics. Output is design and draft copy only. Brand-neutral.

## Triggers

Lead nurture flows, welcome/onboarding series, abandoned cart or inquiry follow-up, post-purchase and review requests, repeat-purchase reminders, win-back, WhatsApp template planning, email deliverability or consent review.

## Reusable principles

- Permission first: message only people who opted in for that channel and purpose; record when, where, and what they agreed to.
- Right channel for the job: WhatsApp for fast, conversational, time-sensitive messages; email for richer content, receipts, and longer education. Do not duplicate every message on both.
- Triggered by behavior, not calendar alone; frequency caps protect trust.
- One message, one purpose, one clear next step.
- Tone follows the audience: warm, respectful, concise; Egyptian Arabic or Modern Standard Arabic as the audience expects, never literal translation; check formality (you/plural respectful forms) with the brand.
- Honest content: no fake urgency, invented discounts, or implied personal relationship that does not exist.
- Every message offers an easy way out.

## Workflow

1. Confirm inputs: business model, offer, ICP and JTBD (SK-004), channels available, consent records, CRM/data fields, language(s), constraints.
2. Lifecycle stage map: lead / inquiry; first purchase (welcome, onboarding, delivery updates); repeat (replenishment, cross-sell, loyalty); at-risk and win-back; plus service moments (support, complaints, reviews). For each stage define goal, entry trigger, exit condition, channel, and owner.
3. Flow design per stage: trigger, delay, message sequence (usually 1-4), branch on reply/click/purchase, suppression rules (already bought, opted out, complained, open support ticket), frequency cap, quiet hours.
4. Templates per stage (draft in AR and EN, mark placeholders): 
   - lead: acknowledge and set expectation of response time; qualify with one question;
   - first purchase: confirmation, what happens next, how to get help;
   - repeat: timely reminder tied to usage cycle, or helpful follow-up, then a relevant offer;
   - win-back: acknowledge the gap, give a reason to return that is real, easy opt-out;
   - post-purchase: ask feedback first, review request second.
5. WhatsApp Business specifics (verify against current Meta docs before use):
   - opt-in must be obtained before business-initiated messages; keep proof;
   - business-initiated messages outside the customer-service window need pre-approved templates;
   - template categories (for example marketing, utility, authentication) differ in rules and pricing; category choice must match real content;
   - 24-hour customer-service window opens when the customer messages; free-form replies are allowed inside it, templates are needed after it;
   - quality rating and user blocks/reports can restrict sending; keep volume and relevance in check;
   - API access, number setup, and pricing change often. Do not assume figures from this skill.
6. Email deliverability basics: authenticated sending domain (SPF, DKIM, DMARC); consistent from-name; clean, permission-based list; remove hard bounces and long-inactive contacts; warm up volume gradually; avoid spammy subject lines and image-only emails; plain-text alternative; mobile-friendly layout; Arabic RTL rendering tested across major clients.
7. Consent and unsubscribe: purpose-specific opt-in, unticked boxes, privacy notice link; one-click unsubscribe plus visible footer link in email; STOP/opt-out handling for WhatsApp honored promptly across systems; no re-adding of opted-out contacts; check applicable local law (for example Egypt's data protection law) with a qualified person, as this skill gives no legal advice.
8. Metrics per stage: lead (response time, reply rate, qualified rate); first purchase (conversion, time to first order, delivery confusion tickets); repeat (repeat rate, time between orders, revenue per contact); win-back (reactivation rate, unsubscribe rate); health (opt-out, complaint/block, bounce, delivery, template quality). Always pair a growth metric with a guardrail (opt-outs, complaints).
9. Handoff to DEV (CRM): events and fields needed, segments, suppression logic, template IDs and variables, consent store, logging, and test plan with internal test contacts only. Measurement and attribution to SPARK-SK-002.

## Output contract

- lifecycle stage map (goal, trigger, exit, channel, owner);
- flow diagrams or tables with delays, branches, suppression, frequency caps;
- draft templates per stage in AR/EN with placeholders, marked DRAFT;
- WhatsApp compliance notes marked "verify against current Meta docs before use";
- deliverability and consent checklist;
- metrics table per stage with guardrails;
- CRM/DEV handoff spec;
- open questions and assumptions.

## Quality gates / critical failures

Critical (block delivery):
- any actual sending or contact with real customers;
- messaging contacts without recorded opt-in for that channel;
- no unsubscribe/opt-out path;
- WhatsApp rules stated as fact without the verify label;
- marketing content disguised under a utility category;
- fake urgency, fabricated discounts, or deceptive personalization;
- no suppression rules (messages to buyers, complainers, opted-out);
- translated-only Arabic with no native review.

Gate checklist:
- [ ] Every stage has trigger, exit, and suppression.
- [ ] Consent source recorded per channel.
- [ ] Templates marked DRAFT with placeholders; test contacts only.
- [ ] Frequency caps and quiet hours set.
- [ ] Metrics include guardrails.
- [ ] DEV handoff lists events, fields, and consent store.

## Handoffs

- DEV: CRM implementation, events, template wiring, consent logging.
- SPARK-SK-002: measurement and attribution.
- LENS SK-004: ICP/JTBD inputs; SK-005/SK-002: claims and evidence.
- CREATIVE_AG: email visual design if needed.
- Client/legal reviewer: consent and regulatory sign-off.

## Common failure modes

- bulk blasting a purchased or old list;
- same message on WhatsApp and email at once;
- win-back offers that teach customers to wait for discounts;
- asking for a review before delivery;
- ignoring replies because the flow is automated;
- measuring opens only (privacy features inflate them).

## Practical evaluation

Given a generic business and consent notes, deliver a four-stage flow map, six draft templates (AR/EN), a suppression list, a metrics table, and a CRM handoff, with no sending performed.

## Changelog

- 0.1: initial draft (ADR-003 P1 gap closure). Unvalidated; no registry entry yet. WhatsApp platform details must be re-verified against Meta documentation.
