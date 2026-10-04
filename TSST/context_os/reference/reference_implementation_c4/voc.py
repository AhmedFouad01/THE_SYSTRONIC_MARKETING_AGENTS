from dataclasses import dataclass, field
from typing import Optional, List, Dict, Tuple
from collections import defaultdict
from datetime import datetime

@dataclass(frozen=True)
class Observation:
    observation_id: str
    tenant_id: str
    account_id: str
    source_locator: str
    product_area: str
    theme: str
    observation_type: str
    evidence_quality: str
    sentiment: str
    segment: str
    jtbd: str
    outcome_strength: Optional[int]=None
    severity: Optional[int]=None
    contains_pii: bool=False
    durable_copy_allowed: bool=True

def safe_for_derived_memory(o:Observation)->bool:
    return bool(o.source_locator) and not o.contains_pii and o.durable_copy_allowed

def dedupe_by_source(observations:List[Observation])->List[Observation]:
    seen=set()
    out=[]
    for o in observations:
        key=(o.tenant_id,o.source_locator)
        if key in seen:
            continue
        seen.add(key)
        out.append(o)
    return out

def cluster(observations:List[Observation]):
    groups=defaultdict(list)
    for o in dedupe_by_source(observations):
        groups[(o.product_area,o.theme,o.segment,o.jtbd)].append(o)
    return groups

def contradiction_rate(obs:List[Observation])->float:
    if not obs: return 0.0
    pos=sum(1 for o in obs if o.sentiment=="positive")
    neg=sum(1 for o in obs if o.sentiment=="negative")
    if not pos or not neg: return 0.0
    return min(pos,neg)/len(obs)

def confidence_for_strength(obs:List[Observation], proofable:bool=False)->str:
    obs=[o for o in dedupe_by_source(obs) if safe_for_derived_memory(o)]
    if not obs:
        return "HYPOTHESIS"
    accounts={o.account_id for o in obs}
    direct=sum(1 for o in obs if o.evidence_quality=="DIRECT")
    inferred=sum(1 for o in obs if o.evidence_quality=="INFERRED")
    outcome_vals=[o.outcome_strength for o in obs if o.outcome_strength is not None]
    outcome=(sum(outcome_vals)/len(outcome_vals)) if outcome_vals else 0
    contra=contradiction_rate(obs)

    if len(accounts) < 2 or direct==0 or inferred==len(obs):
        return "HYPOTHESIS"
    if len(accounts) >= 3 and outcome >= 3 and contra <= 0.34:
        if proofable and contra <= 0.20:
            return "CLAIM_READY"
        return "VERIFIED_STRENGTH"
    return "STRONG_SIGNAL"

def route_cause(cause:str)->Tuple[str,...]:
    mapping={
        "product_capability":("DEV_AG","LENS_AG"),
        "technical_defect":("DEV_AG",),
        "ux_usability":("CREATIVE_AG","DEV_AG"),
        "expectation_positioning":("LENS_AG","CREATIVE_AG"),
        "lead_quality":("SPARK_AG","LENS_AG"),
        "measurement":("SPARK_AG","DEV_AG"),
        "configuration":("DEV_AG","LENS_AG"),
        "pricing_commercial":("TSST_LEAD","LENS_AG"),
        "unknown":("LENS_AG","TSST_LEAD"),
    }
    return mapping.get(cause,("TSST_LEAD",))

def product_strength_score(obs:List[Observation])->Dict[str,float]:
    clean=[o for o in dedupe_by_source(obs) if safe_for_derived_memory(o)]
    accounts={o.account_id for o in clean}
    direct=sum(1 for o in clean if o.evidence_quality=="DIRECT")
    outcome_vals=[o.outcome_strength for o in clean if o.outcome_strength is not None]
    outcome=(sum(outcome_vals)/len(outcome_vals)) if outcome_vals else 0.0
    frequency=min(len(clean)/5,1.0)
    breadth=min(len(accounts)/5,1.0)
    directness=(direct/len(clean)) if clean else 0.0
    consistency=1.0-contradiction_rate(clean)
    outcome_norm=min(outcome/5,1.0)
    score=.20*frequency+.25*breadth+.20*outcome_norm+.15*directness+.20*consistency
    return {
        "score":round(score,4),
        "distinct_accounts":len(accounts),
        "observations":len(clean),
        "contradiction_rate":round(1-consistency,4),
        "avg_outcome_strength":round(outcome,2)
    }
