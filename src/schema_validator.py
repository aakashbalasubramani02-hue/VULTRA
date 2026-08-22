from collections import Counter
from typing import Sequence
from .models import GoldStandardRecord, OrganizationProfile, VulnerabilityRecord


def validate_vulnerabilities(records: Sequence[VulnerabilityRecord]) -> list[str]:
    """Validate vulnerability records for missing fields, boundary constraints, and duplicates."""
    issues = []
    keys = []
    for i, r in enumerate(records, 1):
        if not r.cve_id:
            issues.append(f'row {i}: empty CVE')
        if not r.product_name:
            issues.append(f'row {i}: empty product')
        if not (0.0 <= r.cvss_base_score <= 10.0):
            issues.append(f'row {i}: CVSS outside 0-10 ({r.cvss_base_score})')
        if not (0.0 <= r.first_epss <= 1.0):
            issues.append(f'row {i}: EPSS outside 0-1 ({r.first_epss})')
        keys.append((r.cve_id, r.product_name, r.cvss_base_score, r.cisa_kev, r.first_epss))

    dup = sum(n - 1 for n in Counter(keys).values() if n > 1)
    if dup:
        issues.append(f'{dup} duplicate records detected')
    return issues


def validate_profiles(profiles: Sequence[OrganizationProfile]) -> list[str]:
    """Validate organization profiles for structure, technology inventory, and valid weight distributions."""
    issues = []
    for p in profiles:
        if not p.org_id or not p.name:
            issues.append(f'{p.org_id or "unknown"}: missing required profile identifier or name')
        if not p.technologies and not p.critical_products:
            issues.append(f'{p.org_id}: missing technology/product inventory')

        w = p.weights
        weights_tuple = (
            w.cvss_weight,
            w.cisa_kev_weight,
            w.first_epss_weight,
            w.exposure_weight,
            w.importance_weight,
        )
        if any(x < 0.0 or x > 1.0 for x in weights_tuple):
            issues.append(f'{p.org_id}: all weights must be in range [0.0, 1.0]')

        w_sum = sum(weights_tuple)
        if abs(w_sum - 1.0) > 0.05:
            issues.append(f'{p.org_id}: weights should sum to 1.0 (current sum: {w_sum:.2f})')

    return issues


def validate_gold(
    records: Sequence[GoldStandardRecord],
    vulnerabilities: Sequence[VulnerabilityRecord],
) -> list[str]:
    """Validate gold set coverage against active vulnerability dataset."""
    lookup = {(v.cve_id, v.product_name) for v in vulnerabilities}
    cve_lookup = {v.cve_id for v in vulnerabilities}
    issues = []
    for r in records:
        if (r.cve_id, r.product_name) not in lookup:
            if r.cve_id in cve_lookup:
                issues.append(f'unmatched gold product: {r.cve_id} / {r.product_name}')
            else:
                issues.append(f'unmatched gold record: {r.cve_id} / {r.product_name}')
    return issues
