CHATGPT GRADUAL SYNC CONTRACT — THE_SYSTRONIC


FOLDER FLOW


incoming → validation → processed or rejected → evidence


REQUIRED PACKET FIELDS


• Packet ID.
• Project Key: THE_SYSTRONIC.
• Created timestamp.
• Previous confirmed anchor.
• User message preserved verbatim.
• Concise interpretation.
• Confirmed result summary.
• User reaction or approval state when available.
• Decisions, requirements, status changes, and open questions.
• Evidence references.
• Proposed target memory files.
• Next action.


PROCESSING RULES


• Incoming packets are untrusted until validated.
• Do not overwrite canonical memory silently.
• Conflicts require an explicit proposal or rejection reason.
• Processed packets must leave evidence of what changed.
• Rejected packets must include a reason and remain recoverable.
• Full Chat Sync starts from the last confirmed anchor, not from the command time.
• Warn before exceeding the supported save limit.
• Prefer Markdown packets for long syncs.


ISOLATED PATH


Real Memory OS / USERS / AHMED_FOUAD / PROJECTS / THE_SYSTRONIC / 07_SYNC_INBOX / chatgpt-gradual /


Subfolders:
• incoming
• processed
• rejected
• evidence