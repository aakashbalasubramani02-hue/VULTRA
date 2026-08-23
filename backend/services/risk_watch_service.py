"""
Continuous Risk Watch & Smart Alert Service (Phase 10).
Performs deterministic change detection between analysis snapshots,
surfaces actionable alerts for meaningful risk movements without noise,
and maintains an immutable risk history audit trail.
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from backend.schemas.api_models import (
    AlertListResponse,
    AlertSummaryResponse,
    AnalysisSnapshotSchema,
    RiskCheckResponse,
    SmartAlertSchema,
    SnapshotComparisonItemDiff,
    SnapshotComparisonResponse,
    SnapshotItemSchema,
    SnapshotListResponse,
    WhyRiskChangedDriver,
    WhyRiskChangedResponse,
)
from backend.services.remediation_service import remediation_service
from backend.services.triage_service import triage_service
from src.data_loader import DATA

SNAPSHOTS_FILE = DATA / "snapshots.json"
ALERTS_FILE = DATA / "alerts.json"

VALID_SEVERITIES = {"CRITICAL", "HIGH", "MEDIUM", "INFO"}


class RiskWatchService:
    def __init__(self):
        self._ensure_storage()

    def _ensure_storage(self) -> None:
        """Initialize data/snapshots.json and data/alerts.json if missing."""
        if not SNAPSHOTS_FILE.exists():
            SNAPSHOTS_FILE.write_text(
                json.dumps({"$schema_description": "VULTRA Analysis Snapshots", "snapshots": []}, indent=4),
                encoding="utf-8",
            )
        if not ALERTS_FILE.exists():
            ALERTS_FILE.write_text(
                json.dumps({"$schema_description": "VULTRA Smart Risk Alerts", "alerts": []}, indent=4),
                encoding="utf-8",
            )

    def _read_snapshots(self) -> dict:
        self._ensure_storage()
        try:
            return json.loads(SNAPSHOTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {"snapshots": []}

    def _save_snapshots(self, data: dict) -> None:
        tmp_file = SNAPSHOTS_FILE.with_suffix(".tmp")
        tmp_file.write_text(json.dumps(data, indent=4), encoding="utf-8")
        tmp_file.replace(SNAPSHOTS_FILE)

    def _read_alerts(self) -> dict:
        self._ensure_storage()
        try:
            return json.loads(ALERTS_FILE.read_text(encoding="utf-8"))
        except Exception:
            return {"alerts": []}

    def _save_alerts(self, data: dict) -> None:
        tmp_file = ALERTS_FILE.with_suffix(".tmp")
        tmp_file.write_text(json.dumps(data, indent=4), encoding="utf-8")
        tmp_file.replace(ALERTS_FILE)

    def _evaluate_posture(self, critical_count: int, high_count: int) -> str:
        if critical_count >= 2:
            return "CRITICAL"
        if critical_count >= 1 or high_count >= 3:
            return "HIGH"
        if high_count >= 1:
            return "MEDIUM"
        return "LOW"

    def _create_snapshot_object(self, org_id: str) -> AnalysisSnapshotSchema:
        """Execute deterministic triage and build an immutable AnalysisSnapshotSchema."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' does not exist.")

        triage_res = triage_service.run_triage(org_id, limit=540)
        rems_raw = remediation_service._read_raw().get("remediations", [])
        org_rems = {r["cve_id"].upper(): r.get("status", "NONE") for r in rems_raw if r.get("org_id", "").upper() == org_id.upper()}

        now_iso = datetime.now(timezone.utc).isoformat()
        items: list[SnapshotItemSchema] = []
        critical_count = 0
        high_count = 0

        for idx, r in enumerate(triage_res.results):
            rank = idx + 1
            if r.priority == "URGENT" or r.score >= 90.0:
                critical_count += 1
            elif r.priority == "HIGH" or r.score >= 70.0:
                high_count += 1

            matched_tech = r.technology
            rem_status = org_rems.get(r.cve_id.upper(), "NONE")

            items.append(
                SnapshotItemSchema(
                    cve_id=r.cve_id,
                    rank=rank,
                    score=r.score,
                    priority=r.priority,
                    confidence=r.confidence,
                    matched_asset_id=matched_tech.asset_id,
                    asset_name=matched_tech.asset_name,
                    product=matched_tech.product,
                    version=matched_tech.version or "unknown",
                    environment=matched_tech.environment or "production",
                    exposure=r.exposure or "internet-facing",
                    importance=r.importance or "critical",
                    cvss=r.signals.cvss,
                    kev=r.signals.kev,
                    epss=r.signals.epss,
                    match_status=r.match_status or ("MATCH" if r.confidence != "LOW" else "NEEDS_VERIFICATION"),
                    remediation_status=rem_status,
                )
            )

        snaps_data = self._read_snapshots()
        snaps_list = snaps_data.get("snapshots", [])
        max_num = 0
        for s in snaps_list:
            sid = s.get("snapshot_id", "")
            m = re.match(r"^SNP-(\d+)$", sid, re.IGNORECASE)
            if m:
                max_num = max(max_num, int(m.group(1)))
            else:
                max_num = max(max_num, len(snaps_list))
        new_snap_id = f"SNP-{max_num + 1:03d}"

        top5 = [it.cve_id for it in items[:5]]
        posture = self._evaluate_posture(critical_count, high_count)

        return AnalysisSnapshotSchema(
            snapshot_id=new_snap_id,
            org_id=org_id,
            created_at=now_iso,
            analysis_version="1.0",
            total_vulnerabilities=triage_res.summary.total_records,
            matched_count=len(items),
            top5_cves=top5,
            active_critical_count=critical_count,
            active_high_count=high_count,
            overall_risk_posture=posture,
            items=items,
        )

    def run_risk_check(self, org_id: str) -> RiskCheckResponse:
        """Run analysis, compare with latest snapshot, generate smart alerts, and record history."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' was not found.")

        current_snapshot = self._create_snapshot_object(org_id)
        snaps_data = self._read_snapshots()
        snaps_list = snaps_data.get("snapshots", [])

        # Find latest previous snapshot for this organisation
        org_snaps = [s for s in snaps_list if s.get("org_id", "").upper() == org_id.upper()]
        previous_snapshot: Optional[AnalysisSnapshotSchema] = None
        if org_snaps:
            previous_snapshot = AnalysisSnapshotSchema(**org_snaps[-1])

        # Persist new snapshot (immutability rule)
        snaps_list.append(current_snapshot.model_dump())
        snaps_data["snapshots"] = snaps_list
        self._save_snapshots(snaps_data)

        # Baseline Case: No previous snapshot existed
        if not previous_snapshot:
            return RiskCheckResponse(
                org_id=org_id,
                status="BASELINE_CREATED",
                message=f"Initial analysis baseline {current_snapshot.snapshot_id} created for {org.name}. Continuous risk watch is now active.",
                snapshot_id=current_snapshot.snapshot_id,
                new_alerts_count=0,
                priority_changes_count=0,
                new_top5_count=0,
                previous_posture=None,
                current_posture=current_snapshot.overall_risk_posture,
                alerts=[],
            )

        # Compare Snapshots & Generate Deterministic Alerts
        new_alerts, priority_changes, new_top5 = self._compare_snapshots(
            org_id, previous_snapshot, current_snapshot
        )

        # Deduplicate & Persist Alerts
        alerts_data = self._read_alerts()
        existing_alerts = alerts_data.get("alerts", [])

        persisted_new_alerts: list[SmartAlertSchema] = []
        for alert in new_alerts:
            # Check duplicate alert condition
            is_dup = False
            for ea in existing_alerts:
                if (
                    ea.get("org_id", "").upper() == org_id.upper()
                    and ea.get("alert_type") == alert.alert_type
                    and ea.get("cve_id") == alert.cve_id
                    and ea.get("current_rank") == alert.current_rank
                    and not ea.get("is_dismissed", False)
                ):
                    is_dup = True
                    break
            if not is_dup:
                existing_alerts.append(alert.model_dump())
                persisted_new_alerts.append(alert)

        alerts_data["alerts"] = existing_alerts
        self._save_alerts(alerts_data)

        status_text = "RISK_CHANGE_DETECTED" if persisted_new_alerts else "NO_CHANGE"
        message_text = (
            f"Risk check complete. Detected {len(persisted_new_alerts)} meaningful alert(s) across {priority_changes} priority shift(s)."
            if persisted_new_alerts
            else f"No significant risk posture changes detected since baseline {previous_snapshot.snapshot_id}."
        )

        return RiskCheckResponse(
            org_id=org_id,
            status=status_text,
            message=message_text,
            snapshot_id=current_snapshot.snapshot_id,
            new_alerts_count=len(persisted_new_alerts),
            priority_changes_count=priority_changes,
            new_top5_count=new_top5,
            previous_posture=previous_snapshot.overall_risk_posture,
            current_posture=current_snapshot.overall_risk_posture,
            alerts=persisted_new_alerts,
        )

    def _compare_snapshots(
        self,
        org_id: str,
        prev_snp: AnalysisSnapshotSchema,
        curr_snp: AnalysisSnapshotSchema,
    ) -> tuple[list[SmartAlertSchema], int, int]:
        """Deterministic change detection between two analysis snapshots."""
        prev_map = {it.cve_id.upper(): it for it in prev_snp.items}
        curr_map = {it.cve_id.upper(): it for it in curr_snp.items}

        alerts: list[SmartAlertSchema] = []
        priority_changes_count = 0
        new_top5_count = 0
        now_iso = datetime.now(timezone.utc).isoformat()

        alerts_data = self._read_alerts()
        all_alerts = alerts_data.get("alerts", [])
        max_num = 0
        for a in all_alerts:
            aid = a.get("alert_id", "")
            m = re.match(r"^ALT-(\d+)$", aid, re.IGNORECASE)
            if m:
                max_num = max(max_num, int(m.group(1)))
            else:
                max_num = max(max_num, len(all_alerts))

        def next_alert_id() -> str:
            nonlocal max_num
            max_num += 1
            return f"ALT-{max_num:03d}"

        # 1. Inspect Current Items
        for cve_id, curr_item in curr_map.items():
            prev_item = prev_map.get(cve_id)

            # Case A: Brand New Matched Vulnerability
            if not prev_item:
                is_top5 = curr_item.rank <= 5
                if is_top5:
                    new_top5_count += 1
                priority_changes_count += 1
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="NEW_TOP5_ENTRY" if is_top5 else "NEWLY_RELEVANT_ASSET",
                        severity="CRITICAL" if (is_top5 and curr_item.score >= 90.0) else "HIGH",
                        title=f"New High-Priority Finding: {curr_item.cve_id}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state="Unmatched / Excluded from Perimeter",
                        current_state=f"Rank #{curr_item.rank} ({curr_item.priority} • {curr_item.score:.1f} PTS)",
                        what_changed=f"{curr_item.cve_id} became applicable to {curr_item.asset_name or curr_item.product} at rank #{curr_item.rank}.",
                        why_it_matters=f"Direct exposure on {curr_item.importance} tier {curr_item.exposure} infrastructure requires immediate mitigation.",
                        next_action="Verify affected production instances and apply urgent vendor advisory.",
                        previous_rank=None,
                        current_rank=curr_item.rank,
                        previous_score=None,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )
                continue

            # Rank Delta Calculation
            rank_shift = prev_item.rank - curr_item.rank  # Positive means moved UP in priority

            if rank_shift != 0:
                priority_changes_count += 1

            # Case B: Entered Top 5
            if curr_item.rank <= 5 and prev_item.rank > 5:
                new_top5_count += 1
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="NEW_TOP5_ENTRY",
                        severity="CRITICAL" if curr_item.score >= 90.0 else "HIGH",
                        title=f"Entered Top 5 Priorities: {curr_item.cve_id}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state=f"Rank #{prev_item.rank} ({prev_item.score:.1f} PTS)",
                        current_state=f"Rank #{curr_item.rank} ({curr_item.score:.1f} PTS)",
                        what_changed=f"{curr_item.cve_id} escalated +{rank_shift} positions into Top 5 (# {curr_item.rank}).",
                        why_it_matters=f"Escalation directly impacts {curr_item.asset_name or curr_item.product} in {curr_item.environment}.",
                        next_action="Prioritise remediation in the active sprint cycle.",
                        previous_rank=prev_item.rank,
                        current_rank=curr_item.rank,
                        previous_score=prev_item.score,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )

            # Case C: Major Upward Priority Movement (>= 3 positions)
            elif rank_shift >= 3 and curr_item.rank > 5:
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="MAJOR_PRIORITY_SHIFT",
                        severity="HIGH",
                        title=f"Significant Priority Escalation: {curr_item.cve_id}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state=f"Rank #{prev_item.rank}",
                        current_state=f"Rank #{curr_item.rank}",
                        what_changed=f"Rank moved from #{prev_item.rank} to #{curr_item.rank} (+{rank_shift} positions).",
                        why_it_matters="Elevated risk score increases exploit likelihood on deployed asset.",
                        next_action="Review technical telemetry and schedule defensive validation.",
                        previous_rank=prev_item.rank,
                        current_rank=curr_item.rank,
                        previous_score=prev_item.score,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )

            # Case D: New KEV Weaponisation Status
            if not prev_item.kev and curr_item.kev:
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="NEW_KEV_EXPLOIT",
                        severity="CRITICAL",
                        title=f"CISA KEV Active Exploit Confirmed: {curr_item.cve_id}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state="KEV: false",
                        current_state="KEV: true (Active Weaponisation)",
                        what_changed=f"{curr_item.cve_id} was added to CISA Known Exploited Vulnerabilities catalog.",
                        why_it_matters=f"Evidence of active in-the-wild weaponisation directly threatens {curr_item.asset_name or curr_item.product}.",
                        next_action="Execute mandatory defensive mitigation within 24 hours.",
                        previous_rank=prev_item.rank,
                        current_rank=curr_item.rank,
                        previous_score=prev_item.score,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )

            # Case E: Significant EPSS Increase
            epss_delta = curr_item.epss - prev_item.epss
            if epss_delta >= 0.20 or (prev_item.epss < 0.50 and curr_item.epss >= 0.50):
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="SIGNIFICANT_EPSS_INCREASE",
                        severity="HIGH",
                        title=f"EPSS Threat Probability Surged: {curr_item.cve_id}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state=f"EPSS: {prev_item.epss * 100:.1f}%",
                        current_state=f"EPSS: {curr_item.epss * 100:.1f}% (+{epss_delta * 100:.1f}%)",
                        what_changed=f"Exploit probability increased by {epss_delta * 100:.1f}% based on global threat signals.",
                        why_it_matters="High probability of impending exploitation across enterprise perimeter.",
                        next_action="Assess perimeter firewall and WAF containment rules.",
                        previous_rank=prev_item.rank,
                        current_rank=curr_item.rank,
                        previous_score=prev_item.score,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )

            # Case F: Asset Context / Exposure Changed
            if prev_item.exposure != curr_item.exposure or prev_item.importance != curr_item.importance:
                alerts.append(
                    SmartAlertSchema(
                        alert_id=next_alert_id(),
                        org_id=org_id,
                        alert_type="ASSET_CONTEXT_CHANGE",
                        severity="HIGH" if curr_item.exposure == "internet-facing" else "MEDIUM",
                        title=f"Asset Operational Context Shift: {curr_item.asset_name}",
                        cve_id=curr_item.cve_id,
                        asset_id=curr_item.matched_asset_id,
                        asset_name=curr_item.asset_name,
                        product=curr_item.product,
                        previous_state=f"{prev_item.exposure} • {prev_item.importance}",
                        current_state=f"{curr_item.exposure} • {curr_item.importance}",
                        what_changed=f"Asset context transitioned to {curr_item.exposure} ({curr_item.importance} tier).",
                        why_it_matters="Perimeter exposure changes deterministically adjust vulnerability risk score.",
                        next_action="Validate network zoning and perimeter inspection rules.",
                        previous_rank=prev_item.rank,
                        current_rank=curr_item.rank,
                        previous_score=prev_item.score,
                        current_score=curr_item.score,
                        created_at=now_iso,
                    )
                )

        # 2. Inspect Dropped or Remediated Items
        for cve_id, prev_item in prev_map.items():
            curr_item = curr_map.get(cve_id)
            if prev_item.rank <= 5:
                # If dropped out of top 5 or eliminated
                if not curr_item or curr_item.rank > 5:
                    is_remediated = (
                        curr_item and curr_item.remediation_status in ("RESOLVED", "MITIGATED")
                    ) or not curr_item
                    alerts.append(
                        SmartAlertSchema(
                            alert_id=next_alert_id(),
                            org_id=org_id,
                            alert_type="REMEDIATION_IMPACT" if is_remediated else "PRIORITY_DROP",
                            severity="INFO",
                            title=f"Remediation Impact Verified: {prev_item.cve_id}" if is_remediated else f"Priority De-escalated: {prev_item.cve_id}",
                            cve_id=prev_item.cve_id,
                            asset_id=prev_item.matched_asset_id,
                            asset_name=prev_item.asset_name,
                            product=prev_item.product,
                            previous_state=f"Top 5 Priority (#{prev_item.rank} • {prev_item.score:.1f} PTS)",
                            current_state=f"Rank #{curr_item.rank if curr_item else 'Eliminated'}",
                            what_changed=f"{prev_item.cve_id} is no longer in active Top 5 priorities following defensive updates.",
                            why_it_matters="Organisation risk posture improved on this attack vector.",
                            next_action="Verify audit record and maintain defense baseline.",
                            previous_rank=prev_item.rank,
                            current_rank=curr_item.rank if curr_item else None,
                            previous_score=prev_item.score,
                            current_score=curr_item.score if curr_item else None,
                            created_at=now_iso,
                        )
                    )

        return alerts, priority_changes_count, new_top5_count

    def list_alerts(
        self,
        org_id: str,
        severity: Optional[str] = None,
        alert_type: Optional[str] = None,
        unread_only: bool = False,
    ) -> AlertListResponse:
        """Retrieve smart alerts for an organisation with strict isolation."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' does not exist.")

        raw_alerts = self._read_alerts().get("alerts", [])
        org_alerts = [a for a in raw_alerts if a.get("org_id", "").upper() == org_id.upper()]

        filtered = []
        unread_count = 0
        for a in org_alerts:
            if not a.get("is_read", False):
                unread_count += 1

            if unread_only and a.get("is_read", False):
                continue
            if severity and severity.upper() != "ALL" and a.get("severity", "").upper() != severity.upper():
                continue
            if alert_type and alert_type.upper() != "ALL" and a.get("alert_type", "").upper() != alert_type.upper():
                continue

            filtered.append(SmartAlertSchema(**a))

        return AlertListResponse(
            org_id=org_id,
            alerts=filtered,
            total_count=len(filtered),
            unread_count=unread_count,
        )

    def get_alert(self, org_id: str, alert_id: str) -> Optional[SmartAlertSchema]:
        """Fetch single alert detail ensuring organisation isolation."""
        raw_alerts = self._read_alerts().get("alerts", [])
        for a in raw_alerts:
            if (
                a.get("alert_id", "").upper() == alert_id.upper()
                and a.get("org_id", "").upper() == org_id.upper()
            ):
                return SmartAlertSchema(**a)
        return None

    def mark_read(self, org_id: str, alert_id: str) -> bool:
        """Mark an alert as read."""
        raw_data = self._read_alerts()
        alerts = raw_data.get("alerts", [])
        found = False
        for a in alerts:
            if (
                a.get("alert_id", "").upper() == alert_id.upper()
                and a.get("org_id", "").upper() == org_id.upper()
            ):
                a["is_read"] = True
                found = True
                break
        if found:
            self._save_alerts(raw_data)
        return found

    def dismiss_alert(self, org_id: str, alert_id: str) -> bool:
        """Dismiss an alert from active view while preserving in historical logs."""
        raw_data = self._read_alerts()
        alerts = raw_data.get("alerts", [])
        found = False
        for a in alerts:
            if (
                a.get("alert_id", "").upper() == alert_id.upper()
                and a.get("org_id", "").upper() == org_id.upper()
            ):
                a["is_dismissed"] = True
                a["is_read"] = True
                found = True
                break
        if found:
            self._save_alerts(raw_data)
        return found

    def get_summary(self, org_id: str) -> AlertSummaryResponse:
        """Compute KPI summary counts for smart alerts."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' was not found.")

        raw_alerts = self._read_alerts().get("alerts", [])
        org_alerts = [
            a
            for a in raw_alerts
            if a.get("org_id", "").upper() == org_id.upper() and not a.get("is_dismissed", False)
        ]

        summary = {
            "total": len(org_alerts),
            "unread": 0,
            "critical": 0,
            "high": 0,
            "medium": 0,
            "info": 0,
        }

        for a in org_alerts:
            if not a.get("is_read", False):
                summary["unread"] += 1
            sev = a.get("severity", "HIGH").upper()
            if sev == "CRITICAL":
                summary["critical"] += 1
            elif sev == "HIGH":
                summary["high"] += 1
            elif sev == "MEDIUM":
                summary["medium"] += 1
            elif sev == "INFO":
                summary["info"] += 1

        return AlertSummaryResponse(org_id=org_id, **summary)

    def why_did_my_risk_change(self, org_id: str) -> WhyRiskChangedResponse:
        """Executive explanation of overall risk posture shifts and causal drivers."""
        org = triage_service.get_profile(org_id)
        if not org:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' was not found.")

        snaps_data = self._read_snapshots()
        org_snaps = [
            s for s in snaps_data.get("snapshots", []) if s.get("org_id", "").upper() == org_id.upper()
        ]

        now_iso = datetime.now(timezone.utc).isoformat()

        if len(org_snaps) < 2:
            current_snap = org_snaps[-1] if org_snaps else None
            posture = current_snap.get("overall_risk_posture", "MEDIUM") if current_snap else "MEDIUM"
            ts = current_snap.get("created_at", now_iso) if current_snap else now_iso
            return WhyRiskChangedResponse(
                org_id=org_id,
                has_changed=False,
                previous_posture=posture,
                current_posture=posture,
                posture_direction="STABLE",
                last_check_timestamp=ts,
                baseline_timestamp=ts,
                main_drivers=[
                    WhyRiskChangedDriver(
                        category="POSTURE",
                        title="Baseline Risk Established",
                        detail=f"Continuous risk monitoring active. Risk posture is currently evaluated at {posture}.",
                        severity="INFO",
                    )
                ],
                top_actions=[
                    "Monitor perimeter router interfaces and keep software versions up to date.",
                    "Review active critical findings in Top 5 Priorities.",
                ],
            )

        base_snap = AnalysisSnapshotSchema(**org_snaps[0])
        curr_snap = AnalysisSnapshotSchema(**org_snaps[-1])

        drivers: list[WhyRiskChangedDriver] = []
        top_actions: list[str] = []

        # Drivers: Critical Count Delta
        crit_delta = curr_snap.active_critical_count - base_snap.active_critical_count
        if crit_delta > 0:
            drivers.append(
                WhyRiskChangedDriver(
                    category="POSTURE",
                    title=f"+{crit_delta} Critical Priority Findings",
                    detail=f"Active critical priority findings increased from {base_snap.active_critical_count} to {curr_snap.active_critical_count}.",
                    severity="CRITICAL",
                )
            )
            top_actions.append("Initiate immediate remediation for newly escalated critical items.")
        elif crit_delta < 0:
            drivers.append(
                WhyRiskChangedDriver(
                    category="REMEDIATION",
                    title=f"{abs(crit_delta)} Critical Finding(s) Remediated",
                    detail=f"Critical findings reduced from {base_snap.active_critical_count} to {curr_snap.active_critical_count}.",
                    severity="INFO",
                )
            )

        # Drivers: Top 5 shifts
        new_top5 = set(curr_snap.top5_cves) - set(base_snap.top5_cves)
        if new_top5:
            drivers.append(
                WhyRiskChangedDriver(
                    category="TOP5",
                    title=f"{len(new_top5)} New Entrant(s) in Top 5",
                    detail=f"New critical items entered Top 5: {', '.join(sorted(new_top5))}.",
                    severity="HIGH",
                )
            )
            top_actions.append(f"Review technical evidence for newly relevant Top 5 items: {', '.join(sorted(new_top5)[:2])}.")

        # Drivers: KEV weaponisation in current Top 5
        kev_count = sum(1 for it in curr_snap.items[:5] if it.kev)
        if kev_count > 0:
            drivers.append(
                WhyRiskChangedDriver(
                    category="KEV",
                    title=f"{kev_count} Active CISA KEV Weaponisation(s) in Top 5",
                    detail="Active in-the-wild exploitation confirmed for perimeter technologies.",
                    severity="CRITICAL",
                )
            )
            top_actions.append("Apply emergency vendor workarounds for CISA KEV weaponised assets.")

        # Posture Direction
        if curr_snap.overall_risk_posture == "CRITICAL" or crit_delta > 0:
            direction = "INCREASING"
        elif crit_delta < 0:
            direction = "DECREASING"
        else:
            direction = "STABLE"

        if not top_actions:
            top_actions.append("Continue regular risk review and maintain defense-in-depth posture.")

        return WhyRiskChangedResponse(
            org_id=org_id,
            has_changed=len(drivers) > 0,
            previous_posture=base_snap.overall_risk_posture,
            current_posture=curr_snap.overall_risk_posture,
            posture_direction=direction,
            last_check_timestamp=curr_snap.created_at,
            baseline_timestamp=base_snap.created_at,
            main_drivers=drivers,
            top_actions=top_actions,
        )

    def compare_snapshots(
        self, org_id: str, snapshot_a_id: str, snapshot_b_id: str
    ) -> SnapshotComparisonResponse:
        """Compare any two historical snapshots and return structured diff."""
        snaps_data = self._read_snapshots().get("snapshots", [])
        snap_a = next(
            (
                s
                for s in snaps_data
                if s.get("snapshot_id", "").upper() == snapshot_a_id.upper()
                and s.get("org_id", "").upper() == org_id.upper()
            ),
            None,
        )
        snap_b = next(
            (
                s
                for s in snaps_data
                if s.get("snapshot_id", "").upper() == snapshot_b_id.upper()
                and s.get("org_id", "").upper() == org_id.upper()
            ),
            None,
        )

        if not snap_a or not snap_b:
            raise ValueError("SNAPSHOT_NOT_FOUND: One or both snapshots were not found.")

        sa = AnalysisSnapshotSchema(**snap_a)
        sb = AnalysisSnapshotSchema(**snap_b)

        map_a = {it.cve_id.upper(): it for it in sa.items}
        map_b = {it.cve_id.upper(): it for it in sb.items}

        shifts: list[SnapshotComparisonItemDiff] = []
        new_vulns: list[str] = []
        removed_vulns: list[str] = []
        remediation_impacts: list[str] = []

        for cve_id, ib in map_b.items():
            ia = map_a.get(cve_id)
            if not ia:
                new_vulns.append(ib.cve_id)
            else:
                delta = ia.rank - ib.rank
                reasons = []
                if delta != 0:
                    reasons.append(f"Rank shifted from #{ia.rank} to #{ib.rank}")
                if not ia.kev and ib.kev:
                    reasons.append("Weaponised in CISA KEV catalog")
                if ib.epss - ia.epss >= 0.10:
                    reasons.append(f"EPSS increased by +{(ib.epss - ia.epss) * 100:.1f}%")
                if ia.exposure != ib.exposure:
                    reasons.append(f"Asset exposure changed to {ib.exposure}")

                if reasons or delta != 0:
                    shifts.append(
                        SnapshotComparisonItemDiff(
                            cve_id=ib.cve_id,
                            product=ib.product,
                            asset_name=ib.asset_name,
                            previous_rank=ia.rank,
                            current_rank=ib.rank,
                            previous_score=ia.score,
                            current_score=ib.score,
                            rank_delta=delta,
                            change_reasons=reasons,
                        )
                    )

        for cve_id, ia in map_a.items():
            if cve_id not in map_b:
                removed_vulns.append(ia.cve_id)
                if ia.rank <= 5:
                    remediation_impacts.append(f"{ia.cve_id} (previously #{ia.rank}) removed from active perimeter.")

        return SnapshotComparisonResponse(
            org_id=org_id,
            snapshot_a_id=sa.snapshot_id,
            snapshot_b_id=sb.snapshot_id,
            snapshot_a_timestamp=sa.created_at,
            snapshot_b_timestamp=sb.created_at,
            rank_shifts=shifts,
            new_vulnerabilities=new_vulns,
            removed_vulnerabilities=removed_vulns,
            remediation_impacts=remediation_impacts,
        )

    def purge_org_data(self, org_id: str) -> None:
        """Purge all snapshots and alerts associated with a deleted organization."""
        snaps_data = self._read_snapshots()
        snaps_list = [s for s in snaps_data.get("snapshots", []) if s.get("org_id", "").upper() != org_id.upper()]
        snaps_data["snapshots"] = snaps_list
        self._save_snapshots(snaps_data)

        alerts_data = self._read_alerts()
        alerts_list = [a for a in alerts_data.get("alerts", []) if a.get("org_id", "").upper() != org_id.upper()]
        alerts_data["alerts"] = alerts_list
        self._save_alerts(alerts_data)


risk_watch_service = RiskWatchService()

