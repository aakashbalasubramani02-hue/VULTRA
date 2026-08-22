"""Scoring policy and weights configuration for VULTRA.

Deterministic formula:
Score (0.0 to 1.0) =
    (1.0 if KEV else 0.0) * cisa_kev_weight +
    EPSS * first_epss_weight +
    (CVSS / 10.0) * cvss_weight +
    ExposureScore * exposure_weight +
    ImportanceScore * importance_weight

Scaled to 0-100 for human-facing priority points.
"""

# Default engineering weights (sum = 1.0)
DEFAULT_WEIGHTS: dict[str, float] = {
    "cisa_kev_weight": 0.35,
    "first_epss_weight": 0.25,
    "cvss_weight": 0.15,
    "exposure_weight": 0.15,
    "importance_weight": 0.10,
}

# Legacy 3-signal weights (for backwards compatibility if no exposure/importance weights given)
LEGACY_DEFAULT_WEIGHTS: dict[str, float] = {
    "cvss_weight": 0.30,
    "cisa_kev_weight": 0.45,
    "first_epss_weight": 0.25,
    "exposure_weight": 0.0,
    "importance_weight": 0.0,
}

# Exposure contextual scores (0.0 to 1.0)
EXPOSURE_SCORES: dict[str, float] = {
    "internet-facing": 1.0,
    "internet": 1.0,
    "external": 1.0,
    "public": 1.0,
    "dmz": 0.8,
    "internal": 0.4,
    "private": 0.4,
    "air-gapped": 0.0,
    "isolated": 0.0,
    "unknown": 0.5,
}

# Service importance contextual scores (0.0 to 1.0)
IMPORTANCE_SCORES: dict[str, float] = {
    "critical": 1.0,
    "mission-critical": 1.0,
    "high": 0.75,
    "medium": 0.50,
    "normal": 0.50,
    "low": 0.25,
    "negligible": 0.10,
    "unknown": 0.50,
}

# Priority level score cutoffs on 0-100 scale
PRIORITY_THRESHOLDS: dict[str, float] = {
    "URGENT": 70.0,
    "HIGH": 45.0,
    "MEDIUM": 25.0,
    "LOW": 0.0,
}
