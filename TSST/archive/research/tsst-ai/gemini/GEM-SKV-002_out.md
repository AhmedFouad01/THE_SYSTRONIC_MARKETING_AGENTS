# GEM-SKV-002_out · Gemini Deep Research: evaluating agent skills cheaply (Lead extract)
Source: https://share.gemini.google/i7q6bD7s0Y76 (shared by Ahmed 2026-10-11). This file is a **Lead extract** of the report (~30k chars), not a verbatim copy. To check the full text, open the link.
Status: INPUT only. URLs not yet opened by the Lead.

## Sources it lists
- Zheng et al., MT-Bench (arXiv 2306.05685)
- arXiv 2606.19544 (reliability without validity)
- arXiv 2604.13717 (adaptive model escalation)
- arXiv 2608.18300 (judge lifecycle, Netflix RART)
- ACL 2025 findings-acl.306 (LLM-as-judge empirical)
- G-Eval (via a third-party mirror)
- AL-QASIDA (ACL 2025 findings-acl.1137, dialectal Arabic)
- arXiv 2510.13430 (Arabic benchmarks review)
- CheckEval (ACL 2025 demo.44)
- OpenAI Cookbook evaluation flywheel
- RAGAs (EACL 2024)
- Promptfoo docs

## Key claims
1. **Binary checklists (CheckEval)** beat 1–5 scales. Turn each skill's criteria into 3–5 strict PASS/FAIL checks. G-Eval needs logprobs (API only), so it is not usable in a chat UI.
2. **Cross-model judging.** The judge must not be the model that generated the output, because of self-preference bias. Other known biases: position bias (in pairwise), verbosity bias (claimed to be much lower in 2026 models, per "JudgeBench Apr 2026": 21 models, 541k judgments), and kappa deflation on nuanced cases. Mitigations:
   - one "golden pass" and one "known fail" example in the judge prompt (few-shot calibration);
   - swapping the order of answers;
   - an ensemble of judges.
3. **Arabic/Egyptian.**
   - LLMs understand Egyptian dialect better than they generate it, and they drift to MSA.
   - LLM judges are **very low** reliability on dialect tone and naturalness.
   - So a human native review is **mandatory** for Arabic generation. The LLM judges structure only.
4. **Sampling.**
   - 1–2 evidence items are "statistically meaningless".
   - Its suggestion: N=10 for low-risk skills and N=30 for high-risk ones, or 10 prompts × 3 repeats. Inconsistent passes mean the skill text is ambiguous.
5. **Negative tests.** At least 2 near-miss negative prompts per skill. Measure both the true-positive and the true-negative rate.
6. **Re-using past jobs.**
   - Risk 1, hidden human fixes: final deliverables were edited by humans, so judging them overrates the skill. Use the raw, unedited agent output.
   - Risk 2, the judge's prior: score blind, without telling the judge the job was "successful".
   - Producer ≠ scorer.
7. **Cost (subscription UI).**
   - Batch 5–10 outputs per judge message.
   - Run deterministic script pre-checks first (paths, URLs, length).
   - Escalation means a human reads only the FAILs plus a 20% sample of PASSes. If the human disagrees on >2 sampled PASSes, the judge is uncalibrated for that skill and the skill goes to full manual review.
8. **Tools.**
   - Promptfoo (MIT, local CLI, YAML assertions) is the best fit, but LLM grading needs API keys.
   - DeepEval, Inspect, LangSmith/Langfuse, Ragas and lm-eval-harness are too engineering-heavy or the wrong fit.
   - OpenAI Evals needs a paid API.
9. **A/B ablation.** Run each test with and without the skill. If the skill doesn't raise the pass rate, it is bloat and should be deprecated. Keep a frozen regression set and re-run it after every skill edit.
10. **Its critique of our option C:** the separate dossier step is redundant if the raw output is judged directly against the checklist, and three manual chat tools add copy-paste friction.

## Not confirmed (per the report)
- Whether free harnesses can run on chat subscriptions without an API.
- Whether any LLM can reliably judge Egyptian-dialect naturalness. It says no.

## Lead review notes (2026-10-11)
- Strong and usable: points 1, 2 (cross-model + few-shot), 3, 5, 6 (hidden human fixes), 7, 9.
- Not feasible as stated: N=10–30 per skill × 120 skills = 1,200–3,600 runs by hand. This must be scaled by risk tier.
- Stale model names in its examples (e.g. "Claude 3.5 Opus").
- The 2026 arXiv IDs and the JudgeBench stats are unverified. Open them before citing them in governance.
