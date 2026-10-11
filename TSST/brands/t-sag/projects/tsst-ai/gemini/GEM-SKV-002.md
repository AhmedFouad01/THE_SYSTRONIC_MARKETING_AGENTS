# GEM-SKV-002 · How to evaluate LLM-agent skills cheaply but reliably (method research)
SURFACE: Gemini app (Deep Research, new chat)
ROLE B — external research. Paste everything between the lines into a NEW chat (never reuse an old one). Save the answer as `GEM-SKV-002_out.md` next to this file.
Next: LENS reviews the answer, then the Lead locks the validation method (judge type, samples per skill, cross-model rule) before GEM-SKV-001 is re-run. Needs Ahmed's go.

---
ROLE B — external research only. You are not part of any team; no local files, no file writing. Reply with text only. Every claim needs a live working URL and the date you checked it; write "not confirmed" instead of guessing. Keep primary sources (papers, official docs, repos) separate from blogs and opinion. Do not invent paper titles, numbers or tools.

**Who we are:** a small marketing agency in Egypt. Our clients are Egyptian (Arabic/Egyptian dialect first, English second). We run AI agents (Claude, ChatGPT/Codex, Gemini) with a library of 120 "skills". A skill is a markdown instruction file for an LLM agent: a trigger description, a step-by-step workflow, guardrails and an output contract. Skills cover research and source grading, strategy, copywriting (Arabic/Egyptian), visual and video production, code/testing, and project-management decisions.

**Problem:** we must validate all 120 skills before trusting them, with little budget. Our limits: paid chat subscriptions only (no big API budget), one human owner with limited time who must approve results, and no engineering team. We already have past real jobs (finished deliverables made with these skills) that we can re-use as evidence, and a 100-point scorecard.

**Plan being considered (please critique it):** one model/tool builds an "evidence dossier" per skill (checklist of the skill's acceptance criteria, each marked pass / fail / no-evidence with an exact file locator); a different model scores the dossier with a rubric; a stronger model spot-checks a sample; the human approves. Each skill also gets one "should NOT trigger" negative test.

**Research questions**
1. **Judging methods.** Compare LLM-as-judge, human review and rubric/checklist scoring for evaluating prompts, agents or skills: reliability, agreement with humans, cost, and when each is appropriate. Binary checklists vs 1-5 scales vs pairwise comparison: which is most reliable for a small team? Cite the main papers and practitioner guides (e.g. MT-Bench / "Judging LLM-as-a-Judge", G-Eval, Prometheus, and anything newer from 2025-2026 that matters).
2. **Cross-model judging and bias.** When one model generates and a different model judges, what are the documented biases (self-preference, position, verbosity, leniency, format bias)? What mitigations work in practice (swap order, rubric with anchors, reference answers, multiple judges, majority vote, calibration set with human labels)? Is a judge from a different vendor measurably better than the same model? How many human-labelled calibration examples are enough to trust a judge?
3. **Arabic / low-resource.** Evidence on how reliable LLM judges are on Arabic and especially Egyptian dialect text (fluency, tone, naturalness). Is a human native-speaker check still required? Any Arabic judge benchmarks?
4. **Sampling.** How many test cases per skill (or per prompt) are needed for a useful pass/fail decision? Give practical numbers with the statistics behind them (confidence intervals for small N, e.g. 5, 10, 20 cases; cost of repeated runs for non-determinism). Is one real-job evidence item enough for low-risk skills and two for high-risk ones? What do others do?
5. **Trigger and negative tests.** How do teams test that a skill/tool fires when it should and does not fire when it should not (precision/recall of triggering, "near-miss" negative cases, description-based routing tests)? How many positive and negative prompts per skill? Any public guidance from Anthropic, OpenAI or Google on testing agent skills / tool descriptions.
6. **Re-using past outputs as evidence.** Is retrospective scoring of past real job outputs ("offline eval on production traces") valid? What controls are needed (locked evidence, scorer different from producer, blind scoring, version pinning)? What are the known pitfalls (survivorship bias, the producer's edits, hidden human fixes)?
7. **Cost-saving patterns.** Batching many items per judge call, cheap-model-first with escalation to a strong model only on disagreement or low confidence, caching, deterministic pre-checks (scripts that verify file paths, citations exist, tests pass) before any LLM call, sampling a percentage for human review. Give real numbers where sources have them.
8. **Free tools.** Which evaluation harnesses can a small agency run for free or on subscription-only budget, locally on Windows (open-source, no paid API required, or able to use a CLI of an existing subscription)? Cover at least promptfoo, DeepEval, Inspect (UK AISI), OpenAI Evals, LangSmith/Langfuse free tiers, Ragas, lm-eval-harness and anything better for "agent skills / markdown instructions". For each: licence, free limits, how a skill/prompt test is defined, whether it supports rubric/LLM judge, CI-free use by a non-engineer, and honest limits.
9. **Agent-skill specific.** Any published method for evaluating "agent skills" (e.g. Anthropic skills, Claude Code skills, custom GPT instructions, Cursor rules): with/without-skill A/B comparison, trigger-rate testing, regression suites after edits. What is the minimum viable process?

**Output format**
- A one-page executive answer: the cheapest reliable protocol you would recommend for a team like ours, in numbered steps, with the number of judges, cases per skill, human-review share and escalation rule.
- Then a section per question (1-9), each with findings, numbers, and sources.
- A comparison table of the free tools (question 8).
- A list of "contested or not confirmed" items.
- A source list: title, publisher, URL, date checked, primary or secondary.
- Mark clearly what is observed evidence and what is your interpretation.
---
