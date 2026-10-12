"""Isolated fixtures for TSST plan preflight; never mutate the live repository."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('tsst_preflight_tests', Path(__file__).with_name('preflight.py'))
p = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(p)


class PreflightTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='tsst-preflight-')
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        files = {'TSST/core/rules.md': 'owner rules', '.codex/agents/tsst-dev.toml': 'dev contract',
                 'TSST/LEAD/AGENT.md': 'lead contract'}
        rows = []
        for n in range(1, 5):
            folder = f'TSST/DEV/skills/dev-{n:03d}'
            files[folder + '/SKILL.md'] = f'skill {n}'
            rows.append(f'  - {{id: TSST-DEV-SK-{n:03d}, team: build, owner: DEV, status: UNVALIDATED, version: "0.1", trigger: "test", path: "{folder}"}}')
        files['TSST/skills/index.yaml'] = 'skills:\n' + '\n'.join(rows)
        for relative, text in files.items():
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding='utf-8')
        self.plan = {'team': 'build', 'agent': 'tsst-dev', 'skills': ['TSST-DEV-SK-001'],
                     'not_selected': '013 no deployment', 'tier': 'CODE', 'acceptance': 'regressions pass',
                     'skill_gap': 'none', 'track': 'tsst-core', 'read': ['TSST/context'],
                     'write': ['TSST/context/preflight.py'], 'runtime': 'codex', 'contract_mode': 'explicit',
                     'contract_path': '.codex/agents/tsst-dev.toml',
                     'authority': {'source': 'Owner authorized this repair in the current chat',
                                   'approved_scope': {'read': ['TSST'], 'write': ['TSST/context']}}}
        self.branch = 'tsst-core/owner-rules'

    def git(self, *args):
        return str(self.root) if args[0] == 'rev-parse' else self.branch

    def inspect(self, plan=None, **kwargs):
        return p.inspect_plan(plan or self.plan, cwd=self.root, expected_root=self.root,
                              git_runner=self.git, **kwargs)

    def test_complete_explicit_plan_records_current_files(self):
        result = self.inspect(mutate=True)
        self.assertTrue(result['ok'], result)
        self.assertEqual(result['native_registration'], 'unverified')
        self.assertEqual(len(result['hashes']), 3)
        self.assertTrue(result['limitations'])

    def test_each_r3_field_required(self):
        for field in p.PLAN_FIELDS:
            with self.subTest(field=field):
                plan = copy.deepcopy(self.plan)
                del plan[field]
                self.assertFalse(self.inspect(plan)['ok'])

    def test_three_skill_limit_and_justified_exception(self):
        self.plan['skills'] = [f'TSST-DEV-SK-{n:03d}' for n in range(1, 5)]
        self.assertFalse(self.inspect()['ok'])
        self.plan['skill_limit_reason'] = 'four independent failure boundaries require four methods'
        self.assertTrue(self.inspect()['ok'])

    def test_branch_mismatch_inspection_warns_mutation_blocks(self):
        self.branch = 'anvil/campaign'
        self.assertTrue(self.inspect()['ok'])
        self.assertTrue(self.inspect()['warnings'])
        self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_detached_branch_blocks_mutation(self):
        self.branch = ''
        self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_noncanonical_cwd_blocks_even_inspect(self):
        result = p.inspect_plan(self.plan, cwd=self.root / 'copy', expected_root=self.root, git_runner=self.git)
        self.assertFalse(result['ok'])

    def test_mismatched_actual_git_root_blocks(self):
        result = p.inspect_plan(self.plan, cwd=self.root, expected_root=self.root,
                                git_runner=lambda *args: str(self.root / 'different'))
        self.assertFalse(result['ok'])

    def test_cannot_override_canonical_root_in_plan(self):
        self.plan['expected_root'] = str(self.root)
        self.assertFalse(p.inspect_plan(self.plan, cwd=self.root, git_runner=self.git)['ok'])

    def test_scope_without_authority_blocks(self):
        self.plan['write'] = ['TSST/core/rules.md']
        self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_requested_glob_cannot_expand_approved_glob(self):
        self.assertFalse(p.scope_contains('TSST/context/?.py', 'TSST/context/*.py'))
        self.plan['write'] = ['TSST/context/*.py']
        self.plan['authority']['approved_scope']['write'] = ['TSST/context/?.py']
        self.assertFalse(self.inspect(mutate=True)['ok'])
        self.assertTrue(p.scope_contains('TSST/context/*.py', 'TSST/context/*.py'))
        self.assertTrue(p.scope_contains('TSST/context', 'TSST/context/*.py'))
        self.assertTrue(p.scope_contains('TSST/**', 'TSST/context/*.py'))

    def test_read_scope_without_authority_blocks(self):
        self.plan['authority']['approved_scope']['read'] = ['TSST/DEV']
        self.assertFalse(self.inspect()['ok'])

    def test_windows_scope_normalization_and_traversal(self):
        self.plan['write'] = [r'.\TSST\context\preflight.py']
        self.assertTrue(self.inspect(mutate=True)['ok'])
        for path in [r'..\outside', '/outside', 'C:\\outside', 'TSST/context/../core']:
            self.plan['write'] = [path]
            self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_hash_changes_detected_against_recorded_plan(self):
        self.plan['expected_hashes'] = self.inspect()['hashes']
        (self.root / 'TSST/core/rules.md').write_text('changed owner rules', encoding='utf-8')
        result = self.inspect(mutate=True)
        self.assertFalse(result['ok'])
        self.assertTrue(any('recorded plan hash' in e for e in result['errors']))

    def test_missing_skill_file_or_index_blocks(self):
        skill = self.root / 'TSST/DEV/skills/dev-001/SKILL.md'
        skill.unlink()
        self.assertFalse(self.inspect()['ok'])
        (self.root / 'TSST/skills/index.yaml').unlink()
        self.assertFalse(self.inspect()['ok'])

    def test_paid_or_external_action_not_inferred(self):
        self.plan['actions'] = ['paid_generation']
        self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_existing_explicit_authority_is_used_without_new_approval(self):
        self.plan['actions'] = ['external_write']
        self.plan['authority']['approved_scope']['actions'] = ['external_write']
        self.assertTrue(self.inspect(mutate=True)['ok'])

    def test_native_claim_without_evidence_blocks(self):
        self.plan['contract_mode'] = 'native'
        self.assertFalse(self.inspect()['ok'])
        self.plan['registration_evidence'] = 'runtime evidence reference'
        result = self.inspect()
        self.assertTrue(result['ok'])
        self.assertEqual(result['native_registration'], 'unverified')

    def test_lead_main_session_uses_lead_contract(self):
        self.plan.update(team='lead', agent='tsst-lead', contract_path='TSST/LEAD/AGENT.md')
        self.assertTrue(self.inspect(mutate=True)['ok'])

    def test_specialist_cannot_claim_lead_team(self):
        self.plan['team'] = 'lead'
        self.assertFalse(self.inspect(mutate=True)['ok'])

    def test_bad_contract_reference_blocks(self):
        self.plan['contract_path'] = '.codex/agents/other.toml'
        self.assertFalse(self.inspect()['ok'])

    def test_utility_empty_skills_is_only_readonly_exception(self):
        plan = dict(self.plan, agent='tsst-reader', tier='FAST', skills=[])
        self.assertEqual(p.validate_plan(plan, p.load_index(self.root)), [])
        plan['team'] = 'invalid'
        self.assertTrue(p.validate_plan(plan, p.load_index(self.root)))


if __name__ == '__main__':
    unittest.main()
