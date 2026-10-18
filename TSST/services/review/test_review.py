"""Tests for the owner review board. Run: python -m unittest discover -s TSST/services/review -p "test_*.py"
All fixtures live in a temp tree; real client records are never touched."""
import json
import os
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request

import review


def touch(path, data=b"x", mtime=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as fh:
        fh.write(data)
    if mtime:
        os.utime(path, (mtime, mtime))


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = os.path.join(self.tmp.name, "brands")
        self.p = os.path.join(self.root, "acme", "projects")
        os.makedirs(self.p)

    def job(self, rel, **kw):
        d = os.path.join(self.p, *rel.split("/"))
        os.makedirs(d, exist_ok=True)
        return d


class Discovery(Base):
    def test_finds_nested_jobs_and_skips_content_dirs(self):
        a = self.job("campaign-01")
        touch(os.path.join(a, "DELIVERY.json"), b"{}")
        touch(os.path.join(a, "work", "post", "README.md"))      # inside work/: not a job
        b = self.job("campaign-01/week-02")
        touch(os.path.join(b, "README.md"))
        c = self.job("only-work")
        os.makedirs(os.path.join(c, "work"))
        self.job("empty-folder")                                  # Round 2: every first-level folder is a job
        d = self.job("with-brief")
        touch(os.path.join(d, "brief.md"))
        self.job("campaign-01/plain-subfolder")                   # nested folders still need a marker
        self.assertEqual(review.discover_jobs(self.root, "acme"),
                         ["campaign-01", "campaign-01/week-02", "empty-folder", "only-work", "with-brief"])

    def test_job_with_only_project_md_is_a_job_and_shows_it(self):
        d = self.job("switch-pilot")
        touch(os.path.join(d, "project.md"), "# Switch".encode("utf-8"))
        self.job("switch-pilot/sub")
        self.assertEqual(review.discover_jobs(self.root, "acme"), ["switch-pilot"])
        tree = review.api_tree(self.root)
        job = tree["brands"][0]["jobs"][0]
        self.assertEqual((job["job"], job["files"], job["pending"]), ("switch-pilot", 1, 0))
        self.assertEqual([f["path"] for f in review.api_job(self.root, "acme", "switch-pilot")["files"]], ["project.md"])

    def test_nested_marker_via_project_md(self):
        touch(os.path.join(self.job("a/b"), "project.md"))
        self.assertEqual(review.discover_jobs(self.root, "acme"), ["a", "a/b"])

    def test_brands_need_projects_folder_and_skip_template(self):
        os.makedirs(os.path.join(self.root, "_template", "projects"))
        os.makedirs(os.path.join(self.root, "nobrand"))
        self.assertEqual(review.list_brands(self.root), ["acme"])


class Classification(Base):
    def test_kinds(self):
        self.assertEqual([review.classify(n) for n in ("a.PNG", "b.jpeg", "c.webp", "d.gif", "e.mp4", "f.MOV", "g.webm", "h.md", "i.txt", "j.psd", "k")],
                         ["image", "image", "image", "image", "video", "video", "video", "text", "text", "other", "other"])

    def test_scan_newest_first_with_brief_and_hidden_skipped(self):
        d = self.job("j1")
        touch(os.path.join(d, "brief.md"), mtime=1000)
        touch(os.path.join(d, "work", "old.png"), mtime=2000)
        touch(os.path.join(d, "final", "new.png"), mtime=5000)
        touch(os.path.join(d, "work", "sub", "mid.mp4"), mtime=3000)
        touch(os.path.join(d, "work", ".hidden.png"), mtime=9000)
        touch(os.path.join(d, "work", "Thumbs.db"), mtime=9000)
        touch(os.path.join(d, "other-dir", "ignored.png"), mtime=9000)
        files = review.scan_files(d)
        self.assertEqual([f["path"] for f in files], ["final/new.png", "work/sub/mid.mp4", "work/old.png", "brief.md"])
        self.assertEqual(files[0]["kind"], "image")
        self.assertEqual(files[1]["kind"], "video")


class Collapse(Base):
    def test_noise_names_and_big_folders_collapse(self):
        d = self.job("j2")
        touch(os.path.join(d, "work", "qa", "a.png"))
        touch(os.path.join(d, "work", "refs", "deep", "b.png"))
        touch(os.path.join(d, "work", "plates", "c.png"))
        for i in range(41):
            touch(os.path.join(d, "work", "many", f"{i}.png"))
        for i in range(40):
            touch(os.path.join(d, "work", "forty", f"{i}.png"))
        files = review.scan_files(d)
        groups = {g["dir"]: g for g in review.build_groups(files)}
        self.assertTrue(groups["work/qa"]["collapsed"] and groups["work/qa"]["noise"])
        self.assertTrue(groups["work/refs/deep"]["collapsed"])
        self.assertFalse(groups["work/plates"]["collapsed"])
        self.assertTrue(groups["work/many"]["collapsed"] and not groups["work/many"]["noise"])
        self.assertFalse(groups["work/forty"]["collapsed"])
        by = {f["path"]: f for f in files}
        self.assertFalse(by["work/qa/a.png"]["reviewable"])
        self.assertTrue(by["work/plates/c.png"]["reviewable"])
        self.assertTrue(by["work/many/0.png"]["reviewable"])

    def test_summary_counts_pending_only_for_reviewable(self):
        d = self.job("j3")
        touch(os.path.join(d, "project.md"))             # notes tab: view only, never pending
        touch(os.path.join(d, "work", "a.png"))
        touch(os.path.join(d, "work", "b.png"))
        touch(os.path.join(d, "work", "tool.psd"))
        touch(os.path.join(d, "work", "inputs", "ref.png"))
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"review": {"work/a.png": {"status": "approved"}}}).encode())
        summ = review.job_summary(d)[0]
        self.assertEqual((summ["files"], summ["pending"], summ["approved"], summ["rejected"]), (5, 1, 1, 0))


