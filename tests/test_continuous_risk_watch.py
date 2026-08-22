"""
Comprehensive test suite for Phase 10 Continuous Risk Watch + Smart Alerts.
Verifies baseline snapshot establishment, deterministic change detection,
smart alerts for KEV/EPSS/Rank/Asset context changes, duplicate prevention,
read/dismiss state, organisation isolation, snapshot comparison, and data immutability.
"""

import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.risk_watch_service import risk_watch_service
from src.data_loader import DATA

client = TestClient(app)

VULNS_FILE = DATA / "vulnerabilities.csv"
GOLD_FILE = DATA / "gold_set.csv"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_baseline_and_second_risk_check():
    """Verify baseline snapshot creation and second run detection."""
    initial_vulns_hash = file_sha256(VULNS_FILE)
    initial_gold_hash = file_sha256(GOLD_FILE)

    org_id = "ORG-001"

    # 1. First run creates baseline
    res1 = client.post(f"/api/organizations/{org_id}/risk-check")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["status"] in ("BASELINE_CREATED", "NO_CHANGE", "RISK_CHANGE_DETECTED")
    assert data1["snapshot_id"].startswith("SNP-")

    # 2. Second immediate run without changes -> NO_CHANGE
    res2 = client.post(f"/api/organizations/{org_id}/risk-check")
    assert res2.status_code == 200
    data2 = res2.json()
    # Should report NO_CHANGE or 0 new alerts because state has not changed
    assert data2["new_alerts_count"] == 0

    # 3. Why Did My Risk Change endpoint
    why_res = client.get(f"/api/organizations/{org_id}/why-risk-changed")
    assert why_res.status_code == 200
    why_data = why_res.json()
    assert "current_posture" in why_data
    assert len(why_data["top_actions"]) > 0

    # 4. Immutability
    assert file_sha256(VULNS_FILE) == initial_vulns_hash
    assert file_sha256(GOLD_FILE) == initial_gold_hash


def test_smart_alerts_lifecycle_and_actions():
    """Verify listing alerts, summary KPIs, marking read, and dismissal."""
    org_id = "ORG-001"

    # List alerts
    list_res = client.get(f"/api/organizations/{org_id}/alerts")
    assert list_res.status_code == 200
    alerts = list_res.json()["alerts"]

    # Summary
    sum_res = client.get(f"/api/organizations/{org_id}/alerts/summary")
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert "total" in summary
    assert "unread" in summary

    if alerts:
        target_alert = alerts[0]
        alert_id = target_alert["alert_id"]

        # Get single alert
        get_res = client.get(f"/api/organizations/{org_id}/alerts/{alert_id}")
        assert get_res.status_code == 200
        assert get_res.json()["alert_id"] == alert_id

        # Mark read
        read_res = client.post(f"/api/organizations/{org_id}/alerts/{alert_id}/read")
        assert read_res.status_code == 200
        assert read_res.json()["is_read"] is True

        # Dismiss
        dismiss_res = client.post(f"/api/organizations/{org_id}/alerts/{alert_id}/dismiss")
        assert dismiss_res.status_code == 200
        assert dismiss_res.json()["is_dismissed"] is True


