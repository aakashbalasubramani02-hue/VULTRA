from pathlib import Path
from .models import RankingResult


def render_ranking(ranking: RankingResult, limit: int = 5) -> str:
    """Render a comprehensive, human-readable terminal triage decision report."""
    p = ranking.organisation
    w = p.weights

    lines = [
        "================================================================================",
        "                       VULTRA PERSONALISED TRIAGE DECISION                      ",
        "================================================================================",
        f"Organisation : {p.name} ({p.org_id})",
        f"Sector       : {p.sector} | Risk Appetite: {p.risk_appetite}",
        f"Weights      : KEV={w.cisa_kev_weight:.0%}, EPSS={w.first_epss_weight:.0%}, "
        f"CVSS={w.cvss_weight:.0%}, Exposure={w.exposure_weight:.0%}, Importance={w.importance_weight:.0%}",
        f"Evaluated    : {len(ranking.ranked)} relevant candidates from {ranking.total_evaluated} total CVE records",
    ]

    if p.technologies:
        lines.append("Technologies :")
        for t in p.technologies:
            v_str = f" v{t.version}" if t.version and t.version != "unknown" else ""
            lines.append(f"  - {t.product}{v_str} [{t.exposure}] - Service: '{t.service}' ({t.importance})")
    elif p.critical_products:
        lines.append(f"Technologies : {', '.join(p.critical_products)}")

    lines.append("--------------------------------------------------------------------------------")
    lines.append(f"TOP {min(limit, len(ranking.ranked))} PERSONALISED ACTIONS")
    lines.append("--------------------------------------------------------------------------------")

    if not ranking.ranked:
        lines.append("No vulnerabilities matched the organisation's technology profile.")
        return "\n".join(lines)

    for x in ranking.ranked[:limit]:
        v = x.vulnerability
        b = x.breakdown
        m = x.match
        tech = m.matched_technology
        svc = tech.service if tech and tech.service else (tech.product if tech else v.product_name)
        exp = tech.exposure if tech and tech.exposure else "internal"
        imp = tech.importance if tech and tech.importance else "normal"
        f = b.factors_100 or {}

        title = x.explanation.title if x.explanation else f"Vulnerability in {v.product_name}"
        why = x.explanation.why_it_matters if x.explanation else ""
        action = x.explanation.safe_next_action if x.explanation else ""

        lines.extend([
            f"\n[RANK #{x.rank}] {v.cve_id} - {title}",
            f"  Product     : {v.product_name} | Service: '{svc}'",
            f"  Context     : Exposure={exp.upper()} | Importance={imp.upper()} | Confidence={x.confidence.value}",
            f"  Priority    : {x.priority.value} (Score: {b.score_100:.1f} / 100)",
            f"  Signals     : CVSS {v.cvss_base_score:.1f} | KEV: {'YES' if v.cisa_kev else 'NO'} | EPSS: {v.first_epss:.1%}",
            f"  Point Share : KEV +{f.get('kev', 0):.1f} | EPSS +{f.get('epss', 0):.1f} | CVSS +{f.get('cvss', 0):.1f} | Exp +{f.get('exposure', 0):.1f} | Imp +{f.get('importance', 0):.1f}",
            f"  Why Matters : {why}",
            f"  Next Action : {action}",
            f"  Evidence    : Outcome={m.outcome.value} ({m.match_reason}) | Ref: {x.provenance.reference_url if x.provenance else 'NVD'}",
        ])

    lines.append("================================================================================")
    return "\n".join(lines)


def write_report(path: Path | str, content: str) -> None:
    """Write report text to specified path."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')
