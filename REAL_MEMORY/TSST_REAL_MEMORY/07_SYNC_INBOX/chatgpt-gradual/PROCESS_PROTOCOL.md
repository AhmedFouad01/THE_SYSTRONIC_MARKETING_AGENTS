# TSST — Gradual Sync Process Protocol

## 1. Capture

Inside the TSST ChatGPT Project, use `RM_SYNC_NOW` after a meaningful exchange.

Create one packet in:
`07_SYNC_INBOX/chatgpt-gradual/incoming/`

## 2. Review

Review in proposal-only mode.

The reviewer must:
1. validate project key and packet structure;
2. check duplicates/conflicts;
3. compare with current TSST memory;
4. verify external implementation claims only against explicitly connected authoritative sources;
5. propose exact target paths and changed sections;
6. not apply yet.

## 3. Approval

The user approves the exact packet/change set.

## 4. Controlled Apply

Update only approved memory targets.

Record:
- packet ID;
- target path;
- changed section;
- before summary;
- after summary;
- verification source;
- timestamp.

## 5. Close

Successful packet → `processed/` + evidence record.  
Invalid/rejected packet → `rejected/` + reason.

## Safety

- No background monitoring.
- No silent apply.
- No cross-project updates.
- No secret capture.
- No bulk historical import unless explicitly requested.
