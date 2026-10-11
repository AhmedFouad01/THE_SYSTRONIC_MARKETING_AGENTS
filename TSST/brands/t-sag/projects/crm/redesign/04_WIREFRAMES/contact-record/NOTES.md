# Contact record + journey: block wireframe (C2 trial, CREATIVE_AG)
Open `preview/index.html?view=contact&theme=light&dir=rtl` (also `theme=dark`, `dir=ltr`). Built on the 03d theme; only a new view, `contact.css` and `i18n-contact.ts` were added. Source: `C:\Work\tsst-crm-theme-proto` (Contact.tsx). Status: wireframe PREVIS, NOT_READY.

## Regions in order (03b 4.3 / 0.4)
1. Header: single-field name (dir=auto) with red bar, scope line, type chip, owner; call / email / WhatsApp / overflow (Merge, Add to segment, Delete) at the logical end, **Log activity** primary last.
2. Highlights strip (6): lifecycle, owner, phone, email, first-touch source, open deal value (CRM marker).
3. Logical start: Details card, Custom properties card.
4. Middle: Composer (Note, Call, WhatsApp, Email, Task + text area + Save note), then the single Timeline: chips All / People / System, day groups, People events open, System events in one collapsed group (touches, form, consent, conversion sent / rejected with reason), times at the logical end with UTC on hover.
5. Logical end: Associations (leads, deals), Segments with "Add to segment", Consent card (status, purpose, source, time, notice version, evidence ref; change locked "Manager only"), First and latest touch snapshot.
6. 375: header, highlights (horizontal scroll, 2 visible), segmented switch Timeline / Details / Related, sticky action bar (Call, WhatsApp, Log activity) above the shell bottom bar.
Every block shows its name and a one-line purpose; content is sample data, not real fields from a backend.

## Departures from 03b 4.3
- At 375 the header keeps only the overflow button; call, WhatsApp and Log move to the sticky bar (0.4 says so); email has no 375 shortcut.
- Composer submit is the secondary (tinted) button so the page keeps one filled primary.
- Details and Custom properties are not drawn collapsible or draggable (the purpose line says so).
- 4.3 states (new record "Nothing yet", loading skeleton, empty system events, masked fields, merged-away notice) are not drawn.
- The timeline shows today and yesterday only; no pagination or "load earlier".

## Open questions
- Is Delete on a contact allowed for non-managers, or hidden?
- Does "Log activity" open the composer in place (as drawn) or focus it and scroll?
- Email on mobile: add a fourth shortcut or keep it in the highlights?
- Does a rejected conversion event need a retry action for managers?
- Consent evidence ref: link to a document, or text only?

## QA (bounded: shoot, look, fix once, re-shoot once)
`tsc -b && vite build` passes; 4 shots checked by eye after fixes. 0 horizontal overflow, 0 console errors, 0 contrast failures (about 540 text nodes), no unstyled controls (HeroUI Select and TextArea only). Fixed after the first look: overflow button over the title at 375, clipped Task tab, LTR values on the wrong edge in AR cards, low contrast on the locked consent button.
