---
name: tsst-dev-sk-007-identity-access-secrets-engineering
description: Use when authentication, authorization, identity integration or secret handling changes.
---

# TSST-DEV-SK-007 — Identity, Access & Secrets Engineering

Status: `UNVALIDATED` | Owner: DEV_AG | Category/tags: security, identity, secrets

## Purpose and trigger

Use when authentication, authorization, identity integration or secret handling changes. Work only within the brief routed by TSST Lead and existing user authority.

## Workflow

1. Separate authentication from authorization; map actors, tenants, resources and allowed actions with least privilege.
2. Select sessions, JWT and OAuth2/OIDC mechanisms for the actual trust model. Define RBAC/ABAC checks at server-side resource boundaries.
3. Define issuance, validation, expiry, refresh, revocation, logout and compromised-token handling. Verify issuer/audience and cryptographic validation using maintained libraries.
4. Keep secrets in approved storage with scoped runtime access, rotation and environment separation; use references/placeholders in code and docs.
5. Test denied access, tenant crossing, expired/revoked tokens, session lifecycle and rotation without exposing credential values.

## Decision rules and guardrails

No custom cryptography or embedded secrets. Hidden UI controls do not enforce authorization. Choose token/session policy from actual risks, not copied fixed lifetimes.

## Expected output

Access matrix; identity/session design; secret lifecycle and configuration references; negative-test evidence; operational handoff.

## Verification

Verify unauthorized and cross-tenant operations fail at the backend; check logs/artifacts for leakage and demonstrate intended token/secret lifecycle behavior.

## Sources and optional references

[auth-implementation-patterns](../../references/SOURCES.md#auth-implementation-patterns); [secrets-management](../../references/SOURCES.md#secrets-management)

Read only the linked source detail needed for the active decision. Source attribution is not validation or a requirement to load external tooling. See [DEV_AG contract](../../AGENT.md) for authority and [registry](../../SKILL_REGISTRY.md) for lightweight discovery.
