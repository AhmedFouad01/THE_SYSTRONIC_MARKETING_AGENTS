---
name: tsst-creative-sk-002-brand-guidelines-engineering
description: Convert approved brand rules into versioned, human- and agent-readable guidance with explicit precedence, machine-readable references, and testable constraints.
---

# TSST-CREATIVE-SK-002 Brand Guidelines Engineering

Status: `LAB_VALIDATED` — `TSST-CREATIVE-EV-002`, 94/100

## Objective

Encode a brand system so humans and agents can find the canonical source, select correct assets and tokens, apply rules consistently, and identify when escalation is required.

## Triggers

Use when creating `BRAND.md`, an agent guide, a brand repository structure, or operational instructions for generating and reviewing branded work.

## Reusable principles

- Maintain one canonical location for approved rules and assets.
- Separate semantic rules from implementation examples and tool-specific snippets.
- Prefer explicit selection logic: state which asset, token, or rule applies under which condition.
- Make prohibitions, exceptions, precedence, version, and owner visible.
- Pair human-readable rationale with machine-readable tokens or schemas when useful.
- A repository example teaches structure; its brand choices are not reusable content.

## Workflow

1. Confirm the approved brand system, owners, consumers, tools, delivery surfaces, and update process.
2. Define the canonical file map and precedence order for strategy, brand, tokens, assets, and implementation guidance.
3. Write `BRAND.md` for meaning and shared visual rules. Write the agent guide for retrieval order, decisions, constraints, QA, and escalation.
4. Link to machine-readable token files and asset manifests instead of duplicating values across prose.
5. Specify asset-selection conditions, filenames, variants, rights, and forbidden transformations.
6. Add concise valid/invalid examples and deterministic checks for high-risk rules.
7. Test the guidance with representative requests and correct ambiguous instructions.
8. Record version, owner, approval date, and revalidation triggers.

## Output contract

- canonical repository map and precedence;
- `BRAND.md` covering approved identity meaning and rules;
- agent guide covering retrieval, decision logic, output checks, and escalation;
- links to token and asset sources;
- version/change metadata;
- ambiguity test results.

## Guardrails

- Use the BSD XR guide as a structural pattern only; do not copy its brand values, constraints, assets, or code.
- Do not duplicate authoritative values in multiple files without a synchronization mechanism.
- Do not bury non-negotiable constraints inside examples.
- Do not make the guide tool-dependent unless the brand explicitly requires that tool.

## Completion checklist

- [ ] Canonical sources and precedence are unambiguous.
- [ ] Agent decisions have condition-to-action rules.
- [ ] Human rationale and machine-readable values stay linked.
- [ ] Asset variants, rights, and prohibitions are explicit.
- [ ] Versioning and escalation owners exist.
- [ ] Representative agent prompts were tested.

## Practical evaluation

Create `BRAND.md` and `AGENT_GUIDE.md` for a fictional brand fixture. A second reviewer must be able to select the right logo, color tokens, typography, and layout treatment for three surfaces without asking the author. Score ambiguity, traceability, and compliance with the team scorecard.

## Common failure modes

- prose-only guide with no canonical assets or tokens;
- duplicate values that drift;
- examples mistaken for universal rules;
- missing dark/light or language selection logic;
- no update owner or version;
- copying the structural reference's identity.

## Sources

- [BSD XR Agent Guide](https://github.com/BitSpaceDevelopment/bsd-branding-repo/blob/main/agent-guide.md)

Source use: non-authoritative structural example. Extract the repository pattern, not the BSD XR identity.