class Decisions(Base):
    def payload(self, **kw):
        base = {"brand": "acme", "job": "j", "path": "work/a.png", "status": "approved"}
        base.update(kw)
        return base

    def setUp(self):
        super().setUp()
        self.d = self.job("j")
        touch(os.path.join(self.d, "work", "a.png"))
        touch(os.path.join(self.d, "final", "ملف عربي.png"))
        self.mf = os.path.join(self.d, "DELIVERY.json")

    def raw(self):
        with open(self.mf, "rb") as fh:
            return fh.read().decode("utf-8")

    def test_keeps_other_keys_and_one_space_indent(self):
        original = {"client": "ANVIL", "title": "عنوان", "status": "progress", "items": [{"id": "x", "tags": ["a", "b"]}], "ar": {"title": "ب"}}
        with open(self.mf, "wb") as fh:
            fh.write((json.dumps(original, ensure_ascii=False, indent=1) + "\n").encode("utf-8"))
        res = review.save_decision(self.root, self.payload(note=" جيد "), today="2026-10-17")
        self.assertTrue(res["ok"] and not res["created_manifest"])
        text = self.raw()
        self.assertTrue(text.startswith('{\n "client"'))
        self.assertTrue(text.endswith("}\n"))
        self.assertIn("عنوان", text)
        data = json.loads(text)
        for k, v in original.items():
            self.assertEqual(data[k], v)
        self.assertEqual(data["review"]["work/a.png"], {"status": "approved", "note": "جيد", "date": "2026-10-17", "by": "Ahmed"})
        self.assertEqual(list(data)[:len(original)], list(original))
        # a second decision keeps the first and does not change the indent
        review.save_decision(self.root, self.payload(path="final/ملف عربي.png", status="rejected"), today="2026-10-18")
        text2 = self.raw()
        self.assertTrue(text2.startswith('{\n "client"'))
        rv = json.loads(text2)["review"]
        self.assertEqual(set(rv), {"work/a.png", "final/ملف عربي.png"})
        self.assertEqual(rv["final/ملف عربي.png"]["status"], "rejected")

    def test_two_space_indent_and_no_trailing_newline_preserved(self):
        with open(self.mf, "wb") as fh:
            fh.write(json.dumps({"title": "t"}, indent=2).encode("utf-8"))
        review.save_decision(self.root, self.payload())
        text = self.raw()
        self.assertTrue(text.startswith('{\n  "title"'))
        self.assertFalse(text.endswith("\n"))

    def test_crlf_and_tab_indent_preserved(self):
        with open(self.mf, "wb") as fh:
            fh.write(json.dumps({"title": "t"}, indent="\t").replace("\n", "\r\n").encode("utf-8") + b"\r\n")
        review.save_decision(self.root, self.payload())
        text = self.raw()
        self.assertTrue(text.startswith('{\r\n\t"title"'))
        self.assertTrue(text.endswith("}\r\n"))

    def test_comment_only_keeps_status_and_pending_default(self):
        review.save_decision(self.root, {"brand": "acme", "job": "j", "path": "work/a.png", "note": "غير اللون"})
        self.assertEqual(json.loads(self.raw())["review"]["work/a.png"]["status"], "pending")
        review.save_decision(self.root, self.payload())
        review.save_decision(self.root, {"brand": "acme", "job": "j", "path": "work/a.png", "note": "تمام"})
        e = json.loads(self.raw())["review"]["work/a.png"]
        self.assertEqual((e["status"], e["note"]), ("approved", "تمام"))
        review.save_decision(self.root, self.payload(status="rejected"))
        self.assertEqual(json.loads(self.raw())["review"]["work/a.png"]["note"], "تمام")

    def test_minimal_manifest_created_on_first_decision(self):
        self.assertFalse(os.path.exists(self.mf))
        res = review.save_decision(self.root, self.payload(), today="2026-10-17")
        self.assertTrue(res["created_manifest"])
        data = json.loads(self.raw())
        self.assertEqual(set(data), {"title", "status", "review"})
        self.assertEqual((data["title"], data["status"]), ("j", "progress"))
        self.assertTrue(self.raw().endswith("\n"))

    def test_sync_runs_after_write_and_its_result_is_returned(self):
        calls = []

        def fake(brand):
            calls.append((brand, os.path.exists(self.mf)))
            return {"ok": True, "line": "wrote x (1 jobs)"}
        res = review.save_decision(self.root, self.payload(), sync=fake)
        self.assertEqual(calls, [("acme", True)])
        self.assertEqual(res["sync"]["line"], "wrote x (1 jobs)")

    def test_no_temp_file_left_and_malformed_manifest_untouched(self):
        with open(self.mf, "wb") as fh:
            fh.write(b"{ not json")
        with self.assertRaises(review.BadRequest) as cm:
            review.save_decision(self.root, self.payload())
        self.assertEqual(cm.exception.code, 409)
        self.assertEqual(self.raw(), "{ not json")
        with open(self.mf, "wb") as fh:
            fh.write(b'{"title": "t"}')
        review.save_decision(self.root, self.payload())
        self.assertEqual(sorted(os.listdir(self.d)), ["DELIVERY.json", "final", "work"])

    def test_bad_values_rejected(self):
        for bad in (self.payload(status="deleted"), self.payload(note=5), self.payload(note="x" * 2001),
                    {"brand": "acme", "job": "j", "path": "work/a.png"}, "nope"):
            with self.assertRaises(review.BadRequest):
                review.save_decision(self.root, bad)
        self.assertFalse(os.path.exists(self.mf))


class PathSafety(Base):
    def setUp(self):
        super().setUp()
        self.d = self.job("j")
        touch(os.path.join(self.d, "work", "a.png"))
        touch(os.path.join(self.d, "secret.txt"))
        touch(os.path.join(self.root, "acme", "status.md"))
        touch(os.path.join(self.tmp.name, "outside.png"))
        self.other = self.job("other")
        touch(os.path.join(self.other, "work", "o.png"))

    def rejected(self, **kw):
        base = {"brand": "acme", "job": "j", "path": "work/a.png", "status": "approved"}
        base.update(kw)
        with self.assertRaises(review.BadRequest):
            review.save_decision(self.root, base)

    def test_escape_attempts_rejected_and_nothing_written(self):
        self.rejected(path="../secret.txt")
        self.rejected(path="work/../../j/secret.txt")
        self.rejected(path="/etc/passwd")
        self.rejected(path="C:/Windows/win.ini")
        self.rejected(path="work\\a.png")
        self.rejected(path="secret.txt")                 # inside the job but not work/final/brief
        self.rejected(path="work/missing.png")
        self.rejected(path="../other/work/o.png")
        self.rejected(job="../acme/projects/j")
        self.rejected(job="..")
        self.rejected(job="")
        self.rejected(job="nope")
        self.rejected(brand="../brands")
        self.rejected(brand="ghost")
        self.rejected(path="work")
        self.rejected(path="work/")
        for n in (self.d, self.other, self.p):
            self.assertFalse(os.path.exists(os.path.join(n, "DELIVERY.json")))
        self.assertEqual(os.listdir(self.tmp.name).count("outside.png"), 1)

    def test_content_file_accepts_valid(self):
        self.assertTrue(review.content_file(self.root, "acme", "j", "work/a.png").endswith("a.png"))


