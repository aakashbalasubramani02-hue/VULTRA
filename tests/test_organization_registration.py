"""
Unit and API integration test suite for Dynamic Organisation Registration & Management.
Verifies registration, input validation, collision-free ID generation, safe persistence,
instant dynamic triage analysis, editing, benchmark protection, and file immutability.
"""

import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from src.data_loader import DATA

client = TestClient(app)

VULNS_FILE = DATA / 'vulnerabilities.csv'
GOLD_FILE = DATA / 'gold_set.csv'
PROFILES_FILE = DATA / 'profiles.json'


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_product_catalogue_discovery():
    """Verify dynamic discovery of products from vulnerabilities.csv."""
    res = client.get("/api/organizations/catalogue/products")
    assert res.status_code == 200
    data = res.json()
    assert "products" in data
    assert len(data["products"]) >= 6
    assert "Web Application Firewall" in data["products"]
    assert "Identity Provider SaaS" in data["products"]


def test_dynamic_organization_lifecycle_and_analysis():
    """Full lifecycle: Register -> Persist -> Triage -> Evidence -> Edit -> Re-analyse -> Delete."""
    initial_vulns_hash = file_sha256(VULNS_FILE)
    initial_gold_hash = file_sha256(GOLD_FILE)

    # 1. Register new organisation
    new_org_payload = {
        "name": "Apex Genomic Health Networks",
        "sector": "Healthcare",
        "risk_appetite": "Low",
        "critical_products": ["Web Application Firewall", "Cloud Database Engine"],
        "weight_modifiers": {
            "cvss_weight": 0.15,
            "cisa_kev_weight": 0.35,
            "first_epss_weight": 0.25,
            "exposure_weight": 0.15,
            "importance_weight": 0.10,
        },
    }

    reg_res = client.post("/api/organizations", json=new_org_payload)
    assert reg_res.status_code == 201
    created_org = reg_res.json()
    org_id = created_org["profile_id"]
    assert org_id.startswith("ORG-")
    assert created_org["name"] == "Apex Genomic Health Networks"
    assert created_org["sector"] == "Healthcare"

    # 2. Check persistence in profiles.json
    raw_profiles = json.loads(PROFILES_FILE.read_text(encoding='utf-8'))
    org_ids_on_disk = [o["org_id"] for o in raw_profiles["organizations"]]
    assert org_id in org_ids_on_disk

    # 3. Dynamic Triage Analysis against real vulnerabilities.csv
    triage_res = client.get(f"/api/triage/{org_id}")
    assert triage_res.status_code == 200
    triage_data = triage_res.json()
    assert len(triage_data["results"]) == 5
    top_item = triage_data["results"][0]
    assert top_item["rank"] == 1
    assert top_item["technology"]["product"] in ("Web Application Firewall", "Cloud Database Engine")

    # 4. Evidence retrieval for new organisation
    ev_res = client.get(f"/api/evidence/{org_id}/{top_item['cve_id']}")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["profile_id"] == org_id
    assert ev_data["cve_id"] == top_item["cve_id"]

    # 5. Why-Not analysis for new organisation
    why_res = client.get(f"/api/why-not/{org_id}")
    assert why_res.status_code == 200

    # 6. Duplicate registration prevention
    dup_res = client.post("/api/organizations", json=new_org_payload)
    assert dup_res.status_code == 409
    assert dup_res.json()["error"] == "ORGANISATION_EXISTS"

    # 7. Edit organisation products
    edit_payload = {
        "critical_products": ["Core Banking Framework"],
    }
    edit_res = client.put(f"/api/organizations/{org_id}", json=edit_payload)
    assert edit_res.status_code == 200
    assert edit_res.json()["critical_products"] == ["Core Banking Framework"]

    # Re-analysis must now rank Core Banking Framework items
    re_triage = client.get(f"/api/triage/{org_id}")
    assert re_triage.status_code == 200
    assert re_triage.json()["results"][0]["technology"]["product"] == "Core Banking Framework"

    # 8. Benchmark deletion protection
    del_benchmark = client.delete("/api/organizations/ORG-001")
    assert del_benchmark.status_code == 403
    assert del_benchmark.json()["error"] == "BENCHMARK_PROTECTED"

    # 9. Clean deletion of dynamic organisation
    del_res = client.delete(f"/api/organizations/{org_id}")
    assert del_res.status_code == 200

    # Verify removed from profiles.json
    raw_after_del = json.loads(PROFILES_FILE.read_text(encoding='utf-8'))
    assert org_id not in [o["org_id"] for o in raw_after_del["organizations"]]

    # 10. Data immutability assertion
    assert file_sha256(VULNS_FILE) == initial_vulns_hash
    assert file_sha256(GOLD_FILE) == initial_gold_hash
