from typing import Optional, Any
from pydantic import BaseModel, Field


# --- Health ---
class HealthResponse(BaseModel):
    status: str = Field("ok", description="Service health status")
    service: str = Field("vultra-api", description="Service identifier")
    version: str = Field("1.0", description="API version")


# --- Error ---
class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error code identifier")
    message: str = Field(..., description="Human-readable error explanation")
    detail: Optional[Any] = Field(None, description="Optional diagnostic details")


# --- Assets & Technologies ---
class AssetSchema(BaseModel):
    asset_id: str = Field(..., description="Unique asset identifier, e.g. AST-001")
    name: str = Field(..., description="Asset display name, e.g. Production Web Server")
    vendor: str = Field("", description="Vendor name, e.g. Apache")
    product: str = Field(..., description="Product identifier, e.g. Apache HTTP Server")
    version: Optional[str] = Field(None, description="Installed software version, e.g. 2.4.49 or unknown")
    environment: str = Field("production", description="Environment: production, staging, development, testing")
    exposure: str = Field("internet-facing", description="Network exposure: internet-facing, internal, restricted, air-gapped")
    importance: str = Field("critical", description="Criticality: critical, high, medium, low")


class AssetCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Asset display name")
    product: str = Field(..., min_length=2, max_length=120, description="Product name")
    vendor: Optional[str] = Field("", description="Vendor name")
    version: Optional[str] = Field(None, description="Installed software version or unknown")
    environment: str = Field("production", description="Environment: production, staging, development, testing")
    exposure: str = Field("internet-facing", description="Exposure: internet-facing, internal, restricted, air-gapped")
    importance: str = Field("critical", description="Criticality: critical, high, medium, low")


class AssetUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    product: Optional[str] = Field(None, min_length=2, max_length=120)
    vendor: Optional[str] = None
    version: Optional[str] = None
    environment: Optional[str] = None
    exposure: Optional[str] = None
    importance: Optional[str] = None


class AssetListResponse(BaseModel):
    org_id: str = Field(..., description="Organisation unique identifier")
    assets: list[AssetSchema] = Field(..., description="List of registered assets")
    total_count: int = Field(..., description="Total count of assets")


class AssetDetailResponse(BaseModel):
    org_id: str = Field(..., description="Organisation unique identifier")
    asset: AssetSchema = Field(..., description="Asset details")
    matched_vulnerabilities_count: int = Field(0, description="Number of matching CVEs in dataset")


class TechnologySchema(BaseModel):
    vendor: str = Field("", description="Technology vendor name")
    product: str = Field(..., description="Product identifier")
    version: Optional[str] = Field(None, description="Installed version or unknown")
    service: str = Field("", description="Associated business service")
    exposure: str = Field("internal", description="Exposure category: internet-facing, internal, air-gapped")
    importance: str = Field("normal", description="Business criticality: critical, high, medium, low")
    asset_id: Optional[str] = Field(None, description="Asset unique identifier")
    name: Optional[str] = Field(None, description="Asset display name")
    environment: str = Field("production", description="Deployment environment")


class WeightModifiersSchema(BaseModel):
    cisa_kev_weight: float = Field(0.35, ge=0.0, le=1.0, description="Active exploitation weight")
    first_epss_weight: float = Field(0.25, ge=0.0, le=1.0, description="Exploitation probability weight")
    cvss_weight: float = Field(0.15, ge=0.0, le=1.0, description="Technical severity weight")
    exposure_weight: float = Field(0.15, ge=0.0, le=1.0, description="Asset exposure weight")
    importance_weight: float = Field(0.10, ge=0.0, le=1.0, description="Service importance weight")


class ProfileSummarySchema(BaseModel):
    profile_id: str = Field(..., description="Organisation unique identifier")
    name: str = Field(..., description="Organisation display name")
    sector: str = Field("", description="Industry sector")
    risk_appetite: str = Field("", description="Risk appetite declaration")
    technology_count: int = Field(..., description="Number of deployed technologies")


class ProfilesListResponse(BaseModel):
    profiles: list[ProfileSummarySchema] = Field(..., description="List of available organisation profiles")


