# Systronic CRM — Command Map


Status: Wave 2 / UX-02
Owner: CREATIVE_AG
Principle: commands accelerate visible UI; they never create hidden-only functionality.


## Global entry


Candidate shortcut: Ctrl+K / Cmd+K.
Final shortcut assignment requires conflict check during implementation.


Palette groups:
1. Navigate.
2. Create.
3. Search/Open.
4. Context Actions.
5. View/Filter.


## Navigate commands


- Go to Home
- Go to Leads
- Go to Contacts
- Go to Deals
- Go to Tasks
- Go to Insights
- Go to Admin — only when authorized
- Go to Operations — only when authorized


Visible equivalent: primary/secondary navigation.


## Create commands


- Create Lead
- Create Contact
- Create Deal
- Create Task


Visible equivalent: Quick Create and object-level Add buttons.


Rules:
- permission-filter commands before display;
- command opens the same approved form component as visible UI;
- no separate command-only mutation contract.


## Search/Open commands


Desired:
- Search Contacts
- Search Leads
- Search Deals
- Open recent record


Dependency:
Unified cross-object search is an API GAP CANDIDATE. Until resolved, the palette may navigate to object-specific search rather than pretending cross-object backend search exists.


## Context commands


When a Contact is open:
- Edit Contact
- Create Task
- Review Journey
- Review Duplicates / Merge — authorized only


When a Lead is open:
- Edit Lead
- Create Deal
- Create Task


When a Deal is open:
- Edit Deal
- Move Stage
- Create Task
- Open Stage History


When a Task is open:
- Edit Task
- Complete Task


When Insights is open:
- Switch report subview
- Calculate Attribution — authorized only


## View commands


- Switch Deals to Pipeline
- Switch Deals to Table
- Open filter controls
- Clear current filters
- Switch saved view — only if saved-view persistence is implemented


## Command result behavior


Navigation command:
- move to destination;
- preserve recoverable prior workspace state.


Create command:
- open drawer;
- first required field receives focus.


Record command:
- open side panel without losing master context.


Mutation command:
- always surfaces required confirmation/input;
- no silent stage moves or destructive action from palette.


## Unauthorized / unavailable


Unauthorized commands are omitted from result lists.
Temporarily unavailable commands may appear disabled only when the reason is useful and correctable.
Provider/M3 actions do not appear in MVP palette.


## Language


Arabic command labels use user-facing verbs and product terms, not internal API names.
English command labels mirror the same task meaning.
Search matches both localized labels where practical.


## Discovery


Shortcuts may be shown in:
- tooltip;
- menu item;
- command result;
- Help/Shortcuts panel.


A novice user must be able to complete every command-backed action without knowing any shortcut.