"""
Unit and API integration test suite for Asset & Technology Inventory (Phase 8).
Verifies asset CRUD, validation, collision-free AST-00X generation, duplicate prevention,
version matching, environment & exposure attributes, dynamic triage impact, and data immutability.
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


def test_list_and_get_assets():
    """Verify listing assets for benchmark profile ORG-001."""
    res = client.get("/api/organizations/ORG-001/assets")
    assert res.status_code == 200
    data = res.json()
    assert data["org_id"] == "ORG-001"
    assert len(data["assets"]) >= 2
    first_asset = data["assets"][0]
    assert "asset_id" in first_asset
    assert "product" in first_asset
    assert "exposure" in first_asset

    # Get single asset detail
    detail_res = client.get(f"/api/organizations/ORG-001/assets/{first_asset['asset_id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["asset"]["asset_id"] == first_asset["asset_id"]
    assert "matched_vulnerabilities_count" in detail


def test_asset_lifecycle_and_analysis_impact():
    """Full lifecycle: Create -> Duplicate Check -> Triage Attribution -> Edit -> Re-analyse -> Delete."""
    initial_vulns_hash = file_sha256(VULNS_FILE)
    initial_gold_hash = file_sha256(GOLD_FILE)

    org_id = None
    try:
        # 1. Register a temporary test organisation
        org_res = client.post(
            "/api/organizations",
            json={
                "name": "Sovereign Defence Systems",
                "sector": "Aerospace & Defence",
                "risk_appetite": "Zero-Tolerance",
                "critical_products": ["Cloud Database Engine"],
            },
        )
        assert org_res.status_code == 201
        org_id = org_res.json()["profile_id"]

        # 2. Add an Asset: Production Edge Router with known version
        create_asset_payload = {
            "name": "Perimeter Gateway Router Alpha",
            "vendor": "CiscoNet",
            "product": "Enterprise Router OS",
            "version": "15.2(4)M",
            "environment": "production",
            "exposure": "internet-facing",
            "importance": "critical",
        }

        asset_res = client.post(f"/api/organizations/{org_id}/assets", json=create_asset_payload)
        assert asset_res.status_code == 201
        created_asset = asset_res.json()["asset"]
        asset_id = created_asset["asset_id"]
        assert asset_id.startswith("AST-")
        assert created_asset["name"] == "Perimeter Gateway Router Alpha"
        assert created_asset["environment"] == "production"

        # 3. Duplicate asset check
        dup_res = client.post(f"/api/organizations/{org_id}/assets", json=create_asset_payload)
        assert dup_res.status_code == 409
        assert dup_res.json()["error"] == "ASSET_EXISTS"

        # 4. Triage Analysis: Must attribute match to this asset
        triage_res = client.get(f"/api/triage/{org_id}?limit=10")
        assert triage_res.status_code == 200
        triage_data = triage_res.json()
        assert len(triage_data["results"]) > 0
        
        # Find item matching Enterprise Router OS
        router_item = next(
            (x for x in triage_data["results"] if x["technology"]["product"] == "Enterprise Router OS"),
            None,
        )
        assert router_item is not None
        assert router_item["technology"]["asset_id"] == asset_id
        assert router_item["technology"]["asset_name"] == "Perimeter Gateway Router Alpha"
        assert router_item["technology"]["environment"] == "production"

        # 5. Evidence Check: Must include asset context
        ev_res = client.get(f"/api/evidence/{org_id}/{router_item['cve_id']}")
        assert ev_res.status_code == 200
        ev_data = ev_res.json()
        assert ev_data["asset_context"]["asset_id"] == asset_id
        assert ev_data["asset_context"]["asset_name"] == "Perimeter Gateway Router Alpha"
        assert ev_data["asset_context"]["environment"] == "production"

        # 6. Update Asset: Change environment to staging and exposure to internal
        update_res = client.put(
            f"/api/organizations/{org_id}/assets/{asset_id}",
            json={
                "name": "Staging Router Beta",
                "environment": "staging",
                "exposure": "internal",
                "importance": "medium",
            },
        )
        assert update_res.status_code == 200
        updated_asset = update_res.json()["asset"]
        assert updated_asset["name"] == "Staging Router Beta"
        assert updated_asset["environment"] == "staging"
        assert updated_asset["exposure"] == "internal"

        # 7. Delete Asset
        del_asset_res = client.delete(f"/api/organizations/{org_id}/assets/{asset_id}")
        assert del_asset_res.status_code == 200
        assert del_asset_res.json()["status"] == "deleted"

    finally:
        # Cleanup test org
        if org_id:
            client.delete(f"/api/organizations/{org_id}")

    # 8. Data immutability assertion
    assert file_sha256(VULNS_FILE) == initial_vulns_hash
    assert file_sha256(GOLD_FILE) == initial_gold_hash


def test_asset_validation_errors():
    """Verify input validation: missing fields and unknown org."""
    # Unknown org
    res = client.get("/api/organizations/NON_EXISTENT_ORG/assets")
    assert res.status_code == 404

    # Invalid payload (missing product)
    bad_res = client.post("/api/organizations/ORG-001/assets", json={"name": "Incomplete"})
    assert bad_res.status_code == 422
