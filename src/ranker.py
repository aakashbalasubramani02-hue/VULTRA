from collections import OrderedDict
from .models import (
    MatchOutcome,
    OrganizationProfile,
    RankingResult,
    ScoredVulnerability,
    VulnerabilityRecord,
)
from .matcher import match_vulnerability
from .scorer import (
    calculate_personalized_score,
    calculate_priority,
    calculate_confidence,
)
from .provenance import build_provenance_record
from .explainer import build_explanation


def rank_personalized(
    vulnerabilities: list[VulnerabilityRecord],
    organisation: OrganizationProfile,
) -> RankingResult:
    """Filter, score, deduplicate, and rank vulnerabilities for a specific organisation."""
    # Deduplicate raw vulnerabilities by unique signature (keep highest EPSS/CVSS if duplicates exist)
    deduped_vulns: dict[tuple[str, str], VulnerabilityRecord] = {}
    for v in vulnerabilities:
        key = (v.cve_id.strip(), v.product_name.strip())
        if key not in deduped_vulns:
            deduped_vulns[key] = v
        else:
            # If duplicate row exists, keep the one with higher severity/EPSS
            existing = deduped_vulns[key]
            if (v.cvss_base_score, int(v.cisa_kev), v.first_epss) > (existing.cvss_base_score, int(existing.cisa_kev), existing.first_epss):
                deduped_vulns[key] = v

    relevant_scored: list[ScoredVulnerability] = []
    excluded_scored: list[ScoredVulnerability] = []
    needs_verif_scored: list[ScoredVulnerability] = []

    for v in deduped_vulns.values():
        match = match_vulnerability(v, organisation)
        breakdown = calculate_personalized_score(v, organisation, match)
        priority = calculate_priority(breakdown.score_100)
        confidence = calculate_confidence(match, v)
        prov = build_provenance_record(v, match)

        # Temporary placeholder item to build explanation
        item_pre = ScoredVulnerability(
            vulnerability=v,
            match=match,
            breakdown=breakdown,
            rank=0,
            priority=priority,
            confidence=confidence,
            provenance=prov,
        )
        expl = build_explanation(item_pre, organisation)

        item = ScoredVulnerability(
            vulnerability=v,
            match=match,
            breakdown=breakdown,
            rank=0,
            priority=priority,
            confidence=confidence,
            explanation=expl,
            provenance=prov,
        )

        if match.outcome in (MatchOutcome.MATCH, MatchOutcome.NEEDS_VERIFICATION):
            relevant_scored.append(item)
            if match.outcome == MatchOutcome.NEEDS_VERIFICATION:
                needs_verif_scored.append(item)
        else:
            excluded_scored.append(item)

    # Sort relevant items deterministically
    relevant_scored.sort(
        key=lambda x: (
            -x.breakdown.final_score,
            -int(x.vulnerability.cisa_kev),
            -x.vulnerability.first_epss,
            -x.vulnerability.cvss_base_score,
            x.vulnerability.cve_id,
        )
    )

    # Assign sequential ranks 1..N to relevant items
    ranked_final = [
        ScoredVulnerability(
            vulnerability=x.vulnerability,
            match=x.match,
            breakdown=x.breakdown,
            rank=idx + 1,
            priority=x.priority,
            confidence=x.confidence,
            explanation=x.explanation,
            provenance=x.provenance,
        )
        for idx, x in enumerate(relevant_scored)
    ]

    return RankingResult(
        organisation=organisation,
        ranked=tuple(ranked_final),
        excluded=tuple(excluded_scored),
        needs_verification=tuple(needs_verif_scored),
        total_evaluated=len(vulnerabilities),
    )


def rank_by_cvss(vulnerabilities: list[VulnerabilityRecord]) -> list[VulnerabilityRecord]:
    """Sort all vulnerabilities purely by technical baseline (CVSS, KEV, EPSS, CVE ID)."""
    # Deduplicate by (cve_id, product_name)
    deduped: dict[tuple[str, str], VulnerabilityRecord] = {}
    for v in vulnerabilities:
        key = (v.cve_id.strip(), v.product_name.strip())
        if key not in deduped:
            deduped[key] = v
    return sorted(
        deduped.values(),
        key=lambda v: (-v.cvss_base_score, -int(v.cisa_kev), -v.first_epss, v.cve_id),
    )
