import json
import re
from pathlib import Path
from dataclasses import replace
from typing import Optional

from src.data_loader import load_vulnerabilities, load_profiles
from src.normalizer import canonicalize_product_name
from src.models import (
    MatchOutcome,
    OrganizationProfile,
    RankingResult,
    ScoredVulnerability,
    TechnologyProfile,
    VulnerabilityRecord,
    WeightModifiers,
)
from src.ranker import rank_personalized, rank_by_cvss
from backend.schemas.api_models import (
    AssetCreateRequest,
    AssetDetailResponse,
    AssetListResponse,
    AssetSchema,
    AssetUpdateRequest,
    ComparisonDifferenceSchema,
    ComparisonResponse,
    EvidenceResponse,
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    ProductCatalogueResponse,
    ProfileDetailResponse,
    ProfileHeaderSchema,
    ProfileSummarySchema,
    ProfilesListResponse,
    ProvenanceSchema,
    ScoreFactorsSchema,
    SignalBreakdownSchema,
    TechnologyInfoSchema,
    TechnologySchema,
    TriageItemSchema,
    TriageResponse,
    TriageSummarySchema,
    WeightModifiersSchema,
    WhatIfItemSchema,
    WhatIfRequest,
    WhatIfResponse,
    WhyNotItemSchema,
    WhyNotResponse,
)

DATA_DIR = Path(__file__).resolve().parents[2] / 'data'
PROFILES_FILE = DATA_DIR / 'profiles.json'



