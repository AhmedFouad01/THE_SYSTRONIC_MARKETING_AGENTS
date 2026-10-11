# Local reader benchmark: qwen3:14b (Ollama) vs Haiku, read-only reader role (R2)

Run date 2026-10-06. Runner: DEV_AG. Status: NOT_READY / evidence only. One run per task per model.
Ground truth: `out/ground_truth.md`. Auto path check: `check_paths.ps1` -> `out/path_check.csv`.

## Headline

- Local qwen3:14b through headless Claude Code WORKS mechanically: tool calling (Read/Grep/Glob) functions, 5/5 tasks completed, 0 timeouts, 0 errors, 100% GPU, about 9 min total.
- Quality is NOT reader-grade: every task has at least one factual error; T2 (find) and T4 (counts) are unusable without re-verification. Cited paths mostly exist, but "exists" is not "correct".
- Haiku column is EMPTY: BLOCKED. The `claude` CLI on this machine is not logged in (`claude auth status` -> `loggedIn:false`; error `Failed to authenticate: OAuth session expired and could not be refreshed`, also with the desktop-bundled `claude.exe` 2.1.288). Credential handling is out of my scope, so I stopped after one fix attempt. Needs the user to run `claude auth login` once (or an API key), then `powershell -File run_haiku.ps1`. Alternative needing no login: Lead dispatches `tsst-reader`/Explore (Haiku) with the same `tasks/T1..T5.md` prompts and `check_paths.ps1` scores the saved outputs.

## Results table

Wall time = Start-Process to exit (includes model load for first call, CLI start). Tokens from the CLI JSON (`input_tokens` is summed across turns).

| Task | Model | Wall time | Tool calls worked | Paths cited | Cited paths that exist | Obvious errors / hallucinations | Notes |
|---|---|---|---|---|---|---|---|
| T1 inventory | qwen3-14b-32k | 113.4 s (2 turns, 7.0k in / 1.3k out) | Y (Glob ran) | 2 (`TSST/brands`, `TSST/bus`) | 2/2 | Task not completed: answered "cannot fulfil, Glob returns only files" and listed 0 folders; speculated about Windows case sensitivity | Glob has no directory listing, so the reader needed `Glob TSST/*/*` or Grep trick; a prompt/tool limitation, one retry not allowed by the brief. Honest failure, no invented folders. |
| T1 | Haiku | n/a | n/a | n/a | n/a | n/a | BLOCKED: not logged in |
| T2 find | qwen3-14b-32k | 156.2 s (8 turns, 62.0k in / 3.1k out) | Y (8 turns) | 5 | 5/5 | (1) says guard file is "lines 1-158 (entire file)": file has 99 lines. (2) names `test_skill_index_and_guard.py` as the wiring: real wiring is `.claude/settings.json:12` (missed). (3) claims R1-R10 live in `BRAND_GUIDELINES_v1.0/AGENT_GUIDE.md` (file exists, contains no R1/R11 text) and R11-R14 in `crm/MORNING_QUESTIONS_2026-10-05.md` (no R11 there). Real: `TSST/core/rules.md` lines 24-43 (R1-R10) and 48-55 (R11-R14); never found it. | Found the guard file correctly; rules answer is wrong. Hedged ("not read here") but still wrong paths. Existing path does not mean correct path. |
| T2 | Haiku | n/a | n/a | n/a | n/a | n/a | BLOCKED |
| T3 diff | qwen3-14b-32k | 58.8 s (2 turns, 8.1k in / 1.4k out) | Y | 0 (no repo paths needed) | n/a | Insertions/deletions stated as 54/8; real `git diff --numstat` is 48/9. Says "old HEADER constant (lines 80-84) removed" (a HEADER line is removed, line numbers unverified). | Function names correct (`_split_inline`, `edit_runtime`, `save_runtime`), hunk headers `@@ -503,6 +503,52`, `@@ -520,8 +566,7`, `@@ -552,18 +597,12` are real. Behaviour summary plausible. Risk section generic. |
| T3 | Haiku | n/a | n/a | n/a | n/a | n/a | BLOCKED |
| T4 log | qwen3-14b-32k | 134.8 s (2 turns, 12.3k in / 3.1k out) | Y | 1 | 1/1 | Total rows 109 correct. Event counts wrong (new 23 vs 22, claim 18 vs 21, done 21 vs 19, close 15 vs 13, cancel 12 vs 8, verify 13 vs 7, progress 10 vs 12, reopen 3 vs 4). Runtime table garbled (counted values from the note column as runtimes: "gpt-6.1-sol", "codex.git", etc.; real: claude 55, codex 38, gemini 16). 22 distinct tasks correct and last-event list mostly right (misses nothing major). Anomalies: cites real blocks (lines 7, 18) but invents a blank line 110 and "cancel after done" at line 82; missed the `limit` row (109) and the other reopen rows. | Counting over 109 rows is the weak spot: 16 s of thinking, wrong totals. Any count-based reader work needs a script, not a 14B model. |
| T4 | Haiku | n/a | n/a | n/a | n/a | n/a | BLOCKED |
| T5 ref pack | qwen3-14b-32k | 74.8 s (3 turns, 11.1k in / 1.7k out) | Y | 13 | 13/13 | Marked `BRAND_LOOK_v1.0.md` LATEST and missed `BRAND_LOOK_v1.1.md` (the real latest); marked Logo.psd and Logo.png both "latest" with an invented "v1.0" (actual `palette-v1.1.json` sits beside them); `LEAD_NOTES_v0.3.md` marked latest; missed `LEAD_REVIEW_C7-VILL-11/12.md`, `BRAND_GUIDELINES_v1.0/` dir. Claimed `palette-v1.1.json` "confirms v1.0 branding" (self-contradictory). | All 13 listed paths real; guidelines, verbal identity, strategy v0.2, BRIEF 11/12 correct. "Latest" judgement is the weakness. |
| T5 | Haiku | n/a | n/a | n/a | n/a | n/a | BLOCKED |

