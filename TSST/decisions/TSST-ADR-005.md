# TSST-ADR-005 — Motion AG: independent video/motion team (MOTION_AG)

Date: 2026-10-11. Decision owner: user (Ahmed). Integration owner: TSST Lead. Extends TSST-ADR-003/004.
Status: APPROVED (governance registration only).

## Authority
Owner approval in chat, 2026-10-10/11: create a new, independent video team "Motion AG" with its own
manager MOTION_AG, a fixed-roster peer of studio/CREATIVE (not under it). CREATIVE keeps static design,
brand and UI work and does the final brand check on video.

## Decision
1. **New team `motion`**, manager MOTION_AG (runtime agent `tsst-motion`, tier WORK). Identity
   `TSST/MOTION/AGENT.md`; team map `TSST/teams/motion/team.md`. The former CREATIVE internal worker file
   `TSST/CREATIVE/MOTION_AG/AGENT.md` is a pointer stub.
2. **Skills moved**: TSST-CREATIVE-SK-015..018 become TSST-MOTION-SK-001..004 (`TSST/MOTION/skills/`, `git mv`,
   each SKILL.md notes "formerly TSST-CREATIVE-SK-0xx"). Status stays UNVALIDATED. New motion skills are
   written by MOTION_AG itself in later rounds.
3. **Routing**: `router.yaml` team_routing.motion = video, motion, reel, animation, voice-over, shot list (removed
   from studio); `multi_team_order` = marketing -> motion -> studio. `roster.yaml` route `motion: motion`.
   Index builder, dispatch guard and bus accept team `motion` and `TSST-MOTION-*`.
4. **Spec**: LENS/SPARK "Balanced setup, run Budget-first" (`TSST/brands/t-sag/projects/tsst-ai/motion-ag/`
   LENS-MO-001 sections 4-5, SPARK-MO-001 section 4). Pipeline: brief, Egyptian script, JSON shot list, master
   frame, shots, voice, code-motion text, ffmpeg. Handoffs: LENS story in, Motion AG, CREATIVE brand check, SPARK ad specs.
5. **House rules**: raw media is reference only; no slideshow; logos composited; Arabic RTL never breaks; no
   on-camera Arabic speech until a lip-sync test passes; cost fits the package (one credit quote per job).
6. **Generation stays MANUAL through Ahmed**: the team prepares prompts and one credit quote; no spend,
   publication or client contact without explicit approval.

## Limits
Governance registration only. MOTION_AG is `NOT_READY`; the 4 skills are `UNVALIDATED`; no PILOT_READY,
PRODUCTION_READY, autonomous execution or skill validation is granted. Existing evidence and history that cite the
old CREATIVE ids are left untouched (the id mapping above is the bridge). Reversal: move the skills back, restore
the roster/router entries and regenerate agents.
