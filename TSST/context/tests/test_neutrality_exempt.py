#!/usr/bin/env python3
"""Tests: the provider-model-name check exempts report/brief folders but stays strict for spine files.

Run: python TSST/context/tests/test_neutrality_exempt.py   (stdlib only; touches nothing)
"""
import importlib.util
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("validate_spine", os.path.join(HERE, "validate_spine.py"))
vs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vs)

FAILS = []


def expect(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        FAILS.append(name)


B = "TSST/brands/t-sag/projects"
for p in (f"{B}/crm/codex/BRIEF_X.md", f"{B}/crm/codex/reports/CRM-U02.md", f"{B}/crm/review/reports/a.md",
          f"{B}/tsst-ai/local-ai-bench/RESULTS.md", f"{B}/tsst-ai/local-ai-bench/out/T4_local.md",
          f"{B}/scc/ANTIGRAVITY_BRIEF_MVP_FIXES.md", f"{B}/crm/CODEX_BRIEF_P1A_S5.md", f"{B}/crm/BRIEF_X.md"):
    expect(f"exempt: {p}", vs.neutrality_exempt(p))

for p in ("TSST/brands/t-sag/status.md", "TSST/brands/t-sag/rules.md", "TSST/brands/t-sag/memory/source.md",
          f"{B}/crm/project.md", f"{B}/crm/HANDOFF_MVP3.md", "TSST/brands/vill-studio/status.md",
          f"{B}/tsst-ai/project.md", f"{B}/crm/MY_BRIEFCASE.md"):
    expect(f"strict: {p}", not vs.neutrality_exempt(p))

print(f"\n{len(FAILS)} failure(s)")
sys.exit(1 if FAILS else 0)
