from fastapi import APIRouter, HTTPException, Query, status
from backend.schemas.api_models import ErrorResponse, TriageResponse
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/triage", tags=["Triage"])


@router.get(
    "/{profile_id}",
    response_model=TriageResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        }
    },
    summary="Generate personalised Top 5 vulnerability triage decision list",
)
def get_triage(
    profile_id: str,
    limit: int = Query(5, ge=1, le=50, description="Number of top prioritised actions to return"),
) -> TriageResponse:
    """Execute the Phase 1 deterministic decision engine for the specified organisation profile

    Returns the personalised Top actions with full signal point share breakdowns, confidence ratings,
    and conservative safe next actions.
    """
    result = triage_service.run_triage(profile_id, limit=limit)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "PROFILE_NOT_FOUND",
                "message": f"Organisation profile '{profile_id}' not found.",
            },
        )
    return result
