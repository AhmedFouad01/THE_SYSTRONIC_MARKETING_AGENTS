"""Tests for pull_decisions.py (R3b). Fake export + temp tree; nothing touches the server or the real client folders.
Run: python -m unittest discover -s TSST/services/review -p "test_*.py" """
import json
import os
import subprocess
import tempfile
import unittest

import pull_decisions as pd


def row(job="j", key="work/a.png", status="approved", note="", date="2026-10-17", by="Ahmed", brand="acme"):
    return {"brand": brand, "job": job, "key": key, "status": status, "note": note, "by": by, "date": date}


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = os.path.join(self.tmp.name, "brands")
        self.p = os.path.join(self.root, "acme", "projects")
        os.makedirs(self.p)
        self.logs = []
        self.built = []
        self.synced = []

    def job(self, rel, manifest=None, raw=None, page=False):
        d = os.path.join(self.p, *rel.split("/"))
        os.makedirs(d, exist_ok=True)
        if raw is not None:
            with open(os.path.join(d, "DELIVERY.json"), "wb") as fh:
                fh.write(raw)
        elif manifest is not None:
            with open(os.path.join(d, "DELIVERY.json"), "w", encoding="utf-8", newline="\n") as fh:
                json.dump(manifest, fh, ensure_ascii=False, indent=2)
                fh.write("\n")
        if page:
            with open(os.path.join(d, "DELIVERY.html"), "w", encoding="utf-8") as fh:
                fh.write("<html></html>")
        return d

    def read(self, rel):
        with open(os.path.join(self.p, *rel.split("/"), "DELIVERY.json"), "rb") as fh:
            return fh.read().decode("utf-8")

    def run_pull(self, rows, dry=False):
        def build(b, j):
            self.built.append((b, j))
            return {"ok": True, "line": f"{j}: built"}

        def sync(b):
            self.synced.append(b)
            return {"ok": True, "line": "synced"}
        return pd.pull(self.root, rows, dry_run=dry, log=self.logs.append, build=build, sync=sync)


class Pull(Base):
    def test_writes_only_changed_jobs_keeps_other_keys_and_indent(self):
        self.job("j", {"title": "عنوان", "items": [1, 2], "review": {"work/a.png": {"status": "pending", "note": "", "date": "2026-10-10", "by": "Ahmed"}}})
        self.job("same", {"title": "S", "review": {"work/b.png": {"status": "approved", "note": "ok", "date": "2026-10-17", "by": "Ahmed"}}})
        before_same = self.read("same")
        r = self.run_pull([row(note="تمام"), row(job="same", key="work/b.png", note="ok")])
        self.assertEqual(r, {"changed": [("acme", "j", 1)], "errors": 0})
        d = json.loads(self.read("j"))
        self.assertEqual(d["review"]["work/a.png"], {"status": "approved", "note": "تمام", "date": "2026-10-17", "by": "Ahmed"})
        self.assertEqual((d["title"], d["items"]), ("عنوان", [1, 2]))
        self.assertEqual(self.read("same"), before_same)
        self.assertTrue(self.read("j").startswith('{\n  "title"'))
        self.assertTrue(self.read("j").endswith("}\n"))
        self.assertEqual(self.synced, ["acme"])
        self.assertEqual(self.built, [])               # no DELIVERY.html anywhere

    def test_second_run_is_a_no_op(self):
        self.job("j", {"review": {}})
        self.run_pull([row()])
        text = self.read("j")
        self.synced.clear()
        r = self.run_pull([row()])
        self.assertEqual(r["changed"], [])
        self.assertEqual(self.read("j"), text)
        self.assertEqual(self.synced, [])
        self.assertIn("no changes", self.logs)

    def test_page_jobs_are_rebuilt_then_brand_synced_once(self):
        self.job("a", {"review": {}}, page=True)
        self.job("b", {"review": {}})
        self.job("c", {"review": {}}, page=True)
        self.run_pull([row(job="a"), row(job="b"), row(job="c")])
        self.assertEqual(self.built, [("acme", "a"), ("acme", "c")])
        self.assertEqual(self.synced, ["acme"])

    def test_dry_run_prints_the_plan_and_writes_nothing(self):
        self.job("j", {"review": {}}, page=True)
        before = self.read("j")
        r = self.run_pull([row(note="x")], dry=True)
        self.assertEqual(r["changed"], [("acme", "j", 1)])
        self.assertEqual(self.read("j"), before)
        self.assertEqual((self.built, self.synced), ([], []))
        self.assertTrue(any(line.startswith("would update acme/j") for line in self.logs))
        self.logs.clear()
        self.run_pull([], dry=True)
        self.assertEqual(self.logs, ["no changes"])

    def test_creates_a_minimal_manifest_when_a_job_has_decisions_but_no_file(self):
        self.job("fresh")
        self.run_pull([row(job="fresh")])
        d = json.loads(self.read("fresh"))
        self.assertEqual((d["title"], d["status"]), ("fresh", "progress"))
        self.assertEqual(d["review"]["work/a.png"]["status"], "approved")

    def test_crlf_tab_and_missing_trailing_newline_are_kept(self):
        raw = '{\r\n\t"title": "T",\r\n\t"review": {}\r\n}'.encode("utf-8")
        self.job("j", raw=raw)
        self.run_pull([row()])
        text = self.read("j")
        self.assertIn('\r\n\t"title"', text)
        self.assertFalse(text.endswith("\n"))
        self.assertEqual(json.loads(text)["review"]["work/a.png"]["status"], "approved")

    def test_local_only_keys_are_kept_and_extra_fields_survive(self):
        self.job("j", {"review": {"work/old.png": {"status": "approved", "note": "", "date": "2026-10-01", "by": "Ahmed"},
                                  "work/a.png": {"status": "pending", "note": "", "date": "2026-10-01", "by": "Ahmed", "extra": 1}}})
        self.run_pull([row()])
        rv = json.loads(self.read("j"))["review"]
        self.assertIn("work/old.png", rv)
        self.assertEqual(rv["work/a.png"]["extra"], 1)
        self.assertTrue(any("local-only" in line for line in self.logs))

    def test_bad_manifest_unknown_job_and_hostile_names_are_skipped_not_fatal(self):
        self.job("broken", raw=b"{ nope")
        self.job("ok", {"review": {}})
        r = self.run_pull([row(job="broken"), row(job="ghost"), row(job="../../x"), row(brand="..", job="ok"), row(job="ok")])
        self.assertEqual(r["changed"], [("acme", "ok", 1)])
        self.assertEqual(self.read("broken"), "{ nope")
        self.assertEqual(sum(1 for line in self.logs if line.startswith("skip")), 4)
        self.assertFalse(os.path.exists(os.path.join(self.tmp.name, "x")))

    def test_malformed_rows_are_ignored(self):
        self.job("j", {"review": {}})
        r = self.run_pull([{"brand": "acme"}, "nope", row(), dict(row(key="work/n.png"), note=None)])
        self.assertEqual(r["changed"], [("acme", "j", 1)])

    def test_failed_build_is_an_error_exit(self):
        self.job("j", {"review": {}}, page=True)
        r = pd.pull(self.root, [row()], log=self.logs.append, build=lambda b, j: {"ok": False, "line": "j: FAIL"},
                    sync=lambda b: {"ok": True, "line": "s"})
        self.assertEqual(r["errors"], 1)


