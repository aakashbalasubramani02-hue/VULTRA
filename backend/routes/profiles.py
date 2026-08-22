from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import (
    ErrorResponse,
    ProfileDetailResponse,
    ProfilesListResponse,
)
from backend.services.triage_service import triage_service

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get(
    "",
    response_model=ProfilesListResponse,
    summary="List all available organisation profiles",
)
def list_profiles() -> ProfilesListResponse:
    """Retrieve high-level summary cards for all organisation profiles."""
    return triage_service.list_profile_summaries()


@router.get(
    "/{profile_id}",
    response_model=ProfileDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        }
    },
    summary="Get complete details for a single organisation profile",
)
def get_profile(profile_id: str) -> ProfileDetailResponse:
    """Retrieve full details of an organisation profile including asset inventory and weights."""
    profile = triage_service.get_profile_detail(profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "PROFILE_NOT_FOUND",
                "message": f"Organisation profile '{profile_id}' not found.",
            },
        )
    return profile
