import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def run_smoke_tests():
    print("=== VULTRA API Smoke Test Suite ===")

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[OK] GET /api/health:", r.json())

    # 2. Profiles
    r = client.get("/api/profiles")
    assert r.status_code == 200, f"Profiles failed: {r.text}"
    profiles = r.json()["profiles"]
    assert len(profiles) >= 2
    print(f"[OK] GET /api/profiles ({len(profiles)} profiles loaded)")

    # 3. Profile Detail
    r = client.get("/api/profiles/ORG-001")
    assert r.status_code == 200
    p1 = r.json()
    print(f"[OK] GET /api/profiles/ORG-001 ({p1['name']})")

    # 4. Triage ORG-001
    r = client.get("/api/triage/ORG-001?limit=5")
    assert r.status_code == 200
    triage1 = r.json()
    assert len(triage1["results"]) == 5
    top1_org1 = triage1["results"][0]
    print(f"[OK] GET /api/triage/ORG-001: Top 1 is {top1_org1['cve_id']} ({top1_org1['technology']['product']}) - Score: {top1_org1['score']:.1f}")

    # 5. Triage ORG-002
    r = client.get("/api/triage/ORG-002?limit=5")
    assert r.status_code == 200
    triage2 = r.json()
    assert len(triage2["results"]) == 5
    top1_org2 = triage2["results"][0]
    print(f"[OK] GET /api/triage/ORG-002: Top 1 is {top1_org2['cve_id']} ({top1_org2['technology']['product']}) - Score: {top1_org2['score']:.1f}")

    # 6. Evidence
    r = client.get(f"/api/evidence/ORG-001/{top1_org1['cve_id']}")
    assert r.status_code == 200
    ev = r.json()
    assert ev["cve_id"] == top1_org1["cve_id"]
    print(f"[OK] GET /api/evidence/ORG-001/{top1_org1['cve_id']}: CVSS {ev['source_facts']['cvss_base_score']}, KEV={ev['source_facts']['cisa_kev']}")

    # 7. Why-Not
    r = client.get("/api/why-not/ORG-001")
    assert r.status_code == 200
    whynot = r.json()
    assert len(whynot["excluded_high_severity"]) > 0
    neg_cve = whynot["excluded_high_severity"][0]
    print(f"[OK] GET /api/why-not/ORG-001: Excluded High CVSS {neg_cve['cve_id']} (CVSS {neg_cve['cvss']}) - Reason: {neg_cve['reason_code']}")

    # 8. Compare
    r = client.get("/api/compare/ORG-001/ORG-002")
    assert r.status_code == 200
    comp = r.json()
    print(f"[OK] GET /api/compare/ORG-001/ORG-002: Common Top 5 = {len(comp['common_cves'])}, Unique A = {len(comp['unique_a_cves'])}, Unique B = {len(comp['unique_b_cves'])}")

    # 9. What-If Simulation
    r = client.post("/api/what-if/ORG-001", json={"cisa_kev_weight": 0.50, "first_epss_weight": 0.10})
    assert r.status_code == 200
    sim = r.json()
    print(f"[OK] POST /api/what-if/ORG-001: Simulated top item {sim['simulated_top5'][0]['cve_id']} (score: {sim['simulated_top5'][0]['simulated_score']:.1f})")

    # 10. AI Copilot / Fact Guard Explain
    r = client.post(f"/api/ai/explain/ORG-001/{top1_org1['cve_id']}")
    assert r.status_code == 200
    ai_res = r.json()
    print(f"[OK] POST /api/ai/explain: Mode={ai_res['ai']['mode']}, FactGuard={ai_res['fact_guard']['status']}")

    print("\n>>> ALL 10 SMOKE TESTS PASSED CLEANLY! <<<")

if __name__ == "__main__":
    run_smoke_tests()