class TriageService:
    """Service layer coordinating between FastAPI routes and the Phase 1 deterministic decision engine."""

    def __init__(self):
        self._vulnerabilities: Optional[list[VulnerabilityRecord]] = None
        self._profiles: Optional[list[OrganizationProfile]] = None

    def get_vulnerabilities(self, reload: bool = False) -> list[VulnerabilityRecord]:
        """Load and cache vulnerabilities dataset."""
        if self._vulnerabilities is None or reload:
            self._vulnerabilities = load_vulnerabilities()
        return self._vulnerabilities

    def get_profiles(self, reload: bool = False) -> list[OrganizationProfile]:
        """Load and cache organization profiles."""
        if self._profiles is None or reload:
            self._profiles = load_profiles()
        return self._profiles

    def get_profile(self, profile_id: str) -> Optional[OrganizationProfile]:
        """Lookup an organization profile by ID (case-insensitive)."""
        profiles = self.get_profiles()
        for p in profiles:
            if p.org_id.upper() == profile_id.upper():
                return p
        return None

    def list_profile_summaries(self) -> ProfilesListResponse:
        """Return high-level summary of all available profiles."""
        profiles = self.get_profiles()
        summaries = [
            ProfileSummarySchema(
                profile_id=p.org_id,
                name=p.name,
                sector=p.sector,
                risk_appetite=p.risk_appetite,
                technology_count=len(p.technologies) or len(p.critical_products),
            )
            for p in profiles
        ]
        return ProfilesListResponse(profiles=summaries)

    def get_profile_detail(self, profile_id: str) -> Optional[ProfileDetailResponse]:
        """Return full detail of a single organization profile."""
        p = self.get_profile(profile_id)
        if not p:
            return None

        w = p.weights
        weights_schema = WeightModifiersSchema(
            cisa_kev_weight=w.cisa_kev_weight,
            first_epss_weight=w.first_epss_weight,
            cvss_weight=w.cvss_weight,
            exposure_weight=w.exposure_weight,
            importance_weight=w.importance_weight,
        )

        tech_schemas = [
            TechnologySchema(
                vendor=t.vendor,
                product=t.product,
                version=t.version,
                service=t.service,
                exposure=t.exposure,
                importance=t.importance,
                asset_id=t.asset_id or f"AST-{idx+1:03d}",
                name=t.name or t.service or f"{t.product} Asset",
                environment=t.environment or "production",
            )
            for idx, t in enumerate(p.technologies)
        ]

        asset_schemas = [
            AssetSchema(
                asset_id=t.asset_id or f"AST-{idx+1:03d}",
                name=t.name or t.service or f"{t.product} Asset",
                vendor=t.vendor,
                product=t.product,
                version=t.version,
                environment=t.environment or "production",
                exposure=t.exposure or "internal",
                importance=t.importance or "critical",
            )
            for idx, t in enumerate(p.technologies)
        ]

        return ProfileDetailResponse(
            profile_id=p.org_id,
            name=p.name,
            sector=p.sector,
            risk_appetite=p.risk_appetite,
            weights=weights_schema,
            technologies=tech_schemas,
            critical_products=list(p.critical_products),
            assets=asset_schemas,
        )

    def get_catalogue_products(self) -> ProductCatalogueResponse:
        """Dynamically discover unique products present in the authoritative vulnerability dataset."""
        vulns = self.get_vulnerabilities()
        unique_prods = sorted(list(set(v.product_name for v in vulns if v.product_name)))
        return ProductCatalogueResponse(
            products=unique_prods,
            total_count=len(unique_prods),
        )

    def _read_profiles_raw_json(self) -> dict:
        """Read profiles.json from data directory safely."""
        if not PROFILES_FILE.exists():
            return {"$schema_description": "VULTRA profiles", "organizations": []}
        return json.loads(PROFILES_FILE.read_text(encoding='utf-8'))

    def _save_profiles_raw_json(self, data: dict) -> None:
        """Write updated profiles data safely to profiles.json."""
        PROFILES_FILE.write_text(json.dumps(data, indent=4), encoding='utf-8')
        # Invalidate in-memory profile cache
        self._profiles = None
        self.get_profiles(reload=True)

    def register_organization(self, req: OrganizationCreateRequest) -> ProfileDetailResponse:
        """Register a completely new organisation profile dynamically and persist to disk."""
        cleaned_name = req.name.strip()
        cleaned_sector = req.sector.strip()
        cleaned_risk = req.risk_appetite.strip()

        # Check duplicate organisation name
        for existing in self.get_profiles():
            if existing.name.strip().lower() == cleaned_name.lower():
                raise ValueError(f"ORGANISATION_EXISTS: An organisation with name '{cleaned_name}' already exists.")

        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        # Generate next collision-free ORG ID
        max_num = 0
        for org in org_list:
            m = re.match(r"^ORG-(\d+)$", org.get("org_id", ""), re.IGNORECASE)
            if m:
                max_num = max(max_num, int(m.group(1)))
        new_org_id = f"ORG-{max_num + 1:03d}"

        # Normalize critical products
        canonical_products = []
        for cp in req.critical_products:
            norm_cp = canonicalize_product_name(cp)
            if norm_cp and norm_cp not in canonical_products:
                canonical_products.append(norm_cp)

        if not canonical_products:
            raise ValueError("INVALID_PRODUCTS: At least one valid critical product must be provided.")

        # Setup technologies
        if req.technologies:
            technologies_json = [
                {
                    "vendor": t.vendor.strip() or "Standard Vendor",
                    "product": canonicalize_product_name(t.product),
                    "version": t.version.strip() if t.version else "unknown",
                    "service": t.service.strip() or f"{canonicalize_product_name(t.product)} Production Service",
                    "exposure": t.exposure.strip().lower() if t.exposure else "internet-facing",
                    "importance": t.importance.strip().lower() if t.importance else "critical",
                }
                for t in req.technologies
            ]
        else:
            technologies_json = [
                {
                    "vendor": "Standard Vendor",
                    "product": prod,
                    "version": "unknown",
                    "service": f"{prod} Production Deployment",
                    "exposure": "internet-facing",
                    "importance": "critical",
                }
                for prod in canonical_products
            ]

        # Setup weights
        w = req.weight_modifiers
        if w:
            weights_json = {
                "cvss_weight": round(w.cvss_weight, 2),
                "cisa_kev_weight": round(w.cisa_kev_weight, 2),
                "first_epss_weight": round(w.first_epss_weight, 2),
                "exposure_weight": round(w.exposure_weight, 2),
                "importance_weight": round(w.importance_weight, 2),
            }
        else:
            weights_json = {
                "cvss_weight": 0.15,
                "cisa_kev_weight": 0.35,
                "first_epss_weight": 0.25,
                "exposure_weight": 0.15,
                "importance_weight": 0.10,
            }

        new_org_record = {
            "org_id": new_org_id,
            "name": cleaned_name,
            "sector": cleaned_sector,
            "risk_appetite": cleaned_risk,
            "weight_modifiers": weights_json,
            "technologies": technologies_json,
            "critical_products": canonical_products,
        }

        org_list.append(new_org_record)
        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)

        detail = self.get_profile_detail(new_org_id)
        if not detail:
            raise RuntimeError("FAILED_PERSISTENCE: Failed to load newly registered profile.")
        return detail

    def update_organization(self, org_id: str, req: OrganizationUpdateRequest) -> Optional[ProfileDetailResponse]:
        """Update an existing organisation profile and re-persist."""
        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        target_idx = None
        for idx, org in enumerate(org_list):
            if org.get("org_id", "").upper() == org_id.upper():
                target_idx = idx
                break

        if target_idx is None:
            return None

        current = org_list[target_idx]

        if req.name is not None:
            cleaned_name = req.name.strip()
            # Verify no other org shares this name
            for idx, other in enumerate(org_list):
                if idx != target_idx and other.get("name", "").strip().lower() == cleaned_name.lower():
                    raise ValueError(f"ORGANISATION_EXISTS: An organisation with name '{cleaned_name}' already exists.")
            current["name"] = cleaned_name

        if req.sector is not None:
            current["sector"] = req.sector.strip()

        if req.risk_appetite is not None:
            current["risk_appetite"] = req.risk_appetite.strip()

        if req.critical_products is not None:
            canonical_products = []
            for cp in req.critical_products:
                norm_cp = canonicalize_product_name(cp)
                if norm_cp and norm_cp not in canonical_products:
                    canonical_products.append(norm_cp)
            if not canonical_products:
                raise ValueError("INVALID_PRODUCTS: At least one critical product required.")
            current["critical_products"] = canonical_products

            # Synchronize technologies if not explicitly supplied
            if req.technologies is None:
                current["technologies"] = [
                    {
                        "vendor": "Standard Vendor",
                        "product": prod,
                        "version": "unknown",
                        "service": f"{prod} Production Deployment",
                        "exposure": "internet-facing",
                        "importance": "critical",
                    }
                    for prod in canonical_products
                ]

        if req.technologies is not None:
            current["technologies"] = [
                {
                    "vendor": t.vendor.strip() or "Standard Vendor",
                    "product": canonicalize_product_name(t.product),
                    "version": t.version.strip() if t.version else "unknown",
                    "service": t.service.strip() or f"{canonicalize_product_name(t.product)} Production Service",
                    "exposure": t.exposure.strip().lower() if t.exposure else "internet-facing",
                    "importance": t.importance.strip().lower() if t.importance else "critical",
                }
                for t in req.technologies
            ]
            current["critical_products"] = [t["product"] for t in current["technologies"]]

        if req.weight_modifiers is not None:
            w = req.weight_modifiers
            current["weight_modifiers"] = {
                "cvss_weight": round(w.cvss_weight, 2),
                "cisa_kev_weight": round(w.cisa_kev_weight, 2),
                "first_epss_weight": round(w.first_epss_weight, 2),
                "exposure_weight": round(w.exposure_weight, 2),
                "importance_weight": round(w.importance_weight, 2),
            }

        org_list[target_idx] = current
        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)

        return self.get_profile_detail(org_id)

    def delete_organization(self, org_id: str) -> bool:
        """Delete a dynamic organisation profile, protecting benchmark organisations."""
        # Protect benchmark organisations
        if org_id.upper() in ("ORG-001", "ORG-002", "ORG-003"):
            raise ValueError(f"BENCHMARK_PROTECTED: Benchmark organisation '{org_id}' cannot be deleted.")

        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        initial_len = len(org_list)
        org_list = [org for org in org_list if org.get("org_id", "").upper() != org_id.upper()]

        if len(org_list) == initial_len:
            return False

        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)
        return True

    def list_assets(self, org_id: str) -> Optional[AssetListResponse]:
        """List all registered assets for an organisation."""
        org = self.get_profile(org_id)
        if not org:
            return None

        assets = [
            AssetSchema(
                asset_id=t.asset_id or f"AST-{idx+1:03d}",
                name=t.name or t.service or f"{t.product} Asset",
                vendor=t.vendor,
                product=t.product,
                version=t.version,
                environment=t.environment or "production",
                exposure=t.exposure or "internal",
                importance=t.importance or "critical",
            )
            for idx, t in enumerate(org.technologies)
        ]

        return AssetListResponse(
            org_id=org.org_id,
            assets=assets,
            total_count=len(assets),
        )

    def get_asset(self, org_id: str, asset_id: str) -> Optional[AssetDetailResponse]:
        """Get detail for a specific asset including matching vulnerability count."""
        org = self.get_profile(org_id)
        if not org:
            return None

        target_tech = None
        for idx, t in enumerate(org.technologies):
            aid = t.asset_id or f"AST-{idx+1:03d}"
            if aid.upper() == asset_id.upper():
                target_tech = t
                break

        if not target_tech:
            return None

        asset_schema = AssetSchema(
            asset_id=target_tech.asset_id or asset_id,
            name=target_tech.name or target_tech.service or f"{target_tech.product} Asset",
            vendor=target_tech.vendor,
            product=target_tech.product,
            version=target_tech.version,
            environment=target_tech.environment or "production",
            exposure=target_tech.exposure or "internal",
            importance=target_tech.importance or "critical",
        )

        from src.matcher import match_vulnerability
        vulns = self.get_vulnerabilities()
        matched_count = 0
        for v in vulns:
            res = match_vulnerability(v, org)
            if res.matched and res.matched_technology and res.matched_technology.product == target_tech.product:
                matched_count += 1

        return AssetDetailResponse(
            org_id=org.org_id,
            asset=asset_schema,
            matched_vulnerabilities_count=matched_count,
        )

    def create_asset(self, org_id: str, req: AssetCreateRequest) -> AssetDetailResponse:
        """Register a new technology asset within an organisation profile."""
        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        target_idx = None
        for idx, org in enumerate(org_list):
            if org.get("org_id", "").upper() == org_id.upper():
                target_idx = idx
                break

        if target_idx is None:
            raise ValueError(f"ORGANISATION_NOT_FOUND: Organisation '{org_id}' does not exist.")

        current_org = org_list[target_idx]
        current_techs = current_org.get("technologies", [])

        cleaned_name = req.name.strip()
        cleaned_prod = canonicalize_product_name(req.product.strip())
        cleaned_version = req.version.strip() if req.version else "unknown"
        cleaned_vendor = req.vendor.strip() if req.vendor else "Standard Vendor"
        cleaned_env = req.environment.strip().lower() if req.environment else "production"
        cleaned_exp = req.exposure.strip().lower() if req.exposure else "internet-facing"
        cleaned_imp = req.importance.strip().lower() if req.importance else "critical"

        # Check duplicate asset in this organisation
        for t in current_techs:
            t_name = t.get("name", "").strip().lower()
            t_prod = canonicalize_product_name(t.get("product", "")).lower()
            t_ver = (t.get("version", "") or "unknown").strip().lower()
            if t_name == cleaned_name.lower() or (t_prod == cleaned_prod.lower() and t_ver == cleaned_version.lower() and t_name == cleaned_name.lower()):
                raise ValueError(f"ASSET_EXISTS: Asset '{cleaned_name}' with product '{cleaned_prod}' and version '{cleaned_version}' already exists in this organisation.")

        # Generate unique asset ID AST-00X
        max_num = 0
        for idx, t in enumerate(current_techs):
            aid = t.get("asset_id", "")
            m = re.match(r"^AST-(\d+)$", aid, re.IGNORECASE)
            if m:
                max_num = max(max_num, int(m.group(1)))
            else:
                max_num = max(max_num, idx + 1)
        new_asset_id = f"AST-{max_num + 1:03d}"

        new_tech_record = {
            "asset_id": new_asset_id,
            "name": cleaned_name,
            "vendor": cleaned_vendor,
            "product": cleaned_prod,
            "version": cleaned_version,
            "environment": cleaned_env,
            "exposure": cleaned_exp,
            "importance": cleaned_imp,
            "service": cleaned_name,
        }

        current_techs.append(new_tech_record)
        current_org["technologies"] = current_techs

        # Synchronize critical products list
        crit_prods = current_org.get("critical_products", [])
        if cleaned_prod not in crit_prods:
            crit_prods.append(cleaned_prod)
        current_org["critical_products"] = crit_prods

        org_list[target_idx] = current_org
        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)

        detail = self.get_asset(org_id, new_asset_id)
        if not detail:
            raise RuntimeError("FAILED_PERSISTENCE: Failed to load newly created asset.")
        return detail

    def update_asset(self, org_id: str, asset_id: str, req: AssetUpdateRequest) -> Optional[AssetDetailResponse]:
        """Update an existing asset in an organisation."""
        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        target_org_idx = None
        for idx, org in enumerate(org_list):
            if org.get("org_id", "").upper() == org_id.upper():
                target_org_idx = idx
                break

        if target_org_idx is None:
            return None

        current_org = org_list[target_org_idx]
        current_techs = current_org.get("technologies", [])

        target_tech_idx = None
        for idx, t in enumerate(current_techs):
            aid = t.get("asset_id") or f"AST-{idx+1:03d}"
            if aid.upper() == asset_id.upper():
                target_tech_idx = idx
                break

        if target_tech_idx is None:
            return None

        target_tech = current_techs[target_tech_idx]

        if req.name is not None:
            target_tech["name"] = req.name.strip()
            target_tech["service"] = req.name.strip()
        if req.vendor is not None:
            target_tech["vendor"] = req.vendor.strip()
        if req.product is not None:
            target_tech["product"] = canonicalize_product_name(req.product.strip())
        if req.version is not None:
            target_tech["version"] = req.version.strip() if req.version else "unknown"
        if req.environment is not None:
            target_tech["environment"] = req.environment.strip().lower()
        if req.exposure is not None:
            target_tech["exposure"] = req.exposure.strip().lower()
        if req.importance is not None:
            target_tech["importance"] = req.importance.strip().lower()

        current_techs[target_tech_idx] = target_tech
        current_org["technologies"] = current_techs

        current_org["critical_products"] = list(set(t["product"] for t in current_techs if "product" in t))

        org_list[target_org_idx] = current_org
        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)

        return self.get_asset(org_id, asset_id)

    def delete_asset(self, org_id: str, asset_id: str) -> bool:
        """Delete an asset from an organisation profile."""
        raw_data = self._read_profiles_raw_json()
        org_list = raw_data.get("organizations", [])

        target_org_idx = None
        for idx, org in enumerate(org_list):
            if org.get("org_id", "").upper() == org_id.upper():
                target_org_idx = idx
                break

        if target_org_idx is None:
            return False

        current_org = org_list[target_org_idx]
        current_techs = current_org.get("technologies", [])

        initial_len = len(current_techs)
        current_techs = [
            t for idx, t in enumerate(current_techs)
            if (t.get("asset_id") or f"AST-{idx+1:03d}").upper() != asset_id.upper()
        ]

        if len(current_techs) == initial_len:
            return False

        current_org["technologies"] = current_techs
        current_org["critical_products"] = list(set(t["product"] for t in current_techs if "product" in t))

        org_list[target_org_idx] = current_org
        raw_data["organizations"] = org_list
        self._save_profiles_raw_json(raw_data)
        return True

    def _convert_scored_vuln_to_schema(self, item: ScoredVulnerability) -> TriageItemSchema:
        """Map internal ScoredVulnerability dataclass to API TriageItemSchema."""
        v = item.vulnerability
        b = item.breakdown
        m = item.match
        tech = m.matched_technology
        f = b.factors_100 or {}

        vendor = tech.vendor if tech else ""
        prod = tech.product if tech else v.product_name
        version = tech.version if tech else None
        asset_id = tech.asset_id if tech else None
        asset_name = tech.name if tech else (tech.service if tech and tech.service else f"{prod} Host")
        env = tech.environment if tech else "production"
        svc = tech.service if tech and tech.service else (asset_name or prod)
        exp = tech.exposure if tech and tech.exposure else "internal"
        imp = tech.importance if tech and tech.importance else "normal"

        factors_schema = ScoreFactorsSchema(
            kev=f.get("kev", 0.0),
            epss=f.get("epss", 0.0),
            cvss=f.get("cvss", 0.0),
            exposure=f.get("exposure", 0.0),
            importance=f.get("importance", 0.0),
        )

        signals_schema = SignalBreakdownSchema(
            cvss=v.cvss_base_score,
            kev=v.cisa_kev,
            epss=v.first_epss,
        )

        prov = item.provenance
        prov_schema = ProvenanceSchema(
            reference_url=prov.reference_url if prov else f"https://nvd.nist.gov/vuln/detail/{v.cve_id}",
            source_snapshot_date=prov.snapshot_date if prov else "2026-Q1 Snapshot",
            source_file=prov.source_file if prov else "vulnerabilities.csv",
            source_cvss=v.cvss_base_score,
            source_kev=v.cisa_kev,
            source_epss=v.first_epss,
            matched_asset_id=asset_id,
            matched_asset_name=asset_name,
            matched_environment=env,
        )

        title = item.explanation.title if item.explanation else f"Security Vulnerability in {v.product_name}"
        why = item.explanation.why_it_matters if item.explanation else ""
        action = item.explanation.safe_next_action if item.explanation else ""

        return TriageItemSchema(
            rank=item.rank,
            cve_id=v.cve_id,
            priority=item.priority.value,
            score=b.score_100,
            title=title,
            technology=TechnologyInfoSchema(
                vendor=vendor,
                product=prod,
                version=version,
                asset_id=asset_id,
                asset_name=asset_name,
                environment=env,
            ),
            service=svc,
            exposure=exp,
            importance=imp,
            match_status=m.outcome.value,
            confidence=item.confidence.value,
            factors=factors_schema,
            signals=signals_schema,
            why_it_matters=why,
            next_action=action,
            provenance=prov_schema,
        )

    def run_triage(self, profile_id: str, limit: int = 5) -> Optional[TriageResponse]:
        """Execute deterministic triage pipeline for the given organisation."""
        org = self.get_profile(profile_id)
        if not org:
            return None

        vulns = self.get_vulnerabilities()
        ranking_result: RankingResult = rank_personalized(vulns, org)

        top_items = [
            self._convert_scored_vuln_to_schema(x)
            for x in ranking_result.ranked[:limit]
        ]

        urgent_count = sum(1 for x in ranking_result.ranked if x.priority.value == "URGENT")
        high_count = sum(1 for x in ranking_result.ranked if x.priority.value == "HIGH")

        summary = TriageSummarySchema(
            total_records=ranking_result.total_evaluated,
            matched_candidates=len(ranking_result.ranked),
            urgent=urgent_count,
            high=high_count,
            needs_verification=len(ranking_result.needs_verification),
        )

        header = ProfileHeaderSchema(
            id=org.org_id,
            name=org.name,
            sector=org.sector,
            risk_appetite=org.risk_appetite,
        )

        return TriageResponse(
            profile=header,
            summary=summary,
            results=top_items,
        )

    def get_evidence(self, profile_id: str, cve_id: str) -> Optional[EvidenceResponse]:
        """Retrieve full underlying decision evidence for a specific CVE and organisation."""
        org = self.get_profile(profile_id)
        if not org:
            return None

        vulns = self.get_vulnerabilities()
        ranking_result = rank_personalized(vulns, org)

        # Search in ranked items first
        target_item = next(
            (x for x in ranking_result.ranked if x.vulnerability.cve_id.upper() == cve_id.upper()),
            None,
        )
        # If not in ranked, search in excluded items
        if not target_item:
            target_item = next(
                (x for x in ranking_result.excluded if x.vulnerability.cve_id.upper() == cve_id.upper()),
                None,
            )

        if not target_item:
            return None

        v = target_item.vulnerability
        b = target_item.breakdown
        m = target_item.match
        tech = m.matched_technology
        prov = target_item.provenance
        expl = target_item.explanation
        f = b.factors_100 or {}
        w = org.weights

        source_facts = {
            "cve_id": v.cve_id,
            "product_name": v.product_name,
            "cvss_base_score": v.cvss_base_score,
            "cisa_kev": v.cisa_kev,
            "first_epss": v.first_epss,
            "affected_versions": v.affected_versions,
            "version_note": v.version_note,
            "reference_url": prov.reference_url if prov else f"https://nvd.nist.gov/vuln/detail/{v.cve_id}",
            "snapshot_date": prov.snapshot_date if prov else "2026-Q1 Snapshot",
            "source_file": prov.source_file if prov else "vulnerabilities.csv",
        }

        matching = {
            "outcome": m.outcome.value,
            "reason_code": m.reason_code.value,
            "match_reason": m.match_reason,
            "is_matched": m.matched,
        }

        asset_context = {
            "asset_id": tech.asset_id if tech else None,
            "asset_name": tech.name if tech else (tech.service if tech and tech.service else None),
            "matched_technology": tech.product if tech else None,
            "vendor": tech.vendor if tech else None,
            "installed_version": tech.version if tech else None,
            "environment": tech.environment if tech else "production",
            "service": tech.service if tech else None,
            "exposure": tech.exposure if tech else "N/A",
            "importance": tech.importance if tech else "N/A",
        }

        score_factors = {
            "kev_points": f.get("kev", 0.0),
            "epss_points": f.get("epss", 0.0),
            "cvss_points": f.get("cvss", 0.0),
            "exposure_points": f.get("exposure", 0.0),
            "importance_points": f.get("importance", 0.0),
            "total_score_100": b.score_100,
        }

        weights_used = {
            "cisa_kev_weight": w.cisa_kev_weight,
            "first_epss_weight": w.first_epss_weight,
            "cvss_weight": w.cvss_weight,
            "exposure_weight": w.exposure_weight,
            "importance_weight": w.importance_weight,
        }

        explanation = {
            "title": expl.title if expl else "",
            "why_it_matters": expl.why_it_matters if expl else "",
            "safe_next_action": expl.safe_next_action if expl else "",
            "contributing_signals": list(expl.contributing_signals) if expl else [],
        }

        return EvidenceResponse(
            cve_id=v.cve_id,
            product_name=v.product_name,
            profile_id=org.org_id,
            profile_name=org.name,
            rank=target_item.rank if target_item.rank > 0 else None,
            priority=target_item.priority.value,
            score_100=b.score_100,
            confidence=target_item.confidence.value,
            source_facts=source_facts,
            matching=matching,
            asset_context=asset_context,
            score_factors=score_factors,
            weights_used=weights_used,
            explanation=explanation,
        )

    def get_why_not(self, profile_id: str) -> Optional[WhyNotResponse]:
        """Expose negative test and deprioritisation analysis demonstrating SEVERITY != PRIORITY."""
        org = self.get_profile(profile_id)
        if not org:
            return None

        vulns = self.get_vulnerabilities()
        ranking_result = rank_personalized(vulns, org)

        # High CVSS excluded
        high_cvss_excluded = [
            x for x in ranking_result.excluded
            if x.vulnerability.cvss_base_score >= 9.0
        ]
        high_cvss_excluded.sort(key=lambda x: -x.vulnerability.cvss_base_score)

        excluded_schemas = [
            WhyNotItemSchema(
                cve_id=x.vulnerability.cve_id,
                product_name=x.vulnerability.product_name,
                cvss=x.vulnerability.cvss_base_score,
                cisa_kev=x.vulnerability.cisa_kev,
                first_epss=x.vulnerability.first_epss,
                rank=None,
                decision=x.match.outcome.value,
                reason_code=x.match.reason_code.value,
                reason=x.match.match_reason,
            )
            for x in high_cvss_excluded[:6]
        ]

        # High CVSS matched but deprioritised
        high_cvss_deprioritised = [
            x for x in ranking_result.ranked
            if x.vulnerability.cvss_base_score >= 9.0 and x.rank > 5 and not x.vulnerability.cisa_kev
        ]

        deprioritised_schemas = [
            WhyNotItemSchema(
                cve_id=x.vulnerability.cve_id,
                product_name=x.vulnerability.product_name,
                cvss=x.vulnerability.cvss_base_score,
                cisa_kev=x.vulnerability.cisa_kev,
                first_epss=x.vulnerability.first_epss,
                rank=x.rank,
                decision="DEPRIORITISED",
                reason_code="NO_ACTIVE_EXPLOITATION",
                reason=(
                    f"Despite technical CVSS score of {x.vulnerability.cvss_base_score:.1f}, "
                    f"the lack of confirmed active exploitation (KEV=False, EPSS={x.vulnerability.first_epss:.2%}) "
                    f"and lower contextual urgency moved this vulnerability to rank #{x.rank}."
                ),
            )
            for x in high_cvss_deprioritised[:4]
        ]

        return WhyNotResponse(
            profile_id=org.org_id,
            profile_name=org.name,
            negative_test_summary=(
                "Demonstrates the core 'Severity != Priority' thesis: high CVSS vulnerabilities (>= 9.0) "
                "are excluded if the technology is not deployed by the organisation, or deprioritised if active "
                "threat signals (CISA KEV, FIRST EPSS) and asset exposure are low."
            ),
            excluded_high_severity=excluded_schemas,
            deprioritised_high_severity=deprioritised_schemas,
        )

    def compare_profiles(self, profile_a_id: str, profile_b_id: str) -> Optional[ComparisonResponse]:
        """Compare two profiles processed by the single deterministic engine."""
        org_a = self.get_profile(profile_a_id)
        org_b = self.get_profile(profile_b_id)
        if not org_a or not org_b:
            return None

        vulns = self.get_vulnerabilities()
        ra = rank_personalized(vulns, org_a)
        rb = rank_personalized(vulns, org_b)

        top5_a = [self._convert_scored_vuln_to_schema(x) for x in ra.ranked[:5]]
        top5_b = [self._convert_scored_vuln_to_schema(x) for x in rb.ranked[:5]]

        cves_a = [x.cve_id for x in top5_a]
        cves_b = [x.cve_id for x in top5_b]

        common_cves = sorted(set(cves_a) & set(cves_b))
        unique_a = [c for c in cves_a if c not in common_cves]
        unique_b = [c for c in cves_b if c not in common_cves]

        ranks_b_map = {x.vulnerability.cve_id: x.rank for x in rb.ranked}
        scores_b_map = {x.vulnerability.cve_id: x.breakdown.score_100 for x in rb.ranked}
        ranks_a_map = {x.vulnerability.cve_id: x.rank for x in ra.ranked}
        scores_a_map = {x.vulnerability.cve_id: x.breakdown.score_100 for x in ra.ranked}

        differences = []
        all_top_cves = set(cves_a + cves_b)
        for cve in sorted(all_top_cves):
            # Find item in a or b
            item_a = next((x for x in ra.ranked if x.vulnerability.cve_id == cve), None)
            item_b = next((x for x in rb.ranked if x.vulnerability.cve_id == cve), None)
            prod = (item_a or item_b).vulnerability.product_name

            drivers = []
            if item_a and not item_b:
                drivers.append(f"Product '{prod}' deployed only in {org_a.org_id}")
            elif item_b and not item_a:
                drivers.append(f"Product '{prod}' deployed only in {org_b.org_id}")
            elif item_a and item_b:
                t_a = item_a.match.matched_technology
                t_b = item_b.match.matched_technology
                if t_a and t_b and t_a.exposure != t_b.exposure:
                    drivers.append(f"Exposure difference: {t_a.exposure} vs {t_b.exposure}")
                if t_a and t_b and t_a.importance != t_b.importance:
                    drivers.append(f"Criticality difference: {t_a.importance} vs {t_b.importance}")

            differences.append(
                ComparisonDifferenceSchema(
                    cve_id=cve,
                    product_name=prod,
                    rank_a=ranks_a_map.get(cve),
                    rank_b=ranks_b_map.get(cve),
                    score_a=scores_a_map.get(cve),
                    score_b=scores_b_map.get(cve),
                    drivers=drivers,
                )
            )

        summary = (
            f"Comparing {org_a.name} ({org_a.org_id}) with {org_b.name} ({org_b.org_id}): "
            f"{len(common_cves)} common Top 5 actions, {len(unique_a)} actions unique to {org_a.org_id}, "
            f"and {len(unique_b)} actions unique to {org_b.org_id}. "
            "Divergence is driven by distinct technology stacks and perimeter exposures."
        )

        return ComparisonResponse(
            profile_a=ProfileHeaderSchema(id=org_a.org_id, name=org_a.name, sector=org_a.sector, risk_appetite=org_a.risk_appetite),
            profile_b=ProfileHeaderSchema(id=org_b.org_id, name=org_b.name, sector=org_b.sector, risk_appetite=org_b.risk_appetite),
            top5_a=top5_a,
            top5_b=top5_b,
            common_cves=common_cves,
            unique_a_cves=unique_a,
            unique_b_cves=unique_b,
            differences=differences,
            summary=summary,
        )

    def simulate_what_if(self, profile_id: str, request: WhatIfRequest) -> Optional[WhatIfResponse]:
        """Perform temporary what-if ranking simulation without mutating official profile."""
        org = self.get_profile(profile_id)
        if not org:
            return None

        w = org.weights
        new_weights = WeightModifiers(
            cvss_weight=request.cvss_weight if request.cvss_weight is not None else w.cvss_weight,
            cisa_kev_weight=request.cisa_kev_weight if request.cisa_kev_weight is not None else w.cisa_kev_weight,
            first_epss_weight=request.first_epss_weight if request.first_epss_weight is not None else w.first_epss_weight,
            exposure_weight=request.exposure_weight if request.exposure_weight is not None else w.exposure_weight,
            importance_weight=request.importance_weight if request.importance_weight is not None else w.importance_weight,
        )

        sim_org = replace(org, weights=new_weights)
        vulns = self.get_vulnerabilities()

        orig_ranking = rank_personalized(vulns, org)
        sim_ranking = rank_personalized(vulns, sim_org)

        orig_rank_map = {
            (x.vulnerability.cve_id, x.vulnerability.product_name): (x.rank, x.breakdown.score_100)
            for x in orig_ranking.ranked
        }

        sim_top5_schemas = []
        for x in sim_ranking.ranked[:5]:
            orig_info = orig_rank_map.get((x.vulnerability.cve_id, x.vulnerability.product_name))
            if orig_info:
                orig_rank, orig_score = orig_info
                shift = f"was #{orig_rank}" if orig_rank != x.rank else "unchanged"
            else:
                orig_rank, orig_score = None, 0.0
                shift = "new"

            sim_top5_schemas.append(
                WhatIfItemSchema(
                    rank=x.rank,
                    previous_rank=orig_rank,
                    cve_id=x.vulnerability.cve_id,
                    product_name=x.vulnerability.product_name,
                    simulated_score=x.breakdown.score_100,
                    original_score=orig_score,
                    rank_change=shift,
                )
            )

        orig_top5_schemas = [
            WhatIfItemSchema(
                rank=x.rank,
                previous_rank=x.rank,
                cve_id=x.vulnerability.cve_id,
                product_name=x.vulnerability.product_name,
                simulated_score=x.breakdown.score_100,
                original_score=x.breakdown.score_100,
                rank_change="baseline",
            )
            for x in orig_ranking.ranked[:5]
        ]

        return WhatIfResponse(
            profile_id=org.org_id,
            profile_name=org.name,
            original_weights=WeightModifiersSchema(
                cisa_kev_weight=w.cisa_kev_weight,
                first_epss_weight=w.first_epss_weight,
                cvss_weight=w.cvss_weight,
                exposure_weight=w.exposure_weight,
                importance_weight=w.importance_weight,
            ),
            simulated_weights=WeightModifiersSchema(
                cisa_kev_weight=new_weights.cisa_kev_weight,
                first_epss_weight=new_weights.first_epss_weight,
                cvss_weight=new_weights.cvss_weight,
                exposure_weight=new_weights.exposure_weight,
                importance_weight=new_weights.importance_weight,
            ),
            simulated_top5=sim_top5_schemas,
            original_top5=orig_top5_schemas,
        )


# Singleton service instance
triage_service = TriageService()
