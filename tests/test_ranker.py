from src.data_loader import load_profiles, load_vulnerabilities
from src.models import (
    MatchOutcome,
    OrganizationProfile,
    TechnologyProfile,
    VulnerabilityRecord,
    WeightModifiers,
)
from src.ranker import rank_by_cvss, rank_personalized


def test_baseline_and_personalised_are_deterministic():
    v = load_vulnerabilities()
    p = load_profiles()
    assert rank_by_cvss(v) == rank_by_cvss(v)
    assert rank_personalized(v, p[0]) == rank_personalized(v, p[0])


def test_candidate_filtering_excludes_unused_products():
    v = load_vulnerabilities()
    p = load_profiles()[0]
    r = rank_personalized(v, p)

    # For ORG-001 (Core Banking Framework and Identity Provider SaaS), only matching products are ranked
    ranked_products = {x.vulnerability.product_name for x in r.ranked}
    assert ranked_products.issubset({"Core Banking Framework", "Identity Provider SaaS"})
    assert len(r.excluded) > 0
    assert len(r.ranked) + len(r.excluded) == len({(x.cve_id, x.product_name) for x in v})


def test_negative_test_high_cvss_excluded():
    """Mandatory negative test: CVSS >= 9.0 on an unused product must be EXCLUDED from Top 5."""
    org = OrganizationProfile(
        org_id="BANK-ONLY",
        name="Bank Org",
        sector="Finance",
        risk_appetite="Low",
        weights=WeightModifiers(),
        technologies=(TechnologyProfile(product="Core Banking Framework", exposure="internal", importance="critical"),),
    )

    # High-CVSS vulnerability on an irrelevant product (e.g., Enterprise Router OS)
    high_cvss_vuln = VulnerabilityRecord(
        cve_id="CVE-2026-9999",
        product_name="Enterprise Router OS",
        cvss_base_score=10.0,
        cisa_kev=True,
        first_epss=0.99,
    )
    # Moderate-CVSS vulnerability on the bank's actual product
    matched_vuln = VulnerabilityRecord(
        cve_id="CVE-2025-0001",
        product_name="Core Banking Framework",
        cvss_base_score=7.0,
        cisa_kev=False,
        first_epss=0.2,
    )

    r = rank_personalized([high_cvss_vuln, matched_vuln], org)

    # The high-CVSS irrelevant vulnerability must NOT be in ranked Top 5
    ranked_cves = [x.vulnerability.cve_id for x in r.ranked]
    assert "CVE-2026-9999" not in ranked_cves
    assert "CVE-2025-0001" in ranked_cves

    # The high-CVSS irrelevant vuln must be in excluded with PRODUCT_NOT_USED
    excluded_item = next((x for x in r.excluded if x.vulnerability.cve_id == "CVE-2026-9999"), None)
    assert excluded_item is not None
    assert excluded_item.match.outcome == MatchOutcome.EXCLUDE


def test_two_profiles_produce_different_top5():
    """Mandatory two-profile test: Different org profiles must produce distinct Top 5 triage lists."""
    v = load_vulnerabilities()
    profiles = load_profiles()
    org1, org2 = profiles[0], profiles[1]

    r1 = rank_personalized(v, org1)
    r2 = rank_personalized(v, org2)

    top5_org1 = [x.vulnerability.cve_id for x in r1.ranked[:5]]
    top5_org2 = [x.vulnerability.cve_id for x in r2.ranked[:5]]

    assert len(top5_org1) == 5
    assert len(top5_org2) == 5
    # The two Top 5 lists must be different
    assert top5_org1 != top5_org2
