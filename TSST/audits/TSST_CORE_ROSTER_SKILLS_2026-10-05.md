# تقرير تنفيذ: TSST Core، التيم الثابت ومكتبة السكيلز

**التاريخ:** 2026-10-05
**القرار:** `TSST/decisions/TSST-ADR-003.md` (اتوافق عليه بـ "تمام كمل")
**الحالة:** اتنفذ واتجرّب بالكامل. **لسه مفيش commit.** TSST كله لسه `NOT_READY`.
**التيم والسكيلز:** الليد (LEAD-SK-028/029، CTX-SK-017/011) · `tsst-dev` (DEV-SK-005/011/015) · LENS (LENS-SK-002/004/005/006)

---

## 1. الخلاصة في سطرين

إيجنتس TSST بقوا هم نفسهم الإيجنتس اللي بتشتغل. مبقاش فيه workers عامة.
السكيلز كلها ليها مدخل واحد، وبتتحمّل بس لما الشغل يحتاجها. وفيه hook في الكود بيرفض أي تكليف مالوش Skill Plan، وده اتجرّب ورفض فعلاً.

---

## 2. اللي اتعمل

### أ. الفريق الثابت
| إيجنت TSST | إيجنت Claude | الموديل |
|---|---|---|
| LENS_AG، مدير Marketing | `tsst-lens` | Sonnet |
| SPARK_AG، Performance | `tsst-spark` | Sonnet |
| CREATIVE_AG، مدير Studio (ومعاه DESIGNER و MOTION) | `tsst-creative` | Sonnet |
| DEV_AG، مدير Build | `tsst-dev` | Sonnet (effort عالي) |
| قراية وجرد بس | `tsst-fast-worker` و `Explore` | Haiku |
| الليد | المحادثة الرئيسية | Opus 5.5 |

- **اتلغوا:** `tsst-execution-worker` و `tsst-code-worker`.
- **ممنوعين بالكود:** `general-purpose` و `claude` و `Plan` وأي إيجنت مش معروف.
- **العقد المشترك:** كل إيجنت بيقرا السكيلز اللي في الـ brief بس. لو مفيش سكيل مناسب بيرجع `SKILL_GAP`، وممنوع يرتجل. بيرجّع packet فيها `Skills used:` و`Skills skipped:` و`skill_friction:`.
- **الملفات:** `.claude/agents/tsst-*.md`

### ب. مكتبة سكيلز ليها مدخل واحد
- **المدخل:** `TSST/skills/index.yaml`. بيتولّد أوتوماتيك بـ `TSST/skills/build_index.py` وفيه **115 سكيل**:

  | التيم | العدد |
  |---|---|
  | core | 23 |
  | lead | 30 |
  | marketing | 17 |
  | studio | 29 |
  | build | 16 |

  وفيه كمان 11 سكيل في الـ backlog.
- **توفير التوكنز:** الليد مش بيقرا الـ index كله (37KB). بيقرا شريحة التيم بس:
  - `build_index.py --team marketing` ≈ 2.3KB
  - `--id <ID>` بيطلع سكيل واحد بس
- **توحيد الشكل:** الـ 22 سكيل بتوع CTX بقى ليهم frontmatter. وسكيلز LEAD الـ version بتاعتهم بقت تتقري صح (1.0).
- **السكيلز الجديدة:** بتتحط في `TSST/skills/<team>/`. الفولدرات القديمة متنقلتش (ده قرار مرحلة جاية).
- `build_index.py --check` بيكشف لو الـ index قديم.

### ج. القواعد الصارمة R1–R10 (`TSST/core/rules.md`)
1. **R1** فريق ثابت.
2. **R2** القراية والجرد بس هم اللي بيتعملوا بالـ utility workers.
3. **R3** Skill Plan قبل أي تكليف.
4. **R4** 3 سكيلز بالكتير.
5. **R5** الـ index بس، ممنوع تحميل registry كاملة.
6. **R6** الليد بيحكم، والتيم بينفذ.
7. **R7** الفجوة بتروح للـ intake.
8. **R8** السكيلز الخارجية: مراجعة أمان، وبعدين موافقتك.
9. **R9** التطوير بـ version.
10. **R10** لازم تبقى فيه evidence.

### د. الإجبار بالكود
| المكان | بيعمل إيه | اتجرّب؟ |
|---|---|---|
| Hook `TSST/context/hooks/agent_dispatch_guard.py` على أداة Agent | بيرفض الإيجنت العام. بيرفض أي تكليف من غير `TEAM:` و`SKILLS:` بأرقام موجودة في الـ index. بيرفض السكيل اللي مش تبع التيم | ✅ اترفض `general-purpose` فعلاً. ✅ `tsst-dev` عدّى لما كان معاه Skill Plan |
| `bus.py` | بيتأكد إن السكيل موجود في الـ index، ومش DEPRECATED، وتبع التيم الصح | ✅ |
| Tests | `test_skill_index_and_guard.py` (أكتر من 67 check) و`test_bus.py` و`validate_spine.py` (28/28) و`bus check` | ✅ كلها نجحت |