class Sections(Base):
    """Round 2: view-only brand sections approved / photos / archive."""

    def setUp(self):
        super().setUp()
        b = os.path.join(self.root, "acme")
        touch(os.path.join(b, "approved", "ASSETS.yaml"))
        touch(os.path.join(b, "approved", "NOTES.md"), "ملاحظات".encode("utf-8"))
        touch(os.path.join(b, "approved", "logo", "mark.png"), mtime=2000)
        touch(os.path.join(b, "approved", "logo", "deep", "mark2.png"), mtime=3000)
        touch(os.path.join(b, "approved", "visual-identity", "guide.md"))
        touch(os.path.join(b, "photos", "bank", "a.jpg"))
        touch(os.path.join(b, "photos", "bank", ".hidden.jpg"))
        touch(os.path.join(b, "photos", "product-master", "p.png"))
        touch(os.path.join(b, "archive", "INBOX_README.md"))
        touch(os.path.join(b, "archive", "handoffs", "h.md"))
        touch(os.path.join(b, "archive", "pilot-001", "x.md"))
        touch(os.path.join(b, "archive", "pilot-001", "run-1", "r.png"))
        touch(os.path.join(b, "archive", "outside", "POINTER.md"))
        touch(os.path.join(b, "archive", "outside", "chatgpt-continuation", "c.txt"))
        touch(os.path.join(b, "archive", "outside", "real-memory-video", "v.mp4"))
        os.makedirs(os.path.join(b, "archive", "outside", "empty-one"))
        self.secret = os.path.join(self.root, "acme", "status.md")
        touch(self.secret)
        touch(os.path.join(self.p, "j", "work", "a.png"))

    def keys(self, section):
        return [e["key"] for e in review.discover_entries(self.root, "acme", section)]

    def test_section_discovery_levels_and_order(self):
        self.assertEqual(self.keys("approved"), ["approved", "approved/logo", "approved/visual-identity"])
        self.assertEqual(self.keys("photos"), ["photos/bank", "photos/product-master"])
        self.assertEqual(self.keys("archive"), [
            "archive", "archive/handoffs",
            "archive/outside", "archive/outside/chatgpt-continuation", "archive/outside/empty-one", "archive/outside/real-memory-video",
            "archive/pilot-001", "archive/pilot-001/run-1"])
        self.assertEqual(self.keys("nope"), [])
        names = {e["key"]: e["name"] for e in review.discover_entries(self.root, "acme", "archive")}
        self.assertEqual(names["archive"], "archive")
        self.assertEqual(names["archive/outside/real-memory-video"], "outside/real-memory-video")
        tree = review.api_tree(self.root)["brands"][0]
        self.assertEqual([s["id"] for s in tree["sections"]], ["approved", "photos", "archive"])
        self.assertEqual([s["label"] for s in tree["sections"]], ["المعتمد", "الصور", "الأرشيف"])
        self.assertEqual([j["job"] for j in tree["jobs"]], ["j"])

    def test_tree_does_not_count_until_asked_then_caches_and_refresh_clears(self):
        review.COUNT_CACHE.clear()
        tree = review.api_tree(self.root)["brands"][0]
        self.assertTrue(all(e["count"] is None for s in tree["sections"] for e in s["entries"]))
        self.assertEqual(review.COUNT_CACHE, {})
        counts = review.api_counts(self.root, "acme", "photos")["counts"]
        self.assertEqual(counts, {"photos/bank": 1, "photos/product-master": 1})   # hidden file skipped
        self.assertEqual(review.api_tree(self.root)["brands"][0]["sections"][1]["entries"][0]["count"], 1)
        self.assertEqual(review.api_counts(self.root, "acme", "approved")["counts"],
                         {"approved": 2, "approved/logo": 2, "approved/visual-identity": 1})   # root = loose files only, logo recursive
        touch(os.path.join(self.root, "acme", "photos", "bank", "new.jpg"))
        self.assertEqual(review.api_counts(self.root, "acme", "photos")["counts"]["photos/bank"], 1)   # cached
        review.api_tree(self.root, refresh=True)
        self.assertEqual(review.api_counts(self.root, "acme", "photos")["counts"]["photos/bank"], 2)
        self.assertEqual(review.api_counts(self.root, "acme", "archive")["counts"]["archive/outside/empty-one"], 0)
        with self.assertRaises(review.BadRequest):
            review.api_counts(self.root, "acme", "projects")

    def test_entry_view_recursive_shallow_and_same_file_model(self):
        e = review.api_entry(self.root, "acme", "approved/logo")
        self.assertTrue(e["view_only"])
        self.assertEqual([f["path"] for f in e["files"]], ["deep/mark2.png", "mark.png"])      # newest first, relative paths
        self.assertEqual({g["dir"] for g in e["groups"]}, {"", "deep"})
        self.assertTrue(all(f["reviewable"] is False and f["decision"] is None for f in e["files"]))
        root_entry = review.api_entry(self.root, "acme", "approved")
        self.assertEqual(sorted(f["path"] for f in root_entry["files"]), ["ASSETS.yaml", "NOTES.md"])  # loose files only
        outside = review.api_entry(self.root, "acme", "archive/outside")
        self.assertEqual([f["path"] for f in outside["files"]], ["POINTER.md"])

    def test_entry_collapse_rule_and_noise(self):
        b = os.path.join(self.root, "acme", "photos", "bank")
        for i in range(41):
            touch(os.path.join(b, "many", f"{i}.jpg"))
        touch(os.path.join(b, "qa", "q.png"))
        groups = {g["dir"]: g for g in review.api_entry(self.root, "acme", "photos/bank")["groups"]}
        self.assertTrue(groups["many"]["collapsed"] and groups["qa"]["collapsed"] and not groups[""]["collapsed"])

    def test_entry_files_served_but_only_inside_entry(self):
        ok = review.entry_file(self.root, "acme", "approved/logo", "deep/mark2.png")
        self.assertTrue(ok.endswith("mark2.png"))
        self.assertTrue(review.entry_file(self.root, "acme", "approved", "NOTES.md").endswith("NOTES.md"))
        for key, rel in (("approved/logo", "../visual-identity/guide.md"), ("approved/logo", "deep"), ("approved", "logo/mark.png"),
                         ("approved/logo", "/etc/passwd"), ("approved/logo", "missing.png"), ("approved/logo", ".x"),
                         ("archive/outside", "chatgpt-continuation/c.txt")):
            with self.assertRaises(review.BadRequest, msg=(key, rel)):
                review.entry_file(self.root, "acme", key, rel)
        for key in ("projects/j", "status.md", "../acme", "approved/../projects", "", "memory", "approved/a/b/c", "approved/missing"):
            with self.assertRaises(review.BadRequest, msg=key):
                review.entry_dir(self.root, "acme", key)
        with self.assertRaises(review.BadRequest):
            review.entry_dir(self.root, "../brands", "approved")
        self.assertEqual(review.api_text(self.root, "acme", None, "NOTES.md", entry="approved")["text"], "ملاحظات")

    def test_view_only_no_decision_on_entries_or_non_job_paths(self):
        before = sorted(os.path.join(dp, f) for dp, _, fs in os.walk(self.root) for f in fs)
        for bad in ({"brand": "acme", "entry": "approved/logo", "path": "mark.png", "status": "approved"},
                    {"brand": "acme", "section": "approved", "job": "logo", "path": "mark.png", "status": "approved"},
                    {"brand": "acme", "job": "../approved/logo", "path": "mark.png", "status": "approved"},
                    {"brand": "acme", "job": "approved/logo", "path": "work/mark.png", "status": "approved"},
                    {"brand": "acme", "job": "j", "path": "../../approved/logo/mark.png", "status": "approved"}):
            with self.assertRaises(review.BadRequest, msg=bad):
                review.save_decision(self.root, bad)
        self.assertEqual(sorted(os.path.join(dp, f) for dp, _, fs in os.walk(self.root) for f in fs), before)

    def test_brand_with_only_sections_is_listed(self):
        os.makedirs(os.path.join(self.root, "solo", "approved"))
        self.assertEqual(review.list_brands(self.root), ["acme", "solo"])


class SyncWorkerTests(unittest.TestCase):
    """Round 4: one debounced background worker (failure matrix: slow, burst, overlap, crash, starvation)."""

    def worker(self, fn, delay=0.2, max_wait=30.0):
        w = review.SyncWorker(fn, delay, max_wait)
        self.addCleanup(w.close)
        return w

    def test_schedule_returns_at_once_and_sync_runs_later(self):
        calls = []
        w = self.worker(lambda b: calls.append(b) or {"ok": True, "line": "done"}, delay=0.3)
        t0 = time.monotonic()
        w.schedule("acme")
        self.assertLess(time.monotonic() - t0, 0.1)
        self.assertEqual(calls, [])
        self.assertTrue(w.status()["busy"])
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(calls, ["acme"])
        self.assertGreaterEqual(time.monotonic() - t0, 0.25)       # debounced: waited for the delay
        self.assertEqual(w.status()["last"]["acme"]["line"], "done")

    def test_burst_of_decisions_is_one_sync(self):
        calls = []
        w = self.worker(lambda b: calls.append(b) or {"ok": True, "line": ""}, delay=0.3)
        for _ in range(5):
            w.schedule("acme")
            time.sleep(0.05)
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(calls, ["acme"])

    def test_decision_during_a_running_sync_queues_one_more_never_two_at_once(self):
        active, peak, calls = [0], [0], []
        started, release = threading.Event(), threading.Event()

        def slow(b):
            active[0] += 1
            peak[0] = max(peak[0], active[0])
            calls.append(b)
            started.set()
            release.wait(5)
            active[0] -= 1
            return {"ok": True, "line": ""}
        w = self.worker(slow, delay=0.05)
        w.schedule("acme")
        self.assertTrue(started.wait(5))
        w.schedule("acme")
        w.schedule("acme")
        w.schedule("other")
        time.sleep(0.3)
        self.assertEqual(calls, ["acme"])                  # still the first run: nothing overlaps
        release.set()
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(sorted(calls), ["acme", "acme", "other"])
        self.assertEqual(peak[0], 1)

    def test_failed_and_crashing_sync_is_kept_visible_and_the_worker_survives(self):
        results = [RuntimeError("boom"), {"ok": False, "line": "job_check FAIL"}, {"ok": True, "line": "fine"}]

        def flaky(b):
            r = results.pop(0)
            if isinstance(r, Exception):
                raise r
            return r
        w = self.worker(flaky, delay=0.02)
        w.schedule("acme")
        self.assertTrue(w.wait_idle(5))
        st = w.status()["last"]["acme"]
        self.assertFalse(st["ok"])
        self.assertIn("boom", st["line"])
        w.schedule("acme")
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(w.status()["last"]["acme"]["line"], "job_check FAIL")
        w.schedule("acme")
        self.assertTrue(w.wait_idle(5))
        self.assertTrue(w.status()["last"]["acme"]["ok"])

    def test_steady_clicking_cannot_postpone_the_sync_forever(self):
        calls = []
        w = self.worker(lambda b: calls.append(time.monotonic()) or {"ok": True, "line": ""}, delay=0.3, max_wait=0.5)
        t0 = time.monotonic()
        while time.monotonic() - t0 < 1.4:
            w.schedule("acme")
            time.sleep(0.1)
        self.assertGreaterEqual(len(calls), 1)
        self.assertLess(calls[0] - t0, 1.0)                # ran during the burst, not after it
        w.wait_idle(5)


