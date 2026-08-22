from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import ErrorResponse, WhatIfRequest, WhatIfResponse
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/what-if", tags=["Simulation"])


@router.post(
    "/{profile_id}",
    response_model=WhatIfResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        }
    },
    summary="Simulate temporary weight adjustments on organisation triage ranking",
)
def simulate_what_if_scenario(
    profile_id: str,
    request: WhatIfRequest,
) -> WhatIfResponse:
    """Execute a what-if simulation by applying custom weights without modifying official profile settings."""
    simulation = triage_service.simulate_what_if(profile_id, request)
    if not simulation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "PROFILE_NOT_FOUND",
                "message": f"Organisation profile '{profile_id}' not found.",
            },
        )
    return simulation
