# شوت حيطة الحجر (غرفة النوم) - خطوات سريعة لأحمد

## الصورة (Magnific على الويب)
1. ارفع الملف: `refs/ref1_PRIMARY_bedroom_still8.png` (ده الأساسي، ومفيش عليه علامة حمرا).
2. اختار Expand (توسيع) خليه 9:16. وسّع من فوق (حوالي 300) ومن تحت (حوالي 180)، مش من الجنب. الصق:
   `Continue the same room: smooth white ceiling with a warm recessed LED cove line at the top, and light oak-grey wood floor at the bottom. Same lighting, same materials, no new objects.`
3. لو ظهرت حاجة حمرا أو لوحة على الحجر: Retouch وامسحها.
4. اختار Relight (إضاءة)، القوة متوسطة، والصق البرومبت من RECIPE_STILL.md (خطوة 4).
5. اختار Upscale (تكبير) والسلايدر على أدق خيار (precise). الهدف 1080x1920 أو أكبر.
6. راجع قايمة الفحص في RECIPE_STILL.md (لمبتين بالظبط، الحجر خشن، خط الإضاءة متصل، من غير ناس أو كلام). لو في مشكلة جرب تاني (3 مرات بالكتير).
7. احفظ الناتج هنا: `shots/s06-stonewall/out/still_v1.png`

## الفيديو
1. افتح Video واختار Seedance 2.5 (الاحتياطي: Kling 2.5).
2. Start frame = `out/still_v1.png`. النسبة 9:16، المدة 6 ثواني (كلينج 5)، الجودة 1080p، الصوت مقفول.
3. الصق البرومبت من RECIPE_VIDEO.md (فقرة Prompt)، وفي خانة Negative الصق قايمة Avoid.
4. اضغط Generate وشوف الفيديو: الحجر ثابت ومش بيتغير، لمبتين بس، وخط الإضاءة مش بيرمش.
5. لو الحركة ضعيفة أو الحجر بيتشوه: جرب مع End frame (RECIPE_VIDEO.md) أو جرب Kling.
6. احفظ: `shots/s06-stonewall/out/video_v1.mp4`

ملحوظة: العلامة الحمرا على حيطة الصالة (ref2) مش حيطة غرفة النوم، فما تستخدمش ref2 في صورة غرفة النوم.
