from src.data_loader import load_profiles, load_vulnerabilities
from src.explainer import build_explanation, explain_vulnerability, next_action
from src.ranker import rank_personalized


def test_explanation_uses_score():
    r = rank_personalized(load_vulnerabilities(), load_profiles()[0])
    top_item = r.ranked[0]
    expl = explain_vulnerability(top_item, r.organisation)
    assert top_item.vulnerability.cve_id in expl
    assert str(top_item.breakdown.score_100) in expl or f"{top_item.breakdown.score_100:.1f}" in expl


def test_structured_explanation():
    r = rank_personalized(load_vulnerabilities(), load_profiles()[0])
    top_item = r.ranked[0]
    struct_expl = build_explanation(top_item, r.organisation)
    assert struct_expl.title != ""
    assert struct_expl.why_it_matters != ""
    assert struct_expl.safe_next_action != ""
    assert len(struct_expl.contributing_signals) > 0


def test_safe_next_action():
    r = rank_personalized(load_vulnerabilities(), load_profiles()[0])
    top_item = r.ranked[0]
    action = next_action(top_item)
    assert isinstance(action, str)
    assert len(action) > 10
