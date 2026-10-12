#!/usr/bin/env python3
"""Read-only TSST plan preflight. No dispatch, state writes, approval or method attestation.

Usage: python -B TSST/context/preflight.py --plan plan.json [--mutate] [--json]
Use --plan - for JSON stdin. Default inspect mode warns on branch mismatch;
--mutate blocks it and requires writes inside the recorded approved scope.
Utility readers use the complete R3 plan with skills: [] (prompt: SKILLS: none).
More than three skills require skill_limit_reason (prompt: SKILL_LIMIT_REASON).
Authority.source references existing approval; this tool cannot authenticate a human.
Hashes identify current files, not proof they were read or their methods applied.
"""
import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CANONICAL_ROOT = Path('G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS')
TEAM_AGENTS = {'tsst-lens': 'marketing', 'tsst-spark': 'marketing',
               'tsst-creative': 'studio', 'tsst-motion': 'motion', 'tsst-dev': 'build'}
UTILITY = {'tsst-reader', 'explore'}
TEAMS = {'marketing', 'studio', 'motion', 'build', 'lead'}
PLAN_FIELDS = ('team', 'agent', 'skills', 'not_selected', 'tier', 'acceptance', 'skill_gap')
ID_RE = re.compile(r'TSST-[A-Z]+-SK-\d{3}')
INDEX_RE = re.compile(r'^\s*- \{id: ([^,]+), team: ([^,]+), owner: [^,]+, status: ([^,]+),.*path: ("[^"]*")\}\s*$')


def load_index(root=ROOT, index_path=None):
    out = {}
    for line in Path(index_path or Path(root) / 'TSST/skills/index.yaml').read_text(encoding='utf-8-sig').splitlines():
        if line == 'backlog:':
            break
        m = INDEX_RE.match(line)
        if m:
            sid, team, status, path = m.groups()
            sid = sid.strip().upper()
            if sid in out:
                raise ValueError('duplicate skill ID in index: ' + sid)
            out[sid] = {'team': team.strip(), 'status': status.strip(), 'path': json.loads(path)}
        elif line.strip() and not line.lstrip().startswith('#') and line != 'skills:':
            raise ValueError('malformed active skill index row')
    if not out:
        raise ValueError('no skills parsed from index')
    return out


def validate_plan(plan, index):
    """Shared R3 validation for JSON preflight and the Agent/Task hook."""
    if not isinstance(plan, dict):
        return ['plan must be an object']
    errors = []
    for field in PLAN_FIELDS:
        if field not in plan or (field != 'skills' and not str(plan[field] or '').strip()):
            errors.append('missing ' + field.upper())
    team, agent = str(plan.get('team', '')).lower(), str(plan.get('agent', '')).lower()
    if team not in TEAMS:
        errors.append('TEAM must be one of ' + ', '.join(sorted(TEAMS)))
    if agent not in TEAM_AGENTS and agent not in UTILITY and not (agent in ('lead-main', 'tsst-lead', 'lead') and team == 'lead'):
        errors.append('AGENT is not a routed TSST agent')
    elif agent in TEAM_AGENTS and team != TEAM_AGENTS[agent]:
        errors.append(f'AGENT {agent} serves team {TEAM_AGENTS[agent]}, not {team}')
    if str(plan.get('tier', '')).upper() not in {'FAST', 'WORK', 'CODE', 'DEEP'}:
        errors.append('invalid TIER')
    if agent in UTILITY and str(plan.get('tier', '')).upper() != 'FAST':
        errors.append('utility reader TIER must be FAST')
    if str(plan.get('skill_gap', '')).lower() != 'none':
        errors.append('SKILL_GAP must be resolved through TSST-CTX-SK-023 before execution')
    skills = plan.get('skills')
    if not isinstance(skills, list) or any(not isinstance(s, str) or not ID_RE.fullmatch(s.upper()) for s in skills):
        errors.append('SKILLS must be a list of canonical skill IDs (utility: empty list / none)')
        return errors
    if agent in UTILITY:
        if skills:
            errors.append('utility readers require SKILLS: none; specialist execution must be routed')
    elif not skills:
        errors.append('SKILLS requires at least one indexed skill')
    if len(set(s.upper() for s in skills)) > 3 and not str(plan.get('skill_limit_reason') or '').strip():
        errors.append('more than 3 SKILLS requires SKILL_LIMIT_REASON')
    for sid in skills:
        sid = sid.upper()
        entry = index.get(sid)
        if entry is None:
            errors.append('skill not in index: ' + sid)
            continue
        st, status = (entry['team'], entry['status']) if isinstance(entry, dict) else entry
        if status == 'DEPRECATED':
            errors.append('skill is DEPRECATED: ' + sid)
        if team != 'lead' and st not in (team, 'core'):
            errors.append(f'skill {sid} belongs to team {st}, not {team}')
    return errors


