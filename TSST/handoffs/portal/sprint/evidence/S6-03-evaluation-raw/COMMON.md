# Evaluation re-run, common brief (2026-11-23)

You are one of six READERS in a re-run of the product evaluation of 2026-11-05. Read only. You change nothing, commit nothing, run nothing that writes.

- The first evaluation (Arabic; read it all first): /Users/fouad/Work/DASH-EVALUATION-2026-11-05.md. It judged commit `6290115` and scored the product 4 of 10.
- What you judge now: the read-only checkout /Users/fouad/Work/tsst-portal-s603, detached at `e758f9a` (branch `next`, NOT deployed). The live site still runs `main` = `6a28ba3`: say clearly for each finding whether your evidence is about `next` only. Compare with `git show 6290115:<path>` or `git diff 6290115 e758f9a -- <path>` when it helps (local git only, no fetch).
- Node 22 if you need it: `export PATH="/opt/homebrew/opt/node@22/bin:$PATH"`. You may run read-only local commands (grep, wc, git log/show/diff, `npx tsx scripts/route-table.ts`). Do NOT run the test suite, do NOT start servers, no network.
- Never open `.env` files, `*.pem`, `~/.ssh`, `/etc/tsst-portal`, or `SERVER.md`. If you meet a secret or a private address in a file, report file and line only, never the value.

Your report: write it to the file named in your brief (plain Markdown, English, at most about 900 words), then return a summary of at most 250 words. Structure:
1. For EACH finding of 5 Nov that belongs to your area (quote its short name): FIXED / PARTLY / OPEN / WORSE, with evidence as file:line or a command and its output. No evidence, no claim: write "not verified".
2. NEW problems in your area that did not exist on 5 Nov (introduced by the sprint), with evidence and a severity (high / medium / low).
3. A score for your area from 1 to 5 with two sentences of reason, next to the 5 Nov score for the same area.
4. What you did not look at.
Numbers must be counted by a command you state, not estimated.