class ProfileDetailResponse(BaseModel):
    profile_id: str = Field(..., description="Organisation unique identifier")
    name: str = Field(..., description="Organisation display name")
    sector: str = Field("", description="Industry sector")
    risk_appetite: str = Field("", description="Risk appetite declaration")
    weights: WeightModifiersSchema = Field(..., description="Active weight modifiers")
    technologies: list[TechnologySchema] = Field(..., description="Asset inventory")
    critical_products: list[str] = Field(default_factory=list, description="Critical products list")
    assets: list[AssetSchema] = Field(default_factory=list, description="Structured asset inventory")



class OrganizationCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120, description="Organisation display name")
    sector: str = Field(..., min_length=2, max_length=80, description="Industry sector")
    risk_appetite: str = Field("Medium", description="Risk appetite: Low, Medium, High, Zero-Tolerance")
    critical_products: list[str] = Field(..., min_length=1, description="List of deployed critical products")
    weight_modifiers: Optional[WeightModifiersSchema] = Field(None, description="Optional custom weight modifiers")
    technologies: Optional[list[TechnologySchema]] = Field(None, description="Optional structured asset technology mappings")


class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    sector: Optional[str] = Field(None, min_length=2, max_length=80)
    risk_appetite: Optional[str] = Field(None)
    critical_products: Optional[list[str]] = Field(None, min_length=1)
    weight_modifiers: Optional[WeightModifiersSchema] = None
    technologies: Optional[list[TechnologySchema]] = None


class ProductCatalogueResponse(BaseModel):
    products: list[str] = Field(..., description="Dynamically discovered products from vulnerability dataset")
    total_count: int = Field(..., description="Count of unique products")



# --- Triage Decision ---
class ProfileHeaderSchema(BaseModel):
    id: str = Field(..., description="Organisation identifier")
    name: str = Field(..., description="Organisation name")
    sector: str = Field("", description="Industry sector")
    risk_appetite: str = Field("", description="Risk appetite")


class TriageSummarySchema(BaseModel):
    total_records: int = Field(..., description="Total vulnerability records processed")
    matched_candidates: int = Field(..., description="Number of relevant matched technology CVEs")
    urgent: int = Field(..., description="Count of URGENT priority actions")
    high: int = Field(..., description="Count of HIGH priority actions")
    needs_verification: int = Field(..., description="Count requiring version verification")


class SignalBreakdownSchema(BaseModel):
    cvss: float = Field(..., description="CVSS base technical score")
    kev: bool = Field(..., description="CISA KEV active exploitation indicator")
    epss: float = Field(..., description="FIRST EPSS exploitation probability (0.0 to 1.0)")


class ScoreFactorsSchema(BaseModel):
    kev: float = Field(..., description="Point share from CISA KEV")
    epss: float = Field(..., description="Point share from FIRST EPSS")
    cvss: float = Field(..., description="Point share from CVSS technical severity")
    exposure: float = Field(..., description="Point share from asset exposure")
    importance: float = Field(..., description="Point share from service importance")


class ProvenanceSchema(BaseModel):
    reference_url: str = Field("", description="Primary advisory or NVD reference URL")
    source_snapshot_date: str = Field("", description="Snapshot date of dataset record")
    source_file: str = Field("vulnerabilities.csv", description="Source data file")
    source_cvss: float = Field(..., description="Source CVSS score")
    source_kev: bool = Field(..., description="Source KEV boolean")
    source_epss: float = Field(..., description="Source EPSS float")
    matched_asset_id: Optional[str] = Field(None, description="Matched organisation asset ID")
    matched_asset_name: Optional[str] = Field(None, description="Matched organisation asset name")
    matched_environment: Optional[str] = Field("production", description="Matched deployment environment")


class TechnologyInfoSchema(BaseModel):
    vendor: str = Field("", description="Vendor name")
    product: str = Field(..., description="Product name")
    version: Optional[str] = Field(None, description="Installed version or unknown")
    asset_id: Optional[str] = Field(None, description="Matched asset unique ID")
    asset_name: Optional[str] = Field(None, description="Matched asset display name")
    environment: str = Field("production", description="Asset deployment environment")



