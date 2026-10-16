### Task T4: Log Analysis of `TSST/bus/log.tsv`

---

#### **(1) Total Number of Rows**  
**109 rows** (line 110 is blank).

---

#### **(2) Count of Rows per Event Type**  
| Event     | Count |
|-----------|-------|
| `new`     | 23    |
| `claim`   | 18    |
| `done`    | 21    |
| `close`   | 15    |
| `block`   | 2     |
| `cancel`  | 12    |
| `reopen`  | 3     |
| `verify`  | 13    |
| `progress`| 10    |

---

#### **(3) Count of Rows per Runtime**  
| Runtime                          | Count |
|----------------------------------|-------|
| `claude`                       | 39    |
| `gemini`                       | 14    |
| `codex`                        | 32    |
| `gemini 3.8 Flash · high`      | 5     |
| `gpt-6.1-sol`                  | 4     |
| `unavailable`                  | 1     |
| `gemini 3.1 Pro · high`        | 1     |
| `codex.git`                    | 3     |
| `gemini.fs_read`               | 3     |
| `gemini.fs_write`              | 3     |
| `gemini.shell`                 | 3     |
| `codex.fs_read`                | 1     |
| `codex.fs_write`               | 1     |
| `codex.shell`                  | 1     |
| `limit codex`                  | 1     |

---

#### **(4) Distinct Task IDs and Last Event**  
**Distinct Task IDs (excluding "-")**:  
- `PROBE-001` → `cancel` (line 12)  
- `REVIEW-001` → `close` (line 8)  
- `BR-001` → `cancel` (line 13)  
- `BR-002` → `cancel` (line 15)  
- `BR-003` → `close` (line 22)  
- `COLD-CODEX` → `close` (line 29)  
- `RM-CS-002` → `close` (line 35)  
- `COLD-GEMINI` → `close` (line 41)  
- `BRANDS-FOLD` → `close` (line 45)  
- `C7-VILL-01` → `close` (line 54)  
- `C7-VILL-02` → `close` (line 60)  
- `C7-VILL-03` → `close` (line 64)  
- `C7-VILL-04` → `close` (line 67)  
- `C7-VILL-05` → `close` (line 71)  
- `C7-VILL-06` → `close` (line 75)  
- `C7-VILL-07` → `cancel` (line 82)  
- `C7-VILL-08` → `cancel` (line 83)  
- `C7-VILL-09` → `cancel` (line 84)  
- `C7-VILL-10` → `cancel` (line 96)  
- `ANVIL-R02` → `cancel` (line 97)  
- `C7-VILL-11` → `close` (line 103)  
- `C7-VILL-12` → `done` (line 108)  

---

#### **(5) Anomalies**  
1. **Line 7 (PROBE-001)**: `block` event due to OS error.  
2. **Line 18 (BR-003)**: `block` due to file collision; reopened and resolved (line 19).  
3. **Line 12 (PROBE-001)**: `cancel` after `block` (no closure).  
4. **Line 82 (C7-VILL-07)**: `cancel` after `done` (line 80).  
5. **Line 110**: Blank line (invalid entry).  

--- 

**Summary**: Most tasks follow expected lifecycles, but anomalies include unresolved blocks, premature cancellations, and invalid entries.
