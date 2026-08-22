from config.scoring import (
    DEFAULT_WEIGHTS,
    EXPOSURE_SCORES,
    IMPORTANCE_SCORES,
    PRIORITY_THRESHOLDS,
)
from .models import (
    MatchOutcome,
    MatchResult,
    OrganizationProfile,
    PriorityLevel,
    ConfidenceLevel,
    ScoreBreakdown,
    VulnerabilityRecord,
)


def calculate_priority(score_100: float) -> PriorityLevel:
    """Map a 0-100 score to a standard priority category."""
    if score_100 >= PRIORITY_THRESHOLDS.get("URGENT", 70.0):
        return PriorityLevel.URGENT
    if score_100 >= PRIORITY_THRESHOLDS.get("HIGH", 45.0):
        return PriorityLevel.HIGH
    if score_100 >= PRIORITY_THRESHOLDS.get("MEDIUM", 25.0):
        return PriorityLevel.MEDIUM
    return PriorityLevel.LOW


def calculate_confidence(
    match: MatchResult,
    vulnerability: VulnerabilityRecord,
) -> ConfidenceLevel:
    """Determine confidence level based on matching and data precision (not threat severity)."""
    if match.outcome == MatchOutcome.MATCH:
        if match.matched_technology and match.matched_technology.version not in (None, "unknown", ""):
            return ConfidenceLevel.HIGH
        # Product match without specific version or all-versions
        return ConfidenceLevel.HIGH
    elif match.outcome == MatchOutcome.NEEDS_VERIFICATION:
        return ConfidenceLevel.MEDIUM
    elif match.outcome == MatchOutcome.NOT_AFFECTED:
        return ConfidenceLevel.HIGH
    return ConfidenceLevel.LOW


def calculate_personalized_score(
    vulnerability: VulnerabilityRecord,
    organisation: OrganizationProfile,
    match: MatchResult,
) -> ScoreBreakdown:
    """Calculate transparent, multi-signal personalised score incorporating organisational context."""
    w = organisation.weights

    # Base technical signals
    cvss_norm = vulnerability.cvss_base_score / 10.0
    kev_val = 1 if vulnerability.cisa_kev else 0
    epss_val = max(0.0, min(1.0, vulnerability.first_epss))

    # Contextual signals from matched technology
    tech = match.matched_technology
    if tech:
        exp_key = tech.exposure.strip().lower() if tech.exposure else "unknown"
        imp_key = tech.importance.strip().lower() if tech.importance else "normal"
    else:
        exp_key = "unknown"
        imp_key = "normal"

    exposure_val = EXPOSURE_SCORES.get(exp_key, 0.5)
    importance_val = IMPORTANCE_SCORES.get(imp_key, 0.5)

    # Weights
    cvss_w = getattr(w, "cvss_weight", DEFAULT_WEIGHTS["cvss_weight"])
    kev_w = getattr(w, "cisa_kev_weight", DEFAULT_WEIGHTS["cisa_kev_weight"])
    epss_w = getattr(w, "first_epss_weight", DEFAULT_WEIGHTS["first_epss_weight"])
    exp_w = getattr(w, "exposure_weight", DEFAULT_WEIGHTS.get("exposure_weight", 0.15))
    imp_w = getattr(w, "importance_weight", DEFAULT_WEIGHTS.get("importance_weight", 0.10))

    # Signal components
    cvss_comp = cvss_norm * cvss_w
    kev_comp = kev_val * kev_w
    epss_comp = epss_val * epss_w
    exp_comp = exposure_val * exp_w
    imp_comp = importance_val * imp_w

    is_excluded = match.outcome in (MatchOutcome.EXCLUDE, MatchOutcome.NOT_AFFECTED)

    if is_excluded:
        final_score = 0.0
        score_100 = 0.0
        factors_100 = {
            "kev": 0.0,
            "epss": 0.0,
            "cvss": 0.0,
            "exposure": 0.0,
            "importance": 0.0,
        }
    else:
        final_score = cvss_comp + kev_comp + epss_comp + exp_comp + imp_comp
        score_100 = round(final_score * 100.0, 1)
        factors_100 = {
            "kev": round(kev_comp * 100.0, 1),
            "epss": round(epss_comp * 100.0, 1),
            "cvss": round(cvss_comp * 100.0, 1),
            "exposure": round(exp_comp * 100.0, 1),
            "importance": round(imp_comp * 100.0, 1),
        }

    return ScoreBreakdown(
        normalized_cvss=cvss_norm,
        cvss_weight=cvss_w,
        cvss_component=cvss_comp,
        kev_signal=kev_val,
        kev_weight=kev_w,
        kev_component=kev_comp,
        epss_signal=epss_val,
        epss_weight=epss_w,
        epss_component=epss_comp,
        exposure_signal=exposure_val,
        exposure_weight=exp_w,
        exposure_component=exp_comp,
        importance_signal=importance_val,
        importance_weight=imp_w,
        importance_component=imp_comp,
        critical_product=match.matched,
        final_score=final_score,
        score_100=score_100,
        factors_100=factors_100,
    )