### هـ. جلب سكيلز جديدة: `TSST-CTX-SK-023` Skill Intake
الخطوات: نحدد الفجوة، وبعدين نشوف لو فيه سكيل داخلي ينفع نوسّعه. لو مفيش، الإيجنت صاحب المجال يدوّر على 3 مرشحين بالكتير (قراية بس). الليد يقارن، وإنت توافق على أي حاجة من برّه. بعدها نحوّلها لصيغة TSST، ونضيفها للـ index، ونقيّمها بـ CTX-SK-018.

**أول تشغيل:** دوّرت في كتالوج السكيلز والـ plugins بتاعك على copywriting وSEO وemail وغيرهم، ومطلعش أي نتيجة. فاتكتبت داخلياً، ومفيش حاجة اتحملت من برّه.

### و. السكيلز الجديدة للماركتنج (كتبها LENS، وكلها UNVALIDATED v0.1)
| ID | السكيل |
|---|---|
| TSST-LENS-SK-011 | Copywriting (إعلانات، بوستات، CTAs، أقسام landing) |
| TSST-LENS-SK-012 | **الكتابة بالعربي والمصري والـ Transcreation**: اختيار المستوى (فصحى، عامية، فرانكو)، والـ bidi، ورمضان والعيد، وبوابة مراجعة من متحدث أصلي |
| TSST-LENS-SK-013 | نظام محتوى السوشيال الأورجانيك والـ calendar |
| TSST-LENS-SK-014 | Landing page و CRO و A/B brief |
| TSST-LENS-SK-015 | WhatsApp و Email lifecycle |

راجعت SK-012 بنفسي: العربي طبيعي، ومثال "التوصيل ببلاش على أي أوردر فوق ٥٠٠ جنيه" مظبوط. وأضفت الخمسة لخريطة `TSST/teams/marketing/team.md`.

---

## 3. إزاي أي تاسك هيمشي من النهارده

```
إنت ← الليد (Opus 5.5)
  1. يعمل Boot ويحدد البراند والمشروع
  2. build_index.py --team <team>  ← شريحة صغيرة
  3. يكتب Skill Plan (TEAM/AGENT/SKILLS≤3/NOT_SELECTED/TIER/ACCEPTANCE/SKILL_GAP)
     └─ لو فيه SKILL_GAP ← CTX-SK-023 (وأي حاجة من برّه محتاجة موافقتك)
  4. يكلّف tsst-lens|spark|creative|dev  ← الـ hook بيتأكد
  5. الإيجنت يحمّل السكيلز بتاعته بس ويشتغل ← يرجّع packet + skill_friction
  6. الليد يراجع ويقبل أو يرفض (R10) ← يحدّث السكيل لو فيه friction
```

---

## 4. ملاحظات صريحة

1. **مشكلة من أول تشغيل:** LENS حط SK-004 وSK-002 في `Skills used` وهو مفتحهمش أصلاً. اتصلحت في العقد: السكيل اللي متفتحش لازم يتكتب في `Skills skipped` مع السبب. والتشغيل اللي بعده التزم بده.
2. **الـ bus بقى صارم:** لو `index.yaml` مش موجود، الـ bus بيرفض الشغل. لازم تشغّل `build_index.py` بعد أي سكيل جديد.
3. **الإيجنتس الجديدة اتحمّلت في نفس الـ session بعد شوية.** قبل ما تتحمّل، شغّلت LENS لمرة واحدة على worker قديم كان لسه موجود في الذاكرة، وكان شغال بعقد `tsst-lens.md` بالظبط.
4. **ملفات اتعدلت من مصدر تاني (مش أنا):**
   - `TSST/brands/t-sag/rules.md`
   - `TSST/core/lessons.md`
   - `TSST/brands/t-sag/projects/crm/MORNING_QUESTIONS_2026-10-05.md`

   مالمستهمش.
5. **مفيش commit ولا PR.** مستني أمرك.

## 5. محتاج منك
1. **مراجعة سريعة لأمثلة العربي** في SK-012. إنت أحسن reviewer لده.
2. **أنهي براند نبدأ بيه** عشان نشغّل السكيلز الجديدة في شغل حقيقي ونقيّمها؟
3. **الـ Commit:** أعمل commit وPR بالتغييرات دي؟
4. **الخطوة الجاية (P2):** SPARK-007 (TikTok creative)، وSPARK-008 (Pixel/Events)، وSPARK-011 (Creative testing)، وLENS-007 (Experiments). نبدأ فيهم؟

---

