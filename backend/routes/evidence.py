from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import ErrorResponse, EvidenceResponse
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.get(
    "/{profile_id}/{cve_id}",
    response_model=EvidenceResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile or CVE not found",
        }
    },
    summary="Retrieve complete evidence drawer details and source provenance for a CVE",
)
def get_evidence(profile_id: str, cve_id: str) -> EvidenceResponse:
    """Retrieve the full underlying source facts, match decisions, contextual asset details,

    and scoring point shares for a CVE evaluated against an organisation profile.
    """
    evidence = triage_service.get_evidence(profile_id, cve_id)
    if not evidence:
        # Check if profile exists to give precise error
        if not triage_service.get_profile(profile_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "PROFILE_NOT_FOUND",
                    "message": f"Organisation profile '{profile_id}' not found.",
                },
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "CVE_NOT_FOUND",
                "message": f"Vulnerability record '{cve_id}' not found in active dataset for organisation '{profile_id}'.",
            },
        )
    return evidence