class Round4Files(Base):
    def test_noise_files_and_dirs_never_listed_or_counted(self):
        d = self.job("j")
        for n in ("a.png", "desktop.ini", ".DS_Store", "Thumbs.db", "ehthumbs.db", "~$lock.docx", "x.tmp", "m.pyc"):
            touch(os.path.join(d, "work", n))
        for sub in ("cache", "thumbnails", "__thumbs__", "node_modules", "__pycache__"):
            touch(os.path.join(d, "work", sub, "t.png"))
        self.assertEqual([f["path"] for f in review.scan_files(d)], ["work/a.png"])
        b = os.path.join(self.root, "acme")
        for n in ("a.png", "desktop.ini", "Thumbs.db", "~$x.docx"):
            touch(os.path.join(b, "photos", "bank", n))
        touch(os.path.join(b, "photos", "bank", "cache", "c.png"))
        touch(os.path.join(b, "photos", "bank", "sub", "s.png"))
        self.assertEqual(review.count_files(os.path.join(b, "photos", "bank")), 2)
        self.assertEqual(sorted(f["path"] for f in review.api_entry(self.root, "acme", "photos/bank")["files"]), ["a.png", "sub/s.png"])

    def test_other_kinds_have_no_decision_and_are_not_pending(self):
        d = self.job("j")
        for n in ("a.png", "tool.py", "data.json", "f.ttf", "m.cjs", "c.jsx", "p.aep", "t.csv", "copy.md"):
            touch(os.path.join(d, "work", n))
        files = {f["name"]: f for f in review.api_job(self.root, "acme", "j")["files"]}
        for n in ("tool.py", "data.json", "f.ttf", "m.cjs", "c.jsx", "p.aep", "t.csv"):
            self.assertEqual((files[n]["kind"], files[n]["reviewable"]), ("other", False), n)
        self.assertEqual(review.job_summary(d)[0]["pending"], 2)       # a.png + copy.md only

    def test_text_preview_limit(self):
        d = self.job("j")
        touch(os.path.join(d, "work", "long.md"), ("# عنوان\n" + "س" * 3000).encode("utf-8"))
        full = review.api_text(self.root, "acme", "j", "work/long.md")
        small = review.api_text(self.root, "acme", "j", "work/long.md", limit="900")
        self.assertEqual((len(small["text"]), small["truncated"]), (900, True))
        self.assertTrue(small["text"].startswith("# عنوان"))
        self.assertGreater(len(full["text"]), 3000)
        with self.assertRaises(review.BadRequest):
            review.api_text(self.root, "acme", "j", "work/long.md", limit="abc")


class HttpBase(Base):
    def setUp(self):
        super().setUp()
        d = self.job("camp")
        touch(os.path.join(d, "work", "a.png"), b"0123456789")
        touch(os.path.join(d, "work", "copy.md"), "مرحبا hello".encode("utf-8"))
        touch(os.path.join(d, "work", "v.mp4"), bytes(range(100)))
        self.synced = []
        self.gate = threading.Event()
        self.gate.set()                       # tests clear it to hold the background sync
        self.srv = review.Board(("127.0.0.1", 0), self.root, self.fake_sync, delay=0.2)
        self.port = self.srv.server_port
        t = threading.Thread(target=self.srv.serve_forever, daemon=True)
        t.start()
        self.addCleanup(lambda: (self.srv.shutdown(), self.srv.server_close()))
        self.base = f"http://127.0.0.1:{self.port}"

    def fake_sync(self, brand):
        self.gate.wait(10)
        self.synced.append(brand)
        return {"ok": True, "line": "stub"}

    def get(self, path, headers=None):
        req = urllib.request.Request(self.base + path, headers=headers or {})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            with e:
                return e.code, e.read(), e.headers

    def post(self, body, headers=None):
        h = {"Content-Type": "application/json"}
        h.update(headers or {})
        req = urllib.request.Request(self.base + "/api/decision", data=json.dumps(body).encode(), headers=h, method="POST")
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            with e:
                return e.code, json.loads(e.read())


class Http(HttpBase):
    def test_page_tree_job_text_and_range(self):
        st, body, _ = self.get("/")
        self.assertEqual(st, 200)
        self.assertIn("لوحة المراجعة".encode("utf-8"), body)
        tree = json.loads(self.get("/api/tree")[1])
        self.assertEqual(tree["brands"][0]["jobs"][0]["job"], "camp")
        self.assertEqual(tree["brands"][0]["jobs"][0]["pending"], 3)
        job = json.loads(self.get("/api/job?brand=acme&job=camp")[1])
        self.assertEqual(len(job["files"]), 3)
        txt = json.loads(self.get("/api/text?brand=acme&job=camp&path=work/copy.md")[1])
        self.assertEqual(txt["text"], "مرحبا hello")
        st, body, hdr = self.get("/file?brand=acme&job=camp&path=work/v.mp4", {"Range": "bytes=10-19"})
        self.assertEqual((st, body, hdr["Content-Range"]), (206, bytes(range(10, 20)), "bytes 10-19/100"))
        self.assertEqual(self.get("/file?brand=acme&job=camp&path=work/v.mp4", {"Range": "bytes=-5"})[1], bytes(range(95, 100)))
        self.assertEqual(self.get("/file?brand=acme&job=camp&path=../x")[0], 400)
        self.assertEqual(self.get("/file?brand=acme&job=camp&path=work/none.png")[0], 404)

    def test_post_writes_and_hostile_requests_refused(self):
        st, res = self.post({"brand": "acme", "job": "camp", "path": "work/a.png", "status": "approved", "note": "ok"})
        self.assertEqual((st, res["ok"], res["sync"]["queued"]), (200, True, True))
        self.assertTrue(self.srv.syncer.wait_idle(5))
        self.assertEqual(self.synced, ["acme"])
        job = json.loads(self.get("/api/job?brand=acme&job=camp")[1])
        dec = {f["path"]: f["decision"] for f in job["files"]}
        self.assertEqual(dec["work/a.png"]["status"], "approved")
        self.assertEqual(self.post({"brand": "acme", "job": "camp", "path": "../x", "status": "approved"})[0], 400)
        self.assertEqual(self.post({"brand": "acme", "job": "camp", "path": "work/a.png", "status": "approved"},
                                   {"Origin": "http://evil.example"})[0], 403)
        req = urllib.request.Request(self.base + "/api/decision", data=b"{}", headers={"Content-Type": "text/plain"}, method="POST")
        with self.assertRaises(urllib.error.HTTPError) as cm:
            urllib.request.urlopen(req)
        cm.exception.close()
        self.assertEqual(cm.exception.code, 415)
        req = urllib.request.Request(self.base + "/api/tree", headers={"Host": "evil.example"})
        with self.assertRaises(urllib.error.HTTPError) as cm:
            urllib.request.urlopen(req)
        cm.exception.close()
        self.assertEqual(cm.exception.code, 403)

    def test_entry_endpoints_and_post_refused_over_http(self):
        touch(os.path.join(self.root, "acme", "approved", "logo", "mark.png"), b"PNGDATA")
        touch(os.path.join(self.root, "acme", "approved", "logo", "note.md"), "شعار".encode("utf-8"))
        tree = json.loads(self.get("/api/tree")[1])["brands"][0]
        self.assertEqual([s["id"] for s in tree["sections"]], ["approved", "photos", "archive"])
        self.assertEqual(tree["sections"][0]["entries"][0]["key"], "approved/logo")
        self.assertEqual(json.loads(self.get("/api/counts?brand=acme&section=approved")[1])["counts"], {"approved/logo": 2})
        ent = json.loads(self.get("/api/entry?brand=acme&entry=approved/logo")[1])
        self.assertEqual(len(ent["files"]), 2)
        self.assertEqual(self.get("/file?brand=acme&entry=approved/logo&path=mark.png")[1], b"PNGDATA")
        self.assertEqual(json.loads(self.get("/api/text?brand=acme&entry=approved/logo&path=note.md")[1])["text"], "شعار")
        self.assertEqual(self.get("/file?brand=acme&entry=approved/logo&path=../../projects/camp/work/a.png")[0], 400)
        self.assertEqual(self.get("/api/entry?brand=acme&entry=projects/camp")[0], 404)
        st, res = self.post({"brand": "acme", "entry": "approved/logo", "path": "mark.png", "status": "approved"})
        self.assertEqual(st, 403)
        self.assertIn("view-only", res["error"])
        st, _ = self.post({"brand": "acme", "job": "approved/logo", "path": "work/mark.png", "status": "approved"})
        self.assertEqual(st, 404)
        self.assertEqual(self.synced, [])
        self.assertFalse(os.path.exists(os.path.join(self.root, "acme", "approved", "logo", "DELIVERY.json")))

    def test_decision_answers_before_the_sync_and_two_quick_decisions_sync_once(self):
        self.gate.clear()                                  # the sync cannot finish until released
        t0 = time.monotonic()
        st1, r1 = self.post({"brand": "acme", "job": "camp", "path": "work/a.png", "status": "approved"})
        st2, r2 = self.post({"brand": "acme", "job": "camp", "path": "work/copy.md", "status": "rejected", "note": "x"})
        took = time.monotonic() - t0
        self.assertEqual((st1, st2), (200, 200))
        self.assertLess(took, 0.5)
        self.assertEqual(self.synced, [])                  # nothing synced yet
        job = json.loads(self.get("/api/job?brand=acme&job=camp")[1])   # both decisions are already on disk
        self.assertEqual({f["path"]: f["decision"]["status"] for f in job["files"] if f["decision"]},
                         {"work/a.png": "approved", "work/copy.md": "rejected"})
        st = json.loads(self.get("/api/sync")[1])
        self.assertTrue(st["busy"])
        self.gate.set()
        self.assertTrue(self.srv.syncer.wait_idle(5))
        self.assertEqual(self.synced, ["acme"])            # one sync for the two decisions
        last = json.loads(self.get("/api/sync")[1])
        self.assertFalse(last["busy"])
        self.assertEqual(last["last"]["acme"]["ok"], True)

    def test_server_binds_loopback_only(self):
        self.assertEqual(self.srv.server_address[0], "127.0.0.1")


