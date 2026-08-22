from fastapi.testclient import TestClient
from backend.main import app
from backend.services.fact_guard import FactGuard
from backend.services.ai_service import AIService

client = TestClient(app)


def test_fact_guard_valid_output():
    evidence = {
        "cve_id": "CVE-2023-1262",
        "cisa_kev": True,
        "source_facts": {"cisa_kev": True, "cvss_base_score": 7.5, "product_name": "Identity Provider SaaS"},
    }
    generated = {
        "why_it_matters": "CVE-2023-1262 is actively exploited in Identity Provider SaaS.",
        "potential_impact": "Disruption to authentication services on internet perimeter.",
        "next_action": "Verify the deployed version and review vendor security advisory.",
    }
    is_valid, checks, violations = FactGuard.validate(evidence, generated)
    assert is_valid is True
    assert len(violations) == 0
    assert "field_presence_why_it_matters" in checks
    assert "defensive_action_safety" in checks


def test_fact_guard_rejects_foreign_cve_hallucination():
    evidence = {
        "cve_id": "CVE-2023-1262",
        "cisa_kev": True,
        "source_facts": {"cisa_kev": True},
    }
    generated = {
        "why_it_matters": "This record is related to CVE-2099-9999 which is unrelated.",
        "potential_impact": "Impact to authentication.",
        "next_action": "Verify installed version.",
    }
    is_valid, checks, violations = FactGuard.validate(evidence, generated)
    assert is_valid is False
    assert any("Hallucinated foreign CVE ID" in v for v in violations)


def test_fact_guard_rejects_unsupported_kev_claim():
    evidence = {
        "cve_id": "CVE-2024-7287",
        "cisa_kev": False,
        "source_facts": {"cisa_kev": False},
    }
    generated = {
        "why_it_matters": "This vulnerability is actively exploited in the wild.",
        "potential_impact": "System disruption.",
        "next_action": "Apply security patches according to change policy.",
    }
    is_valid, checks, violations = FactGuard.validate(evidence, generated)
    assert is_valid is False
    assert any("Unsupported active exploitation claim" in v for v in violations)


def test_fact_guard_rejects_dangerous_offensive_commands():
    evidence = {
        "cve_id": "CVE-2023-1262",
        "cisa_kev": True,
        "source_facts": {"cisa_kev": True},
    }
    generated = {
        "why_it_matters": "Critical authentication flaw.",
        "potential_impact": "System takeover.",
        "next_action": "Run sqlmap -u http://target/login to exploit the vulnerability.",
    }
    is_valid, checks, violations = FactGuard.validate(evidence, generated)
    assert is_valid is False
    assert any("Dangerous, offensive, or destructive command detected" in v for v in violations)


def test_fact_guard_rejects_false_security_overassurance():
    evidence = {
        "cve_id": "CVE-2023-1262",
        "cisa_kev": True,
        "source_facts": {"cisa_kev": True},
    }
    generated = {
        "why_it_matters": "No action needed because system is fully safe.",
        "potential_impact": "None.",
        "next_action": "Do nothing.",
    }
    is_valid, checks, violations = FactGuard.validate(evidence, generated)
    assert is_valid is False
    assert any("Unsubstantiated security over-assurance" in v for v in violations)


def test_ai_service_deterministic_fallback():
    service = AIService()
    ev_data = {
        "cve_id": "CVE-2023-1262",
        "priority": "URGENT",
        "score_100": 91.9,
        "source_facts": {
            "cve_id": "CVE-2023-1262",
            "product_name": "Identity Provider SaaS",
            "cvss_base_score": 7.5,
            "cisa_kev": True,
            "first_epss": 0.825,
        },
        "asset_context": {
            "service": "Customer Portal",
            "exposure": "internet-facing",
            "importance": "critical",
            "installed_version": None,
        },
        "explanation": {
            "safe_next_action": "Verify installed version and review NVD advisory."
        },
    }

    fallback = service.generate_deterministic_fallback(ev_data, "ORG-001", "CVE-2023-1262")
    assert fallback.profile_id == "ORG-001"
    assert fallback.cve_id == "CVE-2023-1262"
    assert fallback.ai.mode == "deterministic_fallback"
    assert fallback.ai.available is False
    assert fallback.source_bound is True
    assert "Identity Provider SaaS" in fallback.explanation.why_it_matters


def test_ai_explain_api_endpoint_valid():
    response = client.post("/api/ai/explain/ORG-001/CVE-2023-1262")
    assert response.status_code == 200
    data = response.json()

    assert data["profile_id"] == "ORG-001"
    assert data["cve_id"] == "CVE-2023-1262"
    assert "explanation" in data
    assert "why_it_matters" in data["explanation"]
    assert "potential_impact" in data["explanation"]
    assert "next_action" in data["explanation"]
    assert "ai" in data
    assert data["source_bound"] is True
    assert data["fact_guard"]["status"] in ("PASSED", "FALLBACK")


def test_ai_explain_api_endpoint_missing_profile():
    response = client.post("/api/ai/explain/INVALID-ORG/CVE-2023-1262")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "PROFILE_NOT_FOUND"


def test_ai_explain_api_endpoint_missing_cve():
    response = client.post("/api/ai/explain/ORG-001/CVE-DOES-NOT-EXIST")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "CVE_NOT_FOUND"
