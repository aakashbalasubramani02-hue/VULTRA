from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import (
    ErrorResponse,
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    ProductCatalogueResponse,
    ProfileDetailResponse,
    ProfilesListResponse,
)
from backend.services.triage_service import triage_service

router = APIRouter(tags=["Profiles & Organisations"])


@router.get(
    "/profiles",
    response_model=ProfilesListResponse,
    summary="List all available organisation profiles",
)
@router.get(
    "/organizations",
    response_model=ProfilesListResponse,
    summary="List all available organisations",
)
def list_profiles() -> ProfilesListResponse:
    """Retrieve high-level summary cards for all registered organisation profiles."""
    return triage_service.list_profile_summaries()


@router.get(
    "/profiles/catalogue/products",
    response_model=ProductCatalogueResponse,
    summary="Discover available product catalogue from vulnerability dataset",
)
@router.get(
    "/organizations/catalogue/products",
    response_model=ProductCatalogueResponse,
    summary="Discover available product catalogue from vulnerability dataset",
)
def get_product_catalogue() -> ProductCatalogueResponse:
    """Dynamically discover unique products present in the authoritative vulnerability dataset for autocomplete."""
    return triage_service.get_catalogue_products()


@router.post(
    "/profiles",
    response_model=ProfileDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Organisation with this name already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Validation error in organisation payload",
        },
    },
    summary="Register a new organisation profile",
)
@router.post(
    "/organizations",
    response_model=ProfileDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Organisation with this name already exists",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Validation error in organisation payload",
        },
    },
    summary="Register a new organisation profile",
)
def register_organization(payload: OrganizationCreateRequest) -> ProfileDetailResponse:
    """Dynamically register a new organisation with custom technology stack and risk weights.

    Assigns a collision-free ORG ID and safely persists the profile to disk.
    """
    try:
        return triage_service.register_organization(payload)
    except ValueError as e:
        err_msg = str(e)
        if "ORGANISATION_EXISTS" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "ORGANISATION_EXISTS",
                    "message": err_msg.replace("ORGANISATION_EXISTS: ", ""),
                },
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_ORGANISATION_PAYLOAD",
                "message": err_msg,
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "REGISTRATION_FAILED",
                "message": f"Failed to register organisation: {str(e)}",
            },
        )


@router.get(
    "/profiles/{profile_id}",
    response_model=ProfileDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        }
    },
    summary="Get complete details for a single organisation profile",
)
@router.get(
    "/organizations/{profile_id}",
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


@router.put(
    "/profiles/{profile_id}",
    response_model=ProfileDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Organisation with this name already exists",
        },
    },
    summary="Update an existing organisation profile",
)
@router.put(
    "/organizations/{profile_id}",
    response_model=ProfileDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Organisation with this name already exists",
        },
    },
    summary="Update an existing organisation profile",
)
def update_organization(profile_id: str, payload: OrganizationUpdateRequest) -> ProfileDetailResponse:
    """Update properties of an existing organisation and re-persist to disk."""
    try:
        updated = triage_service.update_organization(profile_id, payload)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "PROFILE_NOT_FOUND",
                    "message": f"Organisation profile '{profile_id}' not found.",
                },
            )
        return updated
    except ValueError as e:
        err_msg = str(e)
        if "ORGANISATION_EXISTS" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "ORGANISATION_EXISTS",
                    "message": err_msg.replace("ORGANISATION_EXISTS: ", ""),
                },
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "INVALID_UPDATE_PAYLOAD",
                "message": err_msg,
            },
        )


@router.delete(
    "/profiles/{profile_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "Benchmark organisations cannot be deleted",
        },
    },
    summary="Delete an organisation profile",
)
@router.delete(
    "/organizations/{profile_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile not found",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "Benchmark organisations cannot be deleted",
        },
    },
    summary="Delete an organisation profile",
)
def delete_organization(profile_id: str):
    """Delete a dynamic organisation profile. Benchmark profiles (ORG-001..003) are protected."""
    try:
        deleted = triage_service.delete_organization(profile_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "PROFILE_NOT_FOUND",
                    "message": f"Organisation profile '{profile_id}' not found.",
                },
            )
        from backend.services.risk_watch_service import risk_watch_service
        from backend.services.remediation_service import remediation_service
        risk_watch_service.purge_org_data(profile_id)
        remediation_service.purge_org_data(profile_id)

        return {
            "status": "deleted",
            "profile_id": profile_id,
            "message": f"Organisation '{profile_id}' deleted successfully.",
        }
    except ValueError as e:
        err_msg = str(e)
        if "BENCHMARK_PROTECTED" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "BENCHMARK_PROTECTED",
                    "message": err_msg.replace("BENCHMARK_PROTECTED: ", ""),
                },
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "DELETE_FAILED", "message": err_msg},
        )
