# Systronic CRM — State & Overlay Decision Matrix


Status: Wave 2 / UX-02
Owner: CREATIVE_AG


## Overlay selection rules


| Interaction | Default surface | Why | Focus / close rule |
|---|---|---|---|
| Read common record details | Side panel / drawer | Preserve list/pipeline context | Focus detail heading; close returns to source row/card |
| Edit short/medium record | Same side panel or form drawer | Preserve work context | Preserve entered data; dirty-close guard |
| Create Lead/Contact/Deal/Task | Drawer/sheet | Fast creation without leaving workspace | First required field; return to invoking control |
| Choose filter/view/columns | Popover/menu | Short bounded choice | Escape closes; focus returns to trigger |
| Row secondary actions | Context menu | Prevent action clutter | Keyboard navigable; permission filtered |
| Confirm destructive merge/delete-like action | Modal dialog | Requires explicit high-impact confirmation | Focus confirmation heading; destructive action not default focus |
| Version-conflict recovery | Dialog or panel state depending complexity | User must compare/review latest state | Never auto-overwrite |
| Long multi-step workflow | Full page | Drawer/modal would trap complexity | Stable Back returns to originating context |
| Command palette | Modal combobox/palette | Global search/action entry | Restore focus to invoker after close |
| Mobile record inspection | Full-height sheet | Narrow screens need single focus surface | Swipe/close plus explicit accessible Close |


## System-state model


### Loading
- preserve shell and prior context;
- table refresh uses local skeleton/row loading rather than blanking whole app;
- mutation buttons show scoped progress and prevent double-submit.


### Empty
Three types:
1. true empty object set → explain what exists here + create action if authorized;
2. filtered empty → “No results for these filters” + clear filters;
3. no evidence/report data → explain unavailable evidence, not “error”.


### Permission denied
- name the restricted action/surface in user language;
- keep safe surrounding context;
- do not reveal protected values;
- offer Back/Close, not fake retry unless permissions may legitimately refresh.


### Validation error
- field error adjacent to field;
- summary for multi-error forms;
- move focus to summary/first invalid field;
- preserve all valid input.


### Stale/version conflict
- explain that record changed after open;
- fetch/display latest authoritative state;
- preserve proposed local values;
- user explicitly reviews then retries;
- never silently overwrite.


### Network/retry
- explain connection failure;
- preserve form/action payload locally;
- retry uses the existing idempotency/command identity behavior;
- avoid duplicate mutation.


### Success
- confirm near the changed object;
- close form only when success is authoritative;
- preserve list position;
- optional Undo only when backend semantics actually support it.


### Partial / processing
Outbox/worker states:
- distinguish queued, processing, completed, blocked/failed;
- show retry meaning only where the current product contract supports it;
- avoid exposing raw implementation jargon as the only explanation.


### Unpublished / stale reporting
- keep report basis visible;
- distinguish no calculation from no data;
- calculate/publish action only with report.calculate;
- never imply provider-reported attribution exists.


## Permission vs disabled


Use disabled for temporary/user-correctable conditions.
Use hidden/omitted when capability is known absent and showing the action provides no useful learning.
Use denied state for direct route/deep-link attempts or when capability resolves only after request.


## Destructive/high-impact actions


Contact merge:
1. review duplicates;
2. generate merge preview;
3. show source/target and version information;
4. explicit confirmation;
5. execute;
6. success returns to canonical surviving contact.


Pipeline/config changes:
- keep in Admin;
- require explicit save;
- no silent auto-submit.


## Dirty state


A form is dirty after meaningful user change.
Closing dirty create/edit:
- if no data loss: close;
- if data loss: confirmation.
Navigation outside the workspace should not silently discard form state.


## Accessibility baseline


- all dialogs/drawers have accessible name;
- focus trapped only in true modal dialogs;
- non-modal detail panel must still provide predictable keyboard order;
- Escape behavior never conflicts with required field selection without warning;
- focus return is mandatory;
- status changes use appropriate live-region semantics without repeated noise.