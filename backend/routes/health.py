from fastapi import APIRouter
from backend.schemas.api_models import HealthResponse

router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
def health_check() -> HealthResponse:
    """Return local service health status."""
    return HealthResponse(status="ok", service="vultra-api", version="1.0")
