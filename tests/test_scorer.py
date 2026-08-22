import pytest
from src.data_loader import load_profiles, load_vulnerabilities
from src.matcher import match_vulnerability
from src.models import (
    ConfidenceLevel,
    MatchOutcome,
    MatchReason,
    MatchResult,
    OrganizationProfile,
    PriorityLevel,
    TechnologyProfile,
    VulnerabilityRecord,
    WeightModifiers,
)
from src.scorer import (
    calculate_confidence,
    calculate_personalized_score,
    calculate_priority,
)


def test_score_is_reproducible():
    v = load_vulnerabilities()[0]
    p = load_profiles()[0]
    m = match_vulnerability(v, p)
    b = calculate_personalized_score(v, p, m)
    expected_sum = (
        b.cvss_component
        + b.kev_component
        + b.epss_component
        + b.exposure_component
        + b.importance_component
    )
    assert pytest.approx(b.final_score, abs=1e-6) == expected_sum


def test_score_factors_sum_to_score_100():
    v = load_vulnerabilities()[0]
    p = load_profiles()[0]
    m = match_vulnerability(v, p)
    b = calculate_personalized_score(v, p, m)
    factors_sum = sum(b.factors_100.values())
    assert pytest.approx(b.score_100, abs=0.5) == factors_sum


def test_kev_signal_increases_score():
    org = load_profiles()[0]
    v_no_kev = VulnerabilityRecord("CVE-TEST-1", "Core Banking Framework", 8.0, False, 0.1)
    v_kev = VulnerabilityRecord("CVE-TEST-2", "Core Banking Framework", 8.0, True, 0.1)

    m1 = match_vulnerability(v_no_kev, org)
    m2 = match_vulnerability(v_kev, org)

    b1 = calculate_personalized_score(v_no_kev, org, m1)
    b2 = calculate_personalized_score(v_kev, org, m2)

    assert b2.final_score > b1.final_score
    assert b2.kev_component > b1.kev_component


def test_exposure_increases_score():
    tech_internal = TechnologyProfile("Core Banking Framework", exposure="internal", importance="critical")
    tech_internet = TechnologyProfile("Core Banking Framework", exposure="internet-facing", importance="critical")

    org_internal = OrganizationProfile("O1", "Org1", "Finance", "Low", WeightModifiers(), (tech_internal,))
    org_internet = OrganizationProfile("O2", "Org2", "Finance", "Low", WeightModifiers(), (tech_internet,))

    v = VulnerabilityRecord("CVE-TEST-1", "Core Banking Framework", 8.0, False, 0.1)

    m1 = match_vulnerability(v, org_internal)
    m2 = match_vulnerability(v, org_internet)

    b1 = calculate_personalized_score(v, org_internal, m1)
    b2 = calculate_personalized_score(v, org_internet, m2)

    assert b2.final_score > b1.final_score
    assert b2.exposure_component > b1.exposure_component


def test_importance_increases_score():
    tech_low = TechnologyProfile("Core Banking Framework", exposure="internal", importance="low")
    tech_crit = TechnologyProfile("Core Banking Framework", exposure="internal", importance="critical")

    org_low = OrganizationProfile("O1", "Org1", "Finance", "Low", WeightModifiers(), (tech_low,))
    org_crit = OrganizationProfile("O2", "Org2", "Finance", "Low", WeightModifiers(), (tech_crit,))

    v = VulnerabilityRecord("CVE-TEST-1", "Core Banking Framework", 8.0, False, 0.1)

    m1 = match_vulnerability(v, org_low)
    m2 = match_vulnerability(v, org_crit)

    b1 = calculate_personalized_score(v, org_low, m1)
    b2 = calculate_personalized_score(v, org_crit, m2)

    assert b2.final_score > b1.final_score
    assert b2.importance_component > b1.importance_component


def test_priority_thresholds():
    assert calculate_priority(85.0) == PriorityLevel.URGENT
    assert calculate_priority(60.0) == PriorityLevel.HIGH
    assert calculate_priority(35.0) == PriorityLevel.MEDIUM
    assert calculate_priority(15.0) == PriorityLevel.LOW


def test_confidence_calculation():
    v = VulnerabilityRecord("CVE-TEST-1", "Core Banking Framework", 8.0, False, 0.1)
    tech = TechnologyProfile("Core Banking Framework", version="3.2.0")
    m_match = MatchResult(MatchOutcome.MATCH, MatchReason.AFFECTED_VERSION, "Match", tech)
    m_verif = MatchResult(MatchOutcome.NEEDS_VERIFICATION, MatchReason.VERSION_UNKNOWN, "Unknown version", tech)

    assert calculate_confidence(m_match, v) == ConfidenceLevel.HIGH
    assert calculate_confidence(m_verif, v) == ConfidenceLevel.MEDIUM
