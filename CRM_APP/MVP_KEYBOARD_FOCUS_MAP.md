# Systronic CRM — Keyboard & Focus Map


Status: Wave 2 / UX-02
Owner: CREATIVE_AG


## Global focus order
1. Skip-to-content link.
2. Primary navigation.
3. Global search / command entry.
4. Context header actions.
5. View toolbar.
6. Main workspace.
7. Record panel when open.


Focus follows task and document order, not decoration.


## AppShell
- Sidebar collapse control is keyboard reachable.
- Active destination uses a semantic current-state indicator.
- Collapsing the sidebar does not move focus unexpectedly.
- Search and quick actions always have a visible focus state.


## Command palette
- A conventional platform command shortcut may be used after implementation conflict testing.
- Opening the palette moves focus to its search field.
- Arrow navigation selects results.
- Enter activates the selected result.
- Escape closes the palette.
- Closing returns focus to the invoking control.
- Every command also has a visible mouse/touch path.


## Tables and lists
- Default to semantic table behavior.
- Static cells do not become unnecessary tab stops.
- Row open actions and selection controls are keyboard reachable.
- Bulk actions enter the tab order only after rows are selected.
- If true interactive-grid behavior is later justified, its roving-focus model must be specified separately.


## Record side panel
Opening:
- preserve the source row/card reference;
- move focus to the record heading or first meaningful control;
- keep the master list state intact.


Closing:
- explicit Close action;
- Escape closes when safe;
- return focus to the source row/card or nearest stable equivalent.


Switching records:
- keep focus in the same logical panel location;
- update the record heading without excessive announcements.


## Forms
Opening:
- focus the first task-essential field or heading as appropriate.


Validation:
- multi-error submission moves focus to an error summary;
- field errors are associated with their controls;
- user-entered valid values remain in place.


Save:
- prevent duplicate submit while pending;
- success returns focus to the updated record context;
- failure keeps the user inside the recoverable form.


Cancel/close:
- clean form returns to the invoker;
- dirty form that would lose data requires confirmation.


## Dialogs
- True modal dialogs contain focus while open.
- Escape closes when safe.
- Closing returns focus to the trigger.
- High-impact confirmations place initial focus on a safe action unless the specific workflow requires otherwise.


## Popovers and menus
- Trigger remains the focus anchor.
- Escape closes and returns to trigger.
- Menu/listbox behavior follows the chosen accessible pattern.
- No important action is hover-only.


## Pipeline
- Deal card/open action is keyboard reachable.
- Move Stage is a visible action listing allowed transitions.
- Required reason is collected before submit.
- Any drag interaction is optional and never the sole path.
- Server confirmation determines the authoritative resulting stage.


## Tasks
- Quick Complete is reachable from the task row/card.
- Pending state prevents duplicate action.
- Success keeps the user in the queue and moves focus predictably.


## Reporting
- Report subviews use an appropriate tab/navigation pattern.
- Filters and calculate/refresh controls are keyboard reachable.
- State updates do not steal focus.
- Drill-down panel close returns focus to the exact source row/card.


## RTL / bidi
- Keyboard order follows logical task order, not naive mirroring.
- Directional behavior is defined per component.
- Mixed-direction values use bidi-safe rendering for IDs, emails, phones, URLs and numeric/currency data where needed.


## Focus QA scenarios
1. Home → Leads → open record → Create Deal → save → return to lead.
2. Filter Contacts → inspect multiple records → close → filter and scroll remain.
3. Deals → Move Stage → conflict → review and recover without focus loss.
4. Tasks → Complete → continue in queue without jumping to page start.
5. Insights → open evidence detail → close → return to source item.
6. Dirty form → attempt close → cancel discard → form focus restored.
7. Permission-denied deep link → understandable state → safe navigation out.
8. Complete Arabic RTL and English LTR paths.


## UX-02 keyboard acceptance
No core task depends on pointer-only interaction. Every overlay has defined focus entry, keyboard operation and focus return. Final behavior still requires implementation QA; this artifact does not validate the underlying skill by itself.