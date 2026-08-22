export type PriorityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type MatchStatus = 'MATCH' | 'NEEDS_VERIFICATION' | 'EXCLUDE' | 'NOT_AFFECTED';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface Asset {
  asset_id: string;
  name: string;
  vendor: string;
  product: string;
  version?: string | null;
  environment: string;
  exposure: string;
  importance: string;
}

export interface AssetCreateRequest {
  name: string;
  product: string;
  vendor?: string;
  version?: string | null;
  environment?: string;
  exposure?: string;
  importance?: string;
}

export interface AssetUpdateRequest {
  name?: string;
  product?: string;
  vendor?: string;
  version?: string | null;
  environment?: string;
  exposure?: string;
  importance?: string;
}

export interface AssetListResponse {
  org_id: string;
  assets: Asset[];
  total_count: number;
}

export interface AssetDetailResponse {
  org_id: string;
  asset: Asset;
  matched_vulnerabilities_count: number;
}

export interface Technology {
  vendor: string;
  product: string;
  version?: string | null;
  service: string;
  exposure: string;
  importance: string;
  asset_id?: string | null;
  name?: string | null;
  environment?: string;
}

export interface WeightModifiers {
  cisa_kev_weight: number;
  first_epss_weight: number;
  cvss_weight: number;
  exposure_weight: number;
  importance_weight: number;
}

export interface ProfileSummary {
  profile_id: string;
  name: string;
  sector: string;
  risk_appetite: string;
  technology_count: number;
}

export interface ProfilesListResponse {
  profiles: ProfileSummary[];
}

export interface ProfileDetailResponse {
  profile_id: string;
  name: string;
  sector: string;
  risk_appetite: string;
  weights: WeightModifiers;
  technologies: Technology[];
  critical_products: string[];
  assets?: Asset[];
}

export interface OrganizationCreateRequest {
  name: string;
  sector: string;
  risk_appetite: string;
  critical_products: string[];
  weight_modifiers?: Partial<WeightModifiers>;
  technologies?: Technology[];
}

export interface OrganizationUpdateRequest {
  name?: string;
  sector?: string;
  risk_appetite?: string;
  critical_products?: string[];
  weight_modifiers?: Partial<WeightModifiers>;
  technologies?: Technology[];
}

export interface ProductCatalogueResponse {
  products: string[];
  total_count: number;
}


export interface ProfileHeader {
  id: string;
  name: string;
  sector: string;
  risk_appetite: string;
}

export interface TriageSummary {
  total_records: number;
  matched_candidates: number;
  urgent: number;
  high: number;
  needs_verification: number;
}

export interface SignalBreakdown {
  cvss: number;
  kev: boolean;
  epss: number;
}

export interface ScoreFactors {
  kev: number;
  epss: number;
  cvss: number;
  exposure: number;
  importance: number;
}

export interface Provenance {
  reference_url: string;
  source_snapshot_date: string;
  source_file: string;
  source_cvss: number;
  source_kev: boolean;
  source_epss: number;
  matched_asset_id?: string | null;
  matched_asset_name?: string | null;
  matched_environment?: string | null;
}

export interface TechnologyInfo {
  vendor: string;
  product: string;
  version?: string | null;
  asset_id?: string | null;
  asset_name?: string | null;
  environment?: string;
}


export interface TriageItem {
  rank: number;
  cve_id: string;
  priority: PriorityLevel;
  score: number;
  title: string;
  technology: TechnologyInfo;
  service: string;
  exposure: string;
  importance: string;
  match_status: MatchStatus;
  confidence: ConfidenceLevel;
  factors: ScoreFactors;
  signals: SignalBreakdown;
  why_it_matters: string;
  next_action: string;
  provenance: Provenance;
}

export interface TriageResponse {
  profile: ProfileHeader;
  summary: TriageSummary;
  results: TriageItem[];
}