def test_snapshot_comparison_endpoint():
    """Verify comparing two historical snapshots returns structured diff."""
    org_id = "ORG-001"

    # Ensure at least 2 snapshots exist
    client.post(f"/api/organizations/{org_id}/risk-check")
    client.post(f"/api/organizations/{org_id}/risk-check")

    snaps_raw = risk_watch_service._read_snapshots().get("snapshots", [])
    org_snaps = [s for s in snaps_raw if s.get("org_id") == org_id]
    assert len(org_snaps) >= 2

    snap_a = org_snaps[0]["snapshot_id"]
    snap_b = org_snaps[-1]["snapshot_id"]

    comp_res = client.get(
        f"/api/organizations/{org_id}/snapshots/compare",
        params={"snapshot_a": snap_a, "snapshot_b": snap_b},
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["snapshot_a_id"] == snap_a
    assert comp_data["snapshot_b_id"] == snap_b
    assert "rank_shifts" in comp_data


def test_organisation_isolation_for_alerts():
    """Verify alerts in one organisation are never visible or accessible in another."""
    # Create test org
    org_payload = {
        "name": "Alert Isolation Test Org",
        "sector": "Fintech",
        "risk_appetite": "Low",
        "critical_products": ["Enterprise Router OS"],
        "technologies": [
            {
                "product": "Enterprise Router OS",
                "vendor": "Cisco",
                "version": "15.2(4)M",
                "exposure": "internet-facing",
                "importance": "critical",
                "name": "Isolated Gateway"
            }
        ]
    }
    org_res = client.post("/api/organizations", json=org_payload)
    assert org_res.status_code == 201
    test_org_id = org_res.json()["profile_id"]

    try:
        # Run risk check for test org
        risk_res = client.post(f"/api/organizations/{test_org_id}/risk-check")
        assert risk_res.status_code == 200

        # Check that ORG-002 cannot view test_org_id's alerts
        test_alerts = client.get(f"/api/organizations/{test_org_id}/alerts").json()["alerts"]
        if test_alerts:
            t_aid = test_alerts[0]["alert_id"]
            cross_get = client.get(f"/api/organizations/ORG-002/alerts/{t_aid}")
            assert cross_get.status_code == 404

    finally:
        client.delete(f"/api/organizations/{test_org_id}")


def test_alert_generation_scenarios_and_remediation_impact():
    """Verify change detection triggers appropriate alerts when assets or signals change."""
    # Create test org
    org_payload = {
        "name": "Risk Shift Testing Org",
        "sector": "Energy",
        "risk_appetite": "Low",
        "critical_products": ["Enterprise Router OS"],
        "technologies": [
            {
                "product": "Enterprise Router OS",
                "vendor": "Cisco",
                "version": "15.2(4)M",
                "exposure": "internal",  # Start internal
                "importance": "high",
                "name": "Internal Scada Bridge"
            }
        ]
    }
    create_res = client.post("/api/organizations", json=org_payload)
    assert create_res.status_code == 201
    org_id = create_res.json()["profile_id"]

    try:
        # 1. Baseline risk check
        base_check = client.post(f"/api/organizations/{org_id}/risk-check")
        assert base_check.status_code == 200
        assert base_check.json()["status"] == "BASELINE_CREATED"

        # 2. Update asset exposure: internal -> internet-facing (Escalates priority!)
        assets_res = client.get(f"/api/organizations/{org_id}/assets")
        asset_id = assets_res.json()["assets"][0]["asset_id"]
        update_asset_res = client.put(
            f"/api/organizations/{org_id}/assets/{asset_id}",
            json={"exposure": "internet-facing", "importance": "critical"}
        )
        assert update_asset_res.status_code == 200

        # 3. Second risk check -> Must detect ASSET_CONTEXT_CHANGE and/or NEW_TOP5_ENTRY!
        check2 = client.post(f"/api/organizations/{org_id}/risk-check")
        assert check2.status_code == 200
        data2 = check2.json()
        assert data2["status"] == "RISK_CHANGE_DETECTED"
        assert data2["new_alerts_count"] >= 1

        alerts_list = client.get(f"/api/organizations/{org_id}/alerts").json()["alerts"]
        alert_types = [a["alert_type"] for a in alerts_list]
        assert any(t in alert_types for t in ("ASSET_CONTEXT_CHANGE", "NEW_TOP5_ENTRY", "MAJOR_PRIORITY_SHIFT"))

        # 4. Third immediate check without changes -> Duplicate prevention (0 new alerts)
        check3 = client.post(f"/api/organizations/{org_id}/risk-check")
        assert check3.status_code == 200
        assert check3.json()["new_alerts_count"] == 0

    finally:
        client.delete(f"/api/organizations/{org_id}")

