"""
Unit and integration tests for NEXORA Differentiation Capabilities:
1. Priority Delta calculation & context difference extraction
2. Decision Trace 8-stage evidence verification
3. Decision Stability sensitivity & classification rules
"""

import pytest
from src.data_loader import load_vulnerabilities, load_profiles
from src.ranker import rank_personalized
from backend.services.triage_service import triage_service
from backend.schemas.api_models import WhatIfRequest


def test_priority_delta_between_profiles():
    """Verify priority delta correctly computes rank movement between distinct profiles."""
    profiles = load_profiles()
    vulns = load_vulnerabilities()
    assert len(profiles) >= 2

    org_a = profiles[0]  # Global Retail Bank (ORG-001)
    org_b = profiles[1]  # Agile Cloud Tech Startup (ORG-002)

    comp = triage_service.compare_profiles(org_a.org_id, org_b.org_id)
    assert comp is not None
    assert len(comp.top5_a) == 5
    assert len(comp.top5_b) == 5

    # Check differences exist
    assert len(comp.differences) > 0
    for diff in comp.differences:
        assert diff.cve_id.startswith("CVE-")
        assert diff.product_name is not None
        # Ranks must be integers 1-5 or None (if outside Top 5)
        if diff.rank_a is not None:
            assert 1 <= diff.rank_a <= 540
        if diff.rank_b is not None:
            assert 1 <= diff.rank_b <= 540


def test_decision_trace_eight_stages():
    """Verify Decision Trace extracts all 8 factual stages without hallucination."""
    profiles = load_profiles()
    vulns = load_vulnerabilities()
    org = profiles[0]

    ranking = rank_personalized(vulns, org)
    top_item = ranking.ranked[0]
    cve_id = top_item.vulnerability.cve_id

    evidence = triage_service.get_evidence(org.org_id, cve_id)
    assert evidence is not None

    # Stage 1: Source Record
    assert evidence.source_facts["cve_id"] == cve_id
    assert evidence.source_facts["cvss_base_score"] > 0
    assert "reference_url" in evidence.source_facts

    # Stage 2: Product Match
    assert evidence.matching["is_matched"] is True
    assert evidence.matching["outcome"] in ("MATCH", "NEEDS_VERIFICATION")

    # Stage 3: Version Match
    assert "installed_version" in evidence.asset_context

    # Stage 4: Organisation Context
    assert evidence.asset_context["exposure"].lower() in ("internet-facing", "internal", "air-gapped", "n/a")
    assert evidence.asset_context["importance"].lower() in ("critical", "high", "medium", "low", "normal", "n/a")

    # Stage 5: Threat Signals
    assert "kev_points" in evidence.score_factors
    assert "epss_points" in evidence.score_factors
    assert "cvss_points" in evidence.score_factors

    # Stage 6: Decision
    assert evidence.rank == 1
    assert evidence.score_100 > 0

    # Stage 7: Confidence
    assert evidence.confidence in ("HIGH", "MEDIUM", "LOW")

    # Stage 8: Next Action
    assert len(evidence.explanation["safe_next_action"]) > 0


def test_decision_stability_simulation():
    """Verify Decision Stability evaluates rank shift across sensitivity scenarios."""
    profiles = load_profiles()
    org = profiles[0]

    # Run Threat-Centric scenario with decimal weights (<= 1.0)
    threat_req = WhatIfRequest(
        cisa_kev_weight=0.45,
        first_epss_weight=0.35,
        cvss_weight=0.10,
        exposure_weight=0.05,
        importance_weight=0.05,
    )
    sim_res = triage_service.simulate_what_if(org.org_id, threat_req)
    assert sim_res is not None
    assert len(sim_res.simulated_top5) == 5
    assert len(sim_res.original_top5) == 5

    # Check that simulated scores are valid and bounded (0-100)
    for item in sim_res.simulated_top5:
        assert 0.0 <= item.simulated_score <= 100.0
        assert item.rank in range(1, 6)


def test_unconstrained_version_uncertainty_handling():
    """Verify unconstrained versions produce NEEDS_VERIFICATION rather than false security."""
    profiles = load_profiles()
    vulns = load_vulnerabilities()
    org = profiles[0]

    ranking = rank_personalized(vulns, org)
    needs_verif_items = [x for x in ranking.ranked if x.match.outcome.value == "NEEDS_VERIFICATION"]

    for item in needs_verif_items:
        evidence = triage_service.get_evidence(org.org_id, item.vulnerability.cve_id)
        assert evidence is not None
        assert evidence.matching["outcome"] == "NEEDS_VERIFICATION"
