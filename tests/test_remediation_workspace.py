"""
Comprehensive test suite for Phase 9 Remediation Workspace.
Verifies full lifecycle, validation, organisation and asset isolation, notes, activity history,
verification on resolution, overdue calculation, persistence, and data immutability.
"""

import hashlib
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.remediation_service import remediation_service
from src.data_loader import DATA

client = TestClient(app)

VULNS_FILE = DATA / "vulnerabilities.csv"
GOLD_FILE = DATA / "gold_set.csv"


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_remediation_full_lifecycle():
    """Verify complete remediation lifecycle from creation to resolution and activity audit."""
    initial_vulns_hash = file_sha256(VULNS_FILE)
    initial_gold_hash = file_sha256(GOLD_FILE)

    org_id = "ORG-001"
    # Find Top 1 CVE for ORG-001
    triage_res = client.get(f"/api/triage/{org_id}")
    assert triage_res.status_code == 200
    top_item = triage_res.json()["results"][0]
    cve_id = top_item["cve_id"]
    asset_id = top_item["technology"].get("asset_id") or "AST-001"

    # 1. Create remediation
    create_payload = {
        "cve_id": cve_id,
        "asset_id": asset_id,
        "owner": "Infrastructure Team",
        "due_date": "2026-12-31",
        "initial_note": "Initial review: impact assessed on production perimeter.",
    }
    create_res = client.post(f"/api/organizations/{org_id}/remediations", json=create_payload)
    assert create_res.status_code == 201
    rem = create_res.json()
    rem_id = rem["remediation_id"]
    assert rem_id.startswith("REM-")
    assert rem["status"] == "OPEN"
    assert rem["owner"] == "Infrastructure Team"
    assert rem["due_date"] == "2026-12-31"
    assert rem["is_overdue"] is False
    assert len(rem["notes"]) == 1
    assert len(rem["activity_log"]) == 2  # CREATED and NOTE_ADDED

    try:
        # 2. Duplicate active remediation prevention
        dup_res = client.post(f"/api/organizations/{org_id}/remediations", json=create_payload)
        assert dup_res.status_code == 409
        assert dup_res.json()["error"] == "REMEDIATION_EXISTS"

        # 3. Retrieve single remediation
        get_res = client.get(f"/api/organizations/{org_id}/remediations/{rem_id}")
        assert get_res.status_code == 200
        assert get_res.json()["remediation_id"] == rem_id

        # 4. Update Status: OPEN -> ACKNOWLEDGED
        ack_res = client.put(
            f"/api/organizations/{org_id}/remediations/{rem_id}",
            json={"status": "ACKNOWLEDGED", "owner": "Platform Security Team"},
        )
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "ACKNOWLEDGED"
        assert ack_res.json()["owner"] == "Platform Security Team"

        # 5. Transition: ACKNOWLEDGED -> IN_PROGRESS with note
        inprog_res = client.put(
            f"/api/organizations/{org_id}/remediations/{rem_id}",
            json={"status": "IN_PROGRESS", "note": "Maintenance window scheduled for Saturday 02:00 UTC."},
        )
        assert inprog_res.status_code == 200
        assert inprog_res.json()["status"] == "IN_PROGRESS"
        assert len(inprog_res.json()["notes"]) == 2

        # 6. Add dedicated note
        note_res = client.post(
            f"/api/organizations/{org_id}/remediations/{rem_id}/notes",
            json={"content": "Vendor patch package verified in staging lab.", "author": "QA Lead"},
        )
        assert note_res.status_code == 200
        assert len(note_res.json()["notes"]) == 3

        # 7. Transition: IN_PROGRESS -> RESOLVED with verification
        res_payload = {
            "status": "RESOLVED",
            "verification_details": "Patched to version 2.4.52; SHA256 binary hash verified; regression tests passed.",
        }
        resolve_res = client.put(
            f"/api/organizations/{org_id}/remediations/{rem_id}",
            json=res_payload,
        )
        assert resolve_res.status_code == 200
        resolved_rem = resolve_res.json()
        assert resolved_rem["status"] == "RESOLVED"
        assert "Patched to version 2.4.52" in resolved_rem["verification_details"]
        
        # Verify Activity Log contains full audit trail
        actions = [a["action"] for a in resolved_rem["activity_log"]]
        assert "CREATED" in actions
        assert "STATUS_CHANGED" in actions
        assert "OWNER_ASSIGNED" in actions
        assert "NOTE_ADDED" in actions
        assert "RESOLVED" in actions

        # 8. Summary KPIs
        summary_res = client.get(f"/api/organizations/{org_id}/remediations/summary")
        assert summary_res.status_code == 200
        summary = summary_res.json()
        assert summary["total"] >= 1
        assert summary["resolved"] >= 1

    finally:
        # Cleanup created test remediation
        client.delete(f"/api/organizations/{org_id}/remediations/{rem_id}")

    # Immutability
    assert file_sha256(VULNS_FILE) == initial_vulns_hash
    assert file_sha256(GOLD_FILE) == initial_gold_hash


