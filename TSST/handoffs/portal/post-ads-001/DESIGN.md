# DASH-POST-ADS-001 D1: posts and ads redraw (PREVIS, HTML mocks, not built)

Look source: `*.html` + `posts.css` (extends `shared.css`, a copy of the pkg-link-004 one, left unchanged). `posts.js` = mock data + frame/card renderers.
Theme: every value is `var(--token)`. New tokens are in `proposed-tokens.css` under "DASH-POST-ADS-001": life/review chip pairs, frame sizes, `--phone-bg`, `--post-safe-zone`, `--stage-bg`.
Demo brand "Sabeel Bakery" (made up), with SVG mock media. Platform icons are plain outline icons, not logos. Proof: `node render.mjs all`, which checks 1440/390 light+dark plus 1024 light (numbers only, no PNG). All 6 checks = 0.

## Decisions
- **Wizard** (`new-post.html`) is one scrolling page with a stepper in the owner's order. Done steps show what was picked. On desktop, step 6 Preview is a sticky side rail; at 390 it drops to the bottom. "Create post" is the only page action.
- Choices are tiles (RadioGroup / CheckboxGroup, card style) with no borders: selected = `--sy-selection`, disabled = sunk fill + a reason line in plain words. Shown: Album, Document, 3:4, LinkedIn.
- Ad details sit in step 4: goal, funnel stage (with a "Suggested" tag, editable), start and end dates. A line shows the package count: "3 of 6 used · 3 left".
- Step 5 counter turns red when over the limit. It's a soft warning that never blocks (FORMATS-001 rule).
- **Frames** are always LTR (live rule) and use the client's social profile. Ad frames carry "Ad" under the name. The safe-zone switch shows tints at 14% top, 35% bottom and 6% sides. A 4:5 image in Stories is drawn smaller with space around it. Right column shows 1:1 by default plus 1.91:1, because the sources conflict. Album layouts come as one set (2 / 3 / 4 / 12 with "+7").
- **Post card**: thumbnail (4:5 crop with a type badge), title (2 lines, `dir="auto"`), review chip (R49) on the title row, then Organic|Ad chip · type · ratio · platform icons, then goal + funnel (ads only), then life chip + date + job link.
- **Groups**, with the item that needs action first. Team: Needs a fix / Waiting for client review / Approved, not live yet / Running / Posted and completed. Client: Waiting for your review (Approve + Edit sm on the title row) / Being updated / Coming up / Running now / Published and completed.
- **Client view** has no job link, no ⋯ menu, and no Draft chip; ad cards show goal + funnel. Arabic (`?lang=ar`) is RTL in IBM Plex Sans Arabic, live client style (see D1b).
- Life chip colours: Draft sunk, Scheduled cyan, Posted green, In Meta review violet, Active teal, Paused grey, Completed slate, Rejected red. Violet keeps "In Meta review" apart from Pending review orange.
- **Social profiles**: a table with one row per platform, edited inline. The example row shows a field error with the value kept (SK-025). LinkedIn not set = brand logo + brand name + "Add profile". At 390 the table becomes a list.

## D1b (Lead review + owner answers 2026-10-27)
- Client list at 390: the title row spans the whole card, with Approve / Edit (sm) on it; thumbnail and details sit under it. Team cards use the same layout.
- `post-preview.html` = **frame catalogue** (says so in a notice). Header: title + Ad / life / review chips + Approve / Edit sm. One 3-column grid in both cards (Organic, Ad); LinkedIn is a cell, not its own panel. Safe-zone switch sits on the Stories and Reels row.
- FB ad link bar: domain + headline get the full width, button on its own row (headline never wraps beside it). Headline + Button stay (contract).
- Disabled tiles: no fill (closed) + lock icon + reason line. Safe zones: thin striped bands (`--post-safe-band`), readable on light and dark images.
- Team card ⋯ menu shown open once (first card): Open post · Set status (Draft, Scheduled, Posted) · Turn into ad ("goes back to client review") · Delete post.
- Wizard package line: counts once it goes to Meta review; Draft and Rejected never count. Stepper = thin wrapper on HeroUI primitives (Lead OK).
- Client sees goal + funnel on ad cards (EN + AR). Rejected by Meta and Changes requested share red (Lead OK).
- Arabic = live client style (plain Egyptian, no slang). Live words reused: مستني رأيك · اتوافق عليه · مطلوب تعديل · موافق · تعديل · شغال · متوقف مؤقتًا · اكتمل · مخطط · الرئيسية · المشروعات · خطة · جذب عملاء · تفعيل العملاء · الحفاظ على العملاء · ترشيحات العملاء · المبيعات · صورة · صور متتابعة · فيديو قصير · قصة · ميتا.
  New in that style: مسودة · ميعاده متحدد · اتنشر · تحت مراجعة ميتا · مرفوض من ميتا · groups: مستني رأيك / جاري التعديل / جاي قريب / شغال دلوقتي / اتنشر واكتمل · goals: الوعي بالبراند / زيارات / تفاعل / عملاء محتملين / تحميل التطبيق / مبيعات.

## Open
1. 1024 is checked by numbers only (no PNG). Should the Lead see 1024 renders?
2. Arabic goal words are new (no live strings exist): owner to confirm.
