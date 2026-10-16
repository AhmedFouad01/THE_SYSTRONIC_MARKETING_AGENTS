"""Regression checks for the shared brand view; python -m unittest discover -s TSST/services/delivery -p test_brand.py."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import build_brand
import status_sync
import sync_jobs


class BrandViewTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.brands = Path(self.tmp.name)
        self.home = self.brands / 'brand'
        (self.home / 'projects').mkdir(parents=True)
        self.addCleanup(self.tmp.cleanup)

    def job(self, name, **values):
        folder = self.home / 'projects' / name
        folder.mkdir(parents=True, exist_ok=True)
        data = {'title': name.title(), 'client': 'Example Brand', 'status': 'review', **values}
        (folder / 'DELIVERY.json').write_text(json.dumps(data), encoding='utf-8')
        return folder

    def rows(self, internal=False):
        with patch.object(build_brand.delivery, 'portfolio_name', return_value=None):
            return build_brand.manifest_for('brand', internal, self.brands)['brand_work']

    def test_reads_all_jobs_and_preserves_status(self):
        self.job('kitchen', status='approved', status_label='Six visuals accepted')
        self.job('marketing', status='review')
        rows = self.rows()
        self.assertEqual([r['status'] for r in rows], ['approved', 'review'])
        self.assertEqual(rows[0]['label'], 'Six visuals accepted')

    def test_private_and_rejected_subtrees_never_leak(self):
        self.job('private', internal=True)
        self.job('private/child', title='Hidden child')
        self.job('rejected', status='rejected')
        self.job('rejected/child', title='Rejected child')
        self.assertEqual(self.rows(), [])
        self.assertEqual(len(self.rows(True)), 4)

    def test_nested_relative_link_and_parent_title(self):
        self.job('campaign', title='Kitchen campaign')
        child = self.job('campaign/week-01')
        (child / 'DELIVERY.html').write_text('detail', encoding='utf-8')
        row = self.rows()[1]
        self.assertEqual(row['group'], 'Kitchen campaign')
        self.assertEqual(row['href'], 'projects/campaign/week-01/DELIVERY.html')

    def test_unbuilt_job_and_unknown_status_are_honest(self):
        self.job('pending', status='future-status', status_label='Approved')
        row = self.rows()[0]
        self.assertEqual(row['href'], '')
        self.assertEqual(row['status'], '')
        self.assertEqual(row['label'], 'Status to be confirmed')

    def test_malformed_manifest_fails(self):
        folder = self.job('broken')
        (folder / 'DELIVERY.json').write_text('{', encoding='utf-8')
        with self.assertRaises(ValueError):
            self.rows()

    def test_client_projection_omits_internal_fields(self):
        self.job('work', int_note='Secret', checks=[{'note': 'Secret'}], internal_next=['Secret'])
        self.assertNotIn('Secret', json.dumps(self.rows()))

    def test_real_renderer_escapes_text_and_matches_audience_links(self):
        folder = self.job('campaign/week', title='<script>bad()</script> & Work')
        for filename in ('DELIVERY.html', 'DELIVERY_INTERNAL.html'):
            (folder / filename).write_text('detail', encoding='utf-8')
        self.job('private', title='Private work', internal=True)
        with patch.object(build_brand.delivery, 'portfolio_name', return_value=None):
            build_brand.build_brand('brand', self.brands)
        client = (self.home / 'DELIVERY.html').read_text(encoding='utf-8')
        internal = (self.home / 'DELIVERY_INTERNAL.html').read_text(encoding='utf-8')
        self.assertIn('&lt;script&gt;', client)
        self.assertNotIn('<script>bad()', client)
        self.assertNotIn('Private work', client)
        self.assertIn('Private work', internal)
        self.assertIn('href="projects/campaign/week/DELIVERY.html"', client)
        self.assertNotIn('projects/campaign/week/DELIVERY_INTERNAL.html', client)
        self.assertIn('href="projects/campaign/week/DELIVERY_INTERNAL.html"', internal)

    def test_sync_connects_existing_pages_on_first_run(self):
        folder = self.job('work')
        for filename in ('DELIVERY.html', 'DELIVERY_INTERNAL.html'):
            (folder / filename).write_text('old', encoding='utf-8')
        def render(job, audience, write=False):
            return '', '<html><body><a data-brand-link href="../../DELIVERY.html">Brand</a></body></html>'
        with patch.object(sync_jobs, 'BRANDS', self.brands), patch.object(sync_jobs, 'ROOT', self.brands), \
             patch.object(build_brand, 'build_brand'), patch.object(sync_jobs, 'check_result', return_value='PASS'), \
             patch.object(status_sync, 'sync_brand', return_value={}), \
             patch.object(build_brand.delivery, 'build', side_effect=render) as call:
            self.assertEqual(sync_jobs.sync('brand'), 0)
            self.assertEqual(call.call_count, 2)
            sync_jobs.sync('brand')
            self.assertEqual(call.call_count, 2)


if __name__ == '__main__':
    unittest.main()
