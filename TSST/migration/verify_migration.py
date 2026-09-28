"""Read-only repository integrity checks. Does not execute skill evaluations."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[2]
team = root / 'TSST'
manifest = json.loads((team / 'migration/PRESERVATION_MANIFEST.json').read_text(encoding='utf-8'))
errors = []
for row in manifest:
    p = root / row['path']
    if not p.is_file():
        errors.append('Missing preserved file: ' + row['path'])
    elif '/evaluations/' in row['path'] or '/skills/' in row['path'] or p.suffix == '.xlsx':
        if hashlib.sha256(p.read_bytes()).hexdigest() != row['sha256_migrated']:
            errors.append('Preservation mismatch: ' + row['path'])
pngs = [r for r in manifest if r['path'].endswith('.png')]
assert all(r['sha256_before'] == r['sha256_migrated'] for r in pngs)

# The legacy map is the only active document containing retired identifiers.
map_text = (root / 'LEGACY_ID_MAP.md').read_text(encoding='utf-8')
id_section = map_text.split('## Complete file map')[0]
pairs = re.findall(r'^\| `([^`]+)` \| `([^`]+)` \|$', id_section, re.M)
legacy = [a for a, b in pairs if a != b]
legacy_pattern = re.compile('|'.join(re.escape(x) for x in sorted(legacy, key=len, reverse=True)))
for p in [root / 'AGENTS.md', root / 'TSST_TEAM_BOOTSTRAP_PROMPT_v0.1.md', *team.rglob('*.md'), *team.rglob('*.html'), *team.rglob('*.cjs')]:
    if legacy_pattern.search(p.read_text(encoding='utf-8')):
        errors.append('Retired identifier in active text: ' + str(p.relative_to(root)))
for p in team.rglob('*'):
    if legacy_pattern.search(p.relative_to(root).as_posix()):
        errors.append('Retired path: ' + str(p.relative_to(root)))

skills = list(team.glob('*/skills/*/SKILL.md'))
names = []
bodies = []
for p in skills:
    text = p.read_text(encoding='utf-8')
    front = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not front:
        errors.append('Missing frontmatter: ' + str(p)); continue
    fields = dict(line.split(': ', 1) for line in front[1].splitlines())
    name = fields.get('name', '')
    desc = fields.get('description', '')
    if desc.startswith('"'):
        desc = json.loads(desc)  # JSON string is a valid YAML quoted scalar.
    if name != p.parent.name or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name) or len(name) > 64:
        errors.append('Invalid skill name: ' + name)
    if not desc or len(desc) > 1024 or '<' in desc or '>' in desc or '[TODO:' in text:
        errors.append('Invalid description/scaffold: ' + name)
    names.append(name)
    bodies.append(text[front.end():])
if len(names) != len(set(names)) or len(bodies) != len(set(bodies)):
    errors.append('Duplicate skill name/body')
counts = Counter(p.parts[-4] for p in skills)
if counts != {'LEAD': 30, 'CREATIVE': 7, 'LENS': 6, 'SPARK': 6}:
    errors.append('Unexpected skill counts: ' + str(counts))

fixture_targets = {'strategy/positioning.md', 'tokens/brand.tokens.json', 'assets/manifest.yml', 'AGENT_GUIDE.md', 'BRAND.md', 'legacy/social-notes.md', 'references/github-brand-guidelines.pdf'}
known_missing = []
links = 0
for p in [root / 'AGENTS.md', *team.rglob('*.md')]:
    for ref in re.findall(r'\]\(([^)]+)\)', p.read_text(encoding='utf-8')):
        if '://' in ref or ref.startswith('#'):
            continue
        links += 1
        target = ref.split('#')[0]
        if not (p.parent / target).exists():
            if p.name == 'TSST-CREATIVE-EV-002-actual-output.md' and target in fixture_targets:
                known_missing.append(target)
            else:
                errors.append('Broken link: ' + str(p.relative_to(root)) + ' -> ' + ref)
for p in team.rglob('*.html'):
    for ref in re.findall(r'(?:href|src)=[\"\x27]([^\"\x27]+)', p.read_text(encoding='utf-8')):
        if '://' not in ref and not ref.startswith(('data:', '#')) and not (p.parent / ref).exists():
            errors.append('Missing HTML dependency: ' + str(p))
registry = (team / 'SKILL_REGISTRY.md').read_text(encoding='utf-8')
for ref in re.findall(r'- Package: `([^`]+)`', registry):
    if not (team / ref).is_file():
        errors.append('Missing specialist package: ' + ref)

with zipfile.ZipFile(root / 'TSST_Specialist_Skill_Matrix_v0.1.xlsx') as z:
    for name in z.namelist():
        if name.endswith(('.xml', '.rels')):
            text = z.read(name).decode('utf-8')
            ET.fromstring(text)
            if legacy_pattern.search(text):
                errors.append('Retired workbook identifier: ' + name)
    wb = ET.fromstring(z.read('xl/workbook.xml'))
    tabs = [s.attrib['name'] for s in wb.iter() if s.tag.endswith('}sheet')]
    assert tabs == ['Overview', 'CREATIVE', 'LENS', 'SPARK', 'Training_Roadmap']

print(json.dumps({'original_files_present': len(manifest), 'preserved_evaluation_files': sum('/evaluations/' in r['path'] for r in manifest), 'unchanged_original_pngs': len(pngs), 'installed_skills': dict(counts), 'local_links_checked': links, 'historical_missing_link_occurrences': len(known_missing), 'historical_missing_targets': len(set(known_missing)), 'errors': errors}, indent=2))
raise SystemExit(bool(errors))
