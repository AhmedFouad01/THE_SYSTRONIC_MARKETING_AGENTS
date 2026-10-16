# Job layout (R18)

Status: **R48, owner-approved 2026-10-16** (supersedes the 2026-10-11 NN_NAME layout for moved brands; TSD-023).

Every job folder under `TSST/brands/<id>/projects/<job>/` is checked by `python TSST/services/delivery/job_check.py <job>` (check e):

```
<job>/
  brief.md                start here: request, scope, state, next step
  work/                   everything the team produced (raw returns, drafts, evidence; never edited after the fact)
  final/                  generated client copies (build_delivery.py writes them; the client page links here)
  DELIVERY.json -> DELIVERY.html + DELIVERY_INTERNAL.html   (R19)
```

Legacy layout (README.md, `NN_NAME` slots 00-08, `files/`, `observations/`) is still accepted until a brand is moved; `build_delivery.py` keeps writing to `files/` only for a job that has `files/` and no `final/`.

Start a job: `python TSST/services/delivery/new_job.py <brand-id> <job-path> --service "<SV-.. name>" --title "<title>" [--lang en|ar] [--dry-run]` (creates README, 00_BRIEF, DELIVERY.json stub and registers the job; see README.md).

## Rules (legacy NN_NAME layout; new layout = brief.md + work/ + final/ only)
- Slots 00-08 are optional. If the job has no such content, do not create an empty or invented file; the README file map lists what exists.
- File names: `NN_NAME.ext` or `NNb_NAME.ext` (b, c... = extra file in the same slot), upper-case ASCII names; `.md` or `.csv`.
- Start-here file is mandatory: `brief.md` (new) or `README.md` (legacy); it is the checkpoint path used in `portfolio.yaml`.
- Top-level folders: `final/`, `work/` (legacy also `files/`, `observations/`). Anything else is a warning.
- `work/` and `observations/` are evidence (may carry hashes): never edit after the fact.
- A re-layout renames only; content is never rewritten. Record old -> new names in a "Renamed <date>" table in the job README so old references resolve.
- Bus task files and `log.tsv` are hash-verified history: never edit them to follow a rename.

## Example
`TSST/brands/anvil/projects/campaign-01/marketing-week-01/` (00_BRIEF, 01_STRATEGY + 01b_CONTENT_STRATEGY, 02_PLAN, 03_COPY + 03b_PILOT_COPY_REVIEW, 05_MEASUREMENT + 05b_SPARK_REVIEW, 06_SCORECARD.csv, 07_DECISIONS, 08_LEAD_CHECKPOINT).

## Legacy jobs
A job that was not re-laid out has a README with the line `layout: legacy (pre R18, not re-laid out)`; `job_check.py` then reports file-name mismatches as WARN, not FAIL.

## Moving a job (checklist)
1. Move with `git mv` (history stays); never recreate `.git`.
2. `brands/*/projects/{_qa,files}/` is git-ignored (media is untracked): move those folders by file copy and check they arrived; they do not travel with git.
3. Build scripts under the job have a hard-coded `ROOT` depth (number of `..` / `parents[n]`): fix it after the move and rebuild.
4. Hashed evidence (`work/`, `observations/`, bus task files, `log.tsv`) is never edited. Record old -> new paths in a `MOVED.md` next to the README instead.
5. Update the brand `project.md`, `status.md` and `portfolio.yaml` paths, rebuild the delivery pages, then run `python TSST/services/delivery/sync_jobs.py <brand>` and `python TSST/services/delivery/job_check.py <job>`.

## Status agreement

After a manifest change, run the approved brand sync and strict `job_check.py`; the helper derives hash-bound `TSST_JOB_SYNC` comments in existing project/status/portfolio pointers. Missing pointers need an explicit scoped correction; they are never invented. See README.md, Strict status agreement. `--structure-only` is an incomplete legacy inspection and cannot establish R20.
