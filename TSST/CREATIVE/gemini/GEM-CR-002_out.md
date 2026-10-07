# Motion Design & Animation Reference (2026)

## Part 1: Principles of Animation & UI Motion

### The 12 Animation Principles
(Source: Disney Animation: The Illusion of Life, Thomas & Johnston, 1981; applied to UI via [Material Design 3 Motion guidelines, 2026](https://m3.material.io/styles/motion/overview))

| Principle | Definition | UI / Motion Graphics Translation | Example | Common Mistake |
| :--- | :--- | :--- | :--- | :--- |
| **Squash & Stretch** | Objects deform to show mass and momentum. | Subtle scaling to indicate button press or element flexibility (no volume loss). | A floating action button flattening slightly on tap. | Distorting text or over-exaggerating UI scale. |
| **Anticipation** | A preparatory action before the main movement. | A small pull-back before an element slides in or out, showing intent. | A modal window shrinking slightly before dismissing. | Adding delays that make the UI feel unresponsive. |
| **Staging** | Directing the viewer's eye to the most important element. | Using motion to guide focus to the primary call-to-action; dimming background. | A snackbar sliding in while background content darkens. | Moving too many unrelated elements simultaneously. |
| **Straight-Ahead vs Pose-to-Pose** | Frame-by-frame linear action vs keyframing extremes then interpolating. | UI uses pose-to-pose (keyframing initial/final states with easing). | CSS transitions from `opacity: 0` to `1`. | Attempting straight-ahead frame-by-frame drawing for UI. |
| **Follow-Through & Overlapping Action** | Parts of an object stop at different times. | Staggered animations; child elements settle after the parent container. | A menu opens, and its list items fade in sequentially. | Staggering too slowly, forcing the user to wait. |
| **Slow In & Slow Out** | Objects accelerate and decelerate (easing). | Elements ease out to start quickly and ease in to stop smoothly. | Standard UI cards sliding onto the screen (ease-out). | Using linear motion for physical objects. |
| **Arcs** | Natural movement follows curved paths. | Elements move along curved paths (bezier paths) instead of straight diagonal lines. | A FAB moving to the top corner along an arc. | Mechanical, straight-line diagonal movement. |
| **Secondary Action** | Additional movement that supports the main action. | A subtle color change or icon rotation accompanying a state change. | A checkmark drawing itself as a success modal appears. | Secondary action overpowering the primary message. |
| **Timing** | The speed of an action defines its weight and meaning. | Fast for small UI elements, slightly longer for large structural changes. | 150ms for a tooltip, 300ms for a page transition. | making animations last longer than 500ms in UI. |
| **Exaggeration** | Pushing an action beyond reality for appeal. | Slight overshoots/springs to make elements feel playful or energetic. | A notification badge popping in with a slight bounce. | Overusing bounce, making a serious app feel cartoonish. |
| **Solid Drawing** | Considering form, volume, and 3D space. | Using drop shadows, elevation, and 3D transforms correctly in flat design. | A card lifting (shadow expands) on hover. | Incorrect shadow angles or confusing layering. |
| **Appeal** | Pleasing, charismatic design and movement. | Smooth, cohesive motion that matches the brand's personality. | A smooth, satisfying toggle switch animation. | Jittery, unrefined, or inconsistent animations. |

### UI & Brand Motion Principles (Material, Apple HIG, IBM Carbon)
*   **Duration Ranges:** Micro-interactions (hovers, toggles) typically run **100ms – 200ms**. Small transitions (modals, expanding cards) run **200ms – 300ms**. Large screen transitions (full page navigation) run **300ms – 400ms**. Anything over 400ms feels sluggish (Sources: [Apple HIG - Motion, 2026](https://developer.apple.com/design/human-interface-guidelines/motion); [Material 3 - Duration, 2026](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)).
*   **Productive vs. Expressive (IBM Carbon):** "Productive" motion is highly functional, fast (70-130ms), and focused on efficiency (data tables, forms). "Expressive" motion is slower (250-400ms) and used for brand moments, storytelling, or major navigational shifts (Source: [IBM Carbon Design System - Motion, 2026](https://carbondesignsystem.com/elements/motion/overview/)).
*   **Accessibility (`prefers-reduced-motion`):** Always respect system accessibility settings. When active, replace large structural movements (slides, scales) with simple crossfades (opacity), and disable auto-playing decorative animations. (Source: [MDN Web Docs - prefers-reduced-motion, 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)).

---

## Part 2: Easing Master Table

(Sources: [easings.net, 2026](https://easings.net/), [GSAP Docs - Easing, 2026](https://gsap.com/docs/v3/Eases/), [Motion Easing Docs, 2026](https://motion.dev/docs/easing))

| Curve | Feel / When to use | CSS `cubic-bezier()` | GSAP Ease | Motion (Framer) | After Effects |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Linear** | Mechanical, constant speed. Use for looping rotations or color fades. | `linear` or `(0,0,1,1)` | `"none"` or `"linear"` | `"linear"` | Keyframes: Linear |
| **Sine (In/Out/InOut)** | Very gentle, soft start/end. | In:`(0.12, 0, 0.39, 0)`<br>Out:`(0.61, 1, 0.88, 1)`<br>InOut:`(0.37, 0, 0.63, 1)` | `"sine.in"`<br>`"sine.out"`<br>`"sine.inOut"` | `[0.12, 0, 0.39, 0]` etc. | ~33% influence |
| **Quad (Power1)** | Standard UI standard. Subtle. | In:`(0.11, 0, 0.5, 0)`<br>Out:`(0.5, 1, 0.89, 1)`<br>InOut:`(0.45, 0, 0.55, 1)` | `"power1.in"`<br>`"power1.out"`<br>`"power1.inOut"` | `"easeIn"` / `"easeOut"` | ~50% influence |
| **Cubic (Power2)** | Slightly more pronounced than Quad. | In:`(0.32, 0, 0.67, 0)`<br>Out:`(0.33, 1, 0.68, 1)`<br>InOut:`(0.65, 0, 0.35, 1)` | `"power2.in"`<br>`"power2.out"`<br>`"power2.inOut"` | `[0.32, 0, 0.67, 0]` etc. | ~66% influence |
| **Quart (Power3)** | Strong easing. Dramatic entries. | In:`(0.5, 0, 0.75, 0)`<br>Out:`(0.25, 1, 0.5, 1)`<br>InOut:`(0.76, 0, 0.24, 1)` | `"power3.in"`<br>`"power3.out"`<br>`"power3.inOut"` | `[0.5, 0, 0.75, 0]` etc. | ~75% influence |
| **Quint (Power4)** | Very strong. Snappy stops. | In:`(0.64, 0, 0.78, 0)`<br>Out:`(0.22, 1, 0.36, 1)`<br>InOut:`(0.83, 0, 0.17, 1)` | `"power4.in"`<br>`"power4.out"`<br>`"power4.inOut"` | `[0.64, 0, 0.78, 0]` etc. | ~85% influence |
| **Expo** | Extreme. Almost instantaneous start, long tail. | In:`(0.7, 0, 0.84, 0)`<br>Out:`(0.16, 1, 0.3, 1)`<br>InOut:`(0.87, 0, 0.13, 1)` | `"expo.in"`<br>`"expo.out"`<br>`"expo.inOut"` | `[0.7, 0, 0.84, 0]` etc. | 100% influence |
| **Circ** | Sudden acceleration/deceleration. | In:`(0.55, 0, 1, 0.45)`<br>Out:`(0, 0.55, 0.45, 1)`<br>InOut:`(0.85, 0, 0.15, 1)` | `"circ.in"`<br>`"circ.out"`<br>`"circ.inOut"` | `[0.55, 0, 1, 0.45]` etc. | Expression driven |
| **Back** | Overshoots value before settling. | In:`(0.36, 0, 0.66, -0.56)`<br>Out:`(0.34, 1.56, 0.64, 1)`<br>InOut:`(0.68, -0.6, 0.32, 1.6)` | `"back.in(1.7)"`<br>`"back.out"`<br>`"back.inOut"` | `"backIn"` / `"backOut"` | Custom curve / overshoot |

### Elastic and Bounce
These **cannot** be represented by a single `cubic-bezier()` because they require multiple direction changes (the math only supports up to two control points).
*   **GSAP:** Uses specific strings like `"elastic.out(1, 0.3)"` or `"bounce.out"`.
*   **CSS:** As of recent specs, requires the `linear()` function (e.g., `linear(0, 0.5, 1.2, 0.9, 1)` approximating points) or keyframes (Source: [MDN - linear(), 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)).
*   **After Effects:** Requires expressions (e.g., inertial bounce expression on `valueAtTime`) to calculate physics (Source: [MotionScript.com - Inertial Bounce, 2026](http://www.motionscript.com/articles/bounce-and-overshoot.html)).

### CSS Keywords
(Source: [MDN Web Docs - easing-function, 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function))
*   `ease` = `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
*   `ease-in` = `cubic-bezier(0.42, 0.0, 1.0, 1.0)`
*   `ease-out` = `cubic-bezier(0.0, 0.0, 0.58, 1.0)`
*   `ease-in-out` = `cubic-bezier(0.42, 0.0, 0.58, 1.0)`
*   `steps(n, end)` = Jumps exactly *n* times (like a flipbook).

### Spring Physics
Unlike duration-based easing, springs do not use a fixed time. They calculate motion dynamically based on physical properties:
*   **Stiffness:** The tension of the spring (higher = faster, snappier).
*   **Damping:** Friction applied to the spring (lower = more bouncy, higher = settles quickly).
*   **Mass:** How heavy the object is (higher = slower to start and stop).
*   **Motion (Framer):** Default animation type. Configured via `transition={{ type: "spring", stiffness: 100, damping: 10 }}`.
*   **GSAP:** Does not use pure un-timed springs natively by default, but simulates them via `CustomEase` or `InertiaPlugin`.

---

## Part 3: Web Motion Libraries

| Technology | What it is / Best use | Licence / Cost (2026) | Size | RTL Notes | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CSS Transitions & @keyframes** | Native browser CSS. Best for simple hovers and state changes. | Free (Built-in) | 0kb | Use logical properties (`margin-inline-start`) to auto-adapt to RTL without overriding values. | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations) |
| **Web Animations API (WAAPI)** | Native JS API for CSS animations. Best for dynamic JS control without libs. | Free (Built-in) | 0kb | Requires manual RTL directional handling for `transform: translate`. | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) |
| **View Transitions API** | Native API for cross-document (page) or state transitions. Best for seamless app-like routing. | Free (Built-in) | 0kb | Animates full pages; inherit RTL directionality automatically. | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) |
| **Scroll-driven (animation-timeline)** | Native CSS mapping animation to scroll position. Best for parallax without JS. | Free (Built-in) | 0kb | Inherits CSS logical properties perfectly. | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline) |
| **GSAP (GreenSock)** | Industry-standard robust JS animation engine. Best for complex, sequenced, or scroll (ScrollTrigger) animations. | **100% Free** (Updated after Webflow acquisition in 2024; previously paid Club plugins are now free). | ~60kb (Core) | Does not auto-flip `x`. Negative `x` moves left (forward in RTL). | [gsap.com](https://gsap.com/) |
| **Motion (Framer Motion)** | React (and vanilla JS) declarative animation library. Best for React apps and layout animations. | MIT (Free) | ~30kb | Does not natively flip `x` values for RTL; requires developer intervention. | [motion.dev](https://motion.dev) |
| **Anime.js** | Lightweight JS engine. Best for simple sequencing and SVG path animations. | MIT (Free) | ~17kb | Standard coordinate system (RTL requires manual overrides). | [animejs.com](https://animejs.com/) |
| **Lottie** | Renders AE vector animations natively. Best for complex vector illustrations. | MIT (Free) | ~250kb (lottie-web), ~45kb (dotLottie) | Pre-baked animation. Cannot easily flip direction dynamically. Use `dir="ltr"` container to prevent breaks. | [lottiefiles.com](https://lottiefiles.com/lottie-web) |
| **Rive** | Real-time interactive vector graphics engine. Best for game-like interactive UI states. | Runtimes open-source, Editor is Freemium/Paid. | ~50kb | Fully state-machine driven, RTL must be handled via inputs. | [rive.app](https://rive.app/) |
| **Theatre.js** | Visual state and animation toolset. Best for WebGL/Three.js orchestration. | MIT / Apache (Free) | ~100kb+ | Coordinate system is standard 3D space, manual RTL logic needed. | [theatrejs.com](https://www.theatrejs.com/) |
| **Remotion** | Create MP4 videos programmatically using React. Best for automated/data-driven video generation. | Free (Individuals/Small <3). **Paid** ($25/mo or usage-based) for Companies ≥4. | N/A (Build tool) | Builds video; handles RTL text rendering if properly configured via React components. | [remotion.dev](https://www.remotion.dev/) |

### Performance Rules
*   **Hardware Acceleration:** Only animate `transform` (translate, scale, rotate) and `opacity`. Animating layout properties (`width`, `height`, `margin`, `top`, `left`) triggers CPU repaints and causes layout thrashing. (Source: [web.dev - Stick to Compositor-Only Properties, 2026](https://web.dev/articles/animations-guide)).
*   **`will-change`:** Apply `will-change: transform` slightly before an animation begins to allow the browser to optimize, but remove it afterward. Overusing it consumes excessive RAM.

### Arabic Text Animation (RTL)
*   **The Problem:** Arabic is a connected script. Standard text splitting plugins (like GSAP `SplitText`) wrap every letter in a `<span>`. This breaks the ligatures and separates the cursive joining, turning connected words into isolated, broken glyphs.
*   **The Solution:** Never animate Arabic by character/letter. Split the text by **Lines** or **Words** only. Ensure the container has `dir="rtl"` to preserve logical reading direction (right-to-left sequencing).

---

## Part 4: After Effects Expressions

(Source: [Adobe Expression Reference, 2026](https://helpx.adobe.com/after-effects/using/expression-reference.html), [MotionScript, 2026](http://www.motionscript.com/))
*Note: AE defaults to the modern JavaScript engine (ES6+). Legacy ExtendScript is deprecated but supported for older projects.*

| Name | What it does | Short Code | Where to apply | Gotchas |
| :--- | :--- | :--- | :--- | :--- |
| **Wiggle** | Randomly shakes a property. | `wiggle(freq, amp);` | Position, Rotation, Opacity | Smooth random, not chaotic noise. Can break out of frame. |
| **LoopOut** | Loops keyframes automatically. | `loopOut("cycle");` (or "pingpong", "offset", "continue") | Any keyframed property. | Requires at least 2 keyframes. Errors if no keyframes exist. |
| **Time** | Continuous linear increase over time. | `time * 100;` | Rotation (for continuous spinning). | Starts at 0. Multiply by negative for reverse. |
| **ValueAtTime** | References a property's value at a specific time. | `transform.position.valueAtTime(time - 1);` | Position (for trailing layers). | Can cause heavy render lag if chained deeply. |
| **Interpolation** | Maps one value range to another smoothly. | `linear(time, 0, 1, 0, 100);` (or `ease`, `easeIn`, `easeOut`) | Opacity linking to scale, etc. | `time` input must be clamped or values overshoot. |
| **Inertial Bounce** | Calculates overshoot physics based on velocity. | *(Requires custom script block)* | Position, Scale | Keyframes must be linear. Eased keyframes break the math. |
| **SourceRectAtTime** | Returns the dynamic bounding box of a layer. | `s = sourceRectAtTime(); [s.width, s.height];` | Shape Path Size (for auto-sizing text boxes). | Does not account for layer scaling/rotation natively. |
| **Index Offset** | Delays animation based on layer order. | `delay = thisComp.frameDuration * index; valueAtTime(time - delay);` | Position, Opacity (staggering). | Breaks if layers are reordered in the timeline. |
| **toComp / fromComp** | Converts local layer coordinates to composition coordinates. | `toComp(anchorPoint);` | Position (linking 2D null to 3D layer). | Confusing syntax. Essential for connecting expressions across parented hierarchies. |
| **PosterizeTime** | Lowers the frame rate of the expression. | `posterizeTime(12); wiggle(2, 50);` | Top of expression box. | Only affects the expression, not the layer footage. |
| **Slider Control** | Links an expression to a UI slider effect. | `effect("Slider Control")("Slider");` | Any property | Slider values are unitless. |
| **Text Selector** | Drives text animation via code instead of ranges. | `textIndex / textTotal * 100;` | Text > Animator > Expression Selector | Complex to debug. Bypasses standard keyframes. |

---

## Part 5: After Effects Plugins, Scripts & Tools

| Tool | What it does | Cost (2026) | Maintained? | Official URL |
| :--- | :--- | :--- | :--- | :--- |
| **Flow** | Visual graph editor for easing, saves bezier presets. | Paid (~$35) | Yes | [aescripts.com/flow](https://aescripts.com/flow/) |
| **Motion Tools Pro** | Workflow extension: anchor points, easing, sequence layers. | Paid (~$35-50) | Yes | [motiondesign.school](https://motiondesign.school/products/motion-tools/) |
| **Ease and Wizz** | Classic expression-based easing application (Expo, Bounce). | Name your own price | Yes | [aescripts.com/ease-and-wizz](https://aescripts.com/ease-and-wizz/) |
| **Duik (Angela)** | Comprehensive rigging and animation toolset (IK, bones). | Free / Open Source | Yes | [rxlaboratory.org/tools/duik/](https://rxlaboratory.org/tools/duik/) |
| **RubberHose (v3)** | Simple, bendy vector limb rigging. | Paid (~$60) | Yes | [battleaxe.co/rubberhose](https://www.battleaxe.co/rubberhose) |
| **Overlord (v2)** | Seamless vector transfer between Illustrator/Figma and AE. | Paid (~$55) | Yes | [battleaxe.co/overlord](https://www.battleaxe.co/overlord) |
| **Explode Shape Layers** | Extracts grouped vectors into individual AE shape layers. | Paid (~$30) | Yes | [aescripts.com/explode-shape-layers/](https://aescripts.com/explode-shape-layers/) |
| **Motion 4 / Motion Bro** | Comprehensive toolsets (easing, rigging, presets). | Paid (M4 ~$65) / Free with paid packs (Bro) | Yes | [mtmograph.com](https://www.mtmograph.com/products/motion-4) / [motionbro.com](https://motionbro.com/) |
| **Bodymovin / LottieFiles** | Exports AE animations to JSON/dotLottie for web/app. | Free (Pro tiers exist) | Yes | [aescripts.com/bodymovin](https://aescripts.com/bodymovin/) |
| **Joysticks 'n Sliders** | Pose-based facial/UI rigging using 2D joysticks. | Paid (~$40) | Yes | [aescripts.com/joysticks-n-sliders/](https://aescripts.com/joysticks-n-sliders/) |
| **Newton 4** | 2D physics engine (gravity, collision, joints) in AE. | Paid (~$250) | Yes | [aescripts.com/newton/](https://aescripts.com/newton/) |

---

## Part 6: Cross-Tool Translation

### The Motion Pipeline
1.  **AE Graph (Speed/Value):** AE primarily uses speed graphs (influence/velocity). To translate this to code, developers must use the **Value Graph** to extract a normalized 0-1 `cubic-bezier(x1, y1, x2, y2)` curve. Tools like Flow provide this instantly.
2.  **Cubic-Bezier:** The universal language of easing. `(0.25, 0.1, 0.25, 1)` translates directly to CSS `transition-timing-function`, GSAP `CustomEase.create()`, and Framer Motion easing arrays.
3.  **Lottie Export Pipeline:**
    *   **What Survives:** Basic transforms (Position, Scale, Rotation, Opacity), shape layer paths, fills, strokes, trim paths, track mattes (alpha/luma), and basic parented hierarchies.
    *   **What Does NOT Survive (Usually):** Most native AE effects (blurs, glows, color correction), blending modes (Multiply/Screen vary wildly by platform), expressions (Lottie web supports some, iOS/Android Lottie supports very few; bake expressions to keyframes before export), 3D layers, and external footage (can be embedded as base64, but ruins file size).
    *   *(Source: [Supported Features - LottieDocs, 2026](https://lottiefiles.github.io/lottie-docs/supported_features/))*

---

## Sources
*   Material Design 3 (Motion Guidelines, October 2026): [m3.material.io](https://m3.material.io/styles/motion/overview)
*   Apple Human Interface Guidelines (Motion, October 2026): [developer.apple.com/design](https://developer.apple.com/design/human-interface-guidelines/motion)
*   IBM Carbon Design System (Motion, October 2026): [carbondesignsystem.com](https://carbondesignsystem.com/elements/motion/overview/)
*   Easing Functions Reference (easings.net, October 2026): [easings.net](https://easings.net/)
*   MDN Web Docs (CSS Animations & Easing, October 2026): [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)
*   GSAP Easing Documentation (October 2026): [gsap.com/docs/v3/Eases/](https://gsap.com/docs/v3/Eases/)
*   Motion (Framer) Documentation (October 2026): [motion.dev](https://motion.dev)
*   Remotion Pricing & Licensing (October 2026): [remotion.dev/docs/license-pricing](https://www.remotion.dev/docs/license-pricing)
*   Lottie Supported Features (October 2026): [lottiefiles.github.io/lottie-docs/](https://lottiefiles.github.io/lottie-docs/supported_features/)
*   Adobe After Effects Expression Reference (October 2026): [helpx.adobe.com](https://helpx.adobe.com/after-effects/using/expression-reference.html)
*   MotionScript / Dan Ebberts (October 2026): [motionscript.com](http://www.motionscript.com/)
