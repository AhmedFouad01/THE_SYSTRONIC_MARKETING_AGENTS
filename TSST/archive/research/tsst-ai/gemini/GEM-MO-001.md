# GEM-MO-001 · Best setup for an AI video agent (Motion AG research, round 1)
SURFACE: Gemini app (Deep Research, new chat)
ROLE B — external research. Paste everything between the lines into a NEW chat. Save the answer as `GEM-MO-001_out.md` next to this file.
Next: LENS verifies prices / API / rights of the top candidates live → SPARK adds ad requirements + scores → Lead comparison page. Each step needs Ahmed's go.

---
ROLE B — external research only. You are not part of any team; no local files, no file writing. Every claim needs a live working URL and the date you checked it; write "not confirmed" instead of guessing. Keep official docs / pricing pages separate from reviews and opinion.

**Who we are:** a small marketing agency in Egypt. Clients are Egyptian (Arabic/Egyptian dialect first, English second). We make short-form marketing video: Reels / TikTok / YouTube Shorts and paid-ad variants, 9:16, 15–60 s.

**Goal:** design the best setup for an "AI video agent": a system that takes a brief or story and runs brief → script → storyboard / shot list → AI-generated shots (raw client media is reference only) → edit → voice-over, music and SFX → Arabic captions → export, with a human approving at checkpoints.

**What we already pay for:** Claude Pro (Claude Code desktop, which can use MCP connectors; we already have one connector with image, video, voice, music and SFX generation), ChatGPT Plus (incl. Codex), Gemini Pro, a Magnific premium account, Adobe After Effects, Blender, ffmpeg, and a local tool that records HTML/CSS animations to MP4 (code-made motion graphics).

**Research questions**
1. **Landscape (as of today).** Which setups are people actually using for agentic AI video production? Cover at least:
   (A) Claude-centred (Claude Code + MCP connectors + code-based video, e.g. Remotion / HTML-to-video / ffmpeg);
   (B) OpenAI-centred (ChatGPT / Codex / Sora);
   (C) Google-centred (Gemini / Veo / Flow);
   (D) all-in-one AI video platforms or "video agents" (e.g. Runway, Kling, Higgsfield, Hailuo/MiniMax, Luma, Pika, LTX Studio, Freepik/Magnific, Krea, HeyGen, Captions, CapCut, invideo — add any stronger ones you find);
   (E) workflow pipelines (n8n / Make / ComfyUI).
2. **For each serious option**, give:
   - who does what: the planning "brain", the shot-generation model(s), the edit/assembly, voice/music, captions, QA;
   - automation: real API or MCP an agent can call, or UI only (manual);
   - quality: independent evidence (public leaderboards or arenas, side-by-side tests), not marketing claims;
   - consistency: reference images, start/end frames, the same character or product across shots, keeping a real logo intact;
   - Arabic: Egyptian-dialect TTS / voice-clone quality, Arabic lip-sync, burned-in RTL Arabic captions that don't break;
   - cost: monthly plan + credit cost of one 30 s 9:16 ad (show the maths), and the cost of 5 variants of that ad;
   - commercial rights: commercial-use licence, indemnity, watermark, ownership of output;
   - main limits and risks.
3. **Recommend exactly 3 setups**: (1) **Budget**: uses mostly what we already pay for; (2) **Balanced**; (3) **Premium**. For each: a step-by-step flow (step → tool → manual or automatic), monthly cost, cost per 30 s video, setup effort, and where a human must approve.
4. **Best-practice workflow**: how strong teams structure agentic video work (shot-list format, reference-frame strategy, selection/QA loop, versioning for ad tests), and the common failure patterns to avoid.

**Output:** a structured report of at most 4 pages: one comparison table (options × criteria above), the 3 recommended setups, then sources per section. Mark every price and capability "official" or "third-party". English.
---
