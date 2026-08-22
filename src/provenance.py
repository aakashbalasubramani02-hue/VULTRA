from .models import MatchResult, ProvenanceRecord, VulnerabilityRecord

PRODUCTION_INPUTS = (
    "Production rankings use vulnerabilities.csv and profiles.json only. "
    "gold_set.csv is evaluation-only."
)


def build_provenance_record(
    vulnerability: VulnerabilityRecord,
    match: MatchResult,
) -> ProvenanceRecord:
    """Construct a full provenance audit record linking decision to source dataset evidence."""
    ref_url = (
        vulnerability.reference_url
        if vulnerability.reference_url
        else f"https://nvd.nist.gov/vuln/detail/{vulnerability.cve_id}"
    )
    snap_date = (
        vulnerability.snapshot_date
        if vulnerability.snapshot_date
        else "2026-Q1 Snapshot"
    )

    return ProvenanceRecord(
        cve_id=vulnerability.cve_id,
        source_product=vulnerability.product_name,
        source_cvss=vulnerability.cvss_base_score,
        source_kev=vulnerability.cisa_kev,
        source_epss=vulnerability.first_epss,
        source_file="vulnerabilities.csv",
        reference_url=ref_url,
        snapshot_date=snap_date,
        match_outcome=match.outcome.value if hasattr(match.outcome, 'value') else str(match.outcome),
        match_reason=match.match_reason,
    )
