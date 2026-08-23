"""
Cybersecurity Judge & Red-Team Security Test Suite.
Verifies threat models, input validation, injection resistance, version comparison correctness,
path traversal defense, data integrity, organisation isolation, URL sanitization, and AI Fact Guard.
"""

import hashlib
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from src.matcher import compare_versions, _parse_version_tuple, _compare_tuples, MatchOutcome, MatchReason
from src.data_loader import DATA
from backend.services.fact_guard import FactGuard

client = TestClient(app)

VULNS_FILE = DATA / "vulnerabilities.csv"
GOLD_FILE = DATA / "gold_set.csv"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


# 1. Dataset Integrity Test
def test_dataset_cryptographic_integrity():
    """Verify that dataset files remain identical and uncorrupted."""
    expected_vulns_hash = "20592c51ba82513d40c4108012ebcd4858a6542873227294c1e81076906424b8"
    expected_gold_hash = "eadc5301a42e284f545f80f0ff603209084c4ac8de4b29f9ac9a91da9e2075f3"
    assert file_sha256(VULNS_FILE) == expected_vulns_hash
    assert file_sha256(GOLD_FILE) == expected_gold_hash


# 2. Version Comparison Red-Team Tests (Lexical vs Semantic)
def test_version_semantic_not_lexical():
    """Verify that 2.4.9 is correctly identified as less than 2.4.49 (avoiding lexical trap)."""
    tup_9 = _parse_version_tuple("2.4.9")
    tup_49 = _parse_version_tuple("2.4.49")
    assert tup_9 == (2, 4, 9)
    assert tup_49 == (2, 4, 49)
    assert _compare_tuples(tup_9, tup_49) == -1  # 2.4.9 < 2.4.49

    # Test compare_versions against affected range "< 2.4.50"
    outcome, reason, expl = compare_versions("2.4.9", "< 2.4.50")
    assert outcome == MatchOutcome.MATCH

    outcome_49, reason_49, _ = compare_versions("2.4.49", "< 2.4.50")
    assert outcome_49 == MatchOutcome.MATCH

    outcome_50, reason_50, _ = compare_versions("2.4.50", "< 2.4.50")
    assert outcome_50 == MatchOutcome.NOT_AFFECTED


def test_malformed_and_edge_case_versions():
    """Verify that unparseable or malicious version strings safely fall back to NEEDS_VERIFICATION."""
    malicious_versions = [
        "<script>alert(1)</script>",
        "2.4.x-custom-build",
        "../../etc/passwd",
        "latest",
        "patch_v2_beta",
        "",
        "unknown",
        "none",
    ]
    for mv in malicious_versions:
        outcome, reason, _ = compare_versions(mv, "< 3.0.0")
        assert outcome == MatchOutcome.NEEDS_VERIFICATION


# 3. Path Traversal & Endpoint Security Tests
def test_path_traversal_attempts():
    """Verify that path traversal strings in parameters return 404 or 403, not system files."""
    traversal_payloads = [
        "../../etc/passwd",
        "..%2f..%2fetc%2fpasswd",
        "....//....//etc/passwd",
        "/etc/passwd",
        "../../data/vulnerabilities.csv",
    ]
    import urllib.parse
    for payload in traversal_payloads:
        encoded = urllib.parse.quote(payload, safe="")
        res = client.get(f"/api/triage/{encoded}")
        assert res.status_code in (404, 422)

        res_spa = client.get(f"/{payload}")
        assert res_spa.status_code in (403, 404)


