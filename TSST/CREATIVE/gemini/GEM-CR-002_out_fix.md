# Corrections for GEM-CR-002

## Part 2: Easing Master Table (Corrected Columns)

| Curve | Feel / When to use | CSS `cubic-bezier()` | Motion (Framer) | After Effects |
| :--- | :--- | :--- | :--- | :--- |
| **Linear** | Mechanical, constant speed. | `linear` or `(0,0,1,1)` | `"linear"` | Not documented |
| **Sine (In/Out/InOut)** | Very gentle, soft start/end. | In:`(0.12, 0, 0.39, 0)`... | `"circIn"` / `"circOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Quad (Power1)** | Standard UI standard. | In:`(0.11, 0, 0.5, 0)`... | `"easeIn"` / `"easeOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Cubic (Power2)** | Slightly more pronounced. | In:`(0.32, 0, 0.67, 0)`... | `"easeIn"` / `"easeOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Quart (Power3)** | Strong easing. | In:`(0.5, 0, 0.75, 0)`... | `"easeIn"` / `"easeOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Quint (Power4)** | Very strong. Snappy stops. | In:`(0.64, 0, 0.78, 0)`... | `"easeIn"` / `"easeOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Expo** | Extreme. | In:`(0.7, 0, 0.84, 0)`... | `"easeIn"` / `"easeOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Circ** | Sudden acceleration. | In:`(0.55, 0, 1, 0.45)`... | `"circIn"` / `"circOut"` (No cubic-bezier documented on motion.dev) | Not documented |
| **Back** | Overshoots value. | In:`(0.36, 0, 0.66, -0.56)`... | `"backIn"` / `"backOut"` (No cubic-bezier documented on motion.dev) | Not documented |

*(Note: Motion.dev uses string aliases like `"easeIn"` or `"backOut"` which map to internal math functions, not cubic-bezier arrays. No explicit cubic-bezier mapping for these strings is documented at [motion.dev/docs/easing](https://motion.dev/docs/easing).)*
*(Note: After Effects keyframe influence % mapping to standard easing curves is not officially documented by Adobe.)*

---

## Part 3: Web Motion Libraries (Licence Corrections)

| Technology | Licence / Cost | Confirmation |
| :--- | :--- | :--- |
| **CSS / WAAPI / View Transitions / Scroll-driven** | Free (Built-in) | CONFIRMED (MDN) |
| **GSAP (GreenSock)** | **100% Free** (No charge for personal/commercial use). *Restriction:* Prohibited for use in competing visual animation builders/tools similar to Webflow. | CONFIRMED ([gsap.com/pricing](https://gsap.com/pricing)) |
| **Motion (Framer Motion)** | MIT (Free) | CONFIRMED ([motion.dev](https://motion.dev)) |
| **Anime.js** | MIT (Free) | CONFIRMED ([animejs.com](https://animejs.com/)) |
| **Lottie** | MIT (Free) | CONFIRMED ([lottiefiles.com/lottie-web](https://lottiefiles.com/lottie-web)) |
| **Rive** | Editor: Freemium / Paid. Runtimes: Open-source (MIT). | CONFIRMED ([rive.app/pricing](https://rive.app/pricing)) |
| **Theatre.js** | MIT / Apache (Free) | CONFIRMED ([theatrejs.com](https://www.theatrejs.com/)) |
| **Remotion** | Free for individuals/companies with **up to 3 employees**. Paid Company Licence required for organizations with **4 or more people** (e.g. $25/mo/seat for Creators, or usage-based with $100/mo minimum for Automators). | CONFIRMED ([remotion.dev/docs/license-pricing](https://www.remotion.dev/docs/license-pricing)) |

---

## Part 5: After Effects Plugins, Scripts & Tools (Corrections)

| Tool | Cost & Licence | Maintained? | Confirmation |
| :--- | :--- | :--- | :--- |
| **Flow** | Paid (~$35) | Yes | CONFIRMED ([aescripts.com/flow](https://aescripts.com/flow/)) |
| **Motion Tools Pro** | Paid (~$35-50) | Yes | CONFIRMED ([motiondesign.school/products/motion-tools/](https://motiondesign.school/products/motion-tools/)) |
| **Ease and Wizz** | Name your own price | Yes | CONFIRMED ([aescripts.com/ease-and-wizz](https://aescripts.com/ease-and-wizz/)) |
| **Duik (Angela)** | Free / Open Source | Yes | CONFIRMED ([rxlaboratory.org/tools/duik/](https://rxlaboratory.org/tools/duik/)) |
| **RubberHose (v3)** | Paid (~$60) | Yes | CONFIRMED ([battleaxe.co/rubberhose](https://www.battleaxe.co/rubberhose)) |
| **Overlord (v2)** | Paid (~$55) | Yes | CONFIRMED ([battleaxe.co/overlord](https://www.battleaxe.co/overlord)) |
| **Explode Shape Layers** | Paid (~$30) | Yes | CONFIRMED ([aescripts.com/explode-shape-layers/](https://aescripts.com/explode-shape-layers/)) |
| **Motion 4 / Motion Bro** | Paid (M4 ~$65) / Free with paid packs (Bro) | Yes | CONFIRMED ([mtmograph.com/products/motion-4](https://www.mtmograph.com/products/motion-4) / [motionbro.com](https://motionbro.com/)) |
| **Bodymovin / LottieFiles** | Free (Pro tiers exist) | Yes | CONFIRMED ([aescripts.com/bodymovin](https://aescripts.com/bodymovin/)) |
| **Joysticks 'n Sliders** | Paid (~$40) | Yes | CONFIRMED ([aescripts.com/joysticks-n-sliders/](https://aescripts.com/joysticks-n-sliders/)) |
| **Newton 4** | Paid (~$250) | Yes | CONFIRMED ([aescripts.com/newton/](https://aescripts.com/newton/)) |

---

## Sources (Dates Updated)
*   Material Design 3 (Motion Guidelines): [m3.material.io](https://m3.material.io/styles/motion/overview) (No date shown)
*   Apple Human Interface Guidelines (Motion): [developer.apple.com/design](https://developer.apple.com/design/human-interface-guidelines/motion) (No date shown)
*   IBM Carbon Design System (Motion): [carbondesignsystem.com](https://carbondesignsystem.com/elements/motion/overview/) (No date shown)
*   Easing Functions Reference: [easings.net](https://easings.net/) (No date shown)
*   MDN Web Docs (CSS Animations & Easing): [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function) (No date shown)
*   GSAP Pricing & Licensing: [gsap.com/pricing](https://gsap.com/pricing) (No date shown)
*   Motion (Framer) Easing Documentation: [motion.dev/docs/easing](https://motion.dev/docs/easing) (No date shown)
*   Remotion Pricing & Licensing: [remotion.dev/docs/license-pricing](https://www.remotion.dev/docs/license-pricing) (No date shown)
*   Lottie Supported Features: [lottiefiles.github.io/lottie-docs/](https://lottiefiles.github.io/lottie-docs/supported_features/) (No date shown)
*   Adobe After Effects Expression Reference: [helpx.adobe.com](https://helpx.adobe.com/after-effects/using/expression-reference.html) (No date shown)
*   MotionScript / Dan Ebberts: [motionscript.com](http://www.motionscript.com/) (No date shown)
