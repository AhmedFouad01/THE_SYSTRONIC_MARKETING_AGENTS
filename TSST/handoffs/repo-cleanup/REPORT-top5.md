# تقرير أدوات نضافة الـ git - Top 5 (بعد مراجعة كلام Gemini)
التاريخ: 2026-10-11 | المراجعة: LENS_AG بـ TSST-LENS-SK-002 + SK-001 | الحالة: NOT_READY (توصية، مفيش حاجة اتنفذت)
الأرقام اتشيّكت live من api.github.com يوم 2026-10-11 (مصدر أولي، حديث).

## 1) مراجعة ادعاءات Gemini
| الادعاء | النتيجة | الدليل |
|---|---|---|
| cyanheads/git-mcp-server: 241 نجمة، Apache-2.0، 15 issue، 28 tool، worktree/stash، تأكيد قبل الحذف | verified | API: 241 / Apache-2.0 / 15 / آخر push 2026-09-26 / مش archived. README: 28 tools + git_worktree + git_stash، والعمليات الخطرة (clean, reset --hard) محتاجة flag تأكيد |
| CVE-2026-85626 | verified (حقيقي)، والصياغة ناقصة | NVD: argument injection في git_log/git_diff/git_show في النسخة 2.15.1 (CVSS 7.5، PoC موجود، حالة Deferred). الـ CHANGELOG فيه رفض أي قيمة بتبدأ بـ `-`، لكن رقم النسخة المصلّحة unverified |
| gitleaks: 29.7k نجمة، MIT | verified | API: 29,848 / MIT / push 2026-09-30 / 496 issue |
| git-machete: 1.1k نجمة، MIT | verified | API: 1,143 / MIT / push 2026-10-11 / 45 issue |
| git-machete بيتثبّت كـ agent skill بـ gh | verified | README: `gh skill install VirtusLab/git-machete git-machete --scope user`، أو نسخ SKILL.md يدوي لـ ~/.claude/skills |
| git-machete interactive مش مدعوم على Windows | verified | README سطر 162 (الأوامر العادية شغالة، وفيه Scoop) |
| git-secateurs "rebrand" لـ git-trim | **wrong** | repo جديد اتعمل 2026-09-15، **0 نجمة و0 issue**، شخص واحد. foriequal0/git-trim الأصلي لسه شغال (548 نجمة، MIT، آخر push 2026-02-05). الرخصة MIT |
| git-filter-repo: 13.4k نجمة، MIT/GPL | الرقم verified (13,378)، الرخصة unverified | API بترجّع NOASSERTION. آخر push 2026-07-09. شرط "fresh clone" موجود في README |
| github/github-mcp-server (Gemini ما عرفش أرقامه) | تم تعويضه | 33,512 نجمة / MIT / push 2026-10-08، وبيحتاج OAuth/توكن |
| trufflehog: AGPL + بيعمل verification عبر النت | الرخصة verified، موضوع النت لم أختبره | API: AGPL-3.0. التحقق عبر الشبكة سلوك معروف للأداة، غير مجرّب هنا. مش محتاجينه |
| **Google Drive هيبوّظ الـ .git** | **مبالغ فيه عندنا** | `.git` عندنا ملف صغير بيشاور على `C:/GitMetadata/THE_SYSTRONIC_MARKETING_AGENTS.git`، يعني قاعدة git الفعلية برّه Drive. الـ worktrees في C:/Work برّه Drive برضه. المتبقي: Drive ممكن يقفل ملفات الشغل مؤقتًا أثناء checkout/merge، مش تبوّظ للتاريخ |
| "قفّل Drive قبل أي حذف" | غير لازم | الكافي: نسخة من `C:/GitMetadata` قبل أي حذف |

