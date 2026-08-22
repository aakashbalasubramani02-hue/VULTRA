"""
Adversarial API Test Suite
Attacks all FastAPI endpoints with invalid profiles, invalid CVEs, boundary queries,
and malformed weights, ensuring no unhandled 500 exceptions, stack traces, or leaks.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_invalid_profile_returns_clean_404():
    res = client.get("/api/triage/ORG-NONEXISTENT-999")
    assert res.status_code == 404
    data = res.json()
    assert data["error"] == "PROFILE_NOT_FOUND"
    assert "not found" in data["message"].lower()


def test_invalid_cve_evidence_returns_clean_404():
    res = client.get("/api/evidence/ORG-001/CVE-9999-999999")
    assert res.status_code == 404
    data = res.json()
    assert data["error"] == "CVE_NOT_FOUND"
    assert "not found" in data["message"].lower()


def test_invalid_weights_what_if_returns_clean_422():
    # Weight > 1.0 should be rejected by Pydantic validator
    res = client.post("/api/what-if/ORG-001", json={"cisa_kev_weight": 5.0})
    assert res.status_code == 422

    # Negative weight should be rejected
    res = client.post("/api/what-if/ORG-001", json={"cisa_kev_weight": -0.5})
    assert res.status_code == 422


def test_why_not_analysis_validity():
    res = client.get("/api/why-not/ORG-001")
    assert res.status_code == 200
    data = res.json()
    assert "excluded_high_severity" in data
    assert len(data["excluded_high_severity"]) > 0
    # Every excluded high CVSS must have cvss >= 9.0
    for item in data["excluded_high_severity"]:
        assert item["cvss"] >= 9.0
        assert "reason" in item


def test_ai_fallback_on_arbitrary_cve():
    # When Ollama is offline or unavailable, AI endpoint returns deterministic fallback cleanly
    res = client.post("/api/ai/explain/ORG-001/CVE-2023-1262")
    assert res.status_code == 200
    data = res.json()
    assert "explanation" in data
    assert "why_it_matters" in data["explanation"]
    assert "next_action" in data["explanation"]
    assert data["ai"]["mode"] in ("local", "deterministic_fallback")
    assert data["fact_guard"]["status"] in ("PASSED", "FALLBACK")