class TriageItemSchema(BaseModel):
    rank: int = Field(..., description="Personalised priority rank (1..N)")
    cve_id: str = Field(..., description="CVE identifier")
    priority: str = Field(..., description="Priority category: URGENT, HIGH, MEDIUM, LOW")
    score: float = Field(..., description="Personalised priority score (0.0 to 100.0)")
    title: str = Field(..., description="Consequence-first plain-language title")
    technology: TechnologyInfoSchema = Field(..., description="Matched technology details")
    service: str = Field("", description="Associated business service")
    exposure: str = Field("internal", description="Asset exposure context")
    importance: str = Field("normal", description="Service criticality context")
    match_status: str = Field(..., description="Matching outcome: MATCH or NEEDS_VERIFICATION")
    confidence: str = Field(..., description="Confidence rating: HIGH, MEDIUM, LOW")
    factors: ScoreFactorsSchema = Field(..., description="Score contribution point shares")
    signals: SignalBreakdownSchema = Field(..., description="Underlying technical signals")
    why_it_matters: str = Field(..., description="Plain-language justification for this organisation")
    next_action: str = Field(..., description="Defensive, conservative next step")
    provenance: ProvenanceSchema = Field(..., description="Source facts traceability")


class TriageResponse(BaseModel):
    profile: ProfileHeaderSchema = Field(..., description="Organisation profile context")
    summary: TriageSummarySchema = Field(..., description="Triage summary statistics")
    results: list[TriageItemSchema] = Field(..., description="Personalised Top action decision list")


# --- Evidence Drawer ---
class EvidenceResponse(BaseModel):
    cve_id: str = Field(..., description="CVE identifier")
    product_name: str = Field(..., description="Product name")
    profile_id: str = Field(..., description="Organisation ID")
    profile_name: str = Field(..., description="Organisation name")
    rank: Optional[int] = Field(None, description="Assigned priority rank or null if excluded")
    priority: str = Field(..., description="Assigned priority level")
    score_100: float = Field(..., description="Computed priority score (0-100)")
    confidence: str = Field(..., description="Data confidence rating")
    source_facts: dict[str, Any] = Field(..., description="Original raw vulnerability evidence")
    matching: dict[str, Any] = Field(..., description="Matching engine decision and reasoning")
    asset_context: dict[str, Any] = Field(..., description="Organisation asset and exposure context")
    score_factors: dict[str, Any] = Field(..., description="Point share contribution breakdown")
    weights_used: dict[str, float] = Field(..., description="Active weight configuration")
    explanation: dict[str, Any] = Field(..., description="Structured plain-language explanation")


# --- Why-Not & Negative Test ---
class WhyNotItemSchema(BaseModel):
    cve_id: str = Field(..., description="CVE identifier")
    product_name: str = Field(..., description="Product name")
    cvss: float = Field(..., description="Technical severity CVSS")
    cisa_kev: bool = Field(..., description="CISA KEV flag")
    first_epss: float = Field(..., description="FIRST EPSS probability")
    rank: Optional[int] = Field(None, description="Assigned rank if relevant, null if excluded")
    decision: str = Field(..., description="Outcome: EXCLUDE, NOT_AFFECTED, DEPRIORITISED")
    reason_code: str = Field(..., description="Reason code identifier")
    reason: str = Field(..., description="Explanation of why item is not top priority")


class WhyNotResponse(BaseModel):
    profile_id: str = Field(..., description="Organisation identifier")
    profile_name: str = Field(..., description="Organisation name")
    negative_test_summary: str = Field(..., description="Explanation of Severity != Priority principle")
    excluded_high_severity: list[WhyNotItemSchema] = Field(..., description="High CVSS items excluded due to profile mismatch")
    deprioritised_high_severity: list[WhyNotItemSchema] = Field(..., description="High CVSS items deprioritised due to low threat signals")


# --- Profile Comparison ---
class ComparisonDifferenceSchema(BaseModel):
    cve_id: str = Field(..., description="CVE identifier")
    product_name: str = Field(..., description="Product name")
    rank_a: Optional[int] = Field(None, description="Rank in Organisation A or null if excluded")
    rank_b: Optional[int] = Field(None, description="Rank in Organisation B or null if excluded")
    score_a: Optional[float] = Field(None, description="Score in Organisation A")
    score_b: Optional[float] = Field(None, description="Score in Organisation B")
    drivers: list[str] = Field(default_factory=list, description="Key factors causing ranking divergence")


