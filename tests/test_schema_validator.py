from src.data_loader import load_vulnerabilities
from src.schema_validator import validate_vulnerabilities
def test_actual_vulnerabilities_are_valid(): assert validate_vulnerabilities(load_vulnerabilities()) == []
