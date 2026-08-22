from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "vultra-api"
    assert data["version"] == "1.0"


def test_list_profiles():
    response = client.get("/api/profiles")
    assert response.status_code == 200
    data = response.json()
    assert "profiles" in data
    assert len(data["profiles"]) >= 3
    org_ids = [p["profile_id"] for p in data["profiles"]]
    assert "ORG-001" in org_ids
    assert "ORG-002" in org_ids
    assert "ORG-003" in org_ids


def test_get_valid_profile():
    response = client.get("/api/profiles/ORG-001")
    assert response.status_code == 200
    data = response.json()
    assert data["profile_id"] == "ORG-001"
    assert data["name"] == "Global Retail Bank"
    assert len(data["technologies"]) == 2
    assert "weights" in data
    assert data["weights"]["cisa_kev_weight"] == 0.35


def test_get_missing_profile_returns_404():
    response = client.get("/api/profiles/INVALID-ORG-999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "PROFILE_NOT_FOUND"


def test_triage_endpoint_org001():
    response = client.get("/api/triage/ORG-001")
    assert response.status_code == 200
    data = response.json()

    assert data["profile"]["id"] == "ORG-001"
    assert data["summary"]["total_records"] == 540
    assert data["summary"]["matched_candidates"] > 0

    results = data["results"]
    assert len(results) == 5

    # Verify ranking order and attributes
    for idx, item in enumerate(results, start=1):
        assert item["rank"] == idx
        assert item["cve_id"].startswith("CVE-")
        assert item["priority"] in ("URGENT", "HIGH", "MEDIUM", "LOW")
        assert item["score"] > 0
        assert item["title"] != ""
        assert item["technology"]["product"] != ""
        assert item["why_it_matters"] != ""
        assert item["next_action"] != ""
        assert item["confidence"] in ("HIGH", "MEDIUM", "LOW")
        assert "kev" in item["factors"]
        assert "epss" in item["factors"]
        assert "cvss" in item["factors"]
        assert "exposure" in item["factors"]
        assert "importance" in item["factors"]
        assert "reference_url" in item["provenance"]


def test_two_profiles_produce_different_triage_results():
    res1 = client.get("/api/triage/ORG-001")
    res2 = client.get("/api/triage/ORG-002")

    assert res1.status_code == 200
    assert res2.status_code == 200

    top5_1 = [x["cve_id"] for x in res1.json()["results"]]
    top5_2 = [x["cve_id"] for x in res2.json()["results"]]

    assert top5_1 != top5_2


def test_evidence_endpoint_valid_cve():
    # First get top #1 CVE for ORG-001
    triage_res = client.get("/api/triage/ORG-001")
    top_cve = triage_res.json()["results"][0]["cve_id"]

    ev_res = client.get(f"/api/evidence/ORG-001/{top_cve}")
    assert ev_res.status_code == 200
    data = ev_res.json()

    assert data["cve_id"] == top_cve
    assert data["profile_id"] == "ORG-001"
    assert data["rank"] == 1
    assert "source_facts" in data
    assert "matching" in data
    assert "asset_context" in data
    assert "score_factors" in data
    assert "weights_used" in data
    assert "explanation" in data
    assert "https://" in data["source_facts"]["reference_url"]


def test_evidence_endpoint_missing_cve():
    response = client.get("/api/evidence/ORG-001/CVE-NONEXISTENT-9999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "CVE_NOT_FOUND"


def test_why_not_negative_test_endpoint():
    response = client.get("/api/why-not/ORG-001")
    assert response.status_code == 200
    data = response.json()

    assert data["profile_id"] == "ORG-001"
    assert "negative_test_summary" in data
    assert len(data["excluded_high_severity"]) > 0

    # Ensure excluded items are high CVSS (>= 9.0) on unused products
    for item in data["excluded_high_severity"]:
        assert item["cvss"] >= 9.0
        assert item["decision"] in ("EXCLUDE", "NOT_AFFECTED")


def test_compare_endpoint():
    response = client.get("/api/compare/ORG-001/ORG-002")
    assert response.status_code == 200
    data = response.json()

    assert data["profile_a"]["id"] == "ORG-001"
    assert data["profile_b"]["id"] == "ORG-002"
    assert len(data["top5_a"]) == 5
    assert len(data["top5_b"]) == 5
    assert isinstance(data["common_cves"], list)
    assert isinstance(data["unique_a_cves"], list)
    assert isinstance(data["unique_b_cves"], list)
    assert len(data["differences"]) > 0
    assert "summary" in data


def test_what_if_simulation_endpoint():
    payload = {
        "cisa_kev_weight": 0.30,
        "first_epss_weight": 0.50,
        "cvss_weight": 0.20,
        "exposure_weight": 0.15,
        "importance_weight": 0.10,
    }
    response = client.post("/api/what-if/ORG-001", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["profile_id"] == "ORG-001"
    assert data["simulated_weights"]["first_epss_weight"] == 0.50
    assert len(data["simulated_top5"]) == 5
    assert len(data["original_top5"]) == 5

    # Verify official profile in service is not mutated
    orig_profile = client.get("/api/profiles/ORG-001").json()
    assert orig_profile["weights"]["first_epss_weight"] == 0.25
