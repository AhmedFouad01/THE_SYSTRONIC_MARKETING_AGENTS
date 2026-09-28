---
name: tsst-dev-sk-015-verification-before-completion
description: Use before claiming an engineering task is complete, fixed, passing or ready for handoff.
---

# TSST-DEV-SK-015 — Verification Before Completion

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: verification, acceptance

## Purpose and trigger

Use before claiming an engineering task is complete, fixed, passing or ready for handoff. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Identify each intended claim and the evidence needed to support it for the current change.
2. Run the relevant authorized verification freshly on the exact version/environment; if blocked, record the limitation instead of assuming success.
3. Inspect full results, exit status, failures, warnings and skipped checks; distinguish a successful command from proof of the required behavior.
4. Compare evidence with the claim, exposing every remaining unverified item and its consequence.
5. Only then state a supported completion status. Reverify affected claims after later changes.

## Decision rules and guardrails

NO COMPLETION CLAIM WITHOUT FRESH VERIFICATION EVIDENCE. Historical results, confidence and another agent’s assertion are not fresh verification. Packaging checks do not validate specialist capability.

## Expected output

For each claim: Claim; Evidence; Verification Method; Result; Remaining Unverified Items. Include version/environment and evidence location.

## Verification

Audit claim-to-evidence coverage. If evidence is missing, stale or narrower than the claim, narrow the claim or mark it unverified.

## Sources and optional references

[verification-before-completion](../../references/SOURCES.md#verification-before-completion)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
