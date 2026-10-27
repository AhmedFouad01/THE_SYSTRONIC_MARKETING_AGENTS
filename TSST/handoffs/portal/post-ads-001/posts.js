// DASH-POST-ADS-001 mock data + renderers (frames, post cards). Demo brand only: "Sabeel Bakery" (not a client).
(function () {
  const M = 'assets/media/';
  const ico = (n, c = '') => `<svg class="i ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Client social profiles (Client settings). LinkedIn not set: frames fall back to brand logo + brand name.
  const brand = { name: 'Sabeel Bakery', logo: M + 'logo.svg' };
  const profiles = {
    instagram: { avatar: M + 'avatar.svg', page: 'Sabeel Bakery', handle: 'sabeel.bakery' },
    facebook: { avatar: M + 'avatar.svg', page: 'Sabeel Bakery | مخبز سبيل', handle: 'sabeelbakery' },
    linkedin: null,
  };
  const prof = p => profiles[p] || { avatar: brand.logo, page: brand.name, handle: '', fallback: true };
  const avatar = (p, extra = '') => { const x = prof(p); return `<span class="frame__avatar ${extra}"${x.fallback ? ' style="padding: var(--size-4)"' : ''}><img src="${x.avatar}" alt=""${x.fallback ? ' style="object-fit: contain"' : ''}></span>`; };

  const post = {
    img: M + 'brunch.svg',
    text: 'Weekend brunch is back: buttery croissants, shakshuka and sourdough toast, every Friday and Saturday from 9 am. احجز ترابيزتك أو اطلب مسبقًا من الرابط.',
    headline: 'Weekend brunch from 9 am',
    button: 'Order now',
  };

  const F = {};
  F.igFeed = ({ ratio = '4 / 5', ad = false, slides = 0, img = post.img } = {}) => `
    <article class="frame frame--ig" aria-label="Instagram feed preview">
      <div class="frame__head">${avatar('instagram')}<div class="frame__who"><span class="frame__name">${prof('instagram').handle}</span>${ad ? '<span class="frame__sub">Ad</span>' : ''}</div><span class="icon-button icon-button--sm">${ico('more')}</span></div>
      <div class="frame__media" style="--ratio:${ratio}"><img src="${img}" alt="">${slides ? `<span class="frame__pill">1/${slides}</span><span class="frame__dots">${'<i></i>'.repeat(slides)}</span>` : ''}</div>
      ${ad ? `<div class="frame__cta"><span>${post.button}</span>${ico('chevron-right')}</div>` : ''}
      <div class="frame__actions">${ico('heart')}${ico('comment')}${ico('send')}<span class="save">${ico('bookmark')}</span></div>
      <p class="frame__caption" dir="auto"><b>${prof('instagram').handle}</b> ${esc(post.text)}</p>
    </article>`;
  F.fbFeed = ({ ratio = '4 / 5', ad = false } = {}) => `
    <article class="frame frame--fb" aria-label="Facebook feed preview">
      <div class="frame__head">${avatar('facebook')}<div class="frame__who"><span class="frame__name" dir="auto">${esc(prof('facebook').page)}</span><span class="frame__sub">${ad ? 'Ad' : '3 Nov'} · ${ico('globe', 'i-14')}</span></div><span class="icon-button icon-button--sm">${ico('more')}</span></div>
      <div class="frame__text"><p class="clamp" dir="auto">${esc(post.text)}</p><span class="frame__more">See more</span></div>
      <div class="frame__media" style="--ratio:${ratio}"><img src="${post.img}" alt=""></div>
      ${ad ? `<div class="frame__link frame__link--stack"><span class="frame__link-text"><small>sabeelbakery.com</small><b dir="auto">${post.headline}</b></span><span class="frame__btn">${post.button}</span></div>` : ''}
      <div class="frame__react">${'<span>' + ico('like') + 'Like</span><span>' + ico('comment') + 'Comment</span><span>' + ico('share') + 'Share</span>'}</div>
    </article>`;
  F.liFeed = ({ ratio = '1 / 1' } = {}) => { const x = prof('linkedin'); return `
    <article class="frame frame--li" aria-label="LinkedIn feed preview">
      <div class="frame__head">${avatar('linkedin')}<div class="frame__who"><span class="frame__name">${x.page}</span><span class="frame__sub">Company · 3 Nov</span></div><span class="icon-button icon-button--sm">${ico('more')}</span></div>
      <div class="frame__text frame__text--3"><p class="clamp" dir="auto">${esc(post.text)}</p><span class="frame__more">…more</span></div>
      <div class="frame__media" style="--ratio:${ratio}"><img src="${post.img}" alt=""></div>
      <div class="frame__react" style="--n:4"><span>${ico('like')}Like</span><span>${ico('comment')}Comment</span><span>${ico('repost')}Repost</span><span>${ico('send')}Send</span></div>
    </article>`; };
  F.phone = ({ kind = 'story', ad = false, fit = false, safe = false, platform = 'instagram', img } = {}) => {
    const x = prof(platform); const name = platform === 'instagram' ? x.handle : x.page;
    const media = fit ? `<div class="fit"><img src="${img || post.img}" alt=""></div>` : `<img class="fill" src="${img || (kind === 'reel' ? M + 'reel.svg' : post.img)}" alt="">`;
    const top = `<div class="phone__top">${kind === 'story' ? '<div class="phone__bars"><i></i><i></i><i></i></div>' : ''}<div class="phone__who">${avatar(platform)}<b dir="auto">${esc(name)}</b><span>${ad ? 'Ad' : (kind === 'story' ? '2h' : '')}</span></div></div>`;
    const bottom = kind === 'reel'
      ? `<div class="phone__bottom"><div class="stack" style="gap:var(--space-2)"><p class="phone__cap" dir="auto"><b dir="auto">${esc(name)}</b> ${esc(post.text)}</p>${ad ? `<span class="phone__cta">${post.button}${ico('chevron-right', 'i-14')}</span>` : ''}</div><div class="phone__icons">${ico('heart')}${ico('comment')}${ico('send')}${ico('more')}</div></div>`
      : `<div class="phone__bottom" style="grid-template-columns:minmax(0,1fr)">${ad ? `<span class="phone__cta">${post.button}${ico('chevron-right', 'i-14')}</span>` : `<div class="row"><span class="phone__reply" style="flex:1">Send message</span>${ico('heart', 'i-20')}${ico('send', 'i-20')}</div>`}</div>`;
    return `<div class="phone" aria-label="${kind === 'reel' ? 'Reel' : 'Story'} preview">${media}${kind === 'reel' ? `<span class="phone__play">${ico('play')}</span>` : ''}${top}${bottom}${safe ? '<div class="safe" aria-hidden="true"><i class="safe__top"></i><i class="safe__bottom"></i><i class="safe__start"></i><i class="safe__end"></i></div>' : ''}</div>`;
  };
  F.mp = () => `<div class="mp" aria-label="Marketplace preview"><div class="mp__media"><img src="${post.img}" alt=""></div><span class="mp__title" dir="auto">${post.headline}</span><span class="mp__sub" dir="auto">${esc(prof('facebook').page)} · Ad</span></div>`;
  F.rc = ({ ratio = '1 / 1', w = 'var(--size-120)' } = {}) => `<div class="rc" aria-label="Right column preview"><span class="rc__label">Ad</span><div class="rc__row" style="--rc-media:${w}"><div class="rc__media" style="--ratio:${ratio}"><img src="${post.img}" alt=""></div><div><p class="rc__title" dir="auto">${post.headline}</p><p class="rc__sub">sabeelbakery.com</p></div></div></div>`;
  F.grid = () => `<div class="ig-grid" aria-label="Instagram profile grid"><div class="ig-grid__tile is-this"><img src="${post.img}" alt="This post"></div><div class="ig-grid__tile"><img src="${M}croissant.svg" alt=""></div><div class="ig-grid__tile"><img src="${M}bread.svg" alt=""></div></div>`;
  const pics = ['brunch', 'croissant', 'shop', 'bread', 'cookies'];
  F.collage = n => { const k = Math.min(n, 5); let h = ''; for (let i = 0; i < k; i++) h += `<div><img src="${M}${pics[i]}.svg" alt="">${i === 4 && n > 5 ? `<span class="collage__more">+${n - 5}</span>` : ''}</div>`; return `<div class="collage collage--${k}" aria-label="${n} photos">${h}</div>`; };

  // ---------- Post cards ----------
  const L = {
    en: {
      organic: 'Organic', ad: 'Ad',
      type: { single: 'Single image', multi: 'Carousel', album: 'Album', video: 'Reel', story: 'Story', document: 'Document' },
      plat: { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' },
      life: { draft: 'Draft', scheduled: 'Scheduled', posted: 'Posted', in_review: 'In Meta review', active: 'Active', paused: 'Paused', completed: 'Completed', rejected: 'Rejected by Meta' },
      review: { pending: 'Pending review', approved: 'Approved', changes: 'Changes requested' },
      goal: { awareness: 'Awareness', traffic: 'Traffic', engagement: 'Engagement', leads: 'Leads', app_promotion: 'App promotion', sales: 'Sales' },
      funnel: { acquisition: 'Acquisition', activation: 'Activation', retention: 'Retention', referral: 'Referral', revenue: 'Revenue' },
      goalL: 'Goal', funnelL: 'Funnel', approve: 'Approve', edit: 'Edit', more: 'More actions for',
    },
    ar: {
      organic: 'منشور عادي', ad: 'إعلان',
      type: { single: 'صورة', multi: 'صور متتابعة', album: 'ألبوم', video: 'فيديو قصير', story: 'قصة', document: 'مستند' },
      plat: { instagram: 'إنستجرام', facebook: 'فيسبوك', linkedin: 'لينكدإن' },
      life: { draft: 'مسودة', scheduled: 'ميعاده متحدد', posted: 'اتنشر', in_review: 'تحت مراجعة ميتا', active: 'شغال', paused: 'متوقف مؤقتًا', completed: 'اكتمل', rejected: 'مرفوض من ميتا' },
      review: { pending: 'مستني رأيك', approved: 'اتوافق عليه', changes: 'مطلوب تعديل' },
      goal: { awareness: 'الوعي بالبراند', traffic: 'زيارات', engagement: 'تفاعل', leads: 'عملاء محتملين', app_promotion: 'تحميل التطبيق', sales: 'مبيعات' },
      funnel: { acquisition: 'جذب عملاء', activation: 'تفعيل العملاء', retention: 'الحفاظ على العملاء', referral: 'ترشيحات العملاء', revenue: 'المبيعات' },
      goalL: 'الهدف', funnelL: 'المرحلة', approve: 'موافق', edit: 'تعديل', more: '',
    },
  };
  const tIcon = { single: 'image', multi: 'carousel', album: 'album', video: 'video', story: 'story', document: 'doc' };

  // Real-length titles, Arabic + English mixed (user content keeps dir="auto").
  const posts = [
    { id: 'p5', menu: true, g: 'fix', title: 'Story: today\'s fresh bake countdown, 7 am to sold out', kind: 'organic', type: 'story', ratio: '9:16', plats: ['instagram', 'facebook'], life: 'draft', review: 'changes', img: 'reel', when: { en: 'Planned 4 Nov 2026', ar: 'مخطط 4 نوفمبر 2026' }, job: 'November content' },
    { id: 'p7', g: 'fix', title: 'Corporate catering for offices in New Cairo and Sheikh Zayed: tell us your team size and we call you back the same day', kind: 'ad', type: 'single', ratio: '1:1', plats: ['facebook', 'instagram'], life: 'rejected', review: 'approved', img: 'shop', ad: { goal: 'leads', funnel: 'activation' }, when: { en: 'Was to start 28 Oct 2026', ar: 'كان هيبدأ 28 أكتوبر 2026' }, job: 'Catering leads' },
    { id: 'p2', g: 'wait', title: 'صباح الخير من مخبز سبيل: كرواسون الزبدة الطازج كل يوم من الساعة 7', kind: 'organic', type: 'single', ratio: '4:5', plats: ['instagram', 'facebook'], life: 'draft', review: 'pending', img: 'croissant', when: { en: 'Planned 6 Nov 2026', ar: 'مخطط 6 نوفمبر 2026' }, job: 'November content' },
    { id: 'p11', g: 'wait', title: 'Gift cards for the holidays | بطاقات هدايا لموسم الأعياد', kind: 'ad', type: 'multi', ratio: '1:1', plats: ['instagram', 'facebook'], life: 'draft', review: 'pending', img: 'cookies', ad: { goal: 'sales', funnel: 'revenue' }, when: { en: 'Runs 1 – 24 Dec 2026', ar: 'من 1 إلى 24 ديسمبر 2026' }, job: 'Holiday sales' },
    { id: 'p3', g: 'next', title: 'Behind the oven: how we laminate 81 layers of butter dough for every croissant', kind: 'organic', type: 'video', ratio: '9:16', plats: ['instagram', 'facebook', 'linkedin'], life: 'scheduled', review: 'approved', img: 'reel', when: { en: '3 Nov 2026 · 7:00 pm', ar: '3 نوفمبر 2026 · 7:00 م' }, job: 'November content' },
    { id: 'p4', g: 'next', title: 'Weekend brunch menu launch, Zamalek branch', kind: 'ad', type: 'single', ratio: '4:5', plats: ['facebook', 'instagram'], life: 'in_review', review: 'approved', img: 'brunch', ad: { goal: 'traffic', funnel: 'acquisition' }, when: { en: 'Starts 5 Nov 2026', ar: 'هيبدأ 5 نوفمبر 2026' }, job: 'Brunch launch' },
    { id: 'p1', g: 'run', title: 'Ramadan iftar boxes: pre-order now | صناديق الإفطار متاحة للحجز', kind: 'ad', type: 'multi', ratio: '1:1', plats: ['instagram', 'facebook'], life: 'active', review: 'approved', img: 'bread', ad: { goal: 'sales', funnel: 'revenue' }, when: { en: 'Runs 1 – 30 Nov 2026', ar: 'من 1 إلى 30 نوفمبر 2026' }, job: 'November sales push' },
    { id: 'p10', g: 'run', title: 'Halloween cookie box, limited to 200 boxes', kind: 'ad', type: 'single', ratio: '4:5', plats: ['instagram'], life: 'paused', review: 'approved', img: 'cookies', ad: { goal: 'engagement', funnel: 'activation' }, when: { en: 'Paused 30 Oct 2026', ar: 'اتوقف 30 أكتوبر 2026' }, job: 'Halloween' },
    { id: 'p6', g: 'done', title: 'Our sourdough journey: 3 years, 2 branches and 1 starter called Nour', kind: 'organic', type: 'document', ratio: 'Page size', plats: ['linkedin'], life: 'posted', review: 'approved', img: 'bread', when: { en: 'Posted 21 Oct 2026', ar: 'اتنشر 21 أكتوبر 2026' }, job: 'October content' },
    { id: 'p8', g: 'done', title: 'افتتاح فرع الزمالك: 12 صورة من يوم الافتتاح', kind: 'organic', type: 'album', ratio: '4:5', plats: ['facebook'], life: 'posted', review: 'approved', img: 'shop', when: { en: 'Posted 18 Oct 2026', ar: 'اتنشر 18 أكتوبر 2026' }, job: 'Zamalek opening' },
    { id: 'p9', g: 'done', title: 'Mid-October app download push', kind: 'ad', type: 'video', ratio: '9:16', plats: ['instagram', 'facebook'], life: 'completed', review: 'approved', img: 'reel', ad: { goal: 'app_promotion', funnel: 'activation' }, when: { en: 'Ran 1 – 15 Oct 2026', ar: 'من 1 إلى 15 أكتوبر 2026' }, job: 'App launch' },
  ];

  const card = (p, mode, lang) => {
    const t = L[lang]; const client = mode === 'client';
    const typeL = p.kind === 'ad' && p.type === 'video' ? (lang === 'ar' ? 'فيديو' : 'Video') : t.type[p.type];
    const ratio = p.ratio === 'Page size' && lang === 'ar' ? 'حجم الصفحة' : p.ratio;
    const plats = `<span class="pcard__plats" aria-label="${p.plats.map(x => t.plat[x]).join(', ')}">${p.plats.map(x => ico(x)).join('')}</span>`;
    let top;
    if (client && p.review === 'pending') top = `<div class="pcard__review"><button class="button button--sm button--approve">${t.approve}</button><button class="button button--sm button--edit">${t.edit}</button></div>`;
    else top = `<span class="chip chip--rv-${p.review}">${t.review[p.review]}</span>`;
    const menu = p.menu && !client ? `<div class="menu" role="menu" aria-label="Post actions">
        <span class="menu__item" role="menuitem">${ico('eye')}Open post</span>
        <span class="menu__item" role="menuitem">${ico('check')}<span class="menu__text">Set status<small>Draft, Scheduled, Posted</small></span>${ico('chevron-right', 'menu__end')}</span>
        <span class="menu__item" role="menuitem">${ico('megaphone')}<span class="menu__text">Turn into ad<small>Asks for the ad details. Goes back to client review.</small></span></span>
        <span class="menu__sep" role="separator"></span>
        <span class="menu__item menu__item--danger" role="menuitem">Delete post</span>
      </div>` : '';
    const more = client ? '' : `<span class="more-wrap"><button class="icon-button icon-button--sm${p.menu ? ' is-active' : ''}" aria-label="${t.more} ${esc(p.title)}"${p.menu ? ' aria-expanded="true"' : ''}>${ico('more')}</button></span>`;
    const showLife = !(client && p.life === 'draft');
    const ad = p.ad ? `<div class="pcard__ad"><span>${t.goalL} <b>${t.goal[p.ad.goal]}</b></span><span>${t.funnelL} <b>${t.funnel[p.ad.funnel]}</b></span></div>` : '';
    return `<article class="card pcard">
      <div class="pcard__thumb"><img src="${M}${p.img}.svg" alt=""><span class="pcard__type">${ico(tIcon[p.type])}</span></div>
      <div class="pcard__body">
        <div class="pcard__top"><h3 class="pcard__title" dir="auto">${esc(p.title)}</h3>${top}${more}</div>
        <div class="pcard__meta"><span class="chip chip--${p.kind}">${p.kind === 'ad' ? ico('megaphone') : ''}${t[p.kind]}</span><span>${typeL} · <span class="num">${ratio}</span></span>${plats}</div>
        ${ad}
        <div class="pcard__foot">${showLife ? `<span class="chip chip--life-${p.life}">${t.life[p.life]}</span>` : ''}<span class="num">${p.when[lang]}</span>${client ? '' : `<button class="link pcard__job" dir="auto">${esc(p.job)}</button>`}</div>
      </div>
      ${menu}
    </article>`;
  };

  const groups = {
    team: [['fix', 'Needs a fix'], ['wait', 'Waiting for client review'], ['next', 'Approved, not live yet'], ['run', 'Running'], ['done', 'Posted and completed']],
    client: { en: [['wait', 'Waiting for your review'], ['fix', 'Being updated'], ['next', 'Coming up'], ['run', 'Running now'], ['done', 'Published and completed']],
      ar: [['wait', 'مستني رأيك'], ['fix', 'جاري التعديل'], ['next', 'جاي قريب'], ['run', 'شغال دلوقتي'], ['done', 'اتنشر واكتمل']] },
  };
  const list = (mode, lang) => {
    const gs = mode === 'team' ? groups.team : groups.client[lang];
    return gs.map(([k, label]) => { const ps = posts.filter(p => p.g === k); if (!ps.length) return '';
      return `<section class="pgroup" aria-label="${label}"><h2 class="pgroup__title">${label}<span class="count num">${ps.length}</span></h2><div class="pgrid">${ps.map(p => card(p, mode, lang)).join('')}</div></section>`; }).join('');
  };

  window.POSTS = { F, list, posts, prof, brand, ico };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-frame]').forEach(el => { const o = el.dataset.opts ? JSON.parse(el.dataset.opts) : {}; el.outerHTML = F[el.dataset.frame](o.n ?? o); });
    document.querySelectorAll('[data-list]').forEach(el => { el.outerHTML = list(el.dataset.list, el.dataset.lang || document.documentElement.lang || 'en'); });
  });
})();
