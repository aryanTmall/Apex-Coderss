export interface Department {
  id: string;
  name: string;
  supported_categories: string[];
  available: boolean;
  escalation_level: number;
  trust_score?: number;
  spoofing_flags_count?: number;
  fallback_department_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  incident_id?: string | null;
  report_id?: string | null;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  uploaded_at: string;
  verified_at?: string | null;
  verification_status: 'VERIFIED' | 'TAMPERED' | 'FILE_MISSING' | 'PENDING';
  is_synthetic: boolean;
  download_url?: string | null;
}

export interface AttachmentVerifyResult {
  id: string;
  original_filename: string;
  stored_hash: string;
  calculated_hash: string;
  is_valid: boolean;
  status: string;
  verified_at: string;
  details: string;
}

export interface CitizenReport {
  id: string;
  tracking_id: string;
  incident_id?: string | null;
  reporter_name?: string | null;
  text: string;
  language: string;
  category: string;
  custom_category?: string | null;
  location_mode: 'PRECISE' | 'UNCONFIRMED';
  location_status: 'USER_SELECTED' | 'LOCATION_UNCONFIRMED' | 'TO_BE_CONFIRMED' | 'CORROBORATED' | 'LOCATION_CONFIRMED';
  latitude?: number | null;
  longitude?: number | null;
  location_description?: string | null;
  address?: string | null;
  approximate_locality?: string | null;
  observation_time?: string | null;
  photo_ref?: string | null;
  photo_data?: string | null;
  sha256_hash?: string | null;
  created_at: string;
  duplicate_score?: number | null;
  duplicate_rationale?: string | null;
  is_synthetic: boolean;
}

export interface CheckDetail {
  name: string;
  status: 'PASSED' | 'FAILED' | 'NEEDS_REVIEW';
  mandatory: boolean;
  explanation: string;
  evidence?: any;
}

export interface ClosureSubmission {
  id: string;
  incident_id: string;
  department_id?: string | null;
  description: string;
  photo_ref?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  submitted_at: string;
  verdict: 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
  verdict_reasons: string[];
  individual_checks: Record<string, CheckDetail>;
  reviewer_id?: string | null;
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  is_synthetic: boolean;
}

export interface AuditEvent {
  id: string;
  incident_id?: string | null;
  event_type: string;
  from_status?: string | null;
  to_status?: string | null;
  actor: string;
  action: string;
  reason: string;
  structured_metadata: Record<string, any>;
  previous_hash?: string | null;
  event_hash?: string | null;
  timestamp: string;
}

export interface EscalationRecord {
  id: string;
  incident_id: string;
  tier: number;
  tier_name: string;
  authority_title: string;
  reason: string;
  triggered_at: string;
  resolved_at?: string | null;
}

export interface Hotspot {
  id: string;
  name: string;
  category: string;
  zone_name: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  incident_count: number;
  severity_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incident_ids: string[];
  detected_at: string;
  last_activity_at: string;
  is_active: boolean;
}

export interface Incident {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string;
  custom_category?: string | null;
  priority: number;
  priority_reasons: string[];
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'CLOSURE_SUBMITTED' | 'NEEDS_REVIEW' | 'RESOLVED' | 'REOPENED' | 'ESCALATED';
  location_mode: 'PRECISE' | 'UNCONFIRMED';
  location_status: 'USER_SELECTED' | 'LOCATION_UNCONFIRMED' | 'TO_BE_CONFIRMED' | 'CORROBORATED' | 'LOCATION_CONFIRMED';
  latitude?: number | null;
  longitude?: number | null;
  location_description?: string | null;
  address?: string | null;
  approximate_locality?: string | null;
  photo_data?: string | null;
  sha256_hash?: string | null;
  department_id?: string | null;
  created_at: string;
  assigned_at?: string | null;
  sla_due_at?: string | null;
  resolved_at?: string | null;
  reopen_count: number;
  escalation_count: number;
  escalation_tier: number;
  reports_count: number;
  canonical_incident_id?: string | null;
  hotspot_id?: string | null;
  recurring_flag: boolean;
  root_cause_hypothesis?: string | null;
  root_cause_evidence_ids: string[];
  ai_classification_metadata: Record<string, any>;
  assignment_rationale?: string | null;
  is_synthetic: boolean;
  reports?: CitizenReport[];
  closure_submissions?: ClosureSubmission[];
  audit_events?: AuditEvent[];
  attachments?: Attachment[];
  escalation_records?: EscalationRecord[];
}