## 2) Top 5 بعد التدقيق
| # | الأداة | بتغطي إيه | Windows | الخطر | الحكم |
|---|---|---|---|---|---|
| 1 | [gitleaks](https://github.com/gitleaks/gitleaks) | فحص أسرار في كل التاريخ (topic 6) | binary أو Docker (Docker موجود عندك) | منخفض (قراءة بس). false positives واردة | **استخدمها، لازم** |
| 2 | [git-filter-repo](https://github.com/newren/git-filter-repo) | مسح سر من التاريخ (علاج topic 6) | Python 3.14 موجود، سكربت واحد | عالي لو اتشغل غلط (بيعيد كتابة التاريخ)، لازم clone جديد | **احتياطي، ما يتثبتش إلا لو gitleaks لقى سر** |
| 3 | [VirtusLab/git-machete](https://github.com/VirtusLab/git-machete) | شجرة branches ومين اتدمج (1,4,5) + skill للـ agents | pip/Scoop، بدون interactive | منخفض-متوسط: skill جديد UNVALIDATED في ~/.claude/skills | **اختياري، مش دلوقتي**. `git branch --merged` كفاية |
| 4 | [cyanheads/git-mcp-server](https://github.com/cyanheads/git-mcp-server) | worktree/stash/branch عبر MCP (1,2) | Node/npx موجود | متوسط: CVE لازم نسخة بعد الإصلاح، مجتمع صغير، صلاحية git كاملة للـ agent | **اتأجل**. الـ agents عندهم git CLI أصلًا |
| 5 | [foriequal0/git-trim](https://github.com/foriequal0/git-trim) | حذف branches متدمجة/squash (1,4) | Rust binary | منخفض مع `--dry-run` | **بديل** لو احتجنا squash-detection. فروعنا اتدمجت عادي |

مستبعدة: git-secateurs (جديدة، 0 نجمة)، trufflehog (AGPL + network verify)، detect-secrets (baseline مش مناسب لأول push)، jasonmccreary/git-trim (يحذف بدون تأكيد)، git-sweep (متروك 10 سنين)، github-mcp-server (OAuth/توكن، ملوش لازمة في step 1)، modelcontextprotocol git (مفيش إضافة).

## 3) التغطية على الـ 6 مواضيع + أقل مجموعة
| الموضوع | الأداة |
|---|---|
| 1 branches محلية | plain git: `git branch --merged master` و `git branch -d` (-d بيرفض غير المدموج) |
| 2 worktrees و stash | plain git: `git worktree list/remove`, `git stash list/show -p` |
| 3 ترتيب الحذف | ترتيب ASSESSMENT.md (backup push الأول) + نسخة من `C:/GitMetadata` |
| 4 تنضيف remote | plain git: `git fetch --prune`, `git push origin --delete` (بعد موافقة) |
| 5 مزامنة محلي/GitHub | plain git: `git push --dry-run`, `git rev-list --left-right --count` |
| 6 أسرار قبل الـ push | **gitleaks** (+ git-filter-repo لو لقى سر) |

**الحد الأدنى: تثبيت واحد فقط = gitleaks** (أو تشغيله بـ Docker من غير تثبيت). الباقي plain git.

## 4) خطة الخطوة 1: backup push لـ 3 branches (مقترحة، ما اتنفذتش ولا اتجربت، محتاجة موافقة أحمد على تحميل gitleaks)
1. نسخة أمان: انسخ `C:\GitMetadata\THE_SYSTRONIC_MARKETING_AGENTS.git` لمكان برّه Drive.
2. حمّل gitleaks (binary من Releases) أو استخدم Docker.
3. فحص التاريخ (قراءة فقط، السر مخفي في الناتج):
   - binary: `gitleaks git "C:/GitMetadata/THE_SYSTRONIC_MARKETING_AGENTS.git" --log-opts="feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0" --redact -v --report-format json --report-path C:/Work/gitleaks-report.json`
   - Docker: `docker run --rm -v C:/GitMetadata/THE_SYSTRONIC_MARKETING_AGENTS.git:/repo:ro zricethezav/gitleaks:latest git /repo --log-opts="feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0" --redact -v`
   - التقرير برّه الريبو. لو الصيغة اختلفت: `gitleaks git --help`.
4. فحص ملفات خطرة اتضافت يومًا: `git log --all --diff-filter=A --name-only --format= | grep -iE "\.env|\.pem|id_rsa|credential|secret|\.key$|service-account"`
5. فحص ملفات كبيرة: `git rev-list --objects --all | git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)" | sort -k3 -n -r | head -20`
6. Dry run: `git push --dry-run origin feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0`
7. لو نضيف (صفر leaks بعد مراجعة false positives بإيدك): `git push origin feat/crm-mvp-ui anvil/campaign-01-reveal spike/better-auth-b0` بعد موافقة أحمد.

**لو لقينا سر:**
- ما تعملش push.
- غيّر/ألغِ السر فورًا من عند المزوّد (rotate). ده الأهم حتى لو اتمسح من التاريخ.
- لو false positive: ضيفه في `.gitleaksignore` بالـ fingerprint.
- لو حقيقي: `git clone --no-local <gitdir> C:/Work/scrub` ثم `git filter-repo --replace-text expressions.txt` (أو `--invert-paths --path <ملف>`) في الـ clone الجديد بس. بعدين أعد فحص gitleaks وادفع من الـ clone. الـ branches عمرها ما اتدفعت فإعادة الكتابة رخيصة. استبدال الـ branches المحلية الأصلية قرار منفصل لأحمد.

## 5) هل نعمل skill لـ TSST-DEV (git-hygiene)؟
**نعم.** DEV_AG ما لقاش skill مناسب، والمهمة بتتكرر لكل ريبو. يتعمل UNVALIDATED ويتجرب على الخطة دي.
1. قبل أول push: نسخة أمان من الـ gitdir + gitleaks على كل التاريخ + dry-run + قاعدة "سر = rotate قبل scrub".
2. ترتيب الحذف: backup push، بعدين worktrees، بعدين merged branches بـ `-d` بس، بعدين remote بموافقة. كل أمر destructive يبدأ بـ dry-run/list.
3. plain git الأول. أي أداة جديدة تتدقق بـ SK-002 (نجوم/تاريخ/رخصة/CVE) وتاخد موافقة قبل التثبيت.

## ملاحظات ثقة
- النجوم والرخص والتواريخ: ثقة عالية (API مباشر 2026-10-11).
- "gitleaks offline" وصيغة الأوامر: غير مجرّبة، شغّل `--help` الأول.
- ما فحصتش محتوى الريبو نفسه لأسرار (خارج النطاق).
