# GEM-CR-007: Pattern Reference for Code-Drawn Motion

## PART 1 — Anatomy of prompts that worked for ads/product videos

Strong, production-grade prompts typically utilize a strict, highly structured format to control exact timing, rendering, and visual fidelity, avoiding generic AI outputs. 

| Element | How often it appears (rough) | Why it matters | Example rows |
|---------|------------------------------|----------------|--------------|
| **Structured sections** | Frequent in high-end | Separates inputs, direction, structure, and build rules for clarity. | https://x.com/twoclipping/status/2102554209166000267, https://x.com/twoclipping/status/2103273003555402193 |
| **Banned list / Negative prompt** | Frequent | Prevents default AI aesthetics like "shockwave rings, particle bursts." | https://x.com/twoclipping/status/2102554209166000267, https://x.com/twoclipping/status/2103273003555402193 |
| **Strict mathematical timing** | Occasional (premium) | Forces alignment to a beat grid (e.g., "120 BPM, 7 bars") instead of loose durations. | https://x.com/twoclipping/status/2103273003555402193, https://x.com/twoclipping/status/2102554209166000267 |
| **Pre-render storyboard gate** | Frequent in high-end | Stops code generation until the exact timings and scene list are approved. | https://x.com/twoclipping/status/2102554209166000267 |
| **Deterministic rendering `seek(t)`** | Rare but critical | Disables CSS timers/animations in favor of time-computed states for perfect frame extraction. | https://x.com/twoclipping/status/2102554209166000267, https://x.com/twoclipping/status/2103273003555402193 |

**Short vs. Long Prompts:**
Short prompts (~15-60 words, e.g., "make a modern slick and punchy video") rely entirely on the model's default training for design and pacing. They work for quick explorations or generic templates but often fail strict brand requirements. Long, scene-by-scene prompts (~400+ words) work best for commercial production because they explicitly disable generic styles and enforce exact technical constraints (like programmatic motion blur and single HTML file output).

## PART 2 — Recurring ad structures and visual devices

Common ad structures often follow a linear sequence: Hook (typography on beat) → Feature/UI Morphing (showing the product) → Value prop data/charts → Logo reveal.

| Device | Best for | Tech used | Difficulty | Example rows |
|--------|----------|-----------|------------|--------------|
| **Continuous UI Morphing** | Product features, seamless transitions | SVG, GSAP | High | https://x.com/twoclipping/status/2103273003555402193 |
| **3D Device/UI Mockups** | App launches, premium showcases | Three.js, CSS 3D | High | https://x.com/twoclipping/status/2102554209166000267 |
| **Beat-synced Kinetic Type** | Fast hooks, dynamic messaging | SVG, Canvas | Medium | https://x.com/twoclipping/status/2102554209166000267 |
| **Data / Number Counters** | Metrics, social proof, performance stats | Canvas, CSS | Low | https://x.com/twoclipping/status/2103273003555402193 |

## PART 3 — Tech choice

Creators choose different browser technologies based on the visual requirements and trade-offs of the ad format:

- **SVG & GSAP:** Chosen for crisp typography, resolution independence, and complex shape morphing. Perfect for UI abstractions and flat motion graphics. Trade-off: Can suffer from DOM performance limits if there are thousands of elements.
- **Canvas / WebGL:** Chosen for high-performance particle systems, pixel-level manipulation, and complex generative art. Trade-off: Text rendering is often less crisp than SVG/DOM.
- **Three.js / CSS 3D:** Chosen for spatial UI, lighting, and product tours. Trade-off: Higher complexity, and combining 3D depth with 2D DOM elements (CSS 3D) can cause clipping/flattening issues (e.g., opacity on a `preserve-3d` element).

**MP4 Capture Methods:**
To convert the code into a final MP4 video, creators predominantly use headless browser capture techniques. A prominent method is using Playwright to render specific frames by invoking a `seek(t)` function, extracting frames, and blending subframes using `ffmpeg tmix` to simulate real motion blur. Simple screen recording is sometimes used for quick tests, but precise headless capture is required for perfect beat-sync and 60fps fluidity. Some methods remain not confirmed.

## PART 4 — Failure patterns and limits

From review notes and prompt gotchas, several consistent failure patterns emerge:
- **Timing and Audio Drift:** Audio synchronization and subtitle timing often drift over long videos. Exact synchronization requires programmatic audio peak analysis (e.g., via `numpy`) rather than relying on the model's loose timing.
- **Text Overlap and Jitter:** Text swapping inside morphing containers overlaps if enter/exit timings aren't strictly isolated. Applying camera scales to certain elements can also cause text blurriness (jitter).
- **Asset Fetching Failures:** Real-time fetching of external assets or tracks occasionally fails or falls out of sync during rendering.
- **Unverified Claims:** Claims of "4K master resolution", "entirely in code" (when base64 textures or models are embedded), and "physically accurate simulation" are frequently made by creators but remain unverified or not confirmed by the final MP4 artifact alone.

## PART 5 — Gaps for our market

For our market (Egypt; Arabic + English, RTL), public examples and standard AI defaults leave significant gaps that we must bridge:

- **RTL Text Direction and Alignment:** Default HTML/Canvas configurations assume LTR. We must explicitly enforce `dir="rtl"` and correct text-anchoring in Canvas/SVG to prevent layout mirroring issues.
- **Arabic Typography in Motion:** Arabic ligatures (الحروف المتصلة) often break or disconnect during SVG letter-by-letter morphing or path animation. We need specific handling to animate whole words or use font-safe transformations.
- **Strict Brand Guidelines:** Public cases often let the AI pick arbitrary modern colors. We must enforce strict hex codes, exact logo file injection, and prevent the AI from generating "close enough" brand colors or typography. 

## Evidence rows

- https://x.com/twoclipping/status/2102554209166000267
- https://x.com/twoclipping/status/2103273003555402193
- https://x.com/deedydas/status/2102787937482252537
- https://x.com/sudo_kiran/status/2103761658745335993
- https://x.com/ExistentialEnso/status/2102599211212554616
- https://x.com/cromwellian/status/2103028027861152225
- https://x.com/Govindaiii/status/2102815918049132792
