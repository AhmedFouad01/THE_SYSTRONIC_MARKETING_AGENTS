# Rules pack — client jobs and delivery

Load for any client job or delivery page. Core rules still apply (`TSST/core/rules.md`).
Original wording: `TSST/decisions/rules-history.md`.

- **R18 Job home.** Every client job lives in `TSST/brands/<id>/projects/<job>/` and is listed in
  that brand's `project.md`. Never create new work in `TSST/PILOTS/` (read-only history) or
  `TSST/projects/`. Start with `TSST/services/delivery/new_job.py`; layout:
  `TSST/services/delivery/JOB_LAYOUT.md`.
- **R19 Delivery page.** A job that reaches Ahmed or the client ends with `<job>/DELIVERY.json` →
  `python TSST/services/delivery/build_delivery.py <job>` → `DELIVERY.html` (client) +
  `DELIVERY_INTERNAL.html`. Send the page, not a folder of markdown files.
- **R20 Same-round sync.** In the same round update DELIVERY.json, the brand `project.md`, brand
  `status.md` and the brand line in `TSST/core/portfolio.yaml`. Not done until the four agree.
  `[code]` `python TSST/services/delivery/job_check.py <job>`; refresh the index with
  `python TSST/services/delivery/sync_jobs.py <brand>`. DELIVERY.json is the only status source.
- **R40 Client pages are formal.** DELIVERY.html shows no internal names, tools, IDs, spend gates,
  rejected work or sources; one language per sentence. Internal detail → DELIVERY_INTERNAL.html.
- **R45 Unified brand delivery** (owner rule 2026-10-12). All brand work lives in its canonical job
  under the brand and shows, with current status, in the shared brand Delivery System. New
  campaigns extend that system; never a separate campaign-specific one. Brand entry pages link the
  job pages; refresh them (`sync_jobs.py <brand>`) whenever work is added or its status changes.
