# Cold-start cases — any runtime

Run `TSST/context/boot.md` from a fresh session for each request below, exactly as a user
message. Do not open `validate_spine.py` (it holds the expected answers) or anything in
`TSST/bus/out/` (other runtimes' results). Copied results are rejected. Do not execute
the work: stop after boot step 13 (tier).

| case | user request |
|---|---|
| A | كمل CRM |
| B | كمل ANVIL |
| C | اعمل Campaign لـ VILL |
| D | كمل YAKEBDA_MS |

Result file `TSST/bus/out/COLD-<RUNTIME>.md`, ≤ 12 lines:
```
runtime: <id> · model: <what you ran on>
A | brand | project | team | tier | files read | source state (AVAILABLE / UNREADABLE_IN_CURRENT_RUNTIME / UNAVAILABLE)
B | …
C | …
D | …
issues: <only boot ambiguities or broken pointers, else none>
```
