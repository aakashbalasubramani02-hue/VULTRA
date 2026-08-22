from dataclasses import dataclass, asdict, field
from enum import Enum
from typing import Optional, Any


class MatchOutcome(str, Enum):
    MATCH = "MATCH"
    EXCLUDE = "EXCLUDE"
    NEEDS_VERIFICATION = "NEEDS_VERIFICATION"
    NOT_AFFECTED = "NOT_AFFECTED"


class MatchReason(str, Enum):
    PRODUCT_NOT_USED = "PRODUCT_NOT_USED"
    VERSION_NOT_AFFECTED = "VERSION_NOT_AFFECTED"
    VERSION_UNKNOWN = "VERSION_UNKNOWN"
    VERSION_UNSAFE_TO_COMPARE = "VERSION_UNSAFE_TO_COMPARE"
    AFFECTED_VERSION = "AFFECTED_VERSION"
    PRODUCT_MATCH = "PRODUCT_MATCH"


class PriorityLevel(str, Enum):
    URGENT = "URGENT"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass(frozen=True)
class WeightModifiers:
    cvss_weight: float = 0.15
    cisa_kev_weight: float = 0.35
    first_epss_weight: float = 0.25
    exposure_weight: float = 0.15
    importance_weight: float = 0.10


@dataclass(frozen=True)
class TechnologyProfile:
    product: str
    vendor: str = ""
    version: Optional[str] = None
    service: str = ""
    exposure: str = "internal"
    importance: str = "normal"


@dataclass(frozen=True)
class OrganizationProfile:
    org_id: str
    name: str
    sector: str
    risk_appetite: str
    weights: WeightModifiers
    technologies: tuple[TechnologyProfile, ...] = field(default_factory=tuple)
    critical_products: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class VulnerabilityRecord:
    cve_id: str
    product_name: str
    cvss_base_score: float
    cisa_kev: bool
    first_epss: float
    affected_versions: Optional[str] = None
    version_note: Optional[str] = None
    reference_url: Optional[str] = None
    snapshot_date: Optional[str] = None


@dataclass(frozen=True)
class MatchResult:
    outcome: MatchOutcome
    reason_code: MatchReason
    match_reason: str
    matched_technology: Optional[TechnologyProfile] = None
    matched: bool = True
    critical_product: Optional[str] = None


@dataclass(frozen=True)
class ScoreBreakdown:
    normalized_cvss: float
    cvss_weight: float
    cvss_component: float
    kev_signal: int
    kev_weight: float
    kev_component: float
    epss_signal: float
    epss_weight: float
    epss_component: float
    exposure_signal: float = 0.0
    exposure_weight: float = 0.0
    exposure_component: float = 0.0
    importance_signal: float = 0.0
    importance_weight: float = 0.0
    importance_component: float = 0.0
    critical_product: bool = False
    final_score: float = 0.0
    score_100: float = 0.0
    factors_100: dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True)
class ProvenanceRecord:
    cve_id: str
    source_product: str
    source_cvss: float
    source_kev: bool
    source_epss: float
    source_file: str = "vulnerabilities.csv"
    reference_url: str = ""
    snapshot_date: str = ""
    match_outcome: str = ""
    match_reason: str = ""


@dataclass(frozen=True)
class Explanation:
    title: str
    why_it_matters: str
    service: str
    exposure: str
    importance: str
    contributing_signals: tuple[str, ...]
    safe_next_action: str
    confidence: ConfidenceLevel
    match_reason: str


@dataclass(frozen=True)
class ScoredVulnerability:
    vulnerability: VulnerabilityRecord
    match: MatchResult
    breakdown: ScoreBreakdown
    rank: int = 0
    priority: PriorityLevel = PriorityLevel.MEDIUM
    confidence: ConfidenceLevel = ConfidenceLevel.HIGH
    explanation: Optional[Explanation] = None
    provenance: Optional[ProvenanceRecord] = None


@dataclass(frozen=True)
class GoldStandardRecord:
    cve_id: str
    product_name: str
    cvss_base_score: float
    cisa_kev: bool
    first_epss: float
    ranks: dict


@dataclass(frozen=True)
class EvaluationResult:
    available: bool
    gold_count: int
    matched_count: int
    top1_agreement: Optional[bool]
    top3_agreement: Optional[float]
    top5_agreement: Optional[float]
    mrr: Optional[float]
    rank_correlation: Optional[float]
    warnings: tuple[str, ...]


@dataclass(frozen=True)
class RankingResult:
    organisation: OrganizationProfile
    ranked: tuple[ScoredVulnerability, ...]
    excluded: tuple[ScoredVulnerability, ...] = field(default_factory=tuple)
    needs_verification: tuple[ScoredVulnerability, ...] = field(default_factory=tuple)
    total_evaluated: int = 0


@dataclass(frozen=True)
class WhatIfResult:
    original: RankingResult
    simulated: RankingResult
    weights: WeightModifiers


def serialise(obj: Any) -> Any:
    if isinstance(obj, Enum):
        return obj.value
    if hasattr(obj, '__dataclass_fields__'):
        return {k: serialise(v) for k, v in asdict(obj).items()}
    if isinstance(obj, (tuple, list)):
        return [serialise(x) for x in obj]
    if isinstance(obj, dict):
        return {k: serialise(v) for k, v in obj.items()}
    return obj