export interface Metrics {
  total_reports: number;
  canonical_incidents: number;
  open_cases: number;
  resolved_cases: number;
  overdue_cases: number;
  escalated_cases: number;
  duplicate_link_rate_pct: number;
  closure_rejection_rate_pct: number;
  sla_compliance_pct: number;
  median_resolution_min: number;
  by_department: Record<string, number>;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  closure_verdict_distribution: Record<string, number>;
}

export interface ReportIntakeResult {
  report: CitizenReport;
  incident_id: string;
  incident_tracking_id: string;
  is_duplicate: boolean;
  duplicate_action: 'LINKED' | 'REVIEW' | 'CREATED';
  duplicate_score?: number | null;
  explanation: string;
  category: string;
  priority: number;
  assigned_department_id?: string | null;
  location_mode?: 'PRECISE' | 'UNCONFIRMED';
  location_status?: string;
}

export interface DensityIncidentSummary {
  id: string;
  tracking_id: string;
  title: string;
  category: string;
  priority: number;
  status: string;
  distance_meters: number;
}

export interface DensityResponse {
  density_count: number;
  is_high_density: boolean;
  radius_meters: number;
  message: string;
  active_incidents: DensityIncidentSummary[];
}

export interface LocationSearchResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string | null;
  locality?: string | null;
  suburb?: string | null;
  city?: string | null;
  postcode?: string | null;
}