class Fetch(unittest.TestCase):
    def fake(self, out="", rc=0, exc=None):
        def runner(cmd, **kw):
            self.cmd = cmd
            if exc:
                raise exc
            return subprocess.CompletedProcess(cmd, rc, out, "")
        return runner

    def test_parses_the_json_line_after_the_npm_banner(self):
        banner = "> tsst-portal@0.1.0 export:decisions\n> tsx src/cli/export-decisions.ts\n\n"
        rows = pd.fetch_export(self.fake(banner + json.dumps([row()]) + "\n"), key="K", host="h@x")
        self.assertEqual(rows, [row()])
        self.assertEqual(self.cmd[:3], ["ssh", "-i", "K"])
        self.assertIn("BatchMode=yes", self.cmd)
        self.assertEqual(self.cmd[-1], "sudo -u tsst tsst-portal-run export:decisions")

    def test_offline_failures_give_none(self):
        for runner in (self.fake(rc=255), self.fake(exc=subprocess.TimeoutExpired("ssh", 1)), self.fake(exc=FileNotFoundError()),
                       self.fake(out="no json here\n"), self.fake(out="[ not json\n"), self.fake(out='{"a":1}\n')):
            self.assertIsNone(pd.fetch_export(runner))


class Main(Base):
    def run_main(self, argv, rows):
        return pd.main(argv + ["--root", self.root, "--quiet"], fetch=lambda: rows, directory=os.path.join(self.tmp.name, "log"))

    def test_offline_is_a_quiet_exit_0_and_logged(self):
        self.job("j", {"review": {}})
        before = self.read("j")
        self.assertEqual(self.run_main([], None), 0)
        self.assertEqual(self.read("j"), before)
        with open(os.path.join(self.tmp.name, "log", "pull.log"), encoding="utf-8") as fh:
            self.assertIn("server not reachable", fh.read())

    def test_dry_run_through_main_and_custom_root_skips_build_and_sync(self):
        self.job("j", {"review": {}}, page=True)
        before = self.read("j")
        self.assertEqual(self.run_main(["--dry-run"], [row()]), 0)
        self.assertEqual(self.read("j"), before)
        self.assertEqual(self.run_main([], [row()]), 0)       # custom root: no build_delivery / sync_jobs subprocess
        self.assertEqual(json.loads(self.read("j"))["review"]["work/a.png"]["status"], "approved")

    def test_log_rotates_when_large(self):
        d = os.path.join(self.tmp.name, "log")
        os.makedirs(d)
        with open(os.path.join(d, "pull.log"), "w") as fh:
            fh.write("x" * (pd.LOG_MAX + 10))
        pd.Log(d, echo=False)("hello")
        self.assertTrue(os.path.exists(os.path.join(d, "pull.log.1")))
        self.assertLess(os.path.getsize(os.path.join(d, "pull.log")), 200)

    def test_a_second_run_while_locked_is_skipped(self):
        d = os.path.join(self.tmp.name, "log")
        with pd.Lock(d) as first:
            self.assertTrue(first.held)
            self.job("j", {"review": {}})
            self.assertEqual(pd.main(["--root", self.root, "--quiet"], fetch=lambda: [row()], directory=d), 0)
            self.assertEqual(json.loads(self.read("j"))["review"], {})


if __name__ == "__main__":
    unittest.main()
