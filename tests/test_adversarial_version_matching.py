"""
Adversarial Version Matching Test Suite
Thoroughly stress tests version boundary conditions, invalid formats, unconstrained versions,
and ensuring no silent false positives or false negatives.
"""

import pytest
from src.matcher import compare_versions
from src.models import MatchOutcome, MatchReason


def test_version_exact_matches():
    # Affected
    res = compare_versions("2.4.49", "< 2.4.58")
    assert res[0] == MatchOutcome.MATCH
    assert res[1] == MatchReason.AFFECTED_VERSION

    # Unaffected
    res = compare_versions("2.4.59", "< 2.4.58")
    assert res[0] == MatchOutcome.NOT_AFFECTED
    assert res[1] == MatchReason.VERSION_NOT_AFFECTED


def test_version_range_boundaries():
    # Boundary <= 2.4.58 with 2.4.58 (Should Match)
    res = compare_versions("2.4.58", "<= 2.4.58")
    assert res[0] == MatchOutcome.MATCH

    # Boundary < 2.4.58 with 2.4.58 (Should Not Match)
    res = compare_versions("2.4.58", "< 2.4.58")
    assert res[0] == MatchOutcome.NOT_AFFECTED

    # Multi-clause: >= 1.0, < 2.0 with 1.5 (Should Match)
    res = compare_versions("1.5.0", ">= 1.0, < 2.0")
    assert res[0] == MatchOutcome.MATCH

    # Multi-clause: >= 1.0, < 2.0 with 2.0 (Should Not Match)
    res = compare_versions("2.0.0", ">= 1.0, < 2.0")
    assert res[0] == MatchOutcome.NOT_AFFECTED


def test_version_uncertainty_and_unknowns():
    # Missing / None installed version
    res = compare_versions(None, "< 2.4.58")
    assert res[0] == MatchOutcome.NEEDS_VERIFICATION
    assert res[1] == MatchReason.VERSION_UNKNOWN

    # Blank / "unknown" installed version
    res = compare_versions("unknown", "< 2.4.58")
    assert res[0] == MatchOutcome.NEEDS_VERIFICATION
    assert res[1] == MatchReason.VERSION_UNKNOWN

    # Unsafe / complex version note
    res = compare_versions("2.4.49", "< 2.4.58", version_note="vendor specific backport")
    assert res[0] == MatchOutcome.NEEDS_VERIFICATION
    assert res[1] == MatchReason.VERSION_UNSAFE_TO_COMPARE

    # Unparseable range
    res = compare_versions("2.4.49", "custom-branch-alpha-build")
    assert res[0] == MatchOutcome.NEEDS_VERIFICATION
    assert res[1] == MatchReason.VERSION_UNSAFE_TO_COMPARE


def test_unconstrained_vulnerability_version():
    # All versions affected
    res = compare_versions("2.4.49", "*")
    assert res[0] == MatchOutcome.MATCH

    res = compare_versions("2.4.49", "all")
    assert res[0] == MatchOutcome.MATCH
