from fastapi import APIRouter, HTTPException, status
from backend.schemas.api_models import AIExplanationResponse, ErrorResponse
from backend.services.triage_service import triage_service
from backend.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["Copilot & AI Explanation"])


@router.post(
    "/explain/{profile_id}/{cve_id}",
    response_model=AIExplanationResponse,
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "Organisation profile or CVE not found",
        }
    },
    summary="Generate source-bound plain-language explanation via local AI Copilot (with Fact Guard)",
)
def explain_with_ai(profile_id: str, cve_id: str) -> AIExplanationResponse:
    """Explain a deterministic prioritisation decision using only structured evidence

    via local Ollama with strict fact-guard validation and automatic deterministic fallback.
    """
    evidence = triage_service.get_evidence(profile_id, cve_id)
    if not evidence:
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
                "message": f"Vulnerability record '{cve_id}' not found for organisation '{profile_id}'.",
            },
        )

    return ai_service.explain(evidence, profile_id, cve_id)