class TextTabs(Base):
    """Round 5: .md/.txt split into copy / plan / notes by file name and folder."""

    COPY = ["03_COPY.md", "COPY.md", "COPY_REVEAL.md", "COPY_DECK.md",
            "caption-v01.txt", "BEAT_SHEET.md", "voiceover_script.md", "hashtags.txt", "BIO.md", "Instagram_Bio.txt"]
    PLAN = ["strategy.md", "CONTENT_STRATEGY.md", "content-calendar.md", "MEASUREMENT_PLAN.md", "creative_brief.md",
            "SHOT_LIST.md", "look_direction.md", "SCORECARD.md", "week-plan.md"]
    NOTES = ["03b_PILOT_COPY_REVIEW.md", "CLIENT_COPY.md", "CLIENT_COPY_AR.md", "README.md", "project.md", "scope.md", "REPORT.md", "RESULT.md", "REVIEW.md",
             "GATE_REVIEW.md", "08_LEAD_CHECKPOINT.md", "DECISIONS.md", "QA.md", "copy_qa.md", "COPY_REQUEST.md",
             "RUN_LOG.md", "HANDOVER.md", "INDEX.md", "RECIPE.md", "RUN_ME.md", "DIFF.md", "GEM-004-request.md",
             "ANTIGRAVITY_HANDOFF.md", "source_ref.txt", "transcript.txt", "description.md", "explanation.md",
             "logo_notes.md", "unknown-thing.md"]

    def test_copy_names(self):
        for n in self.COPY:
            self.assertEqual(review.tab_of(n, "work"), "copy", n)

    def test_plan_names(self):
        for n in self.PLAN:
            self.assertEqual(review.tab_of(n, "work"), "plan", n)

    def test_notes_names_and_unknown_default(self):
        for n in self.NOTES:
            self.assertEqual(review.tab_of(n, "work"), "notes", n)

    def test_case_insensitive_on_the_base_name_only(self):
        self.assertEqual(review.tab_of("Caption-V01.TXT", "work"), "copy")
        self.assertEqual(review.tab_of("notes.md", "work/copy_ideas"), "notes")   # folder must be named exactly copy/captions

    def test_folder_rule_and_except_list(self):
        self.assertEqual(review.tab_of("post-01.md", "work/copy"), "copy")
        self.assertEqual(review.tab_of("Post.txt", "final/captions/week1"), "copy")
        self.assertEqual(review.tab_of("QA.md", "work/copy"), "notes")             # EXCEPT wins over the folder
        self.assertEqual(review.tab_of("checkpoint-plan.md", "work"), "notes")     # EXCEPT wins over plan
        self.assertEqual(review.tab_of("log.md", "work/captions"), "notes")

    def test_job_brief_is_a_plan_only_at_the_job_root(self):
        self.assertEqual(review.tab_of("brief.md", "", True), "plan")
        self.assertEqual(review.tab_of("00_BRIEF.md", "", True), "plan")
        self.assertEqual(review.tab_of("project.md", "", True), "notes")
        self.assertEqual(review.tab_of("brief.md", "work"), "notes")

    def test_non_text_tabs(self):
        self.assertEqual([review.tab_of(n) for n in ("a.png", "b.mp4", "c.psd", "d")], ["image", "video", "other", "other"])
        self.assertEqual(review.tab_of("copy.png", "work/copy"), "image")

    def test_scan_marks_reviewable_only_for_copy_plan_and_media(self):
        d = self.job("jt")
        touch(os.path.join(d, "brief.md"))
        touch(os.path.join(d, "project.md"))
        touch(os.path.join(d, "work", "03_COPY.md"))
        touch(os.path.join(d, "work", "strategy.md"))
        touch(os.path.join(d, "work", "08_LEAD_CHECKPOINT.md"))
        touch(os.path.join(d, "work", "a.png"))
        touch(os.path.join(d, "work", "qa", "COPY_x.md"))        # noise folder: never reviewable
        files = review.scan_files(d)
        groups = review.build_groups(files)
        by = {f["path"]: (f["tab"], f["reviewable"]) for f in files}
        self.assertEqual(by, {"brief.md": ("plan", True), "project.md": ("notes", False),
                              "work/03_COPY.md": ("copy", True), "work/strategy.md": ("plan", True),
                              "work/08_LEAD_CHECKPOINT.md": ("notes", False), "work/a.png": ("image", True),
                              "work/qa/COPY_x.md": ("copy", False)})
        self.assertEqual(review.job_summary(d)[0]["pending"], 4)   # brief, copy, strategy, png

    def test_old_decision_on_a_notes_file_is_kept_but_not_pending(self):
        d = self.job("jn")
        touch(os.path.join(d, "work", "REVIEW.md"))
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"review": {"work/REVIEW.md": {"status": "approved", "note": "n"}}}).encode())
        summ = review.job_summary(d)[0]
        self.assertEqual((summ["pending"], summ["approved"], summ["rejected"]), (0, 0, 0))
        self.assertEqual(review.read_review(d)[0]["work/REVIEW.md"]["status"], "approved")   # still saved

    def test_view_only_entries_get_tabs_but_no_decisions(self):
        e = os.path.join(self.root, "acme", "approved", "pack")
        touch(os.path.join(e, "COPY.md"))
        touch(os.path.join(e, "README.md"))
        f = {x["name"]: x for x in review.api_entry(self.root, "acme", "approved/pack")["files"]}
        self.assertEqual((f["COPY.md"]["tab"], f["README.md"]["tab"]), ("copy", "notes"))
        self.assertFalse(f["COPY.md"]["reviewable"])


