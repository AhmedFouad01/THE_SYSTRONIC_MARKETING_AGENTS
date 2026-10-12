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
from unittest import mock
import importlib.util

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


class BusResolvedBoundaryTests(unittest.TestCase):
    """All links, tasks and protected targets below are disposable fixtures, never live paths."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='tsst-resolved-bus-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.bus = self.root / 'TSST/bus'
        for relative in ['TSST/bus/tasks', 'TSST/bus/closed', 'TSST/bus/out', 'TSST/core', 'docs', 'out', 'elsewhere']:
            (self.root / relative).mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / 'TSST/bus/bus.py', self.bus / 'bus.py')
        (self.root / 'TSST/core/rules.md').write_text('protected fixture', encoding='utf-8')
        (self.root / 'docs/spec.md').write_text('fixture spec', encoding='utf-8')
        (self.root / 'elsewhere/result.md').write_text('fixture result', encoding='utf-8')
        (self.bus / 'runtimes.yaml').write_text('claude:\n  roles: [lead]\n  status: available\n  caps: [fs_read]\ncodex:\n  roles: [worker]\n  status: available\n  caps: [fs_read]\n', encoding='utf-8')
        (self.bus / 'log.tsv').write_text('', encoding='utf-8')
        spec = importlib.util.spec_from_file_location('isolated_resolved_bus', self.bus / 'bus.py')
        self.b = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.b)

    def task(self, tid='T-1', **updates):
        task = dict(id=tid, title='fixture', kind='probe', status='claimed', to='any', tier='CODE',
                    spec='docs/spec.md', done_when='fixture check', issued_by='claude', created='2026-10-12T00:00Z',
                    read=[], write=[], needs=[], after=[], claimed_by='codex', lease_until='2099-01-01T00:00Z')
        task.update(updates)
        (self.bus / 'tasks' / (tid + '.yaml')).write_text(self.b.dump(task), encoding='utf-8')
        return task

    def run_bus(self, *args):
        return subprocess.run([sys.executable, '-B', str(self.bus / 'bus.py'), *args], cwd=self.root,
                              capture_output=True, text=True)

    def link(self, relative, target):
        alias = self.root / relative
        destination = self.root / target
        try:
            alias.symlink_to(destination, target_is_directory=True)
            self.addCleanup(alias.unlink)
        except OSError:
            if os.name != 'nt':
                self.skipTest('directory links unavailable in isolated fixture')
            r = subprocess.run(['cmd', '/c', 'mklink', '/J', str(alias), str(destination)], capture_output=True, text=True)
            if r.returncode:
                self.skipTest('isolated junction unavailable: ' + r.stderr)
            self.addCleanup(os.rmdir, alias)  # remove the junction itself before temp cleanup, never its target
        self.assertTrue(alias.resolve().is_relative_to(self.root))
        return alias

    def test_link_to_protected_scope_is_rejected(self):
        self.link('TSST/bus/out/p', 'TSST/core')
        self.assertTrue(self.b.scope_errors(['TSST/bus/out/p/**'], True))

    def test_link_to_protected_result_is_rejected(self):
        self.link('TSST/bus/out/p', 'TSST/core')
        self.task()
        r = self.run_bus('done', 'T-1', '--me', 'codex', '--result', 'TSST/bus/out/p/rules.md')
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertEqual((self.root / 'TSST/core/rules.md').read_text(), 'protected fixture')

    def test_link_cannot_escape_declared_result_scope(self):
        self.link('out/p', 'elsewhere')
        self.task(write=['out'])
        r = self.run_bus('done', 'T-1', '--me', 'codex', '--result', 'out/p/result.md')
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)

    def test_explicit_safe_link_scope_records_resolved_result(self):
        self.link('out/p', 'elsewhere')
        self.task(write=['out/p'])
        r = self.run_bus('done', 'T-1', '--me', 'codex', '--result', 'out/p/result.md')
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.b.load('T-1')['result'], 'elsewhere/result.md')
        checked = self.run_bus('check')
        self.assertEqual(checked.returncode, 0, checked.stdout + checked.stderr)

    def test_check_rejects_forged_protected_result_even_with_matching_hash(self):
        self.task(status='done', result='TSST/core/rules.md', sha256=self.b.sha('TSST/core/rules.md'))
        r = self.run_bus('check')
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn('protected', r.stdout)

    def test_check_rejects_forged_result_outside_scope(self):
        self.task(status='done', write=['out'], result='elsewhere/result.md', sha256=self.b.sha('elsewhere/result.md'))
        r = self.run_bus('check')
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn('scope', r.stdout)

    def test_malformed_overlap_is_conservative_conflict(self):
        self.assertTrue(self.b.overlaps('C:/legacy', 'out'))

    def test_legacy_invalid_scope_cli_remains_diagnostic(self):
        self.task('BAD-1', write=['C:/legacy'])
        self.task('GOOD-1', write=['out'])
        for args, code in [(('check',), 1), (('ls', '--me', 'codex'), 0), (('claim', 'GOOD-1', '--me', 'codex'), 2)]:
            with self.subTest(args=args):
                r = self.run_bus(*args)
                self.assertEqual(r.returncode, code, r.stdout + r.stderr)
                self.assertNotIn('Traceback', r.stderr)
                self.assertTrue(any(word in r.stdout for word in ('FAIL', 'WARN', 'REFUSED')), r.stdout)

    def test_nonarray_historical_scope_remains_diagnostic_at_all_entrypoints(self):
        for value in (1, {'invalid': 'scope'}, 0, {}, None):
            self.assertTrue(self.b.scope_errors(value, True))
            self.assertTrue(any(self.b.overlaps(item, 'out') for item in self.b.scope_items(value)))
            self.task('BAD-1', write=value)
            self.task('GOOD-1', write=['out'])
            for args, code in [(('check',), 1), (('ls', '--me', 'codex'), 0), (('claim', 'GOOD-1', '--me', 'codex'), 2)]:
                with self.subTest(value=value, args=args):
                    r = self.run_bus(*args)
                    self.assertEqual(r.returncode, code, r.stdout + r.stderr)
                    self.assertNotIn('Traceback', r.stderr)
                    self.assertTrue(any(word in r.stdout for word in ('FAIL', 'WARN', 'REFUSED')), r.stdout)
                    if args[0] == 'claim':
                        self.assertIn('write scope locked by BAD-1', r.stdout)

    def test_cross_drive_containment_error_is_refused(self):
        with mock.patch.object(self.b.os.path, 'commonpath', side_effect=ValueError('Paths on different drives')):
            self.assertTrue(self.b.scope_errors(['docs/a.md'], False))

    def test_plausible_shortname_spelling_is_rejected_without_os_assumption(self):
        self.assertTrue(self.b.scope_errors(['TSST/CONTEX~1/boot.md'], True))


if __name__ == '__main__':
    unittest.main()
