---
name: tsst-creative-sk-003-design-tokens
description: Create tool-agnostic design-token hierarchies for brand foundations, semantic roles, themes, and channel mappings using typed values and controlled aliases.
---

# TSST-CREATIVE-SK-003 Design Tokens

Status: `UNVALIDATED`

## Objective

Convert color, typography, spacing, sizing, motion, and related brand properties into a stable token hierarchy that reduces visual drift across channels and tools.

## Triggers

Use when defining or auditing design tokens, themes, brand-to-product mappings, naming conventions, aliases, or cross-channel value distribution.

## Reusable principles

- Use typed, tool-agnostic values as the canonical representation.
- Separate base/reference tokens from semantic tokens and component or surface mappings.
- Name by meaning at the semantic layer, not by a value that may change.
- Use aliases to preserve one source of truth and make theme changes controllable.
- Keep the smallest stable core and extend it deliberately.
- Validate references, types, modes, accessibility, and downstream mappings.

## Workflow

1. Inventory approved values, usage roles, themes, surfaces, and target formats.
2. Choose a naming grammar and document allowed characters, casing, nesting, and deprecation rules.
3. Build base tokens for raw scales and assets.
4. Build semantic tokens for roles such as text, surface, border, accent, success, warning, and danger.
5. Map semantic tokens to channel or component needs only where a stable relationship exists.
6. Define light/dark or other modes as overrides, not disconnected duplicate systems.
7. Check aliases for cycles, missing references, type mismatches, and unintended hardcoded duplicates.
8. Test sample social, deck, and web mappings and document gaps.

## Output contract

- token taxonomy and naming rules;
- typed token set with values, descriptions, and aliases;
- mode/theme overrides;
- channel mapping table;
- deprecation and change policy;
- validation report covering reference integrity and representative applications.

## Guardrails

- Follow DTCG concepts and current specification syntax where interoperability is required.
- Do not bind the canonical model to a single design or development tool.
- Do not expose raw palette names as semantic intent when a role token is needed.
- Do not create component tokens before stable shared roles exist.
- Do not claim accessibility from token names; test resolved foreground/background pairs.

## Completion checklist

- [ ] Naming is consistent and documented.
- [ ] Values carry correct types.
- [ ] Base, semantic, and application layers are distinguishable.
- [ ] Aliases resolve without cycles or missing targets.
- [ ] Modes override a shared model.
- [ ] Cross-channel samples and contrast pairs were tested.

## Practical evaluation

Create a token hierarchy for a fictional bilingual brand used in social creative, an executive deck, and a responsive website. Include light/dark modes, semantic color roles, typography, spacing, and a channel mapping. The evaluation checks portability, alias integrity, naming, and accessible resolved pairs.

## Common failure modes

- token names tied to current hex values;
- separate theme files with no shared semantics;
- uncontrolled aliases or circular references;
- exhaustive component tokens without a stable foundation;
- false portability because tool-specific fields own the meaning;
- no migration path for renamed tokens.

## Sources

- [Design Tokens Community Group repository](https://github.com/design-tokens/community-group)
- [DTCG technical reports](https://www.designtokens.org/TR/)

Source use: standards reference. Check the current technical report before emitting a conformance-sensitive format.
