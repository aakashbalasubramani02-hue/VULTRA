from .models import (
    ConfidenceLevel,
    Explanation,
    MatchOutcome,
    OrganizationProfile,
    ScoredVulnerability,
)


def generate_title(vulnerability, tech) -> str:
    """Generate a consequence-first, plain-language title."""
    prod = tech.product if tech else vulnerability.product_name
    if vulnerability.cisa_kev and vulnerability.cvss_base_score >= 9.0:
        return f"Actively Exploited Critical Vulnerability in {prod}"
    elif vulnerability.cisa_kev:
        return f"Actively Exploited Vulnerability in {prod}"
    elif vulnerability.cvss_base_score >= 9.0:
        return f"Critical Severity Vulnerability in {prod}"
    elif vulnerability.first_epss >= 0.70:
        return f"High Exploitation Probability Flaw in {prod}"
    elif vulnerability.first_epss >= 0.30:
        return f"Moderate Exploitation Probability Flaw in {prod}"
    return f"Security Vulnerability in {prod}"


def generate_safe_next_action(item: ScoredVulnerability) -> str:
    """Generate a defensive, conservative, and concrete next action."""
    v = item.vulnerability
    m = item.match
    tech = m.matched_technology
    svc = tech.service if tech and tech.service else (tech.product if tech else v.product_name)
    exp = tech.exposure if tech and tech.exposure else "internal"
    imp = tech.importance if tech and tech.importance else "normal"

    if m.outcome == MatchOutcome.NEEDS_VERIFICATION:
        return f"Verify installed version of {v.product_name} on service '{svc}' to confirm if deployment is affected."
    elif v.cisa_kev and exp == "internet-facing":
        return f"Immediately isolate or restrict public access to '{svc}' and deploy vendor security patch as top priority."
    elif v.cisa_kev:
        return f"Prioritise urgent remediation for {v.product_name} on '{svc}' following confirmed in-the-wild exploitation."
    elif exp == "internet-facing" and imp in ("critical", "high"):
        return f"Prioritise patching for '{svc}' and review perimeter firewall/WAF inspection rules."
    elif imp in ("critical", "high"):
        return f"Schedule patch in upcoming cycle and monitor '{svc}' application logs for anomalous requests."
    return f"Review vendor security advisory for {v.product_name} and apply patch during regular maintenance window."


def build_explanation(
    item: ScoredVulnerability,
    organisation: OrganizationProfile,
) -> Explanation:
    """Build a structured Explanation dataclass for a scored vulnerability."""
    v = item.vulnerability
    b = item.breakdown
    m = item.match
    tech = m.matched_technology

    svc = tech.service if tech and tech.service else (tech.product if tech else v.product_name)
    exp = tech.exposure if tech and tech.exposure else "internal"
    imp = tech.importance if tech and tech.importance else "normal"

    title = generate_title(v, tech)
    action = generate_safe_next_action(item)

    # Threat context summary
    threat_parts = []
    if v.cisa_kev:
        threat_parts.append("Confirmed active exploitation (CISA KEV)")
    threat_parts.append(f"FIRST EPSS probability is {v.first_epss:.1%}")
    threat_parts.append(f"CVSS technical score {v.cvss_base_score:.1f}")
    threat_str = "; ".join(threat_parts)

    if not m.matched:
        why = (
            f"{v.cve_id} ({v.product_name}) does not match any technology used by {organisation.name}. "
            f"It is excluded from operational triage."
        )
    else:
        why = (
            f"{v.cve_id} affects {v.product_name} deployed for service '{svc}' ({exp} exposure, {imp} importance). "
            f"{threat_str}. "
            f"Personalised priority score: {b.score_100:.1f}/100."
        )

    # Contributing signals list
    factors = b.factors_100 or {}
    signals = []
    if v.cisa_kev:
        signals.append(f"CISA KEV active exploitation confirmed (+{factors.get('kev', 0):.1f} pts)")
    if b.epss_signal > 0:
        signals.append(f"FIRST EPSS {v.first_epss:.1%} exploitation probability (+{factors.get('epss', 0):.1f} pts)")
    signals.append(f"CVSS {v.cvss_base_score:.1f} base severity (+{factors.get('cvss', 0):.1f} pts)")
    signals.append(f"Asset Exposure '{exp}' (+{factors.get('exposure', 0):.1f} pts)")
    signals.append(f"Service Importance '{imp}' (+{factors.get('importance', 0):.1f} pts)")

    return Explanation(
        title=title,
        why_it_matters=why,
        service=svc,
        exposure=exp,
        importance=imp,
        contributing_signals=tuple(signals),
        safe_next_action=action,
        confidence=item.confidence,
        match_reason=m.match_reason,
    )


def explain_vulnerability(item: ScoredVulnerability, organisation: OrganizationProfile) -> str:
    """Return plain-language explanation string (for backwards compatibility and CLI)."""
    if item.explanation:
        return f"{item.explanation.title}. {item.explanation.why_it_matters}"
    exp = build_explanation(item, organisation)
    return f"{exp.title}. {exp.why_it_matters}"


def next_action(item: ScoredVulnerability) -> str:
    """Return safe next action string (for backwards compatibility)."""
    if item.explanation:
        return item.explanation.safe_next_action
    return generate_safe_next_action(item)
