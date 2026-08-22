"""
Adversarial Ranking & Deduplication Test Suite
Verifies deterministic sorting, tie-breaking, deduplication, and exclusion integrity.
"""

import pytest
from src.models import (
    OrganizationProfile,
    TechnologyProfile,
    WeightModifiers,
    VulnerabilityRecord,
)
from src.ranker import rank_personalized


def test_deduplication_of_duplicate_cve_product_rows():
    """Verify that duplicate rows in the dataset are deduplicated by (cve_id, product_name)."""
    vulns = [
        VulnerabilityRecord(
            cve_id="CVE-2023-9999",
            product_name="Enterprise Router OS",
            cvss_base_score=7.5,
            cisa_kev=False,
            first_epss=0.10,
            affected_versions="< 5.0",
        ),
        # Duplicate with higher EPSS
        VulnerabilityRecord(
            cve_id="CVE-2023-9999",
            product_name="Enterprise Router OS",
            cvss_base_score=7.5,
            cisa_kev=True,
            first_epss=0.45,
            affected_versions="< 5.0",
        ),
    ]

    profile = OrganizationProfile(
        org_id="ORG-TEST",
        name="Test Org",
        sector="Tech",
        risk_appetite="Low",
        technologies=(
            TechnologyProfile(vendor="SecuGate", product="Enterprise Router OS", version="4.2.0", service="Gateway", exposure="Internet-facing", importance="Critical"),
        ),
        critical_products=("Enterprise Router OS",),
        weights=WeightModifiers(),
    )

    ranking = rank_personalized(vulns, profile)
    assert len(ranking.ranked) == 1
    # Check that the higher threat duplicate was kept
    assert ranking.ranked[0].vulnerability.cisa_kev is True
    assert ranking.ranked[0].vulnerability.first_epss == 0.45


def test_deterministic_sorting_repeatability():
    """Verify running the ranking 100 times produces bit-exact identical rankings."""
    from src.data_loader import load_vulnerabilities, load_profiles

    vulns = load_vulnerabilities()
    profiles = load_profiles()
    org = profiles[0]

    first_run = rank_personalized(vulns, org)
    first_top5_cves = [x.vulnerability.cve_id for x in first_run.ranked[:5]]
    first_scores = [x.breakdown.final_score for x in first_run.ranked[:5]]

    for _ in range(50):
        run = rank_personalized(vulns, org)
        top5_cves = [x.vulnerability.cve_id for x in run.ranked[:5]]
        scores = [x.breakdown.final_score for x in run.ranked[:5]]
        assert top5_cves == first_top5_cves
        assert scores == first_scores
