from src.data_loader import load_profiles, load_vulnerabilities
from src.matcher import match_vulnerability, compare_versions
from src.models import (
    MatchOutcome,
    MatchReason,
    OrganizationProfile,
    TechnologyProfile,
    VulnerabilityRecord,
    WeightModifiers,
)


def test_product_match():
    vuln = load_vulnerabilities()[0]
    org = load_profiles()[0]
    result = match_vulnerability(vuln, org)
    assert result.matched
    assert result.outcome in (MatchOutcome.MATCH, MatchOutcome.NEEDS_VERIFICATION)


def test_product_exclude_when_not_used():
    vuln = VulnerabilityRecord(
        cve_id="CVE-2025-9999",
        product_name="Unused Random Software",
        cvss_base_score=9.8,
        cisa_kev=True,
        first_epss=0.9,
    )
    org = load_profiles()[0]
    result = match_vulnerability(vuln, org)
    assert not result.matched
    assert result.outcome == MatchOutcome.EXCLUDE
    assert result.reason_code == MatchReason.PRODUCT_NOT_USED


def test_alias_match():
    tech = TechnologyProfile(product="Web Application Firewall")
    org = OrganizationProfile(
        org_id="TEST-001",
        name="Test Org",
        sector="Tech",
        risk_appetite="Medium",
        weights=WeightModifiers(),
        technologies=(tech,),
    )
    vuln = VulnerabilityRecord(
        cve_id="CVE-2025-0001",
        product_name="WAF",
        cvss_base_score=8.0,
        cisa_kev=False,
        first_epss=0.1,
    )
    result = match_vulnerability(vuln, org)
    assert result.matched
    assert result.outcome in (MatchOutcome.MATCH, MatchOutcome.NEEDS_VERIFICATION)


def test_version_affected():
    outcome, reason, _ = compare_versions(
        installed_version="2.4.50",
        affected_versions="< 2.4.58",
    )
    assert outcome == MatchOutcome.MATCH
    assert reason == MatchReason.AFFECTED_VERSION


def test_version_not_affected():
    outcome, reason, _ = compare_versions(
        installed_version="2.4.60",
        affected_versions="< 2.4.58",
    )
    assert outcome == MatchOutcome.NOT_AFFECTED
    assert reason == MatchReason.VERSION_NOT_AFFECTED


def test_version_unknown():
    outcome, reason, _ = compare_versions(
        installed_version="unknown",
        affected_versions="< 2.4.58",
    )
    assert outcome == MatchOutcome.NEEDS_VERIFICATION
    assert reason == MatchReason.VERSION_UNKNOWN


def test_version_unsafe_to_compare():
    outcome, reason, _ = compare_versions(
        installed_version="2.4.50",
        affected_versions="< 2.4.58",
        version_note="Complex backported patch; see vendor advisory",
    )
    assert outcome == MatchOutcome.NEEDS_VERIFICATION
    assert reason == MatchReason.VERSION_UNSAFE_TO_COMPARE
