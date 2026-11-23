# S6-03 part c: two rules proposed for `TSST/core/rules.md`

Status: **proposal, not in force.** `rules.md` is not edited until Ahmed says yes. The numbers are his to give (the next free ones after R61, or others).

## Rule A (proposed): one status vocabulary for work

**Text for `rules.md`:**
> **R?? Nine status words** (owner rule, date of approval): a piece of work in Dash has exactly one of nine status words, on every screen, for the team and for the client. No screen invents another word for the state of an item. The words live in one place in code (`TurnStatus` in `src/service/dash/turn.ts`) and one place in copy (`reviewOrder.status` in `web/src/copy.ts` and `web/src/copy/ar/copy.ts`). A new state is a change to this rule first, then to the code.

| # | English | Arabic (as in the product today) | Meaning |
|---|---|---|---|
| 1 | Planned | متخطط | In the plan, not sent for review yet. |
| 2 | Pending review | مستني المراجعة | With the team reviewer. A held item reads this too. |
| 3 | Waiting on client | مستني العميل | Sent to the client, no decision yet. |
| 4 | Waiting on approval | مستني الموافقة | With the approver inside the team. |
| 5 | Changes requested | مطلوب تعديل | Sent back for edits (by the reviewer or by the client). |
| 6 | Approved | اتوافق عليه | Decided yes, not scheduled or posted yet. |
| 7 | Scheduled | متجدول | Approved and has its day. |
| 8 | Posted | اتنشر | Published. |
| 9 | Delivered | اتسلّم | Handed over (work that is not a post). |

**What it does not cover (say so in the rule):** the status of a JOB (Planned, In progress, In review, Delivered, On hold), of a request, of a package (Active, Paused) and of a payment are other lists with their own words. Client pages may use a client's phrase for the same state where a drawing approved it ("Needs your review" for item 3 seen by the client, "Ready" in Latest ready work); those phrases are listed in the copy files and are not new states.

**Checked today by:** the type in code (a tenth word does not compile); the calendar and review gates read the words from the copy file. There is no test that scans every screen for a stray status word: the rule is enforced at review.

**Questions for Ahmed (default in brackets):**
1. Are the nine Arabic words right as they are? [Yes, as in the product; they were not all read by you.]
2. "Waiting on approval" (4): keep it as a separate word from "Pending review" (2)? [Yes, it exists in code.]
3. Should the client phrases ("Needs your review", "Ready") be replaced by the nine words too? [No: approved drawings use them.]

## Rule B (proposed): 44px touch targets

**Text for `rules.md`:**
> **R?? 44px targets** (owner rule, date of approval): on any screen narrower than 768px, every control a person taps (button, link that acts as a button, field, select, switch, checkbox, tab, menu item, row that opens something) is at least 44px in both directions. The gate of a ticket measures it on the phone width; a control under 44px fails the gate.

**Exceptions (proposed):**
- A text link inside a sentence.
- Controls that exist only at 768px and wider.
- Marks that are not controls (status chips, the milestone dots, the calendar's status key).

**Checked today by:** the browser gates of S4 to S6 (each measures its own page at 390px). It is not checked on pages that have no gate, and no gate ran on a real phone or Safari.

**Known today:** the kit's desktop buttons are 36px and stay so above 768px. Nothing in this rule changes desktop.

**Questions for Ahmed (default in brackets):**
1. 44px in both directions, or 44px high with any width? [Both directions.]
2. Does the rule also apply to the team pages on a phone? [Yes, every page.]
3. Old pages without a gate: fix when touched, or a sweep now? [When touched.]
