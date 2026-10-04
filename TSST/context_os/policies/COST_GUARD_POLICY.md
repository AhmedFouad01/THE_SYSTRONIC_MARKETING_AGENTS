# TSST Cost Guard v0.3

Status: PROPOSED / UNVALIDATED

## Objective

Minimize wasted spend while preserving accepted quality.

The cost guard is not a hard-coded currency budget.
Provider prices change and must remain runtime configuration.

## Controls

Per task:
- budget class;
- context tier;
- max calls;
- max executive calls;
- max retries per failure fingerprint;
- max parallel workers;
- max retrieved evidence;
- checkpoint threshold.

## Stop / Escalate Conditions

Stop a loop when:
- same failure fingerprint reaches retry ceiling;
- verification cannot improve without new evidence;
- context growth exceeds task value;
- required authority/input is missing.

Escalate when:
- defined executive trigger is met;
- higher-quality model could materially change the decision;
- lower-tier output fails verification for reasoning quality, not missing inputs.

Do not escalate when:
- source data is missing;
- user approval is required;
- tool permission is absent;
- provider/system is unavailable.

A stronger model cannot fix absent authority or absent evidence.

## Cost Accounting

Collect when runtime exposes it:
- uncached input;
- cached input/read;
- cache write;
- output;
- tool calls;
- sandbox/runtime;
- subagent calls.

Evaluate:
`cost_per_accepted_task = total_task_cost / accepted_outcome`

Cheap failed work that causes expensive rework is not efficient.