COPY03 = """# ANVIL — خطة النصوص الفعلية

DRAFT / NOT_READY. Skills used: TSST-LENS-SK-005 / 006. مراجعة مصرية بشرية PENDING.

## بنك افتتاحيات SK-011

جدول الافتتاحيات.

## W1-M01 — ربط الاسمين

**Facebook — إشعار مقترح للتثبيت:**

Shark X Store بقى ANVIL SUPPS.

**ملاحظة داخلية زمنية:** هذه النسخة قبل تغيير الاسم.

**Instagram — كابشن:**

اسم جديد #ANVIL

**نص البطاقات:** ١ ثلاثة أسطر

**Gloss:** Shark becoming ANVIL. Reuse map: 03b.

## W1-M02 — دور المتجر

**LinkedIn:**

نص لينكدإن.

## W1-M02 — دور المتجر

مكرر.

## الإثبات والاختبار وQA

فحص داخلي.
"""

REVEAL = """# SV-05 ANVIL SUPPS · Post 2 · caption copy
Agent: LENS_AG | Team: marketing | Date: 2026-10-09
Skills: TSST-LENS-SK-012 (register)
Source: STATE.md

## 1. Main caption (Arabic) - 2 options

### Option A (pick)
مرحلة جديدة بتتشكّل.

#ANVIL_SUPPS #Shark

### Option B (more formal)
8 سنين من دعمكم.

### Pick and why
Option A. It opens on the beat.

## 2. Short version (TikTok / Stories)
نص قصير.

## 4. Policy check vs the ad policy
- ok

## 6. Bidi risks
- flag
"""


class Round6Posts(Base):
    def test_03_copy_shape_cards_chips_internal_and_details(self):
        doc = review.parse_doc(COPY03, "03_COPY.md")
        self.assertEqual(doc["title"], "ANVIL — خطة النصوص الفعلية")
        titles = [c["title"] for c in doc["cards"]]
        self.assertEqual(titles, ["بنك افتتاحيات SK-011", "W1-M01 — ربط الاسمين", "W1-M02 — دور المتجر", "W1-M02 — دور المتجر"])
        self.assertEqual([i["title"] for i in doc["internal"]], ["الإثبات والاختبار وQA"])
        m1 = doc["cards"][1]
        self.assertEqual(m1["chips"], ["Facebook", "Instagram", "نص البطاقات"])
        self.assertEqual([n["label"] for n in m1["notes"]], ["ملاحظة داخلية زمنية"])      # internal label -> collapsed note
        self.assertEqual(m1["segments"][0]["sub"], "إشعار مقترح للتثبيت")
        blob = " ".join(s["md"] for c in doc["cards"] for s in c["segments"])
        for bad in ("DRAFT", "Skills used", "Reuse map", "Gloss"):
            self.assertNotIn(bad, blob)                                                   # metadata never in a card
        details = " ".join(doc["details"])
        self.assertIn("Skills used", details)
        self.assertIn("Reuse map", details)

    def test_reveal_shape_h3_cards_and_internal_sections(self):
        doc = review.parse_doc(REVEAL, "COPY_REVEAL.md")
        self.assertEqual([c["title"] for c in doc["cards"]],
                         ["Option A (pick)", "Option B (more formal)", "2. Short version (TikTok / Stories)"])
        self.assertEqual(doc["cards"][0]["parent"], "1. Main caption (Arabic) - 2 options")
        self.assertEqual(len(doc["internal"]), 3)                  # Pick and why, Policy check, Bidi risks
        self.assertTrue(any(l.startswith("Agent:") for l in doc["details"]))
        self.assertTrue(any(l.startswith("Source:") for l in doc["details"]))
        self.assertIn("#ANVIL_SUPPS", doc["cards"][0]["segments"][0]["md"])           # hashtags stay text (chips drawn by the page)

    def test_anchors_stable_and_unique(self):
        a = review.parse_doc(COPY03, "x.md")
        b = review.parse_doc(COPY03, "x.md")
        anchors = [c["anchor"] for c in a["cards"]]
        self.assertEqual(anchors, [c["anchor"] for c in b["cards"]])
        self.assertEqual(len(set(anchors)), len(anchors))
        self.assertEqual(anchors[1], "w1-m01-ربط-الاسمين")
        self.assertEqual(anchors[2:], ["w1-m02-دور-المتجر", "w1-m02-دور-المتجر-2"])
        self.assertEqual(review.slugify("Hello, World *X*"), "hello-world-x")

    def test_no_h2_file_is_one_card_keyed_by_path(self):
        d = self.job("jp")
        touch(os.path.join(d, "work", "caption-v01.txt"), "سطر\nتاني".encode("utf-8"))
        touch(os.path.join(d, "work", "COPY.md"), COPY03.encode("utf-8"))
        files = {f["name"]: f for f in review.api_job(self.root, "acme", "jp")["files"]}
        self.assertEqual([c["key"] for c in files["caption-v01.txt"]["doc"]["cards"]], ["work/caption-v01.txt"])
        self.assertEqual(files["COPY.md"]["doc"]["cards"][1]["key"], "work/COPY.md#w1-m01-ربط-الاسمين")

    def test_card_decision_saved_by_key_and_unknown_anchor_refused(self):
        d = self.job("jd")
        touch(os.path.join(d, "work", "COPY.md"), COPY03.encode("utf-8"))
        key = "work/COPY.md#w1-m01-ربط-الاسمين"
        r = review.save_decision(self.root, {"brand": "acme", "job": "jd", "path": key, "status": "approved"}, today="2026-10-17")
        self.assertEqual(r["entry"]["status"], "approved")
        self.assertEqual(review.read_review(d)[0][key]["status"], "approved")
        for bad in ("work/COPY.md#nope", "work/COPY.md#", "work/a.png#x", "../x.md#a"):
            with self.assertRaises(review.BadRequest, msg=bad):
                review.save_decision(self.root, {"brand": "acme", "job": "jd", "path": bad, "status": "approved"})
        # a card inside the internal box has no decision
        with self.assertRaises(review.BadRequest):
            review.save_decision(self.root, {"brand": "acme", "job": "jd", "path": "work/COPY.md#الإثبات-والاختبار-وqa", "status": "approved"})

    def test_whole_file_decision_still_shows_and_cards_inherit_it(self):
        d = self.job("jl")
        touch(os.path.join(d, "work", "COPY.md"), COPY03.encode("utf-8"))
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"review": {"work/COPY.md": {"status": "approved"}}}).encode())
        job = review.api_job(self.root, "acme", "jl")
        self.assertEqual(job["review"]["work/COPY.md"]["status"], "approved")            # whole-file key still returned
        self.assertTrue(all(u["status"] == "approved" and u["inherited"] for u in job["units"]))
        self.assertEqual(review.job_summary(d)[0]["pending"], 0)
        key = "work/COPY.md#w1-m01-ربط-الاسمين"
        review.save_decision(self.root, {"brand": "acme", "job": "jl", "path": key, "status": "rejected"})
        st = {u["key"]: u["status"] for u in review.api_job(self.root, "acme", "jl")["units"]}
        self.assertEqual(st[key], "rejected")
        self.assertEqual(st["work/COPY.md#w1-m02-دور-المتجر"], "approved")

    def test_batch_decision_is_one_write(self):
        d = self.job("jb")
        for n in ("a", "b", "c"):
            touch(os.path.join(d, "work", n + ".png"))
        r = review.save_decision(self.root, {"brand": "acme", "job": "jb", "paths": ["work/a.png", "work/b.png", "work/a.png"], "status": "rejected"})
        self.assertEqual(sorted(r["entries"]), ["work/a.png", "work/b.png"])
        self.assertEqual(review.job_summary(d)[0]["rejected"], 2)
        with self.assertRaises(review.BadRequest):
            review.save_decision(self.root, {"brand": "acme", "job": "jb", "paths": ["work/a.png", "../x"], "status": "approved"})
        self.assertEqual(review.job_summary(d)[0]["approved"], 0)                          # nothing half-applied


