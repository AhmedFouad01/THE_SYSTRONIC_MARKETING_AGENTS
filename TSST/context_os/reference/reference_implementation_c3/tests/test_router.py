import unittest
from router import RouteRequest, route, Tier, Budget, Tool, select_tools, should_defer

class RouterTests(unittest.TestCase):
    def test_bulk_volume_does_not_force_executive(self):
        d = route(RouteRequest(task_type="feedback_classification", input_volume=4, reasoning_depth=1))
        self.assertEqual(d.tier, Tier.FAST)
        self.assertIn("bulk_input_requires_partition_and_compression", d.reasons)

    def test_standard_complex_task_uses_execution(self):
        d = route(RouteRequest(task_type="crm_analysis", ambiguity=2, business_impact=2))
        self.assertEqual(d.tier, Tier.EXECUTION)

    def test_code_heavy_routes_to_code(self):
        d = route(RouteRequest(task_type="repo_refactor", codebase_coupling=4, needs_code_harness=True))
        self.assertEqual(d.tier, Tier.CODE)

    def test_high_impact_ambiguous_routes_executive(self):
        d = route(RouteRequest(task_type="architecture", business_impact=4, irreversibility=4,
                               ambiguity=3, reasoning_depth=4, budget=Budget.HIGH))
        self.assertEqual(d.tier, Tier.EXECUTIVE)

    def test_repeated_failure_escalates(self):
        d = route(RouteRequest(task_type="debug", same_issue_failures=2, budget=Budget.NORMAL))
        self.assertEqual(d.tier, Tier.EXECUTIVE)

    def test_low_budget_cannot_silently_use_executive(self):
        d = route(RouteRequest(task_type="architecture", business_impact=4, ambiguity=4,
                               reasoning_depth=4, budget=Budget.LOW))
        self.assertEqual(d.tier, Tier.EXECUTION)
        self.assertIn("budget_requires_lead_escalation", d.reasons)

    def test_external_action_blocked_without_authority(self):
        d = route(RouteRequest(task_type="publish", requested_namespaces={"read","external_action"}))
        self.assertNotIn("external_action", d.tool_namespaces)
        self.assertIn("external_action_without_explicit_authority", d.blocked_actions)

    def test_internal_mutation_blocked_without_authority(self):
        d = route(RouteRequest(task_type="crm_write", requested_namespaces={"internal_mutation"}))
        self.assertNotIn("internal_mutation", d.tool_namespaces)

    def test_external_action_allowed_with_authority(self):
        d = route(RouteRequest(task_type="publish", requested_namespaces={"external_action"},
                               explicit_external_action_authority=True))
        self.assertIn("external_action", d.tool_namespaces)

    def test_tool_selection_filters_irrelevant_and_modes(self):
        tools=[
            Tool("drive.read","drive","READ",False,True,{"project","docs"}),
            Tool("github.read","github","READ",True,False,{"code"}),
            Tool("github.write","github","MUTATE_INTERNAL",True,False,{"code"}),
            Tool("ads.publish","ads","EXTERNAL_ACTION",True,False,{"ads"}),
        ]
        selected=select_tools(tools, {"code"}, {"READ"})
        self.assertEqual([x.tool_id for x in selected], ["github.read"])

    def test_large_catalog_defers_nonfrequent(self):
        t=Tool("github.read","github","READ",False,False,{"code"})
        self.assertTrue(should_defer(t, 20))

    def test_frequent_tool_stays_eager(self):
        t=Tool("state.read","project","READ",True,True,{"project"})
        self.assertFalse(should_defer(t, 100))

if __name__ == "__main__":
    unittest.main()
