from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import (
    AssetCreateRequest,
    AssetDetailResponse,
    AssetListResponse,
    AssetUpdateRequest,
    ErrorResponse,
)
from backend.services.triage_service import triage_service

router = APIRouter(tags=["Asset & Technology Inventory"])


@router.get(
    "/organizations/{org_id}/assets",
    response_model=AssetListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List all registered technology assets for an organisation",
)
@router.get(
    "/profiles/{org_id}/assets",
    response_model=AssetListResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        }
    },
    summary="List all registered technology assets for an organisation",
)
def list_assets(org_id: str) -> AssetListResponse:
    """Retrieve all technology assets, versions, environments, and exposures configured for this organisation."""
    result = triage_service.list_assets(org_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "ORGANISATION_NOT_FOUND",
                "message": f"Organisation '{org_id}' was not found.",
            },
        )
    return result


@router.get(
    "/organizations/{org_id}/assets/{asset_id}",
    response_model=AssetDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        }
    },
    summary="Get detail for a specific technology asset",
)
@router.get(
    "/profiles/{org_id}/assets/{asset_id}",
    response_model=AssetDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        }
    },
    summary="Get detail for a specific technology asset",
)
def get_asset(org_id: str, asset_id: str) -> AssetDetailResponse:
    """Retrieve full detail for an individual asset including matching CVE vulnerability counts."""
    result = triage_service.get_asset(org_id, asset_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "ASSET_NOT_FOUND",
                "message": f"Asset '{asset_id}' was not found in organisation '{org_id}'.",
            },
        )
    return result


@router.post(
    "/organizations/{org_id}/assets",
    response_model=AssetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Asset already exists in this organisation",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid asset payload",
        },
    },
    summary="Register a new technology asset in an organisation",
)
@router.post(
    "/profiles/{org_id}/assets",
    response_model=AssetDetailResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation not found",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Asset already exists in this organisation",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid asset payload",
        },
    },
    summary="Register a new technology asset in an organisation",
)
def create_asset(org_id: str, payload: AssetCreateRequest) -> AssetDetailResponse:
    """Add a new technology asset with environment, version, exposure, and importance context."""
    try:
        return triage_service.create_asset(org_id, payload)
    except ValueError as e:
        err_msg = str(e)
        if "ORGANISATION_NOT_FOUND" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "ORGANISATION_NOT_FOUND", "message": err_msg},
            )
        if "ASSET_EXISTS" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "ASSET_EXISTS",
                    "message": err_msg.replace("ASSET_EXISTS: ", ""),
                },
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "INVALID_ASSET_PAYLOAD", "message": err_msg},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "ASSET_CREATION_FAILED", "message": str(e)},
        )


@router.put(
    "/organizations/{org_id}/assets/{asset_id}",
    response_model=AssetDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid update payload",
        },
    },
    summary="Update an existing technology asset",
)
@router.put(
    "/profiles/{org_id}/assets/{asset_id}",
    response_model=AssetDetailResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "Invalid update payload",
        },
    },
    summary="Update an existing technology asset",
)
def update_asset(org_id: str, asset_id: str, payload: AssetUpdateRequest) -> AssetDetailResponse:
    """Update asset metadata, environment, exposure, or version."""
    try:
        updated = triage_service.update_asset(org_id, asset_id, payload)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "ASSET_NOT_FOUND",
                    "message": f"Asset '{asset_id}' was not found in organisation '{org_id}'.",
                },
            )
        return updated
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "INVALID_UPDATE_PAYLOAD", "message": str(e)},
        )


@router.delete(
    "/organizations/{org_id}/assets/{asset_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        }
    },
    summary="Delete an asset from an organisation",
)
@router.delete(
    "/profiles/{org_id}/assets/{asset_id}",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Asset or organisation not found",
        }
    },
    summary="Delete an asset from an organisation",
)
def delete_asset(org_id: str, asset_id: str):
    """Safely delete an asset without altering global vulnerability data or organisation identity."""
    deleted = triage_service.delete_asset(org_id, asset_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "ASSET_NOT_FOUND",
                "message": f"Asset '{asset_id}' was not found in organisation '{org_id}'.",
            },
        )
    return {
        "status": "deleted",
        "org_id": org_id,
        "asset_id": asset_id,
        "message": f"Asset '{asset_id}' deleted successfully.",
    }
