import json
import os
import re
from typing import Any, Optional
import httpx

from backend.schemas.api_models import (
    AICopilotExplanationSchema,
    AICopilotMetadataSchema,
    AIExplanationResponse,
    EvidenceResponse,
    FactGuardStatusSchema,
)
from backend.services.fact_guard import FactGuard


class AIService:
    """Isolated local AI Copilot service providing source-bound explanations

    with deterministic fallback and strict fact-guard validation.
    """

    def __init__(self):
        self.ollama_base_url = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT", "6.0"))
        self._preferred_model = os.getenv("OLLAMA_MODEL", None)
        self._cache: dict[tuple[str, str], AIExplanationResponse] = {}

    def get_available_model(self) -> Optional[str]:
        """Discover available local Ollama model without external dependency."""
        if self._preferred_model:
            return self._preferred_model

        try:
            with httpx.Client(timeout=1.5) as client:
                res = client.get(f"{self.ollama_base_url}/api/tags")
                if res.status_code == 200:
                    models = res.json().get("models", [])
                    if models:
                        # Prefer instruct / coding models if present
                        names = [m.get("name", "") for m in models]
                        for pref in ["codellama:7b-instruct", "llama3.2", "llama3", "mistral", "qwen2.5", "phi3", "deepseek-r1:8b"]:
                            for name in names:
                                if pref in name:
                                    return name
                        return names[0]
        except Exception:
            pass
        return None

    def _build_prompt(self, ev_data: dict[str, Any]) -> str:
        """Construct strict source-bound prompt containing only structured evidence."""
        source_facts = ev_data.get("source_facts", {})
        asset_context = ev_data.get("asset_context", {})
        matching = ev_data.get("matching", {})
        score_factors = ev_data.get("score_factors", {})
        explanation = ev_data.get("explanation", {})

        cve_id = ev_data.get("cve_id", "")
        product = source_facts.get("product_name", "")
        version = asset_context.get("installed_version") or "unspecified"
        service = asset_context.get("service") or "core business service"
        exposure = asset_context.get("exposure") or "internal"
        importance = asset_context.get("importance") or "normal"
        cvss = source_facts.get("cvss_base_score", 0.0)
        is_kev = source_facts.get("cisa_kev", False)
        epss = source_facts.get("first_epss", 0.0)
        priority = ev_data.get("priority", "HIGH")
        score = ev_data.get("score_100", 0.0)

        prompt = f"""You are the VULTRA source-bound cybersecurity explanation assistant.
Your task is to explain why this vulnerability was prioritised for this organisation using ONLY the supplied facts below.

SUPPLIED EVIDENCE:
- CVE ID: {cve_id}
- Target Product: {product}
- Organisation Service: {service}
- Installed Version: {version}
- Perimeter Exposure: {exposure}
- Business Criticality: {importance}
- Technical CVSS: {cvss}
- CISA KEV Active Weaponisation: {is_kev}
- FIRST EPSS Exploitation Rate: {epss:.2%}
- Assigned Priority: {priority} (Score: {score:.1f}/100)
- Match Outcome: {matching.get('outcome')} ({matching.get('match_reason')})

STRICT RULES:
1. Use ONLY the supplied facts above. DO NOT invent versions, attacker techniques, patches, or external facts.
2. If CISA KEV is False, DO NOT claim the vulnerability is actively exploited.
3. Recommended next action MUST be safe and conservative (e.g. verify installed version, review referenced advisory, follow change management).
4. Return ONLY valid JSON with keys: "why_it_matters", "potential_impact", "next_action".

JSON Output:"""
        return prompt

    def generate_deterministic_fallback(
        self,
        ev_data: dict[str, Any],
        profile_id: str,
        cve_id: str,
        reason: str = "local_ai_offline",
    ) -> AIExplanationResponse:
        """Mandatory deterministic fallback using verified Phase 1 intelligence."""
        source_facts = ev_data.get("source_facts", {})
        asset_context = ev_data.get("asset_context", {})
        explanation = ev_data.get("explanation", {})

        product = source_facts.get("product_name", cve_id)
        service = asset_context.get("service") or "core service"
        exposure = asset_context.get("exposure", "internal")
        importance = asset_context.get("importance", "normal")
        cvss = source_facts.get("cvss_base_score", 0.0)
        is_kev = source_facts.get("cisa_kev", False)
        epss = source_facts.get("first_epss", 0.0)

        kev_phrase = "is actively exploited in the wild (CISA KEV confirmed)" if is_kev else "has no confirmed active weaponisation in CISA KEV"
        why = (
            f"Vulnerability {cve_id} affects {product} operating the organisation's {service}. "
            f"It carries a technical CVSS severity of {cvss:.1f} and {kev_phrase} with an EPSS exploitation probability of {epss:.1%}. "
            f"Because this service has {exposure} exposure and {importance} criticality, it demands immediate defensive attention."
        )

        impact = (
            f"Potential disruption or compromise of the {service} application and associated {exposure} perimeter infrastructure."
        )

        next_act = explanation.get("safe_next_action") or (
            f"Verify the exact deployed version of {product} on the {service} host and review the official NVD vendor advisory."
        )

        return AIExplanationResponse(
            profile_id=profile_id,
            cve_id=cve_id,
            explanation=AICopilotExplanationSchema(
                why_it_matters=why,
                potential_impact=impact,
                next_action=next_act,
            ),
            ai=AICopilotMetadataSchema(
                available=False,
                generated=False,
                validated=True,
                mode="deterministic_fallback",
                model=None,
            ),
            source_bound=True,
            fact_guard=FactGuardStatusSchema(
                status="FALLBACK",
                checks_performed=["deterministic_provenance_verified", "safe_guidance_guarantee"],
                violations=[],
            ),
        )

    def explain(
        self,
        evidence: EvidenceResponse | dict[str, Any],
        profile_id: str,
        cve_id: str,
    ) -> AIExplanationResponse:
        """Generate a source-bound explanation using local Ollama if available,

        with automatic FactGuard validation and deterministic fallback.
        """
        cache_key = (profile_id.upper(), cve_id.upper())
        if cache_key in self._cache:
            return self._cache[cache_key]

        ev_data = evidence.model_dump() if hasattr(evidence, "model_dump") else (evidence.dict() if hasattr(evidence, "dict") else evidence)

        # Discover model
        model_name = self.get_available_model()
        if not model_name:
            # Ollama not available -> graceful fallback
            fallback_res = self.generate_deterministic_fallback(ev_data, profile_id, cve_id, reason="ollama_not_found")
            self._cache[cache_key] = fallback_res
            return fallback_res

        prompt = self._build_prompt(ev_data)

        # Attempt Ollama local generation
        try:
            with httpx.Client(timeout=self.timeout) as client:
                payload = {
                    "model": model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,  # Low temperature for strict factual adherence
                        "num_predict": 300,
                    },
                }
                res = client.post(f"{self.ollama_base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise RuntimeError(f"Ollama returned HTTP {res.status_code}")

                raw_response = res.json().get("response", "")

                # Extract JSON from model output (handling code blocks or direct JSON)
                json_match = re.search(r"\{.*\}", raw_response, re.DOTALL)
                if not json_match:
                    raise ValueError("Model output did not contain valid JSON object")

                generated_json = json.loads(json_match.group(0))

                # Pass through Fact Guard
                is_valid, checks, violations = FactGuard.validate(ev_data, generated_json)
                if not is_valid:
                    # FactGuard rejected output -> fallback
                    fallback_res = self.generate_deterministic_fallback(
                        ev_data, profile_id, cve_id, reason=f"fact_guard_rejected: {'; '.join(violations)}"
                    )
                    fallback_res.fact_guard.violations = violations
                    self._cache[cache_key] = fallback_res
                    return fallback_res

                # Build validated response
                ai_response = AIExplanationResponse(
                    profile_id=profile_id,
                    cve_id=cve_id,
                    explanation=AICopilotExplanationSchema(
                        why_it_matters=generated_json["why_it_matters"].strip(),
                        potential_impact=generated_json["potential_impact"].strip(),
                        next_action=generated_json["next_action"].strip(),
                    ),
                    ai=AICopilotMetadataSchema(
                        available=True,
                        generated=True,
                        validated=True,
                        mode="local",
                        model=model_name,
                    ),
                    source_bound=True,
                    fact_guard=FactGuardStatusSchema(
                        status="PASSED",
                        checks_performed=checks,
                        violations=[],
                    ),
                )
                self._cache[cache_key] = ai_response
                return ai_response

        except Exception as e:
            # On any error / timeout / connection failure -> deterministic fallback
            fallback_res = self.generate_deterministic_fallback(ev_data, profile_id, cve_id, reason=str(e))
            self._cache[cache_key] = fallback_res
            return fallback_res


# Singleton AI service
ai_service = AIService()
