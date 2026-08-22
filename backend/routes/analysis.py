from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import ErrorResponse, WhyNotResponse
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/why-not", tags=["Analysis"])


@router.get(
    "/{profile_id}",
    response_model=WhyNotResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        }
    },
    summary="Why-Not Analysis & Mandatory Negative Test (Severity != Priority)",
)
def get_why_not_analysis(profile_id: str) -> WhyNotResponse:
    """Demonstrate the 'Severity != Priority' principle: returns high-CVSS vulnerabilities (>= 9.0)

    that were excluded or deprioritised due to technology mismatch or low threat signals.
    """
    analysis = triage_service.get_why_not(profile_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "PROFILE_NOT_FOUND",
                "message": f"Organisation profile '{profile_id}' not found.",
            },
        )
    return analysis
