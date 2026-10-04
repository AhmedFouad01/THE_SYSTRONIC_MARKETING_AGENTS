import unittest
from voc import Observation, confidence_for_strength, dedupe_by_source, route_cause, safe_for_derived_memory

def o(i, account, source=None, sentiment="positive", q="DIRECT", outcome=4, pii=False):
    return Observation(
        observation_id=i,tenant_id="T1",account_id=account,source_locator=source or f"crm:{i}",
        product_area="reporting",theme="clarity",observation_type="outcome",
        evidence_quality=q,sentiment=sentiment,segment="agency",jtbd="understand_campaign_value",
        outcome_strength=outcome,contains_pii=pii
    )

class VOCTests(unittest.TestCase):
    def test_one_loud_customer_is_hypothesis(self):
        obs=[o("1","A"),o("2","A"),o("3","A")]
        self.assertEqual(confidence_for_strength(obs), "HYPOTHESIS")

    def test_duplicate_source_does_not_inflate(self):
        obs=[o("1","A","crm:same"),o("2","A","crm:same"),o("3","B","crm:b")]
        self.assertEqual(len(dedupe_by_source(obs)),2)

    def test_two_accounts_is_strong_signal_not_verified(self):
        obs=[o("1","A"),o("2","B")]
        self.assertEqual(confidence_for_strength(obs),"STRONG_SIGNAL")

    def test_three_accounts_with_outcome_can_verify(self):
        obs=[o("1","A"),o("2","B"),o("3","C")]
        self.assertEqual(confidence_for_strength(obs),"VERIFIED_STRENGTH")

    def test_claim_ready_needs_proofable(self):
        obs=[o("1","A"),o("2","B"),o("3","C"),o("4","D")]
        self.assertEqual(confidence_for_strength(obs,proofable=True),"CLAIM_READY")

    def test_contradictions_block_claim_ready(self):
        obs=[o("1","A","a","positive"),o("2","B","b","positive"),o("3","C","c","negative"),o("4","D","d","positive")]
        self.assertNotEqual(confidence_for_strength(obs,proofable=True),"CLAIM_READY")

    def test_pii_observation_not_safe_for_derived_memory(self):
        self.assertFalse(safe_for_derived_memory(o("1","A",pii=True)))

    def test_ux_routes_to_creative_and_dev(self):
        self.assertEqual(route_cause("ux_usability"),("CREATIVE_AG","DEV_AG"))

    def test_measurement_routes_to_spark_and_dev(self):
        self.assertEqual(route_cause("measurement"),("SPARK_AG","DEV_AG"))

    def test_expectation_is_not_automatic_dev(self):
        self.assertEqual(route_cause("expectation_positioning"),("LENS_AG","CREATIVE_AG"))

if __name__=="__main__":
    unittest.main()