# 4. Input Validation & XSS Payload Handling
def test_xss_and_injection_in_organization_creation():
    """Verify that XSS and SQLi payloads in profile inputs are cleanly validated."""
    xss_payload = {
        "name": "<script>alert('xss')</script>",
        "sector": "Financial' OR '1'='1",
        "risk_appetite": "Low",
        "critical_products": ["<img src=x onerror=alert(1)>"],
        "technologies": [
            {
                "product": "Enterprise Router OS",
                "vendor": "Cisco",
                "version": "15.2(4)M",
                "exposure": "internal",
                "importance": "high",
                "name": "'; DROP TABLE profiles; --"
            }
        ]
    }
    res = client.post("/api/organizations", json=xss_payload)
    assert res.status_code == 201
    created_id = res.json()["profile_id"]

    try:
        # Verify retrieved profile preserves raw text without rendering as executable code
        get_res = client.get(f"/api/profiles/{created_id}")
        assert get_res.status_code == 200
        data = get_res.json()
        assert "<script>" in data["name"]
    finally:
        client.delete(f"/api/organizations/{created_id}")


# 5. Cross-Organisation Isolation & Authorization Defense
def test_cross_organisation_isolation():
    """Verify that one organisation cannot manipulate another organisation's remediations or assets."""
    # Create two test organisations
    org_a = client.post("/api/organizations", json={
        "name": "RedTeam Org A",
        "sector": "Banking",
        "critical_products": ["Apache HTTP Server"]
    }).json()["profile_id"]

    org_b = client.post("/api/organizations", json={
        "name": "RedTeam Org B",
        "sector": "Defense",
        "critical_products": ["Redis"]
    }).json()["profile_id"]

    try:
        # Create asset in Org A
        ast_a = client.post(f"/api/organizations/{org_a}/assets", json={
            "name": "Asset A",
            "product": "Apache HTTP Server",
            "version": "2.4.49",
            "exposure": "internet-facing",
            "importance": "critical"
        }).json()["asset"]["asset_id"]

        # Org B attempting to fetch or delete Org A's asset must return 404
        cross_get = client.get(f"/api/organizations/{org_b}/assets/{ast_a}")
        assert cross_get.status_code == 404

        cross_del = client.delete(f"/api/organizations/{org_b}/assets/{ast_a}")
        assert cross_del.status_code == 404
    finally:
        client.delete(f"/api/organizations/{org_a}")
        client.delete(f"/api/organizations/{org_b}")


# 6. AI Fact Guard Red-Team Tests
def test_ai_fact_guard_catches_hallucinations():
    """Verify that AI Fact Guard rejects altered scores, invented CVEs, or false vendor claims."""
    evidence = {
        "cve_id": "CVE-2023-1262",
        "source_facts": {
            "cisa_kev": False,
            "cvss": 7.5
        }
    }

    # 1. Clean valid generated explanation
    clean_gen = {
        "why_it_matters": "CVE-2023-1262 affects the core routing service with potential remote impact.",
        "potential_impact": "Attackers could disrupt traffic routing if exploitation occurs.",
        "next_action": "Apply the recommended vendor configuration patch during the maintenance window."
    }
    valid, passed, violations = FactGuard.validate(evidence, clean_gen)
    assert valid is True
    assert len(violations) == 0

    # 2. Hallucinated foreign CVE ID
    foreign_cve_gen = {
        "why_it_matters": "CVE-2099-9999 is critical for your gateway.",
        "potential_impact": "Severe disruption.",
        "next_action": "Apply patch."
    }
    valid, _, violations = FactGuard.validate(evidence, foreign_cve_gen)
    assert valid is False
    assert any("Hallucinated foreign CVE ID" in v for v in violations)

    # 3. Unsupported active exploitation claim on non-KEV vulnerability
    false_kev_gen = {
        "why_it_matters": "This vulnerability is actively exploited in the wild.",
        "potential_impact": "High.",
        "next_action": "Patch now."
    }
    valid, _, violations = FactGuard.validate(evidence, false_kev_gen)
    assert valid is False
    assert any("Unsupported active exploitation claim" in v for v in violations)

    # 4. Dangerous / offensive command injection in recommendation
    offensive_cmd_gen = {
        "why_it_matters": "High severity flaw.",
        "potential_impact": "System compromise.",
        "next_action": "Run msfconsole and use metasploit to verify."
    }
    valid, _, violations = FactGuard.validate(evidence, offensive_cmd_gen)
    assert valid is False
    assert any("Dangerous, offensive, or destructive command" in v for v in violations)

