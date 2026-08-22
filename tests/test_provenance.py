from src.data_loader import load_profiles, load_vulnerabilities
from src.matcher import match_vulnerability
from src.provenance import build_provenance_record


def test_provenance_preserves_source_fields():
    v = load_vulnerabilities()[0]
    p = load_profiles()[0]
    m = match_vulnerability(v, p)
    prov = build_provenance_record(v, m)

    assert prov.cve_id == v.cve_id
    assert prov.source_product == v.product_name
    assert prov.source_cvss == v.cvss_base_score
    assert prov.source_kev == v.cisa_kev
    assert prov.source_epss == v.first_epss
    assert prov.source_file == "vulnerabilities.csv"
    assert "https://" in prov.reference_url
    assert prov.snapshot_date != ""
    assert prov.match_outcome != ""
