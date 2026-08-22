from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.api_models import (
    ErrorResponse,
    RemediationCreateRequest,
    RemediationListResponse,
    RemediationNoteCreateRequest,
    RemediationRecordSchema,
    RemediationSummaryResponse,
    RemediationUpdateRequest,
)
from backend.services.remediation_service import remediation_service

router = APIRouter(tags=["Remediation Workspace"])


@router.get(
    "/organizations/{org_id}/remediations",
    response_model=RemediationListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List remediation records for an organisation",
)
@router.get(
    "/profiles/{org_id}/remediations",
    response_model=RemediationListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List remediation records for an organisation",
)
def list_remediations(
    org_id: str,
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    search: Optional[str] = Query(None, description="Keyword search"),
) -> RemediationListResponse:
    """Retrieve all defensive remediation items with optional status, priority, asset, and search filters."""
    try:
        return remediation_service.list_remediations(
            org_id,
            status=status_filter,
            priority=priority,
            asset_id=asset_id,
            search=search,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/remediations/summary",
    response_model=RemediationSummaryResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Get remediation summary KPI metrics",
)
@router.get(
    "/profiles/{org_id}/remediations/summary",
    response_model=RemediationSummaryResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="Get remediation summary KPI metrics",
)
def get_remediation_summary(org_id: str) -> RemediationSummaryResponse:
    """Retrieve KPI counts for open, in-progress, mitigated, resolved, and overdue items."""
    try:
        return remediation_service.get_summary(org_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "ORGANISATION_NOT_FOUND", "message": str(e)},
        )


@router.post(
    "/organizations/{org_id}/remediations",
    response_model=RemediationRecordSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation, CVE, or Asset not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Active remediation already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid input payload",
        },
    },
    summary="Create a new defensive remediation record",
)
@router.post(
    "/profiles/{org_id}/remediations",
    response_model=RemediationRecordSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation, CVE, or Asset not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Active remediation already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid input payload",
        },
    },
    summary="Create a new defensive remediation record",
)
def create_remediation(
    org_id: str, payload: RemediationCreateRequest
) -> RemediationRecordSchema:
    """Instantiate a new tracked remediation record prefilled with deterministic risk intelligence."""
    try:
        return remediation_service.create_remediation(org_id, payload)
    except ValueError as e:
        err_msg = str(e)
        if "ORGANISATION_NOT_FOUND" in err_msg or "CVE_NOT_FOUND" in err_msg or "ASSET_NOT_FOUND" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "ENTITY_NOT_FOUND", "message": err_msg},
            )
        if "REMEDIATION_EXISTS" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"error": "REMEDIATION_EXISTS", "message": err_msg},
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "INVALID_REMEDIATION_PAYLOAD", "message": err_msg},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "REMEDIATION_CREATION_FAILED", "message": str(e)},
        )


@router.get(
    "/organizations/{org_id}/remediations/{remediation_id}",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Get single remediation record detail",
)
@router.get(
    "/profiles/{org_id}/remediations/{remediation_id}",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Get single remediation record detail",
)
def get_remediation(org_id: str, remediation_id: str) -> RemediationRecordSchema:
    """Retrieve full detail for a remediation item including notes and audit log."""
    record = remediation_service.get_remediation(org_id, remediation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "REMEDIATION_NOT_FOUND",
                "message": f"Remediation '{remediation_id}' was not found in organisation '{org_id}'.",
            },
        )
    return record


@router.get(
    "/remediations/{remediation_id}",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Get single remediation record by ID",
)
def get_remediation_by_id(remediation_id: str) -> RemediationRecordSchema:
    """Retrieve single remediation record by global ID."""
    record = remediation_service.get_remediation_by_id(remediation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "REMEDIATION_NOT_FOUND",
                "message": f"Remediation '{remediation_id}' was not found.",
            },
        )
    return record


@router.put(
    "/organizations/{org_id}/remediations/{remediation_id}",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid update payload",
        },
    },
    summary="Update remediation workflow status, owner, due date, or verification",
)
@router.put(
    "/profiles/{org_id}/remediations/{remediation_id}",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid update payload",
        },
    },
    summary="Update remediation workflow status, owner, due date, or verification",
)
def update_remediation(
    org_id: str, remediation_id: str, payload: RemediationUpdateRequest
) -> RemediationRecordSchema:
    """Transition remediation status, assign ownership, adjust due dates, and record verification evidence."""
    try:
        updated = remediation_service.update_remediation(org_id, remediation_id, payload)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "REMEDIATION_NOT_FOUND",
                    "message": f"Remediation '{remediation_id}' was not found in organisation '{org_id}'.",
                },
            )
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "INVALID_UPDATE_PAYLOAD", "message": str(e)},
        )


@router.post(
    "/organizations/{org_id}/remediations/{remediation_id}/notes",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Add a plain-text defensive note to remediation record",
)
@router.post(
    "/profiles/{org_id}/remediations/{remediation_id}/notes",
    response_model=RemediationRecordSchema,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Add a plain-text defensive note to remediation record",
)
def add_remediation_note(
    org_id: str, remediation_id: str, payload: RemediationNoteCreateRequest
) -> RemediationRecordSchema:
    """Log an operational defensive note in the remediation record."""
    updated = remediation_service.add_note(org_id, remediation_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "REMEDIATION_NOT_FOUND",
                "message": f"Remediation '{remediation_id}' was not found in organisation '{org_id}'.",
            },
        )
    return updated


@router.delete(
    "/organizations/{org_id}/remediations/{remediation_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Delete a remediation record",
)
@router.delete(
    "/profiles/{org_id}/remediations/{remediation_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Remediation record not found",
        }
    },
    summary="Delete a remediation record",
)
def delete_remediation(org_id: str, remediation_id: str):
    """Delete a remediation record safely without altering global dataset or organisation profile."""
    deleted = remediation_service.delete_remediation(org_id, remediation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "REMEDIATION_NOT_FOUND",
                "message": f"Remediation '{remediation_id}' was not found in organisation '{org_id}'.",
            },
        )
    return {
        "status": "deleted",
        "org_id": org_id,
        "remediation_id": remediation_id,
        "message": f"Remediation '{remediation_id}' deleted successfully.",
    }