# المرحلة الثانية: TSST يشتغل على Codex و Claude (ADR-004)

**القرار:** `TSST/decisions/TSST-ADR-004.md`

## القاعدة العامة لأي runtime
بقت مكتوبة في `AGENTS.md`، وده الملف اللي Codex و Claude بيقروه الاتنين.

الجلسة الرئيسية هي الليد، وبتمشي الخطوات دي:
1. **Boot**
2. **TEAM**
3. **AGENT** من `roster.yaml`
4. **SKILLS**: 3 بالكتير، من `build_index.py --team`
5. **TIER**: المستوى الافتراضي بتاع الإيجنت
6. **MODEL** من `runtimes.yaml`، **وبس الموديلات المتاحة في باقتك**
7. **تكليف** إيجنت `tsst-<id>`، وهو أصلاً شايل الموديل الصح
8. **قبول** الشغل بشرط يكون فيه `Skills used`

## مصدر واحد وملفين مولّدين
- `TSST/context/roster.yaml`: الإيجنتس والتيمز والمستويات. **مفيهوش أي اسم موديل.**
- `TSST/context/agent-contract.md`: العقد الموحد للإيجنتس.
- `TSST/context/gen_runtime_agents.py` بيولّد:
  - `.claude/agents/tsst-*.md`
  - `.codex/agents/tsst-*.toml`

  وفيه `--check` بيكشف لو حد عدّل في الملفات المولّدة بإيده.
- **نفس الأسماء في الاتنين:** `tsst-lens` و`tsst-spark` و`tsst-creative` و`tsst-dev` و`tsst-reader`.

## الموديلات حسب الباقة (`TSST/bus/runtimes.yaml`)

أسماء Codex اتاخدت من قايمة Codex نفسه (`~/.codex/models_cache.json` النهارده)، مش من الذاكرة.

| المستوى | الإيجنت | Claude Pro | Codex على ChatGPT Plus |
|---|---|---|---|
| FAST | `tsst-reader` | haiku · low | gpt-6-luna · low (read-only) |
| WORK | lens, spark, creative | sonnet · medium | gpt-6.1-sol · medium |
| CODE | `tsst-dev` | sonnet · high | gpt-6.1-sol · high |
| DEEP | الليد | opus، الجلسة الرئيسية | الجلسة الرئيسية على work. القرارات العميقة بس بـ `--profile deep` (gpt-6-astra · high)، ودي رسايلها قليلة على Plus |

لو موديل اتشال، زي `gpt-5.5` اللي هيتشال 2026-10-14: الـ runtime يطلع للمستوى اللي بعده ويقول ده صراحة، والليد يحدّث `runtimes.yaml` ويعيد توليد الإيجنتس.

## Antigravity/Gemini اتشال
- `gemini` حالته على الـ bus بقت `retired`، والـ bus بيرفض يدّيله أي تاسك.
- `GEMINI.md` والـ adapter بتاعه اتعلم عليهم RETIRED، والتاريخ القديم زي ما هو.
- الـ 8 skills القديمة اللي في `.agents/skills` (Codex كان بيحمّلها أوتوماتيك) اتنقلت أرشيف لـ `TSST/migration/retired-agents-skills-2026-10-05/`. مكانهم بقى سكيل واحد اسمه `tsst-router` بيعلّم Codex الـ routing.

## الإجبار
- **Claude:** الـ hook زي ما هو. اتعدّل إن `tsst-reader` مسموح و`tsst-fast-worker` مرفوض.
- **Codex:** الـ bus بيطبع `AGENT:` و`RUN ON:`، وبيرفض أي تاسك مالوش team وskills. والتعليمات متولّدة جوه كل إيجنت.
  - **Codex مفيهوش hook متأكد منه، فمش هقول إن فيه.**
- الـ bus بقى بيحمي `.codex/` و`index.yaml` من أي تاسك.

## التحقق
كله نجح:
- `test_runtime_agents`
- `test_skill_index_and_guard`
- `test_bus`
- `validate_spine` (28/28)
- `gen --check`
- `bus check`
- `index --check`

## خطوة لازم تعملها إنت في Codex
**المشروع ده مش معمول له trust في Codex.** الـ trust المسجّل عندك لفولدر قديم تاني: `C:\Users\10\Documents\ChatGPT\THE_SYSTRONIC_MARKETING_AGENTS`.

من غير trust:
- Codex غالباً مش هيحمّل `.codex/agents`.
- وده كمان من أسباب كتر أسئلة الـ permissions.

الحل: افتح Codex على `G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS` واختار Trust لما يسألك. ده إعداد أمان، فأنا مش هغيره بنفسي.

**أول تيست في Codex:** اكتب له "اعرض الإيجنتس المتاحة" أو اعمل `/agents`. لازم يظهر `tsst-*` بالموديلات اللي فوق.
