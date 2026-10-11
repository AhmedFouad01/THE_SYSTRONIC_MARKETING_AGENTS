**Answer:**

(a) **Agent dispatch guard implementation/enforcement**  
- **File:** `TSST/context/hooks/agent_dispatch_guard.py`  
  - **Lines:** 1–158 (entire file)  
  - **Content:** Implements the Agent dispatch guard logic, including TEAM/SKILLS validation, blocked agent checks (e.g., "TSST R1: use a team agent"), and error handling for deprecated skills.  

(b) **Registration/wiring of the guard**  
- **File:** `TSST/context/tests/test_skill_index_and_guard.py`  
  - **Lines:** 32–143 (function `guard`)  
  - **Content:** Registers the guard by invoking `agent_dispatch_guard.py` with test cases for valid/invalid agent prompts. Also, `TSST/context/tests/test_runtime_agents.py` (lines 140–159) wires the guard to runtime agent mappings via `TEAM_AGENTS` table checks.  

(c) **Files defining numbered rules R1–R14**  
- **R1–R10:** `TSST/PILOTS/TSST-PILOT-002_VILL_STRATEGY_BASELINE/BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md` (not read here, but referenced in BRAND_GUIDELINES_v1.0.md).  
- **R11–R14:** `TSST/brands/t-sag/projects/crm/MORNING_QUESTIONS_2026-10-05.md` (mentioned in commit history but not explicitly listed in the file content provided).  
  - **Note:** Rules R1–R10 likely reside in BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md (based on the "agent guidance" link in BRAND_GUIDELINES_v1.0.md), while R11–R14 are implicitly referenced in MORNING_QUESTIONS_2026-10-05.md (e.g., "usage discipline rules R11–R14").  

**Clarification:** The exact rule definitions (R1–R14) are not fully visible in the files read here, but their contexts are tied to the guard implementation (R1) and project-specific guidelines (R11–R14). Further inspection of BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md and MORNING_QUESTIONS_2026-10-05.md would confirm specifics.
