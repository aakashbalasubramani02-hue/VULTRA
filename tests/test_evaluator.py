from src.data_loader import load_gold_set,load_profiles,load_vulnerabilities
from src.evaluator import evaluate
from src.ranker import rank_personalized
def test_unmatched_benchmark_warns_without_scoring():
    r=rank_personalized(load_vulnerabilities(),load_profiles()[0]); e=evaluate(r,load_gold_set(),'ORG-001'); assert e.available and e.matched_count==0 and e.warnings