export interface ReverseGeocodeResult {
  formatted_address: string;
  locality?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  latitude: number;
  longitude: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCitation {
  title: string;
  type: string;
  link_id?: string | null;
  snippet: string;
}

export interface ChatResponse {
  reply: string;
  provider: string;
  citations: ChatCitation[];
  suggested_actions: string[];
}

export interface ChatStatusResponse {
  status: string;
  active_provider: string;
  gemini_configured: boolean;
  openrouter_configured: boolean;
  fallback_available: boolean;
  supported_intents: string[];
}

export interface TrackingData {
  tracking_id: string;
  incident_id?: string | null;
  incident_tracking_id?: string | null;
  title: string;
  category: string;
  status: string;
  priority: number;
  department_name: string;
  created_at: string;
  sla_due_at?: string | null;
  sla_status: 'HEALTHY' | 'AT_RISK' | 'BREACHED' | 'RESOLVED' | 'UNKNOWN';
  reopen_count: number;
  escalation_count: number;
  is_linked_duplicate: boolean;
  duplicate_explanation?: string | null;
  location_description?: string | null;
  timeline: Array<{
    timestamp: string;
    action: string;
    actor_type: string;
    summary: string;
    from_status?: string | null;
    to_status?: string | null;
  }>;
}

export interface RootCauseHypothesis {
  hypothesis: string;
  supporting_incident_ids: string[];
  categories: string[];
  incident_count: number;
  cluster_center: {
    lat: number;
    lon: number;
  };
  confidence: string;
  criteria: string;
  disclaimer: string;
}

export interface RecurringIncident {
  incident_id: string;
  tracking_id: string;
  title: string;
  category: string;
  priority: number;
  status: string;
  location_description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  reopen_count: number;
  created_at: string;
  prior_incident_ids: string[];
}

export interface EmergencyResource {
  id: string;
  name: string;
  category: string;
  phone_number: string;
  alternate_phone?: string | null;
  jurisdiction: string;
  available_hours: string;
  source_url: string;
  last_verified_at: string;
  verification_status: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_active: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  retrieved_at: string;
  geographic_scope: 'LOCAL' | 'CITY' | 'STATE' | 'NATIONAL' | 'GLOBAL';
  city?: string | null;
  state?: string | null;
  country: string;
  category: string;
  is_live: boolean;
  cached_until?: string | null;
  ai_summary?: string;
  civic_relevance?: string;
  related_incident_count?: number;
  related_category?: string;
  is_demo_data?: boolean;
}

export interface EmergencyStation {
  id: string;
  name: string;
  service_type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  alternate_phone?: string | null;
  operating_status: string;
  status_verified: boolean;
  data_source: string;
  last_verified_at: string;
  capabilities?: string | null;
  dispatch_integrated: boolean;
  is_active: boolean;
}

export interface EmergencyStationEta {
  id: string;
  name: string;
  service_type: string;
  address: string;
  latitude: number;
  longitude: number;
  phone_number: string;
  alternate_phone?: string | null;
  operating_status: string;
  status_verified: boolean;
  data_source: string;
  last_verified_at?: string | null;
  capabilities: string[];
  dispatch_integrated: boolean;
  live_eta_available: boolean;
  eta_source: string;
  route_distance_km?: number | null;
  straight_line_distance_km: number;
  estimated_travel_minutes?: number | null;
  eta_description: string;
  eta_calculated_at: string;
  directions_url: string;
  osm_directions_url: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'REVIEWER' | 'DEPARTMENT_OPERATOR' | 'FIELD_OFFICER' | 'CITIZEN';
  department_id?: string | null;
}

export interface AuthLoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface DemoSeedResult {
  status: string;
  incidents_seeded: number;
  reports_seeded: number;
  linked_duplicates: number;
  categories_covered: number;
  geography: string;
  dataset_marker: string;
}

// Module 1: Municipal Fund Tracker
export interface MunicipalFundsSummary {
  financial_year: string;
  city: string;
  total_approved_budget: number;
  total_allocated_amount: number;
  total_funds_released: number;
  total_expenditure_recorded: number;
  total_outstanding_commitments: number;
  remaining_approved_balance: number;
  overall_utilization_pct: number;
  total_projects: number;
  completed_projects: number;
  delayed_projects: number;
  in_progress_projects: number;
  data_source: string;
  reporting_period: string;
  last_verified_at: string;
  is_synthetic_notice: string;
}

export interface WardBudgetItem {
  ward_id: string;
  ward_number: string;
  ward_name: string;
  zone: string;
  city: string;
  councillor_name: string;
  population: number;
  approved_budget: number;
  allocated_amount: number;
  funds_released: number;
  expenditure_recorded: number;
  remaining_balance: number;
  utilization_pct: number;
  active_projects_count: number;
  completed_projects_count: number;
}

export interface MunicipalProject {
  id: string;
  ward_id: string;
  ward_name?: string;
  ward_number?: string;
  department_id: string;
  title: string;
  description: string;
  category: string;
  sanctioned_amount: number;
  expenditure_to_date: number;
  contractor_name: string;
  tender_reference: string;
  status: 'PROPOSED' | 'TENDERED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  progress_pct: number;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date?: string | null;
  financial_year: string;
  milestones?: { milestone: string; status: string; date: string }[];
  is_synthetic: boolean;
}

// Module 6: Contractor Performance & Penalties
export interface ContractorItem {
  id: string;
  name: string;
  agency_type: string;
  contact_person: string;
  email: string;
  phone: string;
  license_no: string;
  trust_score: number;
  active_contracts_count: number;
  is_active: boolean;
  confirmed_penalties: number;
  confirmed_bonuses: number;
  assessments_count: number;
  created_at?: string;
}

export interface ContractItem {
  id: string;
  title: string;
  contract_number: string;
  department_id: string;
  ward_id?: string;
  contract_value: number;
  start_date: string;
  end_date: string;
  sla_target_hours: number;
  allowed_reopen_rate_pct: number;
  penalty_per_hour_breach: number;
  max_penalty_cap_pct: number;
  clauses_summary?: string;
  is_active: boolean;
}

export interface PerformanceAssessmentItem {
  id: string;
  contractor_id: string;
  contractor_name?: string;
  contract_id?: string;
  incident_id?: string;
  project_id?: string;
  assessment_type: 'PENALTY_RECOMMENDATION' | 'BONUS_RECOMMENDATION';
  clause_reference: string;
  breach_duration_hours: number;
  recommended_amount: number;
  final_amount: number;
  status: string;
  evidence_summary: string;
  contractor_response?: string;
  official_decision_notes?: string;
  approved_at?: string;
  created_at?: string;
}

// Module 3: Community Proposals & Participatory Budgeting
export interface PollOptionItem {
  id: string;
  title: string;
  description?: string;
  votes_count: number;
  vote_pct?: number;
}

export interface CommunityProposalItem {
  id: string;
  title: string;
  description: string;
  ward_id: string;
  ward_name: string;
  ward_number: string;
  category: string;
  estimated_cost: number;
  financial_year: string;
  expected_public_benefit: string;
  feasibility_notes?: string;
  submitted_by_type: 'CITIZEN' | 'MUNICIPAL_OFFICER';
  status: string;
  total_votes_count: number;
  official_decision_rationale?: string;
  decision_recorded_at?: string;
  created_at?: string;
  options: PollOptionItem[];
}

// Module 2: Civic Rewards & Leaderboard
export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string;
  category: string;
  credits_cost: number;
  is_partner_verified: boolean;
  partner_name: string;
  terms_summary: string;
}

