from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.api_models import (
    AlertListResponse,
    AlertSummaryResponse,
    ErrorResponse,
    RiskCheckResponse,
    SmartAlertSchema,
    SnapshotComparisonResponse,
    SnapshotListResponse,
    WhyRiskChangedResponse,
)
from backend.services.risk_watch_service import risk_watch_service

router = APIRouter(tags=["Continuous Risk Watch & Smart Alerts"])


@router.post(
    "/organizations/{org_id}/risk-check",
    response_model=RiskCheckResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Execute automated risk check, create snapshot, and surface smart alerts",
)
@router.post(
    "/profiles/{org_id}/risk-check",
    response_model=RiskCheckResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Execute automated risk check, create snapshot, and surface smart alerts",
)
def run_risk_check(org_id: str) -> RiskCheckResponse:
    """Run deterministic risk triage, capture immutable snapshot, and detect meaningful risk changes."""
    try:
        return risk_watch_service.run_risk_check(org_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "RISK_CHECK_FAILED", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/alerts",
    response_model=AlertListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List smart alerts for an organisation",
)
@router.get(
    "/profiles/{org_id}/alerts",
    response_model=AlertListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List smart alerts for an organisation",
)
def list_alerts(
    org_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, INFO"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    unread_only: bool = Query(False, description="Filter to only unread alerts"),
) -> AlertListResponse:
    """Retrieve actionable smart risk alerts for an organisation."""
    try:
        return risk_watch_service.list_alerts(
            org_id,
            severity=severity,
            alert_type=alert_type,
            unread_only=unread_only,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/alerts/summary",
    response_model=AlertSummaryResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Get smart alerts summary KPI metrics",
)
@router.get(
    "/profiles/{org_id}/alerts/summary",
    response_model=AlertSummaryResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Get smart alerts summary KPI metrics",
)
def get_alerts_summary(org_id: str) -> AlertSummaryResponse:
    """Retrieve unread and severity KPI counts for smart alerts."""
    try:
        return risk_watch_service.get_summary(org_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/alerts/{alert_id}",
    response_model=SmartAlertSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Alert not found",
        }
    },
    summary="Get single smart alert detail",
)
def get_alert(org_id: str, alert_id: str) -> SmartAlertSchema:
    """Retrieve full detail for a single smart alert with organisation boundary check."""
    alert = risk_watch_service.get_alert(org_id, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "ALERT_NOT_FOUND",
                "message": f"Alert '{alert_id}' was not found in organisation '{org_id}'.",
            },
        )
    return alert


@router.post(
    "/organizations/{org_id}/alerts/{alert_id}/read",
    summary="Mark smart alert as read",
)
@router.post(
    "/alerts/{alert_id}/read",
    summary="Mark smart alert as read",
)
def mark_alert_read(alert_id: str, org_id: Optional[str] = None):
    """Mark an alert as read."""
    # If org_id is provided or look up via all alerts
    raw_alerts = risk_watch_service._read_alerts().get("alerts", [])
    target = next((a for a in raw_alerts if a.get("alert_id", "").upper() == alert_id.upper()), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ALERT_NOT_FOUND", "message": f"Alert '{alert_id}' not found."},
        )
    target_org = org_id or target.get("org_id")
    success = risk_watch_service.mark_read(target_org, alert_id)
    return {"status": "success", "alert_id": alert_id, "is_read": True}


@router.post(
    "/organizations/{org_id}/alerts/{alert_id}/dismiss",
    summary="Dismiss smart alert from active queue",
)
@router.post(
    "/alerts/{alert_id}/dismiss",
    summary="Dismiss smart alert from active queue",
)
def dismiss_alert(alert_id: str, org_id: Optional[str] = None):
    """Dismiss an alert from the active queue while preserving historical audit record."""
    raw_alerts = risk_watch_service._read_alerts().get("alerts", [])
    target = next((a for a in raw_alerts if a.get("alert_id", "").upper() == alert_id.upper()), None)
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ALERT_NOT_FOUND", "message": f"Alert '{alert_id}' not found."},
        )
    target_org = org_id or target.get("org_id")
    success = risk_watch_service.dismiss_alert(target_org, alert_id)
    return {"status": "dismissed", "alert_id": alert_id, "is_dismissed": True}


@router.get(
    "/organizations/{org_id}/why-risk-changed",
    response_model=WhyRiskChangedResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Executive overview: Why Did My Risk Change?",
)
@router.get(
    "/profiles/{org_id}/why-risk-changed",
    response_model=WhyRiskChangedResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Executive overview: Why Did My Risk Change?",
)
def why_did_my_risk_change(org_id: str) -> WhyRiskChangedResponse:
    """Synthesizes high-level causal drivers, posture shifts, and recommended actions."""
    try:
        return risk_watch_service.why_did_my_risk_change(org_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/snapshots/compare",
    response_model=SnapshotComparisonResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Snapshots not found",
        }
    },
    summary="Compare two historical analysis snapshots",
)
@router.get(
    "/profiles/{org_id}/snapshots/compare",
    response_model=SnapshotComparisonResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Snapshots not found",
        }
    },
    summary="Compare two historical analysis snapshots",
)
def compare_snapshots(
    org_id: str,
    snapshot_a: str = Query(..., description="First snapshot ID"),
    snapshot_b: str = Query(..., description="Second snapshot ID"),
) -> SnapshotComparisonResponse:
    """Return structured diff of ranking movements, signal changes, asset changes, and remediation impacts."""
    try:
        return risk_watch_service.compare_snapshots(org_id, snapshot_a, snapshot_b)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "SNAPSHOT_NOT_FOUND", "message": str(e)},
        )
