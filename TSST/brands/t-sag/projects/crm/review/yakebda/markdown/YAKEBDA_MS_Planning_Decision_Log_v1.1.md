<div dir="rtl" align="right">


# YAKEBDA MS — Planning Decision Log v1.1


## 2026-07-12


- PR #14 مدموجة في main عند 4df57964ef0dacddbbaca2b723849dd4afe055c0.
- Draft PR #16 يحتوي وثائق البرنامج الجديد.
- لا توجد migrations أو endpoints أو UI للموديولات الجديدة.


### القرارات


- Order Source مستقل عن order type/payment/delivery provider.
- Master product واحد.
- Channel Menu للإتاحة والمحتوى؛ Pricelist للسعر.
- Backend Quote هو السلطة النهائية مع snapshots.
- Inventory/Recipes قبل COGS.
- Delivery/Driver custody قبل settlements الكاملة.
- Finance Control قبل Accounting Bridge.


### المراحل


YKMS-11 Sources & Pricing
→ YKMS-12 Channel Menus
→ YKMS-13 Inventory & Recipes
→ YKMS-14 Delivery & Drivers
→ YKMS-15 Finance Control
→ YKMS-16 Accounting/COGS
→ YKMS-17 Online Connectors
→ YKMS-18 e-Receipt


### الخطوة التالية


مراجعة ودمج PR #16، ثم إنشاء feature/ykms-11-order-sources من main.


</div>
