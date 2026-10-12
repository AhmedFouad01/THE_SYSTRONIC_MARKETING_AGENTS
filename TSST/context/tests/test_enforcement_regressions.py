"""Non-writing regressions for dispatch rejection and Windows bus scope aliases."""
import json
import os
from pathlib import Path
import runpy
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[3]
HOOK = ROOT / 'TSST/context/hooks/agent_dispatch_guard.py'


class EnforcementTests(unittest.TestCase):
    def plan(self, **updates):
        values = dict(TEAM='build', AGENT='tsst-dev', SKILLS='TSST-DEV-SK-010',
                      NOT_SELECTED='013 no deploy', TIER='CODE', ACCEPTANCE='bounded test', SKILL_GAP='none')
        values.update(updates)
        return '\n'.join(k + ': ' + v for k, v in values.items())

    def guard(self, prompt, sub='tsst-dev'):
        return subprocess.run([sys.executable, '-B', str(HOOK)], input=json.dumps({
            'tool_name': 'Agent', 'tool_input': {'subagent_type': sub, 'prompt': prompt}}),
            text=True, capture_output=True)

    def test_partial_plan_rejected(self):
        self.assertEqual(self.guard('TEAM: build\nSKILLS: TSST-DEV-SK-010').returncode, 2)

    def test_bad_json_rejected(self):
        r = subprocess.run([sys.executable, '-B', str(HOOK)], input='{', text=True, capture_output=True)
        self.assertEqual(r.returncode, 2)

    def test_missing_or_broken_shared_validator_fails_closed(self):
        for broken in (False, True):
            with self.subTest(broken=broken), tempfile.TemporaryDirectory(prefix='tsst-guard-dependency-') as folder:
                context = Path(folder) / 'TSST/context'
                hook = context / 'hooks/agent_dispatch_guard.py'
                hook.parent.mkdir(parents=True)
                shutil.copyfile(HOOK, hook)
                if broken:
                    (context / 'preflight.py').write_text('def broken(:\n', encoding='utf-8')
                r = subprocess.run([sys.executable, '-B', str(hook)], input='{}', text=True,
                                   capture_output=True, cwd=folder)
                self.assertEqual(r.returncode, 2)
                self.assertIn('shared validator load error', r.stderr)

    def test_invalid_utility_team_rejected(self):
        prompt = self.plan(TEAM='invalid', AGENT='tsst-reader', SKILLS='none', TIER='FAST')
        self.assertEqual(self.guard(prompt, 'tsst-reader').returncode, 2)

    def test_complete_plan_and_each_required_field(self):
        prompt = self.plan()
        self.assertEqual(self.guard(prompt).returncode, 0)
        for field in ['TEAM', 'AGENT', 'SKILLS', 'NOT_SELECTED', 'TIER', 'ACCEPTANCE', 'SKILL_GAP']:
            reduced = '\n'.join(line for line in prompt.splitlines() if not line.startswith(field + ':'))
            with self.subTest(field=field):
                self.assertEqual(self.guard(reduced).returncode, 2)

    def test_four_skills_require_reason(self):
        prompt = self.plan(SKILLS=', '.join(f'TSST-DEV-SK-{i:03d}' for i in range(1, 5)))
        self.assertEqual(self.guard(prompt).returncode, 2)
        self.assertEqual(self.guard(prompt + '\nSKILL_LIMIT_REASON: four independent boundaries').returncode, 0)

    def test_utility_none_exception_and_lead_not_spawned(self):
        prompt = self.plan(AGENT='tsst-reader', SKILLS='none', TIER='FAST')
        self.assertEqual(self.guard(prompt, 'tsst-reader').returncode, 0)
        self.assertEqual(self.guard(self.plan(AGENT='tsst-lead', TEAM='lead'), 'tsst-lead').returncode, 2)

    def test_missing_index_fails_closed(self):
        with tempfile.TemporaryDirectory(prefix='tsst-missing-index-') as folder:
            payload = {'tool_name': 'Agent', 'tool_input': {'subagent_type': 'tsst-dev', 'prompt': self.plan()}}
            r = subprocess.run([sys.executable, '-B', str(HOOK)], input=json.dumps(payload), text=True,
                               capture_output=True, env={**os.environ, 'CLAUDE_PROJECT_DIR': folder})
            self.assertEqual(r.returncode, 2)
            self.assertIn('guard error', r.stderr)

    def test_malformed_or_duplicate_index_fails_closed(self):
        original = (ROOT / 'TSST/skills/index.yaml').read_text(encoding='utf-8')
        for appended in ['  - {id: malformed}\n', original.splitlines()[5] + '\n']:
            with tempfile.TemporaryDirectory(prefix='tsst-bad-index-') as folder:
                index = Path(folder) / 'TSST/skills/index.yaml'
                index.parent.mkdir(parents=True)
                active = original.split('backlog:')[0]
                index.write_text(active + appended, encoding='utf-8')
                payload = {'tool_name': 'Agent', 'tool_input': {'subagent_type': 'tsst-dev', 'prompt': self.plan()}}
                r = subprocess.run([sys.executable, '-B', str(HOOK)], input=json.dumps(payload), text=True,
                                   capture_output=True, env={**os.environ, 'CLAUDE_PROJECT_DIR': folder})
                self.assertEqual(r.returncode, 2)

    def test_specialist_cannot_declare_team_lead(self):
        self.assertEqual(self.guard(self.plan(TEAM='lead', SKILLS='TSST-LENS-SK-001')).returncode, 2)

    def test_windows_scope_aliases_rejected(self):
        b = runpy.run_path(str(ROOT / 'TSST/bus/bus.py'), run_name='readonly_test')
        for path in [r'TSST\core\rules.md', r'..\outside.txt', './TSST/CORE/rules.md']:
            with self.subTest(path=path):
                self.assertTrue(b['scope_errors']([path], True))

    def test_file_prefix_does_not_authorize_sibling(self):
        b = runpy.run_path(str(ROOT / 'TSST/bus/bus.py'), run_name='readonly_test')
        self.assertFalse(b['overlaps']('out/a.md.extra', 'out/a.md'))

    def test_result_and_hash_path_reject_traversal_before_read(self):
        b = runpy.run_path(str(ROOT / 'TSST/bus/bus.py'), run_name='readonly_test')
        for name in ('repo_path', 'sha'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                b[name](r'..\outside.txt')
        self.assertTrue(b['result_in_scope'](r'out\a.md', 'out/*.md'))
        self.assertFalse(b['result_in_scope']('out/a.md.extra', 'out/a.md'))


if __name__ == '__main__':
    unittest.main()
