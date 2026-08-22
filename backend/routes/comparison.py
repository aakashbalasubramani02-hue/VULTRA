from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import ComparisonResponse, ErrorResponse
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/compare", tags=["Comparison"])


@router.get(
    "/{profile_a}/{profile_b}",
    response_model=ComparisonResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "One or both organisation profiles not found",
        }
    },
    summary="Compare personalised triage Top 5 decisions between two organisation profiles",
)
def compare_organisations(profile_a: str, profile_b: str) -> ComparisonResponse:
    """Run the deterministic decision engine across two organisations and explain why rankings diverge."""
    comparison = triage_service.compare_profiles(profile_a, profile_b)
    if not comparison:
        # Check which profile is missing
        missing = []
        if not triage_service.get_profile(profile_a):
            missing.append(profile_a)
        if not triage_service.get_profile(profile_b):
            missing.append(profile_b)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "PROFILE_NOT_FOUND",
                "message": f"Organisation profile(s) not found: {', '.join(missing)}.",
            },
        )
    return comparison
