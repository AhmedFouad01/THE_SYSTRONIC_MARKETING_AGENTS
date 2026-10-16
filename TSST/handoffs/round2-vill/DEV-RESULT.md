# DEV result - round 2 VILL (tsst-dev, branch master, nothing committed)

Files changed (all LF, inside DEV-PLAN write scope; i18n untouched):
- TSST/services/delivery/build_delivery.py: publish() -> final/<name>; legacy files/ kept only if files/ exists and final/ does not; LAYOUT_DIRS += final; jobfiles() treats brief.md like README.md; final/ reuses the existing i18n label "Built client media" (jf_dir_files); header comment updated.
- TSST/services/delivery/job_check.py (check e): start-here = brief.md OR README.md; top-level files allowed brief.md, README.md, DELIVERY*, NN_NAME legacy, desktop.ini; dirs allowed final, work (+ legacy files, observations). Check names changed: "e) start-here file (brief.md or README.md) exists", "e) top-level files are ...".
- TSST/services/delivery/JOB_LAYOUT.md: layout section replaced (new layout + legacy note, 8 lines); legacy rules re-labelled.
- test_job_check.py (+3: new layout passes e, legacy passes e, missing start file/stray file fail e); test_brand.py (+4: publish final/, publish legacy files/, publish prefers final when both, jobfiles brief.md+final/).
- Rebuilt pages: VILL kitchen-campaign-01, marketing-week-01, social-setup-01, sofa-studio-01 (DELIVERY.html + _INTERNAL; links now final/, 0 files/ links). sync_jobs vill-studio wrote brand DELIVERY(.html/_INTERNAL), JOBS.md (4 jobs), project.md, status.md, core/portfolio.yaml mirrors.

Commands and results:
- build_delivery.py <job> x4: exit 0; structure OK, bidi OK, client leak scan clean. marketing-week-01 internal page prints "missing Arabic fields" (int_note, pre-existing, internal only) and plan warnings (empty dates/KPI targets, by design).
- sync_jobs.py vill-studio: exit 0.
- job_check.py on each of the 4 jobs: RESULT: PASS for all, no FAIL, no WARN (was 7 FAILs each).
- unittest discover TSST/services/delivery -p "test*.py": Ran 39, OK (was 32).
- validate_spine.py: 25/29 checks passed (= baseline). Remaining FAILs, not caused by this change: structural backticked paths (old PILOTS/ + pre-move VILL paths in archive/status-history/t-sag docs), neutrality (model names in archived/work docs), bus (C7-VILL-12/VILL-W1 spec paths moved out of PILOTS/), router (B: "كمل ANVIL"). Outside my write scope; Lead decision.
- ANVIL: git status of TSST/brands/anvil shows no changes from me.

Skills used: TSST-DEV-SK-011 (tests for new/legacy layout and publish target, red/green run), TSST-DEV-SK-016 (this handoff).
skill_friction: none.
Note: repo files were CRLF in the working tree (index LF); I normalised the 5 delivery files to LF.