class Round6Groups(Base):
    def test_group_key_two_levels_and_final_is_one_group(self):
        self.assertEqual(review.group_key("work/external/round-02/outputs", 3), "work/external/round-02")
        self.assertEqual(review.group_key("work/a", 3), "work/a")
        self.assertEqual(review.group_key("final/x/y", 1), "final")
        self.assertEqual(review.group_key("work/a/b/c/rejected/d", 3), "work/a/b/c/rejected")     # zone deeper than the cut keeps its own group
        d = self.job("jg")
        for i in range(50):
            touch(os.path.join(d, "work", "external", "round-02", f"out{i % 7}", f"{i}.png"))
        touch(os.path.join(d, "final", "deep", "x.png"))
        touch(os.path.join(d, "final", "y.png"))
        files = review.scan_files(d)
        groups = review.build_groups(files)
        self.assertEqual(sorted(g["dir"] for g in groups), ["final", "work/external/round-02"])
        f = [x for x in files if x["path"].endswith("out3/3.png")][0]
        self.assertEqual((f["gkey"], f["sub"]), ("work/external/round-02", "out3"))

    def test_rejected_folders_not_reviewable_shown_last(self):
        d = self.job("jr")
        touch(os.path.join(d, "work", "ok", "a.png"), mtime=1000)
        for z in ("rejected", "old", "archive", "superseded", "unused", "trash"):
            touch(os.path.join(d, "work", "p", z, "z.png"), mtime=9000)
        touch(os.path.join(d, "work", "p", "plates", "b.png"), mtime=2000)
        files = review.scan_files(d)
        groups = review.build_groups(files)
        self.assertEqual([g["zone"] for g in groups][-6:], ["old"] * 6)
        self.assertTrue(all(g["collapsed"] for g in groups if g["zone"] == "old"))
        by = {f["path"]: f["reviewable"] for f in files}
        self.assertTrue(by["work/ok/a.png"] and by["work/p/plates/b.png"])
        self.assertFalse(any(v for k, v in by.items() if "/rejected/" in k or "/trash/" in k or "/old/" in k))
        self.assertEqual(review.job_summary(d)[0]["pending"], 2)

    def test_qa_media_goes_to_notes_refs_stay_images_view_only_last(self):
        d = self.job("jq")
        touch(os.path.join(d, "work", "a.png"))
        for q in ("qa", "_qa", "observations", "inspection_crops", "contact_sheets", "thumbs", "_catalog", "scripts"):
            touch(os.path.join(d, "work", "x", q, "s.png"))
            touch(os.path.join(d, "work", "x", q, "v.mp4"))
        touch(os.path.join(d, "work", "refs", "r.png"))
        files = {f["path"]: f for f in review.scan_files(d)}
        groups = review.build_groups(list(files.values()))
        self.assertEqual({f["tab"] for p, f in files.items() if "/x/" in p}, {"notes"})
        self.assertEqual(files["work/a.png"]["tab"], "image")
        r = files["work/refs/r.png"]
        self.assertEqual((r["tab"], r["reviewable"], r["zone"]), ("image", False, "ref"))
        self.assertEqual(review.job_summary(d)[0]["pending"], 1)
        self.assertEqual(groups[1]["zone"], "ref")                                          # right after the normal group

    def test_client_copy_is_notes(self):
        for n in ("CLIENT_COPY.md", "CLIENT_COPY_AR.md", "client_copy.md"):
            self.assertEqual(review.tab_of(n, "work/copy"), "notes", n)
        self.assertEqual(review.tab_of("COPY.md", "work/copy"), "copy")

    def test_default_tab_rule(self):
        T = lambda **kw: {t: {"files": kw.get(t, (0, 0))[0], "pending": kw.get(t, (0, 0))[1]} for t in review.TAB_ORDER}
        self.assertEqual(review.default_tab(T(image=(5, 0), copy=(3, 2), plan=(1, 1))), "copy")       # first tab WITH pending
        self.assertEqual(review.default_tab(T(image=(5, 0), copy=(3, 0), notes=(2, 0))), "image")      # else first non-empty
        self.assertEqual(review.default_tab(T(video=(1, 0), notes=(9, 0))), "video")
        self.assertEqual(review.default_tab(T(notes=(2, 0), other=(1, 0))), "notes")
        d = self.job("jt")
        touch(os.path.join(d, "work", "a.png"))
        touch(os.path.join(d, "work", "COPY.md"), COPY03.encode("utf-8"))
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"review": {"work/a.png": {"status": "approved"}}}).encode())
        job = review.api_job(self.root, "acme", "jt")
        self.assertEqual(job["default_tab"], "copy")
        self.assertEqual(job["tabs"]["image"]["pending"], 0)

    def test_titles_slug_brand_name(self):
        d = self.job("kitchen-campaign-01")
        self.assertEqual(review.job_title(d, "kitchen-campaign-01"), "Kitchen Campaign 01")
        touch(os.path.join(d, "brief.md"), "# حملة المطابخ\nنص".encode("utf-8"))
        self.assertEqual(review.job_title(d, "k"), "حملة المطابخ")
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"title": "Kitchen Concepts"}).encode())
        self.assertEqual(review.job_title(d, "k"), "Kitchen Concepts")
        touch(os.path.join(d, "DELIVERY.json"), json.dumps({"title": "Kitchen Concepts", "ar": {"title": "تجارب المطابخ"}}).encode())
        self.assertEqual(review.job_title(d, "k"), "تجارب المطابخ")
        tree = review.api_tree(self.root)
        self.assertEqual(tree["brands"][0]["jobs"][0]["title"], "تجارب المطابخ")
        pf = os.path.join(self.tmp.name, "portfolio.yaml")
        with open(pf, "w", encoding="utf-8") as fh:
            fh.write("brands:\n  acme:\n    name: Acme Foods  # c\n    kind: client\n  other:\n    name: Other\n")
        old = review.PORTFOLIO
        review.PORTFOLIO = pf
        self.addCleanup(lambda: setattr(review, "PORTFOLIO", old))
        review._PORTFOLIO_CACHE.clear()
        self.assertEqual((review.brand_name("acme"), review.brand_name("other"), review.brand_name("zzz")), ("Acme Foods", "Other", "zzz"))