class ComparisonResponse(BaseModel):
    profile_a: ProfileHeaderSchema = Field(..., description="First organisation context")
    profile_b: ProfileHeaderSchema = Field(..., description="Second organisation context")
    top5_a: list[TriageItemSchema] = Field(..., description="Organisation A Top 5")
    top5_b: list[TriageItemSchema] = Field(..., description="Organisation B Top 5")
    common_cves: list[str] = Field(..., description="CVEs appearing in both Top 5 lists")
    unique_a_cves: list[str] = Field(..., description="CVEs appearing only in Organisation A Top 5")
    unique_b_cves: list[str] = Field(..., description="CVEs appearing only in Organisation B Top 5")
    differences: list[ComparisonDifferenceSchema] = Field(..., description="Granular ranking divergence analysis")
    summary: str = Field(..., description="Executive summary of comparison results")


# --- What-If Simulation ---
class WhatIfRequest(BaseModel):
    cisa_kev_weight: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated KEV weight")
    first_epss_weight: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated EPSS weight")
    cvss_weight: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated CVSS weight")
    exposure_weight: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated Exposure weight")
    importance_weight: Optional[float] = Field(None, ge=0.0, le=1.0, description="Simulated Importance weight")


class WhatIfItemSchema(BaseModel):
    rank: int = Field(..., description="Simulated rank")
    previous_rank: Optional[int] = Field(None, description="Original official rank")
    cve_id: str = Field(..., description="CVE identifier")
    product_name: str = Field(..., description="Product name")
    simulated_score: float = Field(..., description="Simulated score (0-100)")
    original_score: float = Field(..., description="Original score (0-100)")
    rank_change: str = Field(..., description="Description of rank shift (e.g. +2, was #3, new)")


class WhatIfResponse(BaseModel):
    profile_id: str = Field(..., description="Organisation identifier")
    profile_name: str = Field(..., description="Organisation name")
    original_weights: WeightModifiersSchema = Field(..., description="Official profile weights")
    simulated_weights: WeightModifiersSchema = Field(..., description="Simulated weights applied")
    simulated_top5: list[WhatIfItemSchema] = Field(..., description="Top 5 under simulation")
    original_top5: list[WhatIfItemSchema] = Field(..., description="Original Top 5")


# --- Local AI Copilot & Fact Guard (Phase 5) ---
class AICopilotExplanationSchema(BaseModel):
    why_it_matters: str = Field(..., description="Plain-language explanation of why vulnerability is relevant")
    potential_impact: str = Field(..., description="Specific potential business impact based on evidence")
    next_action: str = Field(..., description="Conservative, safe defensive recommended next step")


class AICopilotMetadataSchema(BaseModel):
    available: bool = Field(..., description="Whether local AI runtime was reachable")
    generated: bool = Field(..., description="Whether output was generated via local AI")
    validated: bool = Field(True, description="Whether output passed Fact Guard validation")
    mode: str = Field(..., description="Mode: 'local' or 'deterministic_fallback'")
    model: Optional[str] = Field(None, description="Local model name if AI-generated")


class FactGuardStatusSchema(BaseModel):
    status: str = Field("PASSED", description="Fact guard status: 'PASSED', 'FAILED', or 'FALLBACK'")
    checks_performed: list[str] = Field(default_factory=list, description="Validation checks passed")
    violations: list[str] = Field(default_factory=list, description="Detected factual violation details")


class AIExplanationResponse(BaseModel):
    profile_id: str = Field(..., description="Organisation identifier")
    cve_id: str = Field(..., description="CVE identifier")
    explanation: AICopilotExplanationSchema = Field(..., description="Structured explanation output")
    ai: AICopilotMetadataSchema = Field(..., description="AI runtime provenance metadata")
    source_bound: bool = Field(True, description="True indicates explanation is bound strictly to supplied source facts")
    fact_guard: FactGuardStatusSchema = Field(..., description="Fact guard audit result")


# --- Remediation Workspace (Phase 9) ---
class RemediationNoteSchema(BaseModel):
    note_id: str = Field(..., description="Unique note identifier, e.g. NOT-001")
    author: str = Field("Security Team", description="Author of the note")
    content: str = Field(..., description="Plain-text note content")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")


