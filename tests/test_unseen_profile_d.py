"""
Adversarial Test Suite: Unseen Profile Compatibility (Profile D)
Verifies that the deterministic engine handles arbitrary, schema-compatible unseen profiles
without hardcoded branches, sector biases, or crashes.
"""

import pytest
from src.data_loader import load_vulnerabilities
from src.models import (
    OrganizationProfile,
    TechnologyProfile,
    WeightModifiers,
    MatchOutcome,
)
from src.ranker import rank_personalized


def test_unseen_profile_d_full_pipeline():
    """Test completely unseen profile with distinct technologies, versions, exposures, and services."""
    vulns = load_vulnerabilities()

    unseen_profile_d = OrganizationProfile(
        org_id="ORG-UNSEEN-D",
        name="BioTech Genomics Research Lab",
        sector="Life Sciences / Biotechnology",
        risk_appetite="Very Low",
        technologies=(
            TechnologyProfile(vendor="SecuGate", product="Enterprise Router OS", version="4.2.0", service="Genomics Perimeter Uplink", exposure="Internet-facing", importance="Critical"),
            TechnologyProfile(vendor="AuthCorp", product="Identity Provider SaaS", version="2023.1", service="Researcher SSO", exposure="Internet-facing", importance="Critical"),
            TechnologyProfile(vendor="CloudStack", product="Cloud Database Engine", version="3.8.0", service="Primary Genomic DB", exposure="Internal", importance="High"),
        ),
        critical_products=("Enterprise Router OS", "Identity Provider SaaS"),
        weights=WeightModifiers(
            cisa_kev_weight=0.40,
            first_epss_weight=0.30,
            cvss_weight=0.10,
            exposure_weight=0.10,
            importance_weight=0.10,
        ),
    )

    ranking = rank_personalized(vulns, unseen_profile_d)
    assert ranking is not None
    assert len(ranking.ranked) > 0
    assert len(ranking.ranked[:5]) == 5

    # Verify that ranked items belong ONLY to technologies deployed in Profile D
    allowed_prods = {"Enterprise Router OS", "Identity Provider SaaS", "Cloud Database Engine"}
    for item in ranking.ranked[:5]:
        assert item.match.matched_technology is not None
        assert item.match.matched_technology.product in allowed_prods
        assert item.breakdown.score_100 >= 0.0
        assert item.rank in range(1, 6)


def test_unseen_profile_no_matches():
    """Test completely unseen profile with technologies not present in the dataset."""
    vulns = load_vulnerabilities()

    unseen_no_match = OrganizationProfile(
        org_id="ORG-ZERO-MATCH",
        name="Antique Wooden Toys Workshop",
        sector="Artisanal Manufacturing",
        risk_appetite="Low",
        technologies=(
            TechnologyProfile(vendor="CustomHandmade", product="ChiselToolOS", version="1.0", service="Carving Desk", exposure="Air-gapped", importance="Low"),
        ),
        critical_products=(),
        weights=WeightModifiers(
            cisa_kev_weight=0.35,
            first_epss_weight=0.25,
            cvss_weight=0.15,
            exposure_weight=0.15,
            importance_weight=0.10,
        ),
    )

    ranking = rank_personalized(vulns, unseen_no_match)
    assert ranking is not None
    assert len(ranking.ranked) == 0
    # Everything should be in excluded
    assert len(ranking.excluded) == len(vulns)


def test_unseen_profile_unconstrained_versions():
    """Test unseen profile with unconstrained (None) versions produces NEEDS_VERIFICATION."""
    vulns = load_vulnerabilities()

    unseen_unconstrained = OrganizationProfile(
        org_id="ORG-UNCONSTRAINED",
        name="Legacy Municipal Utility",
        sector="Public Sector",
        risk_appetite="Medium",
        technologies=(
            TechnologyProfile(vendor="NetGuard", product="Web Application Firewall", version=None, service="Public Portal", exposure="Internet-facing", importance="High"),
        ),
        critical_products=("Web Application Firewall",),
        weights=WeightModifiers(
            cisa_kev_weight=0.35,
            first_epss_weight=0.25,
            cvss_weight=0.15,
            exposure_weight=0.15,
            importance_weight=0.10,
        ),
    )

    ranking = rank_personalized(vulns, unseen_unconstrained)
    assert ranking is not None
    assert len(ranking.ranked) > 0
    # Must retain candidates as NEEDS_VERIFICATION
    verif_items = [x for x in ranking.ranked if x.match.outcome == MatchOutcome.NEEDS_VERIFICATION]
    assert len(verif_items) > 0


def test_unseen_profile_extreme_weights():
    """Test unseen profile with extreme weight modifiers does not produce invalid scores or crashes."""
    vulns = load_vulnerabilities()

    # Pure CVSS focus (100% CVSS)
    cvss_pure_profile = OrganizationProfile(
        org_id="ORG-PURE-CVSS",
        name="Academic Severity Benchmarker",
        sector="Education",
        risk_appetite="High",
        technologies=(
            TechnologyProfile(vendor="SecuGate", product="Enterprise Router OS", version="4.2.0", service="Perimeter", exposure="Internal", importance="Low"),
        ),
        critical_products=(),
        weights=WeightModifiers(
            cisa_kev_weight=0.0,
            first_epss_weight=0.0,
            cvss_weight=1.0,
            exposure_weight=0.0,
            importance_weight=0.0,
        ),
    )

    ranking = rank_personalized(vulns, cvss_pure_profile)
    assert ranking is not None
    for item in ranking.ranked:
        assert 0.0 <= item.breakdown.score_100 <= 100.0
