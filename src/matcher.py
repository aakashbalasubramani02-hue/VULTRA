import re
from typing import Optional
from .models import (
    MatchOutcome,
    MatchReason,
    MatchResult,
    TechnologyProfile,
    OrganizationProfile,
    VulnerabilityRecord,
)
from .normalizer import normalize_product_name


def _parse_version_tuple(v_str: str) -> Optional[tuple[int, ...]]:
    """Parse standard dot-separated numeric version into a tuple of ints for safe comparison."""
    if not v_str:
        return None
    # Strip leading 'v' or 'ver'
    clean = re.sub(r'^[vV](?:er)?\.?', '', v_str.strip())
    # Extract numeric components
    parts = clean.split('.')
    num_parts = []
    for p in parts:
        # Match leading digits
        m = re.match(r'^(\d+)', p)
        if m:
            num_parts.append(int(m.group(1)))
        else:
            return None
    return tuple(num_parts) if num_parts else None


def _compare_tuples(v1: tuple[int, ...], v2: tuple[int, ...]) -> int:
    """Compare two version tuples padded with zeros: returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2."""
    max_len = max(len(v1), len(v2))
    p1 = v1 + (0,) * (max_len - len(v1))
    p2 = v2 + (0,) * (max_len - len(v2))
    if p1 < p2:
        return -1
    elif p1 > p2:
        return 1
    return 0


def compare_versions(
    installed_version: Optional[str],
    affected_versions: Optional[str],
    version_note: Optional[str] = None,
) -> tuple[MatchOutcome, MatchReason, str]:
    """Deterministically compare installed version against affected version specification.

    Returns (MatchOutcome, MatchReason, explanation).
    Never guesses; falls back to NEEDS_VERIFICATION when ambiguous.
    """
    # Check for unsafe version note
    if version_note and any(
        kw in version_note.lower()
        for kw in ("complex", "unsafe", "see advisory", "vendor specific", "varies", "custom", "backport")
    ):
        return (
            MatchOutcome.NEEDS_VERIFICATION,
            MatchReason.VERSION_UNSAFE_TO_COMPARE,
            f"Version note indicates manual verification required: {version_note}",
        )

    # If installed version is unknown
    if not installed_version or installed_version.strip().lower() in ("unknown", "none", "", "n/a"):
        return (
            MatchOutcome.NEEDS_VERIFICATION,
            MatchReason.VERSION_UNKNOWN,
            "Installed technology version is unspecified in organisation profile; verification required.",
        )

    # If vulnerability affected range is unconstrained or unspecified
    if not affected_versions or affected_versions.strip().lower() in ("all", "*", "", "all versions", "unknown"):
        return (
            MatchOutcome.MATCH,
            MatchReason.AFFECTED_VERSION,
            "Vulnerability has unconstrained affected version range; applies to installed deployment.",
        )

    installed_tup = _parse_version_tuple(installed_version)
    if installed_tup is None:
        return (
            MatchOutcome.NEEDS_VERIFICATION,
            MatchReason.VERSION_UNSAFE_TO_COMPARE,
            f"Installed version '{installed_version}' is not a standard numeric version.",
        )

    # Parse simple range expressions: e.g. "< 2.4.58", "<= 3.0", ">= 1.0, < 2.0", "== 1.2", "1.2.3"
    clauses = [c.strip() for c in affected_versions.split(',') if c.strip()]
    in_range = True

    for clause in clauses:
        m = re.match(r'^(<=|>=|<|>|==|=)?\s*([0-9a-zA-Z._-]+)$', clause)
        if not m:
            return (
                MatchOutcome.NEEDS_VERIFICATION,
                MatchReason.VERSION_UNSAFE_TO_COMPARE,
                f"Affected version clause '{clause}' cannot be safely parsed automatically.",
            )
        op = m.group(1) or "=="
        if op == "=":
            op = "=="
        bound_str = m.group(2)
        bound_tup = _parse_version_tuple(bound_str)
        if bound_tup is None:
            return (
                MatchOutcome.NEEDS_VERIFICATION,
                MatchReason.VERSION_UNSAFE_TO_COMPARE,
                f"Affected version bound '{bound_str}' is not a standard numeric version.",
            )

        cmp = _compare_tuples(installed_tup, bound_tup)
        if op == "<" and not (cmp < 0):
            in_range = False
        elif op == "<=" and not (cmp <= 0):
            in_range = False
        elif op == ">" and not (cmp > 0):
            in_range = False
        elif op == ">=" and not (cmp >= 0):
            in_range = False
        elif op == "==" and not (cmp == 0):
            in_range = False

    if in_range:
        return (
            MatchOutcome.MATCH,
            MatchReason.AFFECTED_VERSION,
            f"Installed version {installed_version} is within affected range '{affected_versions}'.",
        )
    else:
        return (
            MatchOutcome.NOT_AFFECTED,
            MatchReason.VERSION_NOT_AFFECTED,
            f"Installed version {installed_version} is outside affected range '{affected_versions}'.",
        )


def match_vulnerability(
    vulnerability: VulnerabilityRecord,
    organisation: OrganizationProfile,
) -> MatchResult:
    """Evaluate a vulnerability against an organisation profile.

    Returns MatchResult with outcome: MATCH, EXCLUDE, NEEDS_VERIFICATION, or NOT_AFFECTED.
    """
    target_product = normalize_product_name(vulnerability.product_name)

    # Check against structured technologies
    if organisation.technologies:
        for tech in organisation.technologies:
            if target_product == normalize_product_name(tech.product):
                outcome, reason_code, explanation = compare_versions(
                    tech.version,
                    vulnerability.affected_versions,
                    vulnerability.version_note,
                )
                is_matched = outcome in (MatchOutcome.MATCH, MatchOutcome.NEEDS_VERIFICATION)
                return MatchResult(
                    outcome=outcome,
                    reason_code=reason_code,
                    match_reason=explanation,
                    matched_technology=tech,
                    matched=is_matched,
                    critical_product=tech.product if is_matched else None,
                )

    # Fallback to critical_products for backwards compatibility
    if organisation.critical_products:
        for prod in organisation.critical_products:
            if target_product == normalize_product_name(prod):
                tech = TechnologyProfile(
                    product=prod,
                    version="unknown",
                    service=prod,
                    exposure="internet-facing",
                    importance="critical",
                )
                outcome, reason_code, explanation = compare_versions(
                    tech.version,
                    vulnerability.affected_versions,
                    vulnerability.version_note,
                )
                is_matched = outcome in (MatchOutcome.MATCH, MatchOutcome.NEEDS_VERIFICATION)
                return MatchResult(
                    outcome=outcome,
                    reason_code=reason_code,
                    match_reason=explanation,
                    matched_technology=tech,
                    matched=is_matched,
                    critical_product=prod if is_matched else None,
                )

    # Product not used by organisation
    return MatchResult(
        outcome=MatchOutcome.EXCLUDE,
        reason_code=MatchReason.PRODUCT_NOT_USED,
        match_reason=f"Product '{vulnerability.product_name}' is not deployed in {organisation.name}.",
        matched_technology=None,
        matched=False,
        critical_product=None,
    )


def match_vulnerabilities(
    vulnerabilities: list[VulnerabilityRecord],
    organisation: OrganizationProfile,
) -> list[MatchResult]:
    """Match all vulnerabilities against an organisation."""
    return [match_vulnerability(v, organisation) for v in vulnerabilities]