export interface RewardLedgerItem {
  id: string;
  transaction_type: 'EARN' | 'REDEEM' | 'REVERSAL' | 'ADJUSTMENT';
  credits: number;
  activity_type: string;
  reference_id?: string;
  description: string;
  verification_status: string;
  timestamp: string;
}

export interface RewardRedemptionItem {
  id: string;
  catalog_item_id: string;
  voucher_code: string;
  credits_spent: number;
  status: string;
  expires_at: string;
  issued_at: string;
}

export interface RewardAccountItem {
  id: string;
  citizen_identifier: string;
  display_name: string;
  ward_id?: string;
  total_earned_credits: number;
  current_balance: number;
  is_public_on_leaderboard: boolean;
  ledger: RewardLedgerItem[];
  redemptions: RewardRedemptionItem[];
}

export interface LeaderboardRankItem {
  rank: number;
  display_name: string;
  ward_name: string;
  ward_number: string;
  total_earned_credits: number;
  badge_tier: string;
}

// Module 4: Multilingual Voice Assistant
export interface VoiceParseResult {
  category: string;
  title: string;
  description: string;
  location_hint: string;
  detected_language: string;
  urgency: string;
  extraction_method: string;
  confidence_score: number;
}

// Module 5: WhatsApp & SMS Bot Simulator
export interface MessagingHistoryItem {
  id: string;
  provider: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender_phone: string;
  recipient_phone: string;
  body: string;
  media_url?: string;
  status: string;
  created_at: string;
}

// Module 7: Whistleblower Portal
export interface WhistleblowerSubmitResult {
  case_id: string;
  case_token: string;
  status: string;
  verification_label: string;
  created_at: string;
}

export interface WhistleblowerTrackResult {
  case_id: string;
  title: string;
  allegation_category: string;
  ward_name: string;
  suspect_organization?: string;
  status: string;
  verification_label: string;
  investigation_outcome?: string;
  created_at: string;
  updated_at?: string;
  attachments_count: number;
}

export interface WhistleblowerCaseItem {
  id: string;
  title: string;
  allegation_category: string;
  ward_id?: string;
  ward_name: string;
  suspect_organization?: string;
  status: string;
  verification_label: string;
  narrative_preview: string;
  attachments_count: number;
  created_at: string;
}

