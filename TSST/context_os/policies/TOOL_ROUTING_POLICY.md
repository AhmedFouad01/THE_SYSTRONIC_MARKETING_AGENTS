# TSST Tool Routing Policy v0.3

Status: PROPOSED / UNVALIDATED

## Selection order

1. Identify authoritative system/source.
2. Determine action mode: READ / DRAFT / MUTATE_INTERNAL / EXTERNAL_ACTION / SECRET_ACCESS.
3. Check authority.
4. Search/load only relevant namespace.
5. Prefer one source-of-truth connector over duplicate paths.
6. Use fallback only on source failure or explicit verification need.
7. Compress large results before passing upward.

## Default eager namespace

Keep a very small always-visible surface:
- project/current-state retrieval;
- skill discovery;
- checkpoint read/write proposal;
- source locator resolution.

Everything else should usually be deferred.

## Deny rules

Deny when:
- external action has no explicit applicable authority;
- secret access would expose secret values to model-visible durable memory;
- project/tenant boundary is wrong;
- a public source is being used to replace an available private source of truth;
- mutation is requested through a read-only work package.

## Tool discovery audit

Record:
- namespaces considered;
- tools loaded;
- tools rejected;
- authority decision;
- whether discovery overhead was justified.
