#!/usr/bin/env python3
"""Build the brand entry pages from canonical job manifests using the shared renderer.

Usage: python TSST/services/delivery/build_brand.py <brand-id>
Normally invoked by sync_jobs.py, including new_job.py and --all flows.
"""
import json
import sys
from pathlib import Path
from urllib.parse import quote
import build_delivery as delivery

BRANDS = Path(delivery.ROOT) / 'TSST' / 'brands'


def manifest_for(brand, internal=False, brands=BRANDS):
    home = brands / brand
    records = []
    for source in sorted((home / 'projects').rglob('DELIVERY.json')):
        # Fail visibly on malformed data; never silently omit an existing workstream.
        data = json.loads(source.read_text(encoding='utf-8'))
        if not isinstance(data, dict):
            raise ValueError(f'{source}: manifest must be an object')
        records.append((source.parent, data))
    by_folder = dict(records)
    rows = []
    for folder, data in records:
        ancestors = [by_folder[p] for p in folder.parents if p in by_folder]
        if not internal and any(d.get('internal') or d.get('status') == 'rejected' for d in [data, *ancestors]):
            continue
        ar = data.get('ar') or {}
        status = data.get('status', '')
        known = status in delivery.ST_CLS
        label = (data.get('status_label') or delivery.I18N['en'].get('st_' + status, 'Status to be confirmed')) if known else 'Status to be confirmed'
        label_ar = (ar.get('status_label') or delivery.I18N['ar'].get('st_' + status, 'الحالة قيد التأكيد')) if known else 'الحالة قيد التأكيد'
        parent = next((p for p in folder.parents if p in by_folder and (internal or not by_folder[p].get('internal'))), None)
        ancestor = by_folder[parent] if parent else {}
        # Folder identifiers are navigation data, never visible client labels.
        title = data.get('title') or ('Untitled work' if not internal else data.get('job') or folder.name)
        group = ancestor.get('title', '') if parent else ''
        filename = 'DELIVERY_INTERNAL.html' if internal else 'DELIVERY.html'
        target = folder / filename
        rows.append({
            'title': title, 'title_ar': ar.get('title') or title,
            'status': status if known else '', 'label': label, 'label_ar': label_ar,
            'detail': data.get('status_detail', ''), 'detail_ar': ar.get('status_detail') or data.get('status_detail', ''),
            'group': group, 'group_ar': (ancestor.get('ar') or {}).get('title') or group,
            'date': data.get('date', ''),
            'href': quote(target.relative_to(home).as_posix(), safe='/') if target.is_file() else '',
        })
    name = delivery.portfolio_name(brand) or next((d.get('client') for _, d in records if d.get('client')), brand)
    langs = [d.get('default_lang') for _, d in records if d.get('default_lang') in ('en', 'ar')]
    return {
        'client': name, 'job': 'brand-' + brand, 'default_lang': langs[0] if langs else 'en',
        'title': 'Projects and work', 'subtitle': 'One view of ongoing work and deliveries',
        'status': 'noted', 'status_label': f'{len(rows)} workstreams',
        'status_detail': 'Choose a project to view its latest status and deliveries.',
        'logo': 'auto', 'brand_work': rows,
        'ar': {'title': 'المشروعات والأعمال', 'subtitle': 'عرض موحد للأعمال والتسليمات',
               'status_label': f'{len(rows)} مسارات عمل',
               'status_detail': 'اختر مشروعًا للاطلاع على حالته الحالية وتسليماته.'},
    }


def build_brand(brand, brands=BRANDS):
    home = (brands / brand).resolve()
    if home.parent != brands.resolve() or not (home / 'projects').is_dir():
        raise ValueError('Expected an existing brand projects folder')
    # Validate both audiences before publishing either generated output.
    for internal in (False, True):
        manifest_for(brand, internal, brands)
    outputs = []
    for audience in ('client', 'internal'):
        manifest = manifest_for(brand, audience == 'internal', brands)
        if audience == 'client':
            # Scan only visible text: paths necessarily contain canonical folder slugs.
            visible = ' '.join(str(v) for r in manifest['brand_work'] for k, v in r.items() if k != 'href')
            hits = delivery.leaks(visible)
            if hits:
                raise ValueError(f'Brand client text contains internal terms: {hits}')
        filename, doc = delivery.build(str(home), audience, manifest=manifest, write=False)
        check = delivery.Chk()
        check.feed(doc)
        check.close()
        if check.err or check.stack:
            raise ValueError(f'{filename}: invalid HTML: {check.err}, {check.stack}')
        outputs.append((filename, doc, len(manifest['brand_work'])))
    for filename, doc, count in outputs:
        target = home / filename
        if not target.is_file() or target.read_text(encoding='utf-8') != doc:
            target.write_text(doc, encoding='utf-8', newline='\n')
        print(f'built {target} ({count} workstreams)')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    try:
        build_brand(sys.argv[1])
    except (OSError, ValueError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        sys.exit(1)