def normalize_scope(value):
    """Repository-relative scope spelling; reject traversal, absolute and Windows aliases."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError('scope must be a nonempty string')
    value = value.strip().replace('\\', '/')
    if value.startswith('/') or ':' in value or '\x00' in value:
        raise ValueError('scope outside repo: ' + value)
    parts = []
    for part in value.split('/'):
        if part in ('', '.'):
            continue
        if part == '..' or part.endswith((' ', '.')):
            raise ValueError('unsafe scope component: ' + value)
        if part.split('.')[0].upper() in {'CON', 'PRN', 'AUX', 'NUL', *('COM' + str(i) for i in range(1, 10)),
                                         *('LPT' + str(i) for i in range(1, 10))}:
            raise ValueError('Windows device scope refused: ' + value)
        parts.append(part)
    if not parts:
        raise ValueError('empty repository scope')
    return '/'.join(parts)


def scope_contains(allowed, requested):
    a, r = normalize_scope(allowed).casefold(), normalize_scope(requested).casefold()
    if a == r:
        return True
    has_glob = lambda value: any(c in value for c in '*?[')
    if not has_glob(a) and r.startswith(a.rstrip('/') + '/'):
        return True
    if has_glob(r):
        # Matching the requested pattern as a filename cannot prove language inclusion.
        # Only identical patterns, literal directory authority or a literal /** subtree
        # establish inclusion without a general-purpose glob-language solver.
        if a.endswith('/**') and not has_glob(a[:-3]):
            return r.startswith(a[:-3].rstrip('/') + '/')
        return a in ('*', '**')
    return fnmatch.fnmatchcase(r, a)


def safe_file(root, relative):
    path = (root / normalize_scope(relative)).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('resolved path outside repo: ' + relative)
    return path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect_plan(plan, *, cwd=None, expected_root=None, mutate=False, git_runner=None):
    """expected_root/git_runner are test injection points, never accepted from a plan/CLI."""
    cwd = Path(cwd or Path.cwd()).resolve()
    expected = Path(expected_root or CANONICAL_ROOT).resolve()
    result = {'ok': False, 'mode': 'mutate' if mutate else 'inspect', 'errors': [], 'warnings': [],
              'workspace': str(cwd), 'branch': None, 'hashes': {},
              'native_registration': 'unverified',
              'limitations': ['Authority is a recorded reference, not human authentication.',
                             'Hashes identify files; they do not prove reading, method use or approval.',
                             'Preflight does not intercept shell tools or enforce subsequent execution.']}
    errors, warnings = result['errors'], result['warnings']
    if not isinstance(plan, dict):
        errors.append('plan must be a JSON object')
        return result
    if cwd != expected:
        errors.append('workspace must be canonical root: ' + str(expected))
        return result
    if expected_root is None and ROOT.resolve() != expected:
        errors.append('preflight script is outside canonical workspace')
        return result
    def git(*args):
        if git_runner:
            return git_runner(*args)
        r = subprocess.run(['git', '-C', str(cwd), *args], text=True, capture_output=True, timeout=15)
        if r.returncode:
            raise ValueError('git failed: ' + r.stderr.strip())
        return r.stdout.strip()
    try:
        git_root = Path(git('rev-parse', '--show-toplevel')).resolve()
        if git_root != expected:
            errors.append('actual git root does not match canonical workspace')
            return result
        branch = git('branch', '--show-current')
        result['branch'] = branch
        track = plan.get('track')
        if not isinstance(track, str) or not track.strip() or track != track.strip() or track.endswith('/'):
            errors.append('TRACK is required and must name a branch or track prefix')
        elif not branch or (branch != track and not branch.startswith(track + '/')):
            message = f'branch {branch or "detached HEAD"} does not match TRACK {track}'
            (errors if mutate else warnings).append(message)
        index = load_index(cwd)
        errors.extend(validate_plan(plan, index))
        for field in ('runtime', 'contract_mode'):
            if not isinstance(plan.get(field), str) or not plan[field].strip():
                errors.append('missing ' + field.upper())
        runtime = str(plan.get('runtime', '')).lower()
        if runtime not in ('codex', 'claude'):
            errors.append('RUNTIME must be codex or claude')
        mode = plan.get('contract_mode')
        if mode not in ('explicit', 'native'):
            errors.append('CONTRACT_MODE must be explicit or native')
        if mode == 'native':
            if not str(plan.get('registration_evidence', '')).strip():
                errors.append('native mode requires REGISTRATION_EVIDENCE reference; file presence is insufficient')
            warnings.append('Native registration evidence is caller-declared and not independently verified.')
        if mode == 'explicit':
            agent = str(plan.get('agent', '')).lower()
            contract = plan.get('contract_path')
            wanted = ('TSST/LEAD/AGENT.md' if agent in ('lead-main', 'tsst-lead', 'lead') else
                      f'.codex/agents/{agent}.toml' if runtime == 'codex' else f'.claude/agents/{agent}.md')
            if not isinstance(contract, str) or normalize_scope(contract).casefold() != wanted.casefold():
                errors.append('CONTRACT_PATH must reference the routed runtime agent file: ' + wanted)
            else:
                path = safe_file(cwd, contract)
                result['hashes'][contract] = digest(path)
            warnings.append('Explicit contract mode records the named contract; native auto-loading is unverified.')
        result['contract_mode'] = mode
        result['hashes']['TSST/core/rules.md'] = digest(safe_file(cwd, 'TSST/core/rules.md'))
        for sid in plan.get('skills', []) if isinstance(plan.get('skills'), list) else []:
            entry = index.get(str(sid).upper())
            if entry:
                relative = entry['path'] + '/SKILL.md'
                result['hashes'][relative] = digest(safe_file(cwd, relative))
        expected_hashes = plan.get('expected_hashes', {})
        if not isinstance(expected_hashes, dict):
            errors.append('EXPECTED_HASHES must be an object when provided')
        else:
            for relative, recorded in expected_hashes.items():
                if result['hashes'].get(relative) != recorded:
                    errors.append('file differs from recorded plan hash: ' + relative)
        authority = plan.get('authority')
        if not isinstance(authority, dict) or not isinstance(authority.get('source'), str) or not authority['source'].strip():
            errors.append('AUTHORITY requires a nonempty source reference to existing approval')
            authority = {}
        approved = authority.get('approved_scope')
        if not isinstance(approved, dict):
            errors.append('AUTHORITY.approved_scope must record read/write arrays')
            approved = {}
        result['authority_source'] = authority.get('source')
        result['scope'] = {}
        for field in ('read', 'write'):
            requested, permitted = plan.get(field), approved.get(field)
            if not isinstance(requested, list) or not isinstance(permitted, list):
                errors.append(field.upper() + ' and approved_scope.' + field + ' must be arrays')
                continue
            requested = [normalize_scope(x) for x in requested]
            permitted = [normalize_scope(x) for x in permitted]
            result['scope'][field] = requested
            for scope in requested:
                if not any(scope_contains(a, scope) for a in permitted):
                    errors.append(f'{field} scope lacks recorded authority: {scope}')
                # Resolve only the literal prefix; never expand globs or access outside root.
                prefix = re.split(r'[*?\[]', scope, maxsplit=1)[0].rstrip('/')
                if prefix:
                    safe_file(cwd, prefix)
        actions = plan.get('actions', [])
        approved_actions = approved.get('actions', [])
        if not isinstance(actions, list) or not isinstance(approved_actions, list):
            errors.append('actions must be arrays; no paid/external action authority is inferred')
        elif any(action not in approved_actions for action in actions):
            errors.append('action lacks explicit recorded authority; no paid/external authority is inferred')
        if str(plan.get('agent', '')).lower() in UTILITY and (plan.get('write') or actions):
            errors.append('utility readers cannot request writes or external actions')
    except (OSError, ValueError, TypeError, subprocess.SubprocessError) as exc:
        errors.append(str(exc))
    result['ok'] = not errors
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', required=True, help='JSON plan file, or - for stdin')
    parser.add_argument('--mutate', action='store_true', help='validate execution that includes mutations')
    parser.add_argument('--json', action='store_true', help='machine-readable result')
    args = parser.parse_args(argv)
    try:
        text = sys.stdin.read() if args.plan == '-' else Path(args.plan).read_text(encoding='utf-8-sig')
        result = inspect_plan(json.loads(text), mutate=args.mutate)
    except (OSError, ValueError) as exc:
        result = {'ok': False, 'errors': [str(exc)], 'warnings': []}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print('PREFLIGHT ' + ('PASS' if result['ok'] else 'BLOCK'))
        for key in ('errors', 'warnings'):
            for message in result[key]:
                print(key.upper() + ': ' + message)
        for path, value in result.get('hashes', {}).items():
            print('SHA256 ' + path + ' ' + value)
        for message in result.get('limitations', []):
            print('LIMIT: ' + message)
    return 0 if result['ok'] else 2


if __name__ == '__main__':
    sys.exit(main())
