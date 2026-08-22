"""
Remediation Service (Phase 9).
Manages persistent, isolated organisational defensive remediation workflows, notes,
due dates, verification audits, and activity logs without altering source vulnerability data.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from backend.schemas.api_models import (
    RemediationActivitySchema,
    RemediationCreateRequest,
    RemediationListResponse,
    RemediationNoteCreateRequest,
    RemediationNoteSchema,
    RemediationRecordSchema,
    RemediationSummaryResponse,
    RemediationUpdateRequest,
)
from backend.services.triage_service import triage_service
from src.data_loader import DATA
from src.matcher import match_vulnerability

REMEDIATIONS_FILE = DATA / "remediations.json"

VALID_STATUSES = {
    "OPEN",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "MITIGATED",
    "RESOLVED",
    "RISK_ACCEPTED",
}


class RemediationService:
    def __init__(self):
        self._ensure_storage()

    def _ensure_storage(self) -> None:
        """Initialize data/remediations.json if missing."""
        if not REMEDIATIONS_FILE.exists():
            default_data = {
                "$schema_description": "VULTRA Remediation Workspace Records",
                "remediations": [],
            }
            REMEDIATIONS_FILE.write_text(
                json.dumps(default_data, indent=4), encoding="utf-8"
            )

    def _read_raw(self) -> dict:
        """Read raw json data from disk safely."""
        self._ensure_storage()
        try:
            return json.loads(REMEDIATIONS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {"$schema_description": "VULTRA Remediation Workspace Records", "remediations": []}

    def _save_raw(self, data: dict) -> None:
        """Atomically persist raw json data to disk."""
        tmp_file = REMEDIATIONS_FILE.with_suffix(".tmp")
        tmp_file.write_text(json.dumps(data, indent=4), encoding="utf-8")
        tmp_file.replace(REMEDIATIONS_FILE)

    def _is_overdue(self, due_date_str: Optional[str], status: str) -> bool:
        """Check if an item is past its due date and not in a terminal resolved state."""
        if not due_date_str or status.upper() in ("RESOLVED", "RISK_ACCEPTED"):
            return False
        try:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            return due_date_str < today_str
        except Exception:
            return False

    def _validate_date_format(self, date_str: str) -> None:
        """Ensure date matches YYYY-MM-DD."""
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
            raise ValueError(
                f"INVALID_DATE_FORMAT: Due date '{date_str}' must be in YYYY-MM-DD format."
            )
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            raise ValueError(
                f"INVALID_DATE_VALUE: Due date '{date_str}' is not a valid calendar date."
            )

    def list_remediations(
        self,
        org_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        asset_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> RemediationListResponse:
        """Retrieve filtered remediation records for a specific organisation."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' was not found.")

        raw_data = self._read_raw()
        all_rems = raw_data.get("remediations", [])

        # Hard boundary isolation
        org_rems = [r for r in all_rems if r.get("org_id", "").upper() == org_id.upper()]

        filtered = []
        for r in org_rems:
            r_status = r.get("status", "OPEN").upper()
            r_priority = r.get("priority", "MEDIUM").upper()
            r_asset_id = r.get("asset_id", "").upper()

            if status and status.upper() != "ALL" and r_status != status.upper().replace(" ", "_"):
                continue
            if priority and priority.upper() != "ALL" and r_priority != priority.upper():
                continue
            if asset_id and asset_id.upper() != "ALL" and r_asset_id != asset_id.upper():
                continue

            if search:
                s_lower = search.lower().strip()
                searchable_text = f"{r.get('cve_id', '')} {r.get('product', '')} {r.get('asset_name', '')} {r.get('owner', '')} {r_status}".lower()
                if s_lower not in searchable_text:
                    continue

            # Populate overdue flag
            r["is_overdue"] = self._is_overdue(r.get("due_date"), r_status)
            filtered.append(RemediationRecordSchema(**r))

        return RemediationListResponse(
            org_id=org_id,
            remediations=filtered,
            total_count=len(filtered),
        )

    def get_remediation(
        self, org_id: str, remediation_id: str
    ) -> Optional[RemediationRecordSchema]:
        """Get a single remediation record ensuring strict organisation isolation."""
        raw_data = self._read_raw()
        for r in raw_data.get("remediations", []):
            if (
                r.get("remediation_id", "").upper() == remediation_id.upper()
                and r.get("org_id", "").upper() == org_id.upper()
            ):
                r["is_overdue"] = self._is_overdue(r.get("due_date"), r.get("status", "OPEN"))
                return RemediationRecordSchema(**r)
        return None

    def get_remediation_by_id(
        self, remediation_id: str
    ) -> Optional[RemediationRecordSchema]:
        """Get a single remediation record by its global ID."""
        raw_data = self._read_raw()
        for r in raw_data.get("remediations", []):
            if r.get("remediation_id", "").upper() == remediation_id.upper():
                r["is_overdue"] = self._is_overdue(r.get("due_date"), r.get("status", "OPEN"))
                return RemediationRecordSchema(**r)
        return None

    def create_remediation(
        self, org_id: str, req: RemediationCreateRequest
    ) -> RemediationRecordSchema:
        """Create a new persistent defensive remediation record prefilled with authoritative analysis."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' does not exist.")

        cve_id_clean = req.cve_id.strip().upper()
        vulns = triage_service.get_vulnerabilities()
        target_vuln = next((v for v in vulns if v.cve_id.upper() == cve_id_clean), None)
        if not target_vuln:
            raise ValueError(f"CVE_NOT_FOUND: Vulnerability '{cve_id_clean}' does not exist in authoritative dataset.")

        # Determine target asset context
        target_tech = None
        if req.asset_id:
            asset_id_clean = req.asset_id.strip().upper()
            for idx, t in enumerate(org.technologies):
                aid = t.asset_id or f"AST-{idx+1:03d}"
                if aid.upper() == asset_id_clean:
                    target_tech = t
                    break
            if not target_tech:
                raise ValueError(
                    f"ASSET_NOT_FOUND: Asset '{req.asset_id}' does not exist in organisation '{org_id}'."
                )
        else:
            match_res = match_vulnerability(target_vuln, org)
            if match_res.matched and match_res.matched_technology:
                target_tech = match_res.matched_technology
            elif org.technologies:
                target_tech = org.technologies[0]
            else:
                raise ValueError(f"NO_ASSETS_CONFIGURED: Organisation '{org_id}' has no registered technology assets.")

        asset_id = target_tech.asset_id or "AST-001"
        asset_name = target_tech.name or target_tech.service or f"{target_tech.product} Asset"
        product = target_tech.product
        installed_version = target_tech.version or "unknown"
        environment = target_tech.environment or "production"
        exposure = target_tech.exposure or "internet-facing"
        importance = target_tech.importance or "critical"

        # Deterministic Risk Evaluation (READ-ONLY)
        triage_res = triage_service.run_triage(org_id, limit=540)
        priority = "MEDIUM"
        score = 50.0
        if triage_res:
            for item in triage_res.results:
                if item.cve_id.upper() == cve_id_clean:
                    priority = item.priority
                    score = item.score
                    break

        if req.due_date:
            self._validate_date_format(req.due_date.strip())

        raw_data = self._read_raw()
        rems_list = raw_data.get("remediations", [])

        # Check duplicate active remediation
        for r in rems_list:
            if (
                r.get("org_id", "").upper() == org_id.upper()
                and r.get("cve_id", "").upper() == cve_id_clean
                and r.get("asset_id", "").upper() == asset_id.upper()
                and r.get("status", "").upper() != "RESOLVED"
            ):
                raise ValueError(
                    f"REMEDIATION_EXISTS: An active remediation record ({r.get('remediation_id')}) already exists for {cve_id_clean} on asset {asset_id}."
                )

        # Generate collision-free REM-00X ID
        max_num = 0
        for r in rems_list:
            rid = r.get("remediation_id", "")
            m = re.match(r"^REM-(\d+)$", rid, re.IGNORECASE)
            if m:
                max_num = max(max_num, int(m.group(1)))
            else:
                max_num = max(max_num, len(rems_list))
        new_rem_id = f"REM-{max_num + 1:03d}"

        now_iso = datetime.now(timezone.utc).isoformat()
        owner_clean = (req.owner or "Security Team").strip()
        due_date_clean = req.due_date.strip() if req.due_date else None

        initial_activity = [
            {
                "activity_id": "ACT-001",
                "action": "CREATED",
                "details": f"Remediation created for {cve_id_clean} on {asset_name} ({asset_id}). Owner assigned: {owner_clean}.",
                "author": "Security Operations",
                "timestamp": now_iso,
            }
        ]

        initial_notes = []
        if req.initial_note and req.initial_note.strip():
            initial_notes.append(
                {
                    "note_id": "NOT-001",
                    "author": owner_clean,
                    "content": req.initial_note.strip(),
                    "created_at": now_iso,
                }
            )
            initial_activity.append(
                {
                    "activity_id": "ACT-002",
                    "action": "NOTE_ADDED",
                    "details": f"Initial note logged: '{req.initial_note.strip()}'",
                    "author": owner_clean,
                    "timestamp": now_iso,
                }
            )

        new_record = {
            "remediation_id": new_rem_id,
            "org_id": org_id,
            "cve_id": cve_id_clean,
            "asset_id": asset_id,
            "asset_name": asset_name,
            "product": product,
            "installed_version": installed_version,
            "environment": environment,
            "exposure": exposure,
            "importance": importance,
            "priority": priority,
            "score": score,
            "status": "OPEN",
            "owner": owner_clean,
            "due_date": due_date_clean,
            "is_overdue": self._is_overdue(due_date_clean, "OPEN"),
            "verification_details": None,
            "notes": initial_notes,
            "activity_log": initial_activity,
            "created_at": now_iso,
            "updated_at": now_iso,
        }

        rems_list.append(new_record)
        raw_data["remediations"] = rems_list
        self._save_raw(raw_data)

        return RemediationRecordSchema(**new_record)

    def update_remediation(
        self, org_id: str, remediation_id: str, req: RemediationUpdateRequest
    ) -> Optional[RemediationRecordSchema]:
        """Update remediation workflow status, owner, due date, or add note/verification."""
        raw_data = self._read_raw()
        rems_list = raw_data.get("remediations", [])

        target_idx = None
        for idx, r in enumerate(rems_list):
            if (
                r.get("remediation_id", "").upper() == remediation_id.upper()
                and r.get("org_id", "").upper() == org_id.upper()
            ):
                target_idx = idx
                break

        if target_idx is None:
            return None

        record = rems_list[target_idx]
        now_iso = datetime.now(timezone.utc).isoformat()
        activities = record.get("activity_log", [])
        notes = record.get("notes", [])

        # 1. Update Status
        if req.status is not None:
            status_clean = req.status.strip().upper().replace(" ", "_")
            if status_clean not in VALID_STATUSES:
                raise ValueError(
                    f"INVALID_STATUS: '{req.status}' is not valid. Choose from: {', '.join(sorted(VALID_STATUSES))}."
                )

            old_status = record.get("status", "OPEN")
            if status_clean != old_status:
                record["status"] = status_clean
                act_id = f"ACT-{len(activities) + 1:03d}"
                details = f"Status transitioned from {old_status} to {status_clean}."
                if status_clean == "RESOLVED" and req.verification_details:
                    record["verification_details"] = req.verification_details.strip()
                    details += f" Verification evidence: '{req.verification_details.strip()}'"

                activities.append(
                    {
                        "activity_id": act_id,
                        "action": "RESOLVED" if status_clean == "RESOLVED" else "STATUS_CHANGED",
                        "details": details,
                        "author": record.get("owner", "Security Operations"),
                        "timestamp": now_iso,
                    }
                )

        # 2. Update Owner
        if req.owner is not None:
            owner_clean = req.owner.strip()
            old_owner = record.get("owner", "Unassigned")
            if owner_clean != old_owner:
                record["owner"] = owner_clean
                act_id = f"ACT-{len(activities) + 1:03d}"
                activities.append(
                    {
                        "activity_id": act_id,
                        "action": "OWNER_ASSIGNED",
                        "details": f"Ownership reassigned from '{old_owner}' to '{owner_clean}'.",
                        "author": "Security Operations",
                        "timestamp": now_iso,
                    }
                )

        # 3. Update Due Date
        if req.due_date is not None:
            due_clean = req.due_date.strip() if req.due_date.strip() else None
            if due_clean:
                self._validate_date_format(due_clean)
            old_due = record.get("due_date")
            if due_clean != old_due:
                record["due_date"] = due_clean
                act_id = f"ACT-{len(activities) + 1:03d}"
                activities.append(
                    {
                        "activity_id": act_id,
                        "action": "DUE_DATE_SET",
                        "details": f"Due date updated to {due_clean if due_clean else 'None'}.",
                        "author": "Security Operations",
                        "timestamp": now_iso,
                    }
                )

        # 4. Add Note
        if req.note is not None and req.note.strip():
            note_content = req.note.strip()
            note_id = f"NOT-{len(notes) + 1:03d}"
            notes.append(
                {
                    "note_id": note_id,
                    "author": record.get("owner", "Security Team"),
                    "content": note_content,
                    "created_at": now_iso,
                }
            )
            act_id = f"ACT-{len(activities) + 1:03d}"
            activities.append(
                {
                    "activity_id": act_id,
                    "action": "NOTE_ADDED",
                    "details": f"Note logged: '{note_content}'",
                    "author": record.get("owner", "Security Team"),
                    "timestamp": now_iso,
                }
            )

        record["activity_log"] = activities
        record["notes"] = notes
        record["updated_at"] = now_iso
        record["is_overdue"] = self._is_overdue(record.get("due_date"), record.get("status", "OPEN"))

        rems_list[target_idx] = record
        raw_data["remediations"] = rems_list
        self._save_raw(raw_data)

        return RemediationRecordSchema(**record)

    def add_note(
        self, org_id: str, remediation_id: str, req: RemediationNoteCreateRequest
    ) -> Optional[RemediationRecordSchema]:
        """Append a plain-text note to a remediation record."""
        return self.update_remediation(
            org_id,
            remediation_id,
            RemediationUpdateRequest(note=req.content.strip()),
        )

    def delete_remediation(self, org_id: str, remediation_id: str) -> bool:
        """Safely remove a remediation record."""
        raw_data = self._read_raw()
        rems_list = raw_data.get("remediations", [])

        initial_len = len(rems_list)
        rems_list = [
            r
            for r in rems_list
            if not (
                r.get("remediation_id", "").upper() == remediation_id.upper()
                and r.get("org_id", "").upper() == org_id.upper()
            )
        ]

        if len(rems_list) == initial_len:
            return False

        raw_data["remediations"] = rems_list
        self._save_raw(raw_data)
        return True

    def get_summary(self, org_id: str) -> RemediationSummaryResponse:
        """Compute KPI summary counts for an organisation."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' was not found.")

        raw_data = self._read_raw()
        org_rems = [
            r
            for r in raw_data.get("remediations", [])
            if r.get("org_id", "").upper() == org_id.upper()
        ]

        summary = {
            "total": len(org_rems),
            "open": 0,
            "acknowledged": 0,
            "in_progress": 0,
            "mitigated": 0,
            "resolved": 0,
            "risk_accepted": 0,
            "overdue": 0,
        }

        for r in org_rems:
            st = r.get("status", "OPEN").upper()
            if st == "OPEN":
                summary["open"] += 1
            elif st == "ACKNOWLEDGED":
                summary["acknowledged"] += 1
            elif st == "IN_PROGRESS":
                summary["in_progress"] += 1
            elif st == "MITIGATED":
                summary["mitigated"] += 1
            elif st == "RESOLVED":
                summary["resolved"] += 1
            elif st == "RISK_ACCEPTED":
                summary["risk_accepted"] += 1

            if self._is_overdue(r.get("due_date"), st):
                summary["overdue"] += 1

        return RemediationSummaryResponse(org_id=org_id, **summary)


remediation_service = RemediationService()
