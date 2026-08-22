from src.data_loader import load_profiles, load_vulnerabilities
from src.normalizer import normalize_product_name
from src.matcher import match_vulnerability
from src.ranker import rank_personalized
from src.models import PriorityLevel, ConfidenceLevel


def test_load_and_rank():
    v = load_vulnerabilities()
    p = load_profiles()
    r = rank_personalized(v, p[0])

    assert len(v) == 540
    assert r.total_evaluated == 540
    assert len(r.ranked) + len(r.excluded) == 540
    assert len(r.ranked) > 0
    assert r.ranked[0].rank == 1
    assert isinstance(r.ranked[0].priority, PriorityLevel)
    assert isinstance(r.ranked[0].confidence, ConfidenceLevel)


def test_normalisation_and_match():
    p = load_profiles()[0]
    v = load_vulnerabilities()[0]
    assert normalize_product_name(' Core   Banking Framework ') == 'core banking framework'
    assert match_vulnerability(v, p).matched
