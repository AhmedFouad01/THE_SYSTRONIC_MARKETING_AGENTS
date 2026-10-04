import unittest
from recovery import Checkpoint,EvidenceRef,validate_checkpoint,build_resume_pack,should_repeat

def cp():
    return Checkpoint(
      checkpoint_id="CP-CRM-1",project_key="TSST",workstream="CRM",state_scope="product_milestone",
      last_verified_state="M1 CLOSED",completed=["M1 audit"],evidence=[EvidenceRef("crm:M1_EVIDENCE","v1")],
      open_items=["M2"],blockers=[],next_action="Start M2",do_not_repeat=["M1 audit","M0 migrations"]
    )

class RecoveryTests(unittest.TestCase):
    def test_current_checkpoint_resumes_next_action(self):
        c=cp()
        status=validate_checkpoint(c,{"crm:M1_EVIDENCE":"v1"})
        self.assertEqual(status,"CURRENT")
        self.assertEqual(build_resume_pack(c,status).next_action,"Start M2")

    def test_missing_critical_evidence_invalidates(self):
        c=cp()
        self.assertEqual(validate_checkpoint(c,{}),"INVALID")

    def test_version_mismatch_stales(self):
        c=cp()
        self.assertEqual(validate_checkpoint(c,{"crm:M1_EVIDENCE":"v2"}),"STALE")

    def test_newer_same_scope_verified_stales(self):
        c=cp()
        newer=[{"project_key":"TSST","workstream":"CRM","state_scope":"product_milestone","verified":True}]
        self.assertEqual(validate_checkpoint(c,{"crm:M1_EVIDENCE":"v1"},newer),"STALE")

    def test_newer_different_scope_does_not_stale(self):
        c=cp()
        newer=[{"project_key":"TSST","workstream":None,"state_scope":"project_governance","verified":True}]
        self.assertEqual(validate_checkpoint(c,{"crm:M1_EVIDENCE":"v1"},newer),"CURRENT")

    def test_other_project_evidence_does_not_stale(self):
        c=cp()
        newer=[{"project_key":"MOBIX","workstream":"CRM","state_scope":"product_milestone","verified":True}]
        self.assertEqual(validate_checkpoint(c,{"crm:M1_EVIDENCE":"v1"},newer),"CURRENT")

    def test_superseded_checkpoint_does_not_resume(self):
        c=cp(); c.status="SUPERSEDED"; c.superseded_by="CP-CRM-2"
        status=validate_checkpoint(c,{"crm:M1_EVIDENCE":"v1"})
        self.assertEqual(status,"SUPERSEDED")
        self.assertEqual(build_resume_pack(c,status).next_action,"Load the superseding checkpoint.")

    def test_do_not_repeat_is_enforced(self):
        c=cp()
        self.assertFalse(should_repeat("M1 audit",c))

    def test_new_failure_can_reopen_closed_work(self):
        c=cp()
        self.assertTrue(should_repeat("M1 audit",c,new_failure_evidence=True))

    def test_nonlisted_work_can_run(self):
        c=cp()
        self.assertTrue(should_repeat("M2 implementation",c))

if __name__=="__main__":
    unittest.main()