export interface EvidenceResponse {
  cve_id: string;
  product_name: string;
  profile_id: string;
  profile_name: string;
  rank?: number | null;
  priority: string;
  score_100: number;
  confidence: string;
  source_facts: {
    cve_id: string;
    product_name: string;
    cvss_base_score: number;
    cisa_kev: boolean;
    first_epss: number;
    affected_versions?: string | null;
    version_note?: string | null;
    reference_url: string;
    snapshot_date: string;
    source_file: string;
  };
  matching: {
    outcome: string;
    reason_code: string;
    match_reason: string;
    is_matched: boolean;
  };
  asset_context: {
    asset_id?: string | null;
    asset_name?: string | null;
    matched_technology?: string | null;
    vendor?: string | null;
    installed_version?: string | null;
    environment?: string | null;
    service?: string | null;
    exposure: string;
    importance: string;
  };
  score_factors: {
    kev_points: number;
    epss_points: number;
    cvss_points: number;
    exposure_points: number;
    importance_points: number;
    total_score_100: number;
  };
  weights_used: Record<string, number>;
  explanation: {
    title: string;
    why_it_matters: string;
    safe_next_action: string;
    contributing_signals: string[];
  };
}

export interface WhyNotItem {
  cve_id: string;
  product_name: string;
  cvss: number;
  cisa_kev: boolean;
  first_epss: number;
  rank?: number | null;
  decision: string;
  reason_code: string;
  reason: string;
}

export interface WhyNotResponse {
  profile_id: string;
  profile_name: string;
  negative_test_summary: string;
  excluded_high_severity: WhyNotItem[];
  deprioritised_high_severity: WhyNotItem[];
}

export interface ComparisonDifference {
  cve_id: string;
  product_name: string;
  rank_a?: number | null;
  rank_b?: number | null;
  score_a?: number | null;
  score_b?: number | null;
  drivers: string[];
}

export interface ComparisonResponse {
  profile_a: ProfileHeader;
  profile_b: ProfileHeader;
  top5_a: TriageItem[];
  top5_b: TriageItem[];
  common_cves: string[];
  unique_a_cves: string[];
  unique_b_cves: string[];
  differences: ComparisonDifference[];
  summary: string;
}

export interface WhatIfItem {
  rank: number;
  previous_rank?: number | null;
  cve_id: string;
  product_name: string;
  simulated_score: number;
  original_score: number;
  rank_change: string;
}

export interface WhatIfResponse {
  profile_id: string;
  profile_name: string;
  original_weights: WeightModifiers;
  simulated_weights: WeightModifiers;
  simulated_top5: WhatIfItem[];
  original_top5: WhatIfItem[];
}

// --- Phase 5: Local AI Copilot & Fact Guard ---
export interface AICopilotExplanation {
  why_it_matters: string;
  potential_impact: string;
  next_action: string;
}

export interface AICopilotMetadata {
  available: boolean;
  generated: boolean;
  validated: boolean;
  mode: 'local' | 'deterministic_fallback';
  model?: string | null;
}

export interface FactGuardStatus {
  status: 'PASSED' | 'FAILED' | 'FALLBACK';
  checks_performed: string[];
  violations: string[];
}

export interface AIExplanationResponse {
  profile_id: string;
  cve_id: string;
  explanation: AICopilotExplanation;
  ai: AICopilotMetadata;
  source_bound: boolean;
  fact_guard: FactGuardStatus;
}

// --- Phase 9: Remediation Workspace ---
export type RemediationStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'MITIGATED'
  | 'RESOLVED'
  | 'RISK_ACCEPTED';

export interface RemediationNote {
  note_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface RemediationActivity {
  activity_id: string;
  action: string;
  details: string;
  author: string;
  timestamp: string;
}

export interface RemediationRecord {
  remediation_id: string;
  org_id: string;
  cve_id: string;
  asset_id: string;
  asset_name: string;
  product: string;
  installed_version?: string | null;
  environment: string;
  exposure: string;
  importance: string;
  priority: string;
  score: number;
  status: RemediationStatus;
  owner: string;
  due_date?: string | null;
  is_overdue: boolean;
  verification_details?: string | null;
  notes: RemediationNote[];
  activity_log: RemediationActivity[];
  created_at: string;
  updated_at: string;
}

export interface RemediationCreateRequest {
  cve_id: string;
  asset_id?: string | null;
  owner?: string;
  due_date?: string | null;
  initial_note?: string | null;
}

export interface RemediationUpdateRequest {
  status?: string;
  owner?: string;
  due_date?: string | null;
  verification_details?: string | null;
  note?: string | null;
}

export interface RemediationNoteCreateRequest {
  content: string;
  author?: string;
}

export interface RemediationListResponse {
  org_id: string;
  remediations: RemediationRecord[];
  total_count: number;
}

export interface RemediationSummary {
  org_id: string;
  total: number;
  open: number;
  acknowledged: number;
  in_progress: number;
  mitigated: number;
  resolved: number;
  risk_accepted: number;
  overdue: number;
}

