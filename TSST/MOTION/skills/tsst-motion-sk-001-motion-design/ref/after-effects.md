# SK-015 ref: After Effects expressions and tools

Sources: Adobe expression reference https://helpx.adobe.com/after-effects/using/expression-language-reference.html (fetched 2026-10-08); GEM-CR-002 (Gemini). Syntax-checked (node --check on the JS-engine code) but NOT run in AE (AE unavailable).

## Engine: JavaScript vs Legacy ExtendScript

| Point | Fact (Adobe page) |
|---|---|
| Default | JavaScript (V8 on Windows) for new projects; projects saved in older versions default to Legacy. Switch: File > Project Settings > Expressions |
| Speed | Render evaluation "up to 5x faster" than Legacy (per Adobe) |
| Gotchas | Strict if/else syntax; modern array/string methods allowed; text char index via `text[i]`-style standard JS; snake_case (`this_comp`, `to_world`) and `this(arg)` shorthand NOT supported; higher float precision |

## Expressions

| Name | Does | Code | Where | Gotchas |
|---|---|---|---|---|
| wiggle | Random shake | `wiggle(freq, amp, octaves=1, amp_mult=.5, t=time)` e.g. `wiggle(2,30)` | Position, rotation, opacity | Per Adobe. 1D only on one axis: `w=wiggle(3,50); [value[0], w[1]]`. Stacks with keyframes |
| loopOut / loopIn | Repeat keyframes | `loopOut("cycle")`; types cycle, pingpong, offset, continue; `loopOut("cycle", numKeyframes)` | Keyframed property | Needs 2+ keyframes; loops from last key back to layer In point; type is a string |
| time*n | Constant rate | `time*90` | Rotation | Starts at 0; negative reverses; add `+ value` to offset |
| valueAtTime | Value at another time | `thisLayer.transform.position.valueAtTime(time-0.2)` | Trail / follow layers | Deep chains slow renders |
| linear / ease / easeIn / easeOut | Remap range | `linear(t,tMin,tMax,v1,v2)`; `ease(...)` eased both ends | Slider-driven values | They CLAMP: v1 at t<=tMin, v2 at t>=tMax (Gemini's "must clamp" was wrong) |
| Inertial bounce / overshoot | Damped sine after last key | see block below | Position, scale, rotation | Own minimal version, not Ebberts' script. Needs keyframes; Gemini's "keyframes must be linear" not confirmed |
| sourceRectAtTime | Text/shape bounds | `r=sourceRectAtTime(time,false); [r.width,r.height]` | Shape size for auto-box behind text | Returns top,left,width,height; includeExtents only for shape/paragraph text; ignores layer scale/rotation |
| Index delay | Stagger by layer order | `d=thisComp.frameDuration*index*3; thisLayer.transform.opacity.valueAtTime(time-d)` | Duplicated layers | Breaks if layers are reordered |
| toComp / fromComp | Layer <-> comp space | `toComp(anchorPoint)` | Position links, 3D to 2D | Takes a point array, `t=time` optional |
| posterizeTime | Lower expression frame rate | `posterizeTime(12); wiggle(2,50)` | First line | Affects the expression only, not footage |
| Slider link | Control from effect | `effect("Slider Control")("Slider")` | Anything | Effect found by name in Effect Controls; unitless; rename carefully |
| Text expression selector | Per-character driver | `textIndex`/`textTotal` based, e.g. `100*textIndex/textTotal` | Text > Animator > Expression Selector | Text-animation page not re-fetched: syntax unconfirmed here. Arabic: use word/line based, not per character |

Inertial bounce (own, JS engine; syntax-checked, not run):

```
amp=.05; freq=3; decay=6; n=0;
if (numKeys>0){ n=nearestKey(time).index; if (key(n).time>time) n--; }
if (n>0){ t=time-key(n).time;
  v=velocityAtTime(key(n).time-thisComp.frameDuration/10);
  value+v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);
} else value
```
Gotchas: apply on a property with keyframes; use `var` if pasting into Legacy; verify `velocityAtTime` return is array-safe for multi-D props (scalar*array fine in AE).

## AE from cubic-bezier (derived, verify in Graph Editor)

Spec cubic-bezier(x1,y1,x2,y2) on a move of distance ΔV over ΔT:

| AE field | Derived from |
|---|---|
| Outgoing influence (first key) | ≈ x1 * 100 % |
| Incoming influence (last key) | ≈ (1 - x2) * 100 % |
| Outgoing speed | (y1 / x1) * ΔV/ΔT |
| Incoming speed | ((1 - y2) / (1 - x2)) * ΔV/ΔT |

Worked 1, easeOutCubic (.33,1,.68,1): out infl 33 %, out speed 3.03*ΔV/ΔT; in infl 32 %, in speed 0.
Worked 2, easeInOutQuart (.76,0,.24,1): out infl 76 %, out speed 0; in infl 76 %, in speed 0 (speed 0 at both ends).
Caveats: AE's Value-graph handle model; overshoot (y>1, Back) needs speed beyond the value range, check; label every result "derived, verify in Graph Editor". Method is a derivation, not Adobe-documented.

## Plugins / tools (prices approx., re-check at purchase; "maintained" per vendor page, not independently confirmed)

| Tool | Does | Cost (approx.) | URL |
|---|---|---|---|
| Flow | Graph editor, bezier presets | ~$35 | https://aescripts.com/flow/ |
| Motion Tools Pro | Anchors, easing, sequencing | ~$35-50 | https://motiondesign.school/products/motion-tools/ |
| Ease and Wizz | Expression easing (Expo, Bounce...) | pay what you want | https://aescripts.com/ease-and-wizz/ |
| Duik (Angela) | Rigging, IK, animation | free/open source (donation) | https://rxlaboratory.org/tools/duik/ |
| RubberHose 3 | Bendy limb rigs | ~$60 | https://www.battleaxe.co/rubberhose |
| Overlord | Illustrator/Figma to AE shapes | ~$55 | https://www.battleaxe.co/overlord |
| Explode Shape Layers | Split shape groups to layers | ~$30 | https://aescripts.com/explode-shape-layers/ |
| Motion 4 / Motion Bro | Toolsets / presets | M4 ~$65 / Bro free + paid packs | https://www.mtmograph.com/products/motion-4 , https://motionbro.com |
| Bodymovin / LottieFiles | AE to Lottie JSON/dotLottie | free (Pro tiers) | https://aescripts.com/bodymovin/ |
| Joysticks 'n Sliders | Pose rigging with joysticks | ~$40 | https://aescripts.com/joysticks-n-sliders/ |
| Newton | 2D physics | ~$250 | https://aescripts.com/newton/ |

## AE -> Lottie: what survives (Gemini; https://lottiefiles.github.io/lottie-docs/supported_features/, not re-fetched)

| Survives | Does not (reliably) |
|---|---|
| Transform keyframes, shape paths, fills, strokes, trim paths, track mattes, parenting | Most native effects (blur, glow, colour correction), many blend modes, 3D layers, external footage (embedding bloats file) |
| | Expressions: bake to keyframes before export (support differs web vs iOS/Android) |
Always test the exported JSON in the target player before delivery; easing survives as bezier handles per keyframe.