class Round6Worker(unittest.TestCase):
    def test_worker_builds_touched_jobs_then_syncs(self):
        order = []
        w = review.SyncWorker(lambda b: order.append(("sync", b)) or {"ok": True, "line": "synced"}, 0.1, 5,
                              build=lambda b, j: order.append(("build", b, j)) or {"ok": True, "line": "built"})
        self.addCleanup(w.close)
        w.schedule("acme", "j1")
        w.schedule("acme", "j2")
        w.schedule("acme", "j1")
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(order, [("build", "acme", "j1"), ("build", "acme", "j2"), ("sync", "acme")])
        w.schedule("acme", "j3")
        self.assertTrue(w.wait_idle(5))
        self.assertEqual(order[3:], [("build", "acme", "j3"), ("sync", "acme")])          # jobs are not remembered between runs

    def test_failed_build_is_reported_and_sync_still_runs(self):
        calls = []
        w = review.SyncWorker(lambda b: calls.append("sync") or {"ok": True, "line": "synced"}, 0.05, 5,
                              build=lambda b, j: {"ok": False, "line": "j1: LEAK x"})
        self.addCleanup(w.close)
        w.schedule("acme", "j1")
        self.assertTrue(w.wait_idle(5))
        last = w.status()["last"]["acme"]
        self.assertEqual((calls, last["ok"]), (["sync"], False))
        self.assertIn("LEAK", last["line"])

    def test_run_build_only_for_jobs_with_a_page(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = os.path.join(tmp.name, "brands")
        for j, page in (("with", True), ("without", False)):
            touch(os.path.join(root, "acme", "projects", j, "DELIVERY.json"), b"{}")
            if page:
                touch(os.path.join(root, "acme", "projects", j, "DELIVERY.html"))
        ran = []

        class P:
            returncode, stdout, stderr = 0, "built x\nleak scan: clean\n", ""
        run = lambda cmd, **kw: ran.append(cmd) or P()
        self.assertTrue(review.run_build(root, "acme", "without", runner=run)["skipped"])
        self.assertEqual(ran, [])
        r = review.run_build(root, "acme", "with", runner=run)
        self.assertTrue(r["ok"])
        self.assertEqual(len(ran), 1)
        self.assertTrue(ran[0][1].endswith("build_delivery.py") and ran[0][2].endswith("with"))
        self.assertNotIn("--audience", ran[0])                                              # default = both audiences

        class Bad:
            returncode, stdout, stderr = 1, "built\n  leak scan: LEAK ['x']\n", ""
        r = review.run_build(root, "acme", "with", runner=lambda cmd, **kw: Bad())
        self.assertFalse(r["ok"])
        self.assertIn("LEAK", r["line"])


class Round6Http(Http):
    def test_fonts_and_assets_whitelist_and_traversal(self):
        st, body, hd = self.get("/fonts/Poppins-Regular.ttf")
        self.assertEqual(st, 200)
        self.assertGreater(len(body), 1000)
        self.assertEqual(self.get("/assets/mark_white_96.png")[0], 200)
        for bad in ("/fonts/..%2fbuild_delivery.py", "/fonts/../build_delivery.py", "/fonts/%2e%2e/x.ttf", "/fonts/OFL-IBMPlexSansArabic.txt",
                    "/fonts/nope.ttf", "/fonts/", "/fonts/..%5cbuild_delivery.py", "/assets/..%2fbuild_delivery.py",
                    "/assets/mark_lavender_196.png", "/assets/"):
            self.assertEqual(self.get(bad)[0], 404, bad)

    def test_thumb_cache_lives_outside_root_and_falls_back(self):
        if review.Image is None:
            self.skipTest("Pillow not installed")
        from PIL import Image
        import io
        d = os.path.join(self.p, "camp", "work")
        big = os.path.join(d, "big.png")
        Image.new("RGB", (1200, 800), (200, 30, 30)).save(big)
        cache = os.path.join(self.tmp.name, "cache")
        os.environ["TSST_REVIEW_CACHE"] = cache
        self.addCleanup(lambda: os.environ.pop("TSST_REVIEW_CACHE", None))
        before = sorted(os.listdir(d))
        st, body, hd = self.get("/thumb?brand=acme&job=camp&path=work/big.png&w=300")
        self.assertEqual((st, hd["Content-Type"]), (200, "image/jpeg"))
        self.assertEqual(max(Image.open(io.BytesIO(body)).size), 300)
        self.assertEqual(len(os.listdir(cache)), 1)                                          # cached once, keyed by path+mtime+size+w
        self.get("/thumb?brand=acme&job=camp&path=work/big.png&w=300")
        self.assertEqual(len(os.listdir(cache)), 1)
        self.get("/thumb?brand=acme&job=camp&path=work/big.png&w=200")
        self.assertEqual(len(os.listdir(cache)), 2)
        self.assertEqual(sorted(os.listdir(d)), before)                                      # nothing written inside the client folders
        # a cache dir inside the root is refused: the original is served and nothing is written
        inside_cache = os.path.join(self.root, "acme", "cachehere")
        os.environ["TSST_REVIEW_CACHE"] = inside_cache
        st, body, hd = self.get("/thumb?brand=acme&job=camp&path=work/big.png&w=300")
        self.assertEqual((st, len(body)), (200, os.path.getsize(big)))
        self.assertFalse(os.path.exists(inside_cache))
        # tiny image, bad width, non-image, escape
        self.assertEqual(self.get("/thumb?brand=acme&job=camp&path=work/a.png&w=300")[0], 200)
        self.assertEqual(self.get("/thumb?brand=acme&job=camp&path=work/big.png&w=abc")[0], 400)
        self.assertEqual(self.get("/thumb?brand=acme&job=camp&path=work/copy.md&w=300")[0], 400)
        self.assertEqual(self.get("/thumb?brand=acme&job=camp&path=../x.png&w=300")[0], 400)

    def test_without_pillow_the_original_is_served(self):
        old = review.Image
        review.Image = None
        self.addCleanup(lambda: setattr(review, "Image", old))
        st, body, _ = self.get("/thumb?brand=acme&job=camp&path=work/a.png&w=300")
        self.assertEqual((st, body), (200, b"0123456789"))

    def test_post_batch_and_card_key_over_http(self):
        d = os.path.join(self.p, "camp", "work")
        touch(os.path.join(d, "POSTS.md"), COPY03.encode("utf-8"))
        st, r = self.post({"brand": "acme", "job": "camp", "paths": ["work/a.png", "work/POSTS.md#w1-m01-ربط-الاسمين"], "status": "approved"})
        self.assertEqual(st, 200)
        self.assertEqual(len(r["entries"]), 2)
        self.assertEqual(self.post({"brand": "acme", "job": "camp", "path": "work/POSTS.md#zzz", "status": "approved"})[0], 404)


class ReadOnlyHttp(HttpBase):
    """REVIEW.bat starts the board with --read-only: decisions are made in the portal (R3b)."""

    def setUp(self):
        super().setUp()
        self.srv.read_only = True

    def test_post_decision_is_403_with_the_portal_link_and_nothing_is_written(self):
        mf = os.path.join(self.p, "camp", "DELIVERY.json")
        st, res = self.post({"brand": "acme", "job": "camp", "path": "work/a.png", "status": "approved"})
        self.assertEqual((st, res["ok"]), (403, False))
        self.assertIn("https://portal.the-systronic.duckdns.org", res["error"])
        self.assertIn("البوابة", res["error"])
        self.assertFalse(os.path.exists(mf))
        self.assertEqual(self.synced, [])
        self.assertEqual(self.post({"brand": "acme", "job": "camp", "paths": ["work/a.png"], "status": "rejected"})[0], 403)

    def test_tree_and_ping_expose_read_only_and_reads_still_work(self):
        tree = json.loads(self.get("/api/tree")[1])
        self.assertIs(tree["read_only"], True)
        self.assertIs(json.loads(self.get("/api/ping")[1])["read_only"], True)
        self.assertEqual(self.get("/api/job?brand=acme&job=camp")[0], 200)
        self.assertEqual(review.board_running(self.port), {"read_only": True})

    def test_page_hides_decision_ui_and_shows_the_banner(self):
        page = self.get("/")[1].decode("utf-8")
        self.assertIn('id="ro"', page)
        self.assertIn("القرارات بقت من البوابة", page)
        self.assertIn("https://portal.the-systronic.duckdns.org", page)
        for guard in ("canAct && !readOnly ? decisionRow", "viewOnly() || readOnly ? null : bulkBar", "if (can && !readOnly) box.append",
                      "viewOnly() || readOnly || !data", "readOnly || !rvCan(it)"):
            self.assertIn(guard, page)


class WritableByDefault(HttpBase):
    def test_tree_says_not_read_only_and_post_still_works(self):
        self.assertIs(json.loads(self.get("/api/tree")[1])["read_only"], False)
        self.assertEqual(self.post({"brand": "acme", "job": "camp", "path": "work/a.png", "status": "approved"})[0], 200)
        self.srv.syncer.wait_idle(5)

    def test_cli_flag_reaches_the_server(self):
        srv = review.make_server(self.root, 0, self.fake_sync, read_only=True)
        self.addCleanup(srv.server_close)
        self.assertTrue(srv.read_only)


if __name__ == "__main__":
    unittest.main()
