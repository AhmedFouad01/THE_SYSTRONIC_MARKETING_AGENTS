# Job layout (R18)

Status: **APPROVED by the owner 2026-10-11** (standard for every new job, all brands and runtimes; TSD-023).

Every job folder under `TSST/brands/<id>/projects/<job>/` uses this layout. Checked by `python TSST/services/delivery/job_check.py <job>` (check e).

```
<job>/
  README.md               start here: summary, state, next step, file map
  00_BRIEF.md             request + scope            (extra: 00b_*.md)
  01_STRATEGY.md          strategy / foundation      (extra: 01b_*.md)
  02_PLAN.md              plan / calendar            (extra: 02b_*.md)
  03_COPY.md              copy                       (extra: 03b_*.md)
  04_CREATIVE_BRIEFS.md   design/video briefs
  05_MEASUREMENT.md       SPARK review + measurement (extra: 05b_*.md)
  06_SCORECARD.csv        numbers sheet              (extra: 06b_*.md guide)
  07_DECISIONS.md         decisions, sources, client approvals
  08_LEAD_CHECKPOINT.md   Lead review / integration  (extra: 08b_*.md)
  DELIVERY.json -> DELIVERY.html + DELIVERY_INTERNAL.html   (R19)
  files/                  built client media (generator)
  work/                   raw team returns (work/lens, work/spark, manifests)
  observations/           skill observations (evidence; unchanged)
```

## Rules
- Slots 00-08 are optional. If the job has no such content, do not create an empty or invented file; the README file map lists what exists.
- File names: `NN_NAME.ext` or `NNb_NAME.ext` (b, c... = extra file in the same slot), upper-case ASCII names; `.md` or `.csv`.
- `README.md` is mandatory and is the checkpoint path used in `portfolio.yaml`.
- Top-level folders: only `files/`, `work/`, `observations/`. Anything else is a warning.
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