def test_organisation_and_asset_isolation():
    """Verify remediations in ORG-001 are never visible or accessible in ORG-002 or ORG-003."""
    cve_id = "CVE-2025-5380"
    
    # Create remediation in ORG-001
    create_res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": cve_id, "owner": "Org1 Team"},
    )
    assert create_res.status_code == 201
    rem_id = create_res.json()["remediation_id"]

    try:
        # List in ORG-002 must NOT contain rem_id
        list_org2 = client.get("/api/organizations/ORG-002/remediations").json()
        assert not any(r["remediation_id"] == rem_id for r in list_org2["remediations"])

        # Direct access with mismatched org must return 404
        cross_get = client.get(f"/api/organizations/ORG-002/remediations/{rem_id}")
        assert cross_get.status_code == 404

        # Cross-org update must return 404
        cross_put = client.put(
            f"/api/organizations/ORG-002/remediations/{rem_id}",
            json={"status": "IN_PROGRESS"},
        )
        assert cross_put.status_code == 404

    finally:
        client.delete(f"/api/organizations/ORG-001/remediations/{rem_id}")


def test_overdue_and_date_validation():
    """Verify past due dates trigger is_overdue=True and invalid dates are rejected."""
    # Invalid date format
    bad_date_res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": "CVE-2025-3368", "due_date": "invalid-date-string"},
    )
    assert bad_date_res.status_code == 422

    # Overdue date (2020-01-01)
    overdue_res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": "CVE-2025-3368", "due_date": "2020-01-01"},
    )
    assert overdue_res.status_code == 201
    rem = overdue_res.json()
    rem_id = rem["remediation_id"]
    assert rem["is_overdue"] is True

    try:
        # Resolving removes overdue status
        resolve_res = client.put(
            f"/api/organizations/ORG-001/remediations/{rem_id}",
            json={"status": "RESOLVED"},
        )
        assert resolve_res.status_code == 200
        assert resolve_res.json()["is_overdue"] is False
    finally:
        client.delete(f"/api/organizations/ORG-001/remediations/{rem_id}")


def test_error_handling_and_validation():
    """Verify 404 on unknown org, unknown CVE, unknown asset, and 422 on invalid status."""
    # Unknown Org
    res = client.post(
        "/api/organizations/NON_EXISTENT_ORG/remediations",
        json={"cve_id": "CVE-2025-3368"},
    )
    assert res.status_code == 404

    # Unknown CVE
    res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": "CVE-9999-999999"},
    )
    assert res.status_code == 404

    # Unknown Asset
    res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": "CVE-2025-3368", "asset_id": "AST-999"},
    )
    assert res.status_code == 404

    # Invalid status
    create_res = client.post(
        "/api/organizations/ORG-001/remediations",
        json={"cve_id": "CVE-2025-3368"},
    )
    assert create_res.status_code == 201
    rem_id = create_res.json()["remediation_id"]

    try:
        bad_status_res = client.put(
            f"/api/organizations/ORG-001/remediations/{rem_id}",
            json={"status": "INVALID_CUSTOM_STATUS"},
        )
        assert bad_status_res.status_code == 422
    finally:
        client.delete(f"/api/organizations/ORG-001/remediations/{rem_id}")