class RemediationActivitySchema(BaseModel):
    activity_id: str = Field(..., description="Unique activity log identifier, e.g. ACT-001")
    action: str = Field(..., description="Action name: CREATED, STATUS_CHANGED, OWNER_ASSIGNED, NOTE_ADDED, DUE_DATE_SET, RESOLVED")
    details: str = Field(..., description="Descriptive audit trail entry")
    author: str = Field("Security Operations", description="Actor recording the activity")
    timestamp: str = Field(..., description="ISO 8601 timestamp")


class RemediationRecordSchema(BaseModel):
    remediation_id: str = Field(..., description="Unique remediation identifier, e.g. REM-001")
    org_id: str = Field(..., description="Associated organisation identifier")
    cve_id: str = Field(..., description="CVE identifier")
    asset_id: str = Field(..., description="Target asset identifier, e.g. AST-001")
    asset_name: str = Field(..., description="Display name of target asset")
    product: str = Field(..., description="Matched product / technology")
    installed_version: Optional[str] = Field("unknown", description="Installed software version")
    environment: str = Field("production", description="Deployment environment")
    exposure: str = Field("internet-facing", description="Network perimeter exposure")
    importance: str = Field("critical", description="Asset criticality tier")
    priority: str = Field("URGENT", description="Read-only deterministic priority from risk engine")
    score: float = Field(0.0, description="Read-only deterministic score from risk engine")
    status: str = Field("OPEN", description="Workflow state: OPEN, ACKNOWLEDGED, IN_PROGRESS, MITIGATED, RESOLVED, RISK_ACCEPTED")
    owner: str = Field("Unassigned", description="Assigned team or individual")
    due_date: Optional[str] = Field(None, description="Remediation due date (YYYY-MM-DD)")
    is_overdue: bool = Field(False, description="Calculated overdue flag")
    verification_details: Optional[str] = Field(None, description="Verification evidence or new version on resolution")
    notes: list[RemediationNoteSchema] = Field(default_factory=list, description="Defensive plain-text notes")
    activity_log: list[RemediationActivitySchema] = Field(default_factory=list, description="Immutable audit log")
    created_at: str = Field(..., description="ISO 8601 creation timestamp")
    updated_at: str = Field(..., description="ISO 8601 last update timestamp")


class RemediationCreateRequest(BaseModel):
    cve_id: str = Field(..., min_length=5, max_length=30, description="CVE identifier")
    asset_id: Optional[str] = Field(None, description="Optional asset ID; auto-resolved if omitted")
    owner: Optional[str] = Field("Security Team", max_length=80, description="Assigned team/owner")
    due_date: Optional[str] = Field(None, description="Optional due date in YYYY-MM-DD format")
    initial_note: Optional[str] = Field(None, max_length=500, description="Optional initial note")


class RemediationUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="New status: OPEN, ACKNOWLEDGED, IN_PROGRESS, MITIGATED, RESOLVED, RISK_ACCEPTED")
    owner: Optional[str] = Field(None, max_length=80, description="Updated owner")
    due_date: Optional[str] = Field(None, description="Updated due date in YYYY-MM-DD format")
    verification_details: Optional[str] = Field(None, max_length=500, description="Verification evidence on resolution")
    note: Optional[str] = Field(None, max_length=500, description="Optional note describing the change")


class RemediationNoteCreateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Plain-text note content")
    author: Optional[str] = Field("Security Team", max_length=80, description="Author display name")


class RemediationListResponse(BaseModel):
    org_id: str = Field(..., description="Organisation identifier")
    remediations: list[RemediationRecordSchema] = Field(..., description="List of remediation items")
    total_count: int = Field(..., description="Total count matching query")


class RemediationSummaryResponse(BaseModel):
    org_id: str = Field(..., description="Organisation identifier")
    total: int = Field(0, description="Total remediation items")
    open: int = Field(0, description="Items in OPEN status")
    acknowledged: int = Field(0, description="Items in ACKNOWLEDGED status")
    in_progress: int = Field(0, description="Items in IN_PROGRESS status")
    mitigated: int = Field(0, description="Items in MITIGATED status")
    resolved: int = Field(0, description="Items in RESOLVED status")
    risk_accepted: int = Field(0, description="Items in RISK_ACCEPTED status")
    overdue: int = Field(0, description="Items overdue against target due date")

