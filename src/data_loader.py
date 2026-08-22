import csv
import json
from pathlib import Path
from typing import Optional
from .models import (
    GoldStandardRecord,
    OrganizationProfile,
    TechnologyProfile,
    VulnerabilityRecord,
    WeightModifiers,
)

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'


def boolean(value: object) -> bool:
    """Parse boolean-like values from strings or primitives."""
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    if s in {'true', '1', 'yes', 'y', 't'}:
        return True
    if s in {'false', '0', 'no', 'n', 'f'}:
        return False
    raise ValueError(f'Invalid boolean-like value: {value!r}')


def load_vulnerabilities(path: Path | str = DATA / 'vulnerabilities.csv') -> list[VulnerabilityRecord]:
    """Load vulnerabilities from CSV file."""
    try:
        with Path(path).open(newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            records = []
            for r in reader:
                cve = r['cve_id'].strip()
                prod = r['product_name'].strip()
                cvss = float(r['cvss_base_score'])
                kev = boolean(r['cisa_kev'])
                epss = float(r['first_epss'])
                aff_v = r.get('affected_versions', '').strip() or None
                v_note = r.get('version_note', '').strip() or None
                ref_url = r.get('reference_url', '').strip() or f"https://nvd.nist.gov/vuln/detail/{cve}"
                snap_date = r.get('snapshot_date', '').strip() or "2026-Q1 Snapshot"

                records.append(
                    VulnerabilityRecord(
                        cve_id=cve,
                        product_name=prod,
                        cvss_base_score=cvss,
                        cisa_kev=kev,
                        first_epss=epss,
                        affected_versions=aff_v,
                        version_note=v_note,
                        reference_url=ref_url,
                        snapshot_date=snap_date,
                    )
                )
            return records
    except (OSError, KeyError, ValueError) as e:
        raise ValueError(f'Unable to load vulnerabilities: {e}') from e


def load_profiles(path: Path | str = DATA / 'profiles.json') -> list[OrganizationProfile]:
    """Load organization profiles with rich technology representations from JSON file."""
    try:
        raw = json.loads(Path(path).read_text(encoding='utf-8'))['organizations']
        profiles = []
        for r in raw:
            w = r.get('weight_modifiers', {})
            # Support 3-signal or 5-signal weights
            weights = WeightModifiers(
                cvss_weight=float(w.get('cvss_weight', 0.15)),
                cisa_kev_weight=float(w.get('cisa_kev_weight', 0.35)),
                first_epss_weight=float(w.get('first_epss_weight', 0.25)),
                exposure_weight=float(w.get('exposure_weight', 0.15)),
                importance_weight=float(w.get('importance_weight', 0.10)),
            )

            technologies = []
            if 'technologies' in r and isinstance(r['technologies'], list):
                for t in r['technologies']:
                    technologies.append(
                        TechnologyProfile(
                            product=t['product'].strip(),
                            vendor=t.get('vendor', '').strip(),
                            version=t.get('version', '').strip() or None,
                            service=t.get('service', '').strip(),
                            exposure=t.get('exposure', 'internal').strip(),
                            importance=t.get('importance', 'normal').strip(),
                        )
                    )
            elif 'critical_products' in r and isinstance(r['critical_products'], list):
                for p in r['critical_products']:
                    technologies.append(
                        TechnologyProfile(
                            product=p.strip(),
                            vendor='',
                            version='unknown',
                            service=p.strip(),
                            exposure='internet-facing',
                            importance='critical',
                        )
                    )

            crit_prods = tuple(
                r.get('critical_products', [t.product for t in technologies])
            )

            profiles.append(
                OrganizationProfile(
                    org_id=r['org_id'].strip(),
                    name=r['name'].strip(),
                    sector=r.get('sector', '').strip(),
                    risk_appetite=r.get('risk_appetite', '').strip(),
                    weights=weights,
                    technologies=tuple(technologies),
                    critical_products=crit_prods,
                )
            )
        return profiles
    except (OSError, KeyError, ValueError, TypeError) as e:
        raise ValueError(f'Unable to load profiles: {e}') from e


def load_gold_set(path: Path | str = DATA / 'gold_set.csv') -> list[GoldStandardRecord]:
    """Load practitioner evaluation benchmark dataset."""
    try:
        with Path(path).open(newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return [
                GoldStandardRecord(
                    cve_id=r['cve_id'].strip(),
                    product_name=r['product_name'].strip(),
                    cvss_base_score=float(r['cvss_base_score']),
                    cisa_kev=boolean(r['cisa_kev']),
                    first_epss=float(r['first_epss']),
                    ranks={
                        k: int(v)
                        for k, v in r.items()
                        if k.startswith('practitioner_rank_') and v.strip()
                    },
                )
                for r in reader
            ]
    except (OSError, KeyError, ValueError) as e:
        raise ValueError(f'Unable to load gold set: {e}') from e
