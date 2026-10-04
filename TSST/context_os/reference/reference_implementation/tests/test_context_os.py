import unittest
from context_os import ContextRecord, RetrievalRequest, Intent, retrieve, detect_same_scope_conflicts

def rec(id, project="TSST", scope="project_governance", state_key="gate",
        content="TSST-001A", authority="LIVE_STATUS", status="ACTIVE",
        workstream=None, verify="VERIFIED", sensitivity="INTERNAL"):
    return ContextRecord(
        record_id=id, project_key=project, memory_class="CANONICAL",
        authority_class=authority, source_locator=f"file:{id}", source_date="2026-10-03",
        state_scope=scope, state_key=state_key, status=status, sensitivity=sensitivity,
        content=content, workstream=workstream, verification_state=verify
    )

class ContextOSTests(unittest.TestCase):
    def test_cross_project_is_hard_rejected(self):
        req = RetrievalRequest(project_key="TSST", intent=Intent.CURRENT_STATE, decision_needed="gate")
        selected, excluded = retrieve(req, [rec("a"), rec("b", project="MOBIX")])
        self.assertEqual([r.record_id for _, r in selected], ["a"])
        self.assertIn(("b", "wrong_project"), excluded)

    def test_secret_prohibited_is_rejected(self):
        req = RetrievalRequest(project_key="TSST", intent=Intent.CURRENT_STATE, decision_needed="gate")
        selected, excluded = retrieve(req, [rec("s", sensitivity="SECRET_PROHIBITED")])
        self.assertEqual(selected, [])
        self.assertIn(("s", "secret_prohibited"), excluded)

    def test_state_scopes_do_not_override_each_other(self):
        gov = rec("gov", scope="project_governance", content="TSST-001A")
        crm = rec("crm", scope="product_milestone", state_key="CRM", content="M2_IMPLEMENTED",
                  authority="VERIFIED_IMPLEMENTATION", workstream="CRM")
        req = RetrievalRequest(project_key="TSST", intent=Intent.CURRENT_STATE,
                               decision_needed="TSST governance", state_scope="project_governance")
        selected, excluded = retrieve(req, [gov, crm])
        self.assertEqual([r.record_id for _, r in selected], ["gov"])
        self.assertIn(("crm", "wrong_state_scope"), excluded)

    def test_superseded_excluded_by_default(self):
        old = rec("old", status="SUPERSEDED")
        cur = rec("cur", content="TSST-001B")
        req = RetrievalRequest(project_key="TSST", intent=Intent.CURRENT_STATE, decision_needed="gate")
        selected, excluded = retrieve(req, [old, cur])
        self.assertEqual([r.record_id for _, r in selected], ["cur"])
        self.assertIn(("old", "superseded"), excluded)

    def test_same_scope_conflict_is_detected(self):
        a = rec("a", content="OPEN")
        b = rec("b", content="CLOSED")
        c = rec("c", scope="product_milestone", state_key="CRM", content="M2")
        conflicts = detect_same_scope_conflicts([a,b,c])
        self.assertEqual(len(conflicts), 1)
        self.assertEqual(set(conflicts[0][1]), {"a","b"})

    def test_semantic_signal_cannot_bypass_wrong_project(self):
        good = rec("good")
        wrong = rec("wrong", project="MOBIX")
        req = RetrievalRequest(project_key="TSST", intent=Intent.CURRENT_STATE, decision_needed="gate")
        selected, excluded = retrieve(req, [good, wrong], signals={"wrong": (1.0,1.0), "good":(0.1,0.1)})
        self.assertEqual([r.record_id for _, r in selected], ["good"])
        self.assertIn(("wrong", "wrong_project"), excluded)

if __name__ == "__main__":
    unittest.main()
