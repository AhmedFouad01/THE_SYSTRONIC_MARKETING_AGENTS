"""R20 regression fixtures only; never inspect or rebuild live brands."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import job_check
import status_sync
import sync_jobs


class JobFixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="tsst-job-check-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.brand = self.root / "TSST/brands/example"
        self.job = self.brand / "projects/campaign/week-01"
        self.job.mkdir(parents=True)
        self.manifest = self.job / "DELIVERY.json"
        self.manifest.write_text(json.dumps({"status": "review"}), encoding="utf-8")
        for name in ("README.md", "DELIVERY.html", "DELIVERY_INTERNAL.html"):
            (self.job / name).write_text("fixture", encoding="utf-8")
        self.project = self.brand / "projects/campaign/project.md"
        self.status = self.brand / "status.md"
        self.portfolio = self.root / "TSST/core/portfolio.yaml"
        self.portfolio.parent.mkdir(parents=True)
        self.project.write_text("campaign/week-01\n", encoding="utf-8")
        self.status.write_text("campaign/week-01\n", encoding="utf-8")
        self.portfolio.write_text("brands:\n  example:\n", encoding="utf-8")
        (self.brand / "JOBS.md").write_text("| `campaign/week-01` | service | title | review | date |\n", encoding="utf-8")

    def marker(self, **changes):
        data = {"version": 1, "brand": "example", "job": "campaign/week-01", "status": "review",
                "source": "TSST/brands/example/projects/campaign/week-01/DELIVERY.json",
                "manifest_sha256": hashlib.sha256(self.manifest.read_bytes()).hexdigest()}
        data.update(changes)
        return json.dumps(data, sort_keys=True)

    def mirrors(self, **changes):
        for path in (self.project, self.status, self.portfolio):
            text = path.read_text(encoding="utf-8")
            mark = self.marker(**changes)
            text += ("# TSST_JOB_SYNC " + mark if path.suffix == ".yaml" else "<!-- TSST_JOB_SYNC " + mark + " -->") + "\n"
            path.write_text(text, encoding="utf-8")

    def run_check(self, *args):
        out = io.StringIO()
        with patch.object(job_check, "ROOT", self.root), patch.object(job_check, "results", []), \
             patch.object(sys, "argv", ["job_check.py", str(self.job), *args]), contextlib.redirect_stdout(out):
            code = job_check.main()
        return code, out.getvalue()



class JobCheckTests(JobFixture):
    def test_legacy_mentions_are_not_full_sync_proof(self):
        code, out = self.run_check()
        self.assertEqual(code, 1, out)
        self.assertIn("SEMANTIC_SYNC_UNVERIFIED", out)

    def test_legacy_structure_only_is_explicit(self):
        code, out = self.run_check("--structure-only")
        self.assertEqual(code, 0, out)
        self.assertIn("RESULT: STRUCTURE_PASS", out)
        self.assertIn("SEMANTIC_SYNC_UNVERIFIED", out)
        self.assertNotIn("RESULT: PASS", out)

    def test_matching_markers_pass_with_scope_limit(self):
        self.mirrors()
        code, out = self.run_check()
        self.assertEqual(code, 0, out)
        self.assertIn("structured_status_sync verified", out)
        self.assertIn("narrative review separate", out)

    def test_conflicting_structured_status_rejected(self):
        self.mirrors(status="published")
        code, out = self.run_check()
        self.assertEqual(code, 1, out)
        self.assertIn("status", out)

    def test_stale_source_hash_rejected(self):
        self.mirrors(manifest_sha256="0" * 64)
        self.assertEqual(self.run_check()[0], 1)

    def test_duplicate_target_rejected(self):
        self.mirrors()
        with self.status.open("a", encoding="utf-8") as stream:
            stream.write("<!-- TSST_JOB_SYNC " + self.marker() + " -->\n")
        self.assertEqual(self.run_check()[0], 1)

    def test_malformed_marker_rejected(self):
        self.mirrors()
        with self.status.open("a", encoding="utf-8") as stream:
            stream.write("<!-- TSST_JOB_SYNC {broken} -->\n")
        self.assertEqual(self.run_check()[0], 1)

    def test_missing_or_unknown_manifest_status_rejected(self):
        for data in ({}, {"status": "mystery"}, [], {"status": None}):
            with self.subTest(data=data):
                self.manifest.write_text(json.dumps(data), encoding="utf-8")
                self.assertEqual(self.run_check("--structure-only")[0], 1)

    def test_source_identity_and_schema_mismatch_rejected(self):
        for changes in ({"source": "wrong/DELIVERY.json"}, {"version": 2}, {"version": True},
                        {"brand": "other"}, {"job": "other"}, {"extra": "unrecognized"}):
            with self.subTest(changes=changes):
                for path in (self.project, self.status, self.portfolio):
                    path.write_text("brands:\n  example:\ncampaign/week-01\n", encoding="utf-8")
                self.mirrors(**changes)
                self.assertEqual(self.run_check()[0], 1)

    def test_narrative_contradiction_is_explicitly_outside_verified_scope(self):
        self.status.write_text("campaign/week-01 is published according to unreviewed prose\n", encoding="utf-8")
        self.mirrors()
        code, out = self.run_check()
        self.assertEqual(code, 0, out)
        self.assertIn("structured_status_sync verified; narrative review separate", out)

    def test_all_renderer_statuses_accepted(self):
        for status in ("approved", "review", "production", "published", "rejected", "progress", "noted", "draft"):
            with self.subTest(status=status):
                self.manifest.write_text(json.dumps({"status": status}), encoding="utf-8")
                for page in ("DELIVERY.html", "DELIVERY_INTERNAL.html"):
                    (self.job / page).write_text("rebuilt", encoding="utf-8")
                (self.brand / "JOBS.md").write_text("| `campaign/week-01` | s | t | " + status + " | d |\n", encoding="utf-8")
                for path in (self.project, self.status, self.portfolio):
                    path.write_text("brands:\n  example:\ncampaign/week-01\n", encoding="utf-8")
                self.mirrors(status=status)
                self.assertEqual(self.run_check()[0], 0)


class StatusSyncTests(JobFixture):
    def test_dry_run_preserves_all_source_bytes_and_write_preserves_notes(self):
        self.status.write_bytes(b"Owner's unfinished notes\r\n")
        before = {p: p.read_bytes() for p in (self.project, self.status, self.portfolio, self.manifest)}
        with contextlib.redirect_stdout(io.StringIO()):
            changes = status_sync.sync_brand("example", self.root)
        self.assertEqual(len(changes), 3)
        for path, content in before.items():
            self.assertEqual(path.read_bytes(), content)
        status_sync.sync_brand("example", self.root, write=True)
        self.assertTrue(self.status.read_bytes().startswith(before[self.status]))
        self.assertNotIn(b"\n", self.status.read_bytes().replace(b"\r\n", b""))
        self.assertEqual(self.manifest.read_bytes(), before[self.manifest])
        expected = status_sync.manifest_evidence(self.job, self.root)
        for surface in status_sync.surfaces(self.job, self.root):
            self.assertTrue(status_sync.verify_surface(surface, expected)[0])
        self.assertEqual(status_sync.plan_brand("example", self.root), {})

    def test_refresh_replaces_current_job_only(self):
        self.mirrors(status="published", manifest_sha256="0" * 64)
        other = self.marker(job="unrelated", status="draft")
        with self.status.open("a", encoding="utf-8") as stream:
            stream.write("Unfinished owner prose\n<!-- TSST_JOB_SYNC " + other + " -->\n")
        status_sync.sync_brand("example", self.root, write=True)
        text = self.status.read_text(encoding="utf-8")
        self.assertIn(other, text)
        self.assertIn("Unfinished owner prose", text)
        self.assertEqual(self.run_check()[0], 0)

    def test_missing_pointer_aborts_all_planned_writes(self):
        self.status.unlink()
        before = self.project.read_bytes(), self.portfolio.read_bytes()
        with self.assertRaises(OSError):
            status_sync.sync_brand("example", self.root, write=True)
        self.assertEqual((self.project.read_bytes(), self.portfolio.read_bytes()), before)
        self.assertFalse(self.status.exists())

    def test_missing_project_pointer_is_not_invented(self):
        self.project.unlink()
        with self.assertRaisesRegex(ValueError, "missing existing ancestor"):
            status_sync.plan_brand("example", self.root)
        self.assertFalse(self.project.exists())

    def test_nearest_project_and_brand_fallback(self):
        self.assertEqual(status_sync.project_for(self.job, self.brand), self.project)
        self.project.unlink()
        fallback = self.brand / "project.md"
        fallback.write_text("Brand pointer\n", encoding="utf-8")
        self.assertEqual(status_sync.project_for(self.job, self.brand), fallback)
        nearest = self.job / "project.md"
        nearest.write_text("Nearest pointer\n", encoding="utf-8")
        self.assertEqual(status_sync.project_for(self.job, self.brand), nearest)

    def test_duplicate_or_malformed_existing_marker_aborts_sync(self):
        for suffix in ("<!-- TSST_JOB_SYNC {broken} -->\n", "<!-- TSST_JOB_SYNC " + self.marker() + " -->\n"):
            with self.subTest(suffix=suffix):
                self.status.write_text("campaign/week-01\n<!-- TSST_JOB_SYNC " + self.marker() + " -->\n" + suffix, encoding="utf-8")
                before = self.project.read_bytes()
                with self.assertRaises(ValueError):
                    status_sync.sync_brand("example", self.root, write=True)
                self.assertEqual(self.project.read_bytes(), before)

    def test_unclosed_fence_fails_before_writes(self):
        self.status.write_text("```text\n<!-- TSST_JOB_SYNC {bad} -->\n", encoding="utf-8")
        before = self.project.read_bytes()
        with self.assertRaisesRegex(ValueError, "unclosed fenced"):
            status_sync.sync_brand("example", self.root, write=True)
        self.assertEqual(self.project.read_bytes(), before)

    def test_fenced_marker_examples_are_inactive(self):
        self.status.write_text("campaign/week-01\n```text\n<!-- TSST_JOB_SYNC {bad} -->\n```\n", encoding="utf-8")
        status_sync.sync_brand("example", self.root, write=True)
        self.assertEqual(self.run_check()[0], 0)


class SyncJobsIntegrationTests(JobFixture):
    def test_normal_index_sync_refreshes_mirrors_without_hub_dependency(self):
        # Brand-hub/navigation edits are separate WIP. Stub their optional adapters
        # so this repair is verifiable even when build_brand.py is absent.
        fake_brand = types.SimpleNamespace(build_brand=lambda brand: None)
        fake_delivery = types.SimpleNamespace(build=None, Chk=None, leaks=None)
        for page in ("DELIVERY.html", "DELIVERY_INTERNAL.html"):
            (self.job / page).write_text('<a data-brand-link>Existing page</a>', encoding="utf-8")
        self.status.write_text("Owner's unfinished status notes\n", encoding="utf-8")
        original_manifest = self.manifest.read_bytes()

        def check_result(folder):
            self.assertEqual(folder, self.job)
            code, output = self.run_check()
            self.assertEqual(code, 0, output)
            return "PASS"

        with patch.dict(sys.modules, {"build_brand": fake_brand, "build_delivery": fake_delivery}), \
             patch.object(sync_jobs, "ROOT", self.root), patch.object(sync_jobs, "BRANDS", self.root / "TSST/brands"), \
             patch.object(sync_jobs, "check_result", side_effect=check_result), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(sync_jobs.sync("example"), 0)
            once = {p: p.read_bytes() for p in (self.project, self.status, self.portfolio)}
            self.assertEqual(sync_jobs.sync("example"), 0)
            self.assertEqual({p: p.read_bytes() for p in once}, once)
        self.assertEqual(self.manifest.read_bytes(), original_manifest)
        self.assertIn("Owner's unfinished status notes", self.status.read_text(encoding="utf-8"))
        self.assertIn("| PASS |", (self.brand / "JOBS.md").read_text(encoding="utf-8"))

    def test_normal_index_sync_reports_missing_pointer_without_inventing_it(self):
        self.status.unlink()
        fake_brand = types.SimpleNamespace(build_brand=lambda brand: None)
        with patch.dict(sys.modules, {"build_brand": fake_brand}), \
             patch.object(sync_jobs, "ROOT", self.root), patch.object(sync_jobs, "BRANDS", self.root / "TSST/brands"), \
             contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(sync_jobs.sync("example"), 1)
        self.assertFalse(self.status.exists())


if __name__ == "__main__":
    unittest.main()
