import re
from typing import Any


class FactGuard:
    """Lightweight deterministic fact-guard validating local LLM explanations

    against structured source evidence to detect and reject hallucinations.
    """

    # Forbidden offensive / attack / destructive command patterns in defensive guidance
    DANGEROUS_PATTERNS = [
        re.compile(r"\b(metasploit|sqlmap|hydra|aircrack|exploit-db|msfconsole)\b", re.IGNORECASE),
        re.compile(r"\b(rm\s+-rf|del\s+/[fqs]|format\s+[c-z]:)\b", re.IGNORECASE),
        re.compile(r"\b(nmap\s+-[a-zA-Z0-9]+|masscan|nikto|burpsuite)\b", re.IGNORECASE),
        re.compile(r"\b(reverse\s+shell|payload|meterpreter|bind\s+shell)\b", re.IGNORECASE),
        re.compile(r"(curl|wget)\s+https?://[^\s|]+\s*\|\s*(bash|sh|powershell|cmd)", re.IGNORECASE),
    ]

    CVE_PATTERN = re.compile(r"\bCVE-\d{4}-\d{4,7}\b", re.IGNORECASE)

    @classmethod
    def validate(cls, evidence: dict[str, Any], generated: dict[str, Any]) -> tuple[bool, list[str], list[str]]:
        """Validate LLM output against source facts.

        Returns: (is_valid, checks_passed, violations)
        """
        checks_passed: list[str] = []
        violations: list[str] = []

        # 1. Structural Schema Validation
        required_keys = ["why_it_matters", "potential_impact", "next_action"]
        for k in required_keys:
            val = generated.get(k)
            if not isinstance(val, str) or not val.strip():
                violations.append(f"Missing or empty required explanation field: '{k}'")
            else:
                checks_passed.append(f"field_presence_{k}")

        if violations:
            return False, checks_passed, violations

        full_text = f"{generated['why_it_matters']} {generated['potential_impact']} {generated['next_action']}"

        # 2. CVE Integrity Validation (No foreign/hallucinated CVE IDs)
        target_cve = str(evidence.get("cve_id", "")).upper()
        found_cves = cls.CVE_PATTERN.findall(full_text)
        for cve in found_cves:
            if cve.upper() != target_cve:
                violations.append(f"Hallucinated foreign CVE ID found: '{cve}', expected only '{target_cve}'")

        if not any(cve.upper() != target_cve for cve in found_cves):
            checks_passed.append("cve_integrity_verified")

        # 3. KEV Truthfulness Check
        is_kev = bool(evidence.get("source_facts", {}).get("cisa_kev", evidence.get("cisa_kev", False)))
        if not is_kev:
            unsupported_kev_claims = [
                "actively exploited in the wild",
                "cisa kev confirmed",
                "listed in cisa kev",
                "in-the-wild exploitation confirmed",
            ]
            for phrase in unsupported_kev_claims:
                if phrase in full_text.lower():
                    violations.append(f"Unsupported active exploitation claim: '{phrase}' on non-KEV vulnerability")

        if not violations:
            checks_passed.append("threat_signal_truthfulness")

        # 4. Safe Defensive Action Safety Check
        next_action_text = generated.get("next_action", "")
        for pat in cls.DANGEROUS_PATTERNS:
            if pat.search(next_action_text):
                violations.append("Dangerous, offensive, or destructive command detected in recommended next action")
                break

        if "Dangerous, offensive, or destructive command detected in recommended next action" not in violations:
            checks_passed.append("defensive_action_safety")

        # 5. Over-assurance / False Security Check
        false_security_claims = [
            "organisation is secure",
            "system is fully safe",
            "no risk to the organisation",
            "cannot be exploited",
        ]
        for claim in false_security_claims:
            if claim in full_text.lower():
                violations.append(f"Unsubstantiated security over-assurance claim: '{claim}'")

        if not violations:
            checks_passed.append("conservative_assurance_check")

        is_valid = len(violations) == 0
        return is_valid, checks_passed, violations