Totals, local: 538.5 s for 5 tasks, mean 108 s; 21 cited paths, 21 exist (100%), but each task contained at least one substantive error against ground truth (T1 produced no answer).

Verdict for R2 use: qwen3:14b local is acceptable only as a path/inventory finder where a human or script verifies, not for counts, "latest" judgements or locating rule definitions. No Haiku comparison obtained.

## Setup that worked (local)

- Ollama 0.33.1 (server already running at `http://localhost:11434`, unchanged), Claude Code CLI 2.1.212 (npm `claude.cmd`), GPU RTX 4060 Ti 16 GB.
- Context method: Modelfile variant, NOT a server env var (no server restart needed):
  `Modelfile.qwen3-14b-32k` = `FROM qwen3:14b` + `PARAMETER num_ctx 32768`, then `ollama create qwen3-14b-32k -f Modelfile.qwen3-14b-32k`. `ollama ps` confirmed `CONTEXT 32768`, `100% GPU`, size 14 GB. (`OLLAMA_CONTEXT_LENGTH` was not needed; not tested.) This created one local Ollama model alias (no download, same weights/blob).
- Env (per process): `ANTHROPIC_BASE_URL=http://localhost:11434`, `ANTHROPIC_AUTH_TOKEN=ollama`, `ANTHROPIC_API_KEY=` (empty), `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`; the parent `CLAUDE_CODE_*`/`ANTHROPIC_*` variables are scrubbed first (`Clear-ClaudeEnv`).
- Flags (all verified in `claude --help`): `-p --model qwen3-14b-32k --output-format json --safe-mode --no-session-persistence --tools "Read,Grep,Glob" --allowedTools "Read,Grep,Glob" --disallowedTools "Edit,Write,Bash,PowerShell,NotebookEdit,WebFetch,WebSearch,Task,Agent" --permission-mode dontAsk`; the prompt is piped on stdin from `tasks/Tn.md`. `--tools` removes every other tool from the prompt; `--safe-mode` drops CLAUDE.md/hooks/skills/MCP, keeping the first request at about 7k input tokens (fits 32k easily; the 8-turn T2 grew to about 62k summed across turns, each call still within window). Note `--safe-mode` also means readers did not see project CLAUDE.md; same flags are used for Haiku.
- VRAM (nvidia-smi, 3 s sampler, `out/vram_local.csv`): idle about 1.3 GB (desktop), during runs 15.0-15.3 GB used (peak 15,257 MiB of 16,380), GPU util about 98%. Tight: a 40k+ context or a second GPU app would spill to CPU.
- T3: `common.ps1::Initialize-T3Input` writes `out/T3_input.diff` (git diff TSST/bus/bus.py) before each run, since the reader has no shell.
- The first bench attempt of T2-T5 failed to start only because `-File` passed `T2,T3,T4,T5` as one string; fixed by splitting on commas. T1 ran in a separate invocation (hence the first VRAM file was overwritten; the saved CSV covers T2-T5).

## Problems

1. Haiku blocked by missing CLI login (above). No spend, no credential touched.
2. T1 failed by tool limits (Glob returns files only). The same limit applies to any reader with `Read,Grep,Glob`; the real reader agents may have an LS/Bash equivalent. Not re-run (one run per task).
3. First-token latency is high (T1 ttft 94 s incl. model load and thinking; later calls 18-30 s) because qwen3 thinks before answering; no flag used to disable thinking.
4. `total_cost_usd` in the CLI JSON for local runs is a fictional price for an unknown model; ignore it.

## Files

- Scripts: `run_local.ps1`, `run_haiku.ps1`, `common.ps1`, `check_paths.ps1`, `Modelfile.qwen3-14b-32k`
- Prompts: `tasks/T1.md` .. `tasks/T5.md`
- Outputs: `out/T{1-5}_local.{md,json,stderr.txt}`, `out/T{1-5}_haiku.*` (these contain only the auth error), `out/timings.csv`, `out/path_check.csv`, `out/vram_local.csv`, `out/ollama_ps_local.txt`, `out/T3_input.diff`, `out/ground_truth.md`
- Repo files outside the bench folder modified by this run: none (git status shows the same modified set as at task start).
