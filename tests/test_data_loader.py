from src.data_loader import load_gold_set,load_profiles,load_vulnerabilities
def test_all_inputs_load(): assert len(load_vulnerabilities()) and len(load_profiles()) and len(load_gold_set())
