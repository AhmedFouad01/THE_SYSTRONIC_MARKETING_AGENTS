# TSST daily board

Purpose: one locked plan per working day. The owner's "ابدأ اليوم" starts it; while it is
locked, work runs only on board rows, one track at a time. New requests wait in the inbox
for tomorrow. Rule: `TSST/core/rules.md` R17. Tool: `python TSST/daily/day.py` (stdlib only).

## Files (only day.py writes them)
- `board.json` - state of the current day (DRAFT -> LOCKED -> CLOSED).
- `today.md` - Arabic table for the owner, regenerated on every change. Do not edit.
- `inbox.md` - parked plain-text requests for tomorrow: `- [YYYY-MM-DD HH:MM] (brand) text`.
- `carry.json` - unfinished/swapped rows with their full plan; `close` writes it, next `collect` restores it (ids remapped, `after` refs to uncarried rows dropped) and then clears it.
- `log/<date>.md` - day-close summary (max 30 lines).
- `tests/test_day.py` - `python TSST/daily/tests/test_day.py`.

## Daily cycle
1. Owner says "ابدأ اليوم" -> `collect` builds a DRAFT from the inbox, portfolio.yaml,
   project.md / status.md "Next" sections and open bus tasks (never brand `memory/`).
2. Lead plans each row with `set` (team, agent, skills, tier, executor, after, done_when).
   Owner's manual work = executor `ahmed`. Remove noise with `drop`.
3. Owner OK -> `lock` (refuses with the full error list if any todo row is incomplete or a
   skill id is not in `TSST/skills/index.yaml`).
4. Work the rows; mark progress with `set N status=doing|done|blocked note=...`.
5. Any new request -> `park`. It enters today only with the owner's explicit OK in chat:
   `add "text" ... --owner-ok --swap N`; row N moves to tomorrow's inbox.
6. Day end -> `close` (unfinished rows -> carry.json, log written), then update each touched
   project checkpoint (core rule Must 6).

## Commands
| Command | Effect |
|---|---|
| `collect [--force]` | Build today's DRAFT. Refuses if an earlier day is not CLOSED or today is LOCKED/CLOSED. `--force` rebuilds today's DRAFT (manual edits lost). |
| `set N field=value ...` | DRAFT: any field. LOCKED: only status/note unless `--owner-ok`. `skills=A,B` `after=1,2` |
| `drop N` | DRAFT only. Inbox-sourced rows return to the inbox. |
| `lock` | Validate and freeze the plan. |
| `add "text" [field=value]` | DRAFT: append. LOCKED: needs `--owner-ok --swap N` and a row that passes lock validation. |
| `park "text" [--brand b]` | Append to the inbox. Always allowed. |
| `close` | LOCKED only. Carry unfinished, write log, status CLOSED. |
| `show [--render]` | Board summary (dropped rows hidden, count shown). `--render` regenerates today.md only. |

Global: `--root DIR` (default: repo root, used by tests).

## Row fields
id, task, brand, project, source, team (marketing|studio|build|lead), agent (tsst-lens|
tsst-spark|tsst-creative|tsst-dev|tsst-reader|lead), skills (1-3 ids), tier (FAST|WORK|CODE|
DEEP|IMAGE|VIDEO), executor (claude|codex|gemini-desktop|chatgpt|ahmed), after (row ids),
done_when, status (todo|doing|done|blocked|carried|swapped|dropped), note, added_midday.
Non-ahmed rows need team, agent, tier and skills; every todo row needs task, executor, done_when.
