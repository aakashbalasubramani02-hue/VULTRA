from typing import Sequence
from .models import EvaluationResult, GoldStandardRecord, RankingResult


def evaluate(
    ranking: RankingResult,
    gold: Sequence[GoldStandardRecord],
    org_id: str,
) -> EvaluationResult:
    """Evaluate ranking results against practitioner gold standard benchmark.

    Gracefully reports unmatched benchmark entries as warnings without halting or overwriting.
    """
    suffix = {'ORG-001': 'bank', 'ORG-002': 'startup'}.get(org_id)
    if not suffix:
        return EvaluationResult(False, 0, 0, None, None, None, None, None, ())

    field = 'practitioner_rank_' + suffix
    applicable = [g for g in gold if field in g.ranks]

    predicted = {
        (x.vulnerability.cve_id, x.vulnerability.product_name): x.rank
        for x in ranking.ranked
    }

    paired = []
    warnings = []

    for g in applicable:
        key = (g.cve_id, g.product_name)
        if key in predicted:
            paired.append((g, predicted[key]))
        else:
            # Check by CVE ID if product matches canonical form
            cve_matches = [
                x.rank for x in ranking.ranked if x.vulnerability.cve_id == g.cve_id
            ]
            if cve_matches:
                paired.append((g, cve_matches[0]))
            else:
                warnings.append(
                    f'DATA CONSISTENCY WARNING: {g.cve_id} / {g.product_name} is not found in active vulnerability dataset'
                )

    if not paired:
        return EvaluationResult(
            available=True,
            gold_count=len(applicable),
            matched_count=0,
            top1_agreement=None,
            top3_agreement=None,
            top5_agreement=None,
            mrr=None,
            rank_correlation=None,
            warnings=tuple(warnings),
        )

    gold_order = sorted(paired, key=lambda p: p[0].ranks[field])
    pred_order = sorted(paired, key=lambda p: p[1])
    gold_top = [g.cve_id for g, _ in gold_order]
    pred_top = [g.cve_id for g, _ in pred_order]

    def agreement(k: int) -> float:
        cutoff = min(k, len(gold_top))
        if cutoff == 0:
            return 0.0
        return len(set(gold_top[:cutoff]) & set(pred_top[:cutoff])) / cutoff

    top_gold_key = (gold_order[0][0].cve_id, gold_order[0][0].product_name)
    top_gold_rank = predicted.get(top_gold_key, paired[0][1])
    reciprocal = 1.0 / top_gold_rank if top_gold_rank > 0 else 0.0

    n = len(paired)
    d2 = sum((g.ranks[field] - p) ** 2 for g, p in paired)
    corr = 1.0 - (6.0 * d2 / (n * (n * n - 1))) if n > 1 else None

    return EvaluationResult(
        available=True,
        gold_count=len(applicable),
        matched_count=n,
        top1_agreement=gold_top[0] == pred_top[0] if gold_top and pred_top else None,
        top3_agreement=agreement(3),
        top5_agreement=agreement(5),
        mrr=reciprocal,
        rank_correlation=corr,
        warnings=tuple(warnings),
    )
