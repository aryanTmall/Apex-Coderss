import {
  Department,
  Incident,
  Metrics,
  Hotspot,
  AuditEvent,
  MunicipalFundsSummary,
  WardBudgetItem,
  MunicipalProject,
  ContractorItem,
  PerformanceAssessmentItem,
  CommunityProposalItem,
  RewardCatalogItem,
  LeaderboardRankItem,
  EmergencyResource,
  NewsArticle,
  RecurringIncident,
  RootCauseHypothesis,
  EscalationRecord,
  WhistleblowerCaseItem
} from './types';

// ================= 1. DEPARTMENTS (NEW DELHI) =================
export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'DEP-ROADS',
    name: 'Roads & Public Works Department (Delhi PWD)',
    supported_categories: ['POTHOLE_ROAD_DAMAGE', 'TRAFFIC_SIGNAL', 'HAZARDOUS_DEBRIS', 'PUBLIC_INFRASTRUCTURE', 'FOOTPATH_DAMAGE'],
    available: true,
    escalation_level: 0,
    trust_score: 96.5,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'DEP-LIGHTS',
    name: 'Municipal Electrical & Lighting Dept (BSES / NDMC Power)',
    supported_categories: ['STREETLIGHT_OUTAGE'],
    available: true,
    escalation_level: 0,
    trust_score: 98.0,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'DEP-WASTE',
    name: 'Solid Waste Management (MCD SWM)',
    supported_categories: ['GARBAGE_DUMP', 'ILLEGAL_DUMPING', 'OVERFLOWING_BIN'],
    available: true,
    escalation_level: 0,
    trust_score: 94.2,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'DEP-WATER',
    name: 'Delhi Jal Board & Sewerage (DJB)',
    supported_categories: ['WATER_PIPE_LEAK', 'WATERLOGGING_FLOOD', 'SEWAGE_OVERFLOW'],
    available: true,
    escalation_level: 0,
    trust_score: 95.8,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'DEP-PARKS',
    name: 'Horticulture & Urban Forestry (DDA / MCD)',
    supported_categories: ['TREE_FALLEN', 'PARK_MAINTENANCE'],
    available: true,
    escalation_level: 0,
    trust_score: 99.1,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ================= 2. METRICS (NEW DELHI) =================
export const MOCK_METRICS: Metrics = {
  total_reports: 452,
  canonical_incidents: 184,
  open_cases: 38,
  resolved_cases: 146,
  overdue_cases: 2,
  escalated_cases: 5,
  duplicate_link_rate_pct: 32.4,
  closure_rejection_rate_pct: 4.1,
  sla_compliance_pct: 94.6,
  median_resolution_min: 185,
  by_department: {
    'DEP-ROADS': 78,
    'DEP-LIGHTS': 32,
    'DEP-WASTE': 44,
    'DEP-WATER': 30
  },
  by_category: {
    'POTHOLE_ROAD_DAMAGE': 64,
    'STREETLIGHT_OUTAGE': 32,
    'GARBAGE_DUMP': 44,
    'WATER_PIPE_LEAK': 28,
    'WATERLOGGING_FLOOD': 16
  },
  by_status: {
    'NEW': 8,
    'ASSIGNED': 14,
    'IN_PROGRESS': 16,
    'CLOSURE_SUBMITTED': 6,
    'RESOLVED': 140
  },
  closure_verdict_distribution: {
    'APPROVED': 140,
    'REOPENED': 6
  }
};

// ================= 3. INCIDENTS (NEW DELHI GEOGRAPHY) =================
export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    tracking_id: 'REP-DEL-001',
    title: 'Severe crater on Radial Road 3 near Barakhamba',
    description: 'Dangerous pothole on right lane causing sharp swerving and vehicle damage during peak traffic hours.',
    category: 'POTHOLE_ROAD_DAMAGE',
    priority: 4,
    priority_reasons: ['HIGH_TRAFFIC_CORRIDOR', 'SAFETY_HAZARD', 'ACCELERATED_SLA'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.6315,
    longitude: 77.2167,
    address: 'Connaught Place Radial Road 3, Near Barakhamba Metro, New Delhi 110001',
    department_id: 'DEP-ROADS',
    assigned_at: new Date(Date.now() - 5400000).toISOString(),
    sla_due_at: new Date(Date.now() + 14400000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 2,
    recurring_flag: true,
    root_cause_hypothesis: 'Sub-surface water pipe seepage eroding asphalt road base',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.96, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'INC-2026-002',
    tracking_id: 'REP-DEL-002',
    title: 'Series of 4 broken streetlights on Arya Samaj Road',
    description: 'Blackout stretch outside commercial market creating safety risk for pedestrians and night shoppers.',
    category: 'STREETLIGHT_OUTAGE',
    priority: 3,
    priority_reasons: ['TRANSIT_ZONE', 'PUBLIC_SAFETY'],
    status: 'ASSIGNED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.6514,
    longitude: 77.1907,
    address: 'Arya Samaj Road, Karol Bagh, New Delhi 110005',
    department_id: 'DEP-LIGHTS',
    assigned_at: new Date(Date.now() - 7200000).toISOString(),
    sla_due_at: new Date(Date.now() + 28800000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: false,
    root_cause_hypothesis: 'Underground junction fuse trip during recent evening rains',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.94, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'INC-2026-003',
    tracking_id: 'REP-DEL-003',
    title: 'Major main water pipe burst flooding lower street',
    description: 'High pressure drinking water pipeline leaking continuously, washing out soil near commercial complex.',
    category: 'WATER_PIPE_LEAK',
    priority: 5,
    priority_reasons: ['CRITICAL_UTILITY_LOSS', 'SOIL_SUBSIDENCE_RISK'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5492,
    longitude: 77.2528,
    address: 'Outer Ring Road, Near Nehru Place Metro Gate 2, New Delhi 110019',
    department_id: 'DEP-WATER',
    assigned_at: new Date(Date.now() - 2700000).toISOString(),
    sla_due_at: new Date(Date.now() + 7200000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 3,
    recurring_flag: false,
    root_cause_hypothesis: 'Corrosion on 30-year-old cast iron municipal distribution trunk',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.98, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'INC-2026-004',
    tracking_id: 'REP-DEL-004',
    title: 'Overflowing commercial garbage dhalao near Hauz Khas Village',
    description: 'Commercial restaurant waste accumulated outside designated bins spilling onto pedestrian pathway.',
    category: 'GARBAGE_DUMP',
    priority: 2,
    priority_reasons: ['HEALTH_SANITATION'],
    status: 'CLOSURE_SUBMITTED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5494,
    longitude: 77.2001,
    address: 'Hauz Khas Village Entrance, Deer Park Road, New Delhi 110016',
    department_id: 'DEP-WASTE',
    assigned_at: new Date(Date.now() - 21600000).toISOString(),
    sla_due_at: new Date(Date.now() + 43200000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: true,
    root_cause_hypothesis: 'Absence of designated waste collection compactor for night market vendors',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.91, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    closure_submissions: [
      {
        id: 'CLS-DEL-004',
        incident_id: 'INC-2026-004',
        department_id: 'DEP-WASTE',
        description: 'Compactor vehicle mobilized and dhalao cleared with disinfectant wash.',
        photo_ref: '/uploads/sample_closure_pwd.jpg',
        latitude: 28.5493,
        longitude: 77.2002,
        submitted_at: new Date(Date.now() - 1800000).toISOString(),
        verdict: 'APPROVED',
        verdict_reasons: ['GEOFENCE_MATCH_EXCELLENT', 'METADATA_TIMESTAMP_VALID'],
        individual_checks: {
          geofence: {
            name: 'Geofence Verification',
            status: 'PASSED',
            mandatory: true,
            explanation: 'Closure proof photo recorded at 12m from report coordinates (Threshold: 50m).'
          },
          tamper_check: {
            name: 'Cryptographic SHA-256 Hash',
            status: 'PASSED',
            mandatory: true,
            explanation: 'Original image hash verified against tamper-evident audit ledger.'
          }
        },
        reviewer_id: 'USR-REV-01',
        is_synthetic: true
      }
    ]
  },
  {
    id: 'INC-2026-005',
    tracking_id: 'REP-DEL-005',
    title: 'Road subsidence and waterlogged underpass after storm',
    description: 'Severe waterlogging under railway bridge reaching 2 feet depth, trapping two-wheelers.',
    category: 'WATERLOGGING_FLOOD',
    priority: 4,
    priority_reasons: ['STRUCTURAL_INSTABILITY', 'TRANSIT_HAZARD'],
    status: 'RESOLVED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5815,
    longitude: 77.0592,
    address: 'Dwarka Sector 10 Underpass, Near Metro Station, New Delhi 110075',
    department_id: 'DEP-ROADS',
    assigned_at: new Date(Date.now() - 144000000).toISOString(),
    sla_due_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 86400000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: false,
    root_cause_hypothesis: 'Culvert structural erosion from silt clogging',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.95, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'INC-2026-006',
    tracking_id: 'REP-DEL-006',
    title: 'Broken concrete storm slab creating fall hazard on Ring Road',
    description: 'Dislodged pedestrian walkway slab exposing 4-foot deep stormwater drain near bus terminal.',
    category: 'PUBLIC_INFRASTRUCTURE',
    priority: 4,
    priority_reasons: ['PEDESTRIAN_SAFETY_HAZARD'],
    status: 'NEEDS_REVIEW',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5677,
    longitude: 77.2433,
    address: 'Lajpat Nagar Central Market Ring Road, New Delhi 110024',
    department_id: 'DEP-ROADS',
    assigned_at: new Date(Date.now() - 12000000).toISOString(),
    sla_due_at: new Date(Date.now() - 1800000).toISOString(),
    reopen_count: 1,
    escalation_count: 1,
    escalation_tier: 1,
    reports_count: 2,
    recurring_flag: true,
    root_cause_hypothesis: 'Heavy delivery truck mounting sidewalk during night replenishment',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.93, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 18000000).toISOString(),
    closure_submissions: [
      {
        id: 'CLS-DEL-006',
        incident_id: 'INC-2026-006',
        department_id: 'DEP-ROADS',
        description: 'Contractor uploaded closure photo taken 142m away from the slab location.',
        photo_ref: '/uploads/sample_closure_bad.jpg',
        latitude: 28.5690,
        longitude: 77.2448,
        submitted_at: new Date(Date.now() - 3600000).toISOString(),
        verdict: 'REJECTED',
        verdict_reasons: ['GEOFENCE_DEVIATION_EXCEEDED', 'SPOOFING_SUSPECTED'],
        individual_checks: {
          geofence: {
            name: 'Geofence Verification',
            status: 'FAILED',
            mandatory: true,
            explanation: 'Closure photo taken 142m away from reported coordinates. Exceeds 50m tolerance.'
          },
          tamper_check: {
            name: 'Audit Trail Check',
            status: 'PASSED',
            mandatory: true,
            explanation: 'Hash verified; flagged for operator physical inspection.'
          }
        },
        reviewer_id: 'USR-REV-01',
        is_synthetic: true
      }
    ]
  },
  {
    id: 'INC-2026-007',
    tracking_id: 'REP-DEL-007',
    title: 'Damaged traffic signal timer blinking amber at Civil Lines intersection',
    description: 'Traffic light stuck on blinking amber causing driver confusion and near-miss accidents at major crossing.',
    category: 'TRAFFIC_SIGNAL',
    priority: 3,
    priority_reasons: ['TRAFFIC_GRIDLOCK_RISK'],
    status: 'ASSIGNED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.6815,
    longitude: 77.2227,
    address: 'Civil Lines University Enclave Crossing, New Delhi 110054',
    department_id: 'DEP-ROADS',
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    sla_due_at: new Date(Date.now() + 18000000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: false,
    root_cause_hypothesis: 'Signal controller board circuit trip',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.97, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'INC-2026-008',
    tracking_id: 'REP-DEL-008',
    title: 'Choked underground sewer line backflowing onto public footpath',
    description: 'Sewer manhole overflowing with foul-smelling effluent blocking access to heritage market arcade.',
    category: 'SEWAGE_OVERFLOW',
    priority: 4,
    priority_reasons: ['PUBLIC_HEALTH_HAZARD', 'COMMERCIAL_CORRIDOR'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.6562,
    longitude: 77.2300,
    address: 'Chandni Chowk Main Heritage Promenade, Near Town Hall, Old Delhi 110006',
    department_id: 'DEP-WATER',
    assigned_at: new Date(Date.now() - 7200000).toISOString(),
    sla_due_at: new Date(Date.now() + 14400000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 3,
    recurring_flag: true,
    root_cause_hypothesis: 'Grease and solid waste coagulation choking narrow British-era brick sewer conduit',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.95, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 9000000).toISOString()
  },
  {
    id: 'INC-2026-009',
    tracking_id: 'REP-DEL-009',
    title: 'Cracked pedestrian foot-overbridge handrail near South Extension Market',
    description: 'Welded railing joint sheared off on high elevated bridge, posing severe fall risk for commuters.',
    category: 'PUBLIC_INFRASTRUCTURE',
    priority: 5,
    priority_reasons: ['LIFE_SAFETY_CRITICAL'],
    status: 'ASSIGNED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5728,
    longitude: 77.2215,
    address: 'South Extension Part 2 Ring Road Flyover, New Delhi 110049',
    department_id: 'DEP-ROADS',
    assigned_at: new Date(Date.now() - 1800000).toISOString(),
    sla_due_at: new Date(Date.now() + 10800000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 2,
    recurring_flag: false,
    root_cause_hypothesis: 'Structural vibration fatigue from continuous heavy vehicle transit on Ring Road',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.99, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 2400000).toISOString()
  },
  {
    id: 'INC-2026-010',
    tracking_id: 'REP-DEL-010',
    title: 'Sunken road shoulder post-utility dig at Rohini Sector 14',
    description: 'Trench backfill improperly compacted following optical fiber laying; road surface sinking under buses.',
    category: 'POTHOLE_ROAD_DAMAGE',
    priority: 3,
    priority_reasons: ['SUB-SURFACE_EROSION'],
    status: 'NEW',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.7150,
    longitude: 77.1325,
    address: 'Sector 14 Main Commercial Avenue, Rohini, New Delhi 110085',
    department_id: 'DEP-ROADS',
    assigned_at: undefined,
    sla_due_at: new Date(Date.now() + 43200000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: false,
    root_cause_hypothesis: 'Improper mechanical rolling of granular sub-base layer',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.92, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 'INC-2026-011',
    tracking_id: 'REP-DEL-011',
    title: 'Unconfirmed water seepage report near AIIMS Ring Road underpass',
    description: 'Citizen submitted delayed report of water accumulation observed during evening commute. Awaiting GPS verification.',
    category: 'WATERLOGGING_FLOOD',
    priority: 3,
    priority_reasons: ['TRANSIT_CORRIDOR'],
    status: 'NEW',
    location_mode: 'UNCONFIRMED',
    location_status: 'LOCATION_UNCONFIRMED',
    latitude: 28.5672,
    longitude: 77.2100,
    address: 'Near AIIMS Emergency Gate Underpass, Ring Road, New Delhi 110029',
    department_id: 'DEP-WATER',
    assigned_at: undefined,
    sla_due_at: new Date(Date.now() + 28800000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: false,
    root_cause_hypothesis: 'Drainage pump failure during sudden shower',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.88, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'INC-2026-012',
    tracking_id: 'REP-DEL-012',
    title: 'Fallen peepal tree branch obstructing bus lane on Outer Ring Road',
    description: 'Large storm-damaged tree limb snapped and resting across left transit lane, blocking low-floor electric buses.',
    category: 'TREE_FALLEN',
    priority: 4,
    priority_reasons: ['PUBLIC_TRANSIT_BLOCKAGE'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 28.5580,
    longitude: 77.1730,
    address: 'Outer Ring Road, Munirka Flyover Descent, New Delhi 110067',
    department_id: 'DEP-PARKS',
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    sla_due_at: new Date(Date.now() + 7200000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 2,
    recurring_flag: false,
    root_cause_hypothesis: 'Dry branch snapped by high-velocity squall',
    root_cause_evidence_ids: [],
    ai_classification_metadata: { confidence: 0.98, model: 'gemini-3.8-flash' },
    is_synthetic: true,
    created_at: new Date(Date.now() - 4800000).toISOString()
  }
];

// ================= 4. HOTSPOTS (NEW DELHI) =================
export const MOCK_HOTSPOTS: Hotspot[] = [
  {
    id: 'HOT-DEL-01',
    name: 'Connaught Place Urban Node',
    zone_name: 'Central Zone',
    center_latitude: 28.6315,
    center_longitude: 77.2167,
    radius_meters: 450,
    incident_count: 18,
    category: 'POTHOLE_ROAD_DAMAGE',
    severity_level: 'CRITICAL',
    incident_ids: ['INC-2026-001'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    last_activity_at: new Date().toISOString()
  },
  {
    id: 'HOT-DEL-02',
    name: 'Karol Bagh Commercial Drainage Sector',
    zone_name: 'West Zone',
    center_latitude: 28.6514,
    center_longitude: 77.1907,
    radius_meters: 600,
    incident_count: 14,
    category: 'SEWAGE_OVERFLOW',
    severity_level: 'HIGH',
    incident_ids: ['INC-2026-002', 'INC-2026-008'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_activity_at: new Date().toISOString()
  },
  {
    id: 'HOT-DEL-03',
    name: 'Nehru Place IT Corridor',
    zone_name: 'South-East Zone',
    center_latitude: 28.5492,
    center_longitude: 77.2528,
    radius_meters: 500,
    incident_count: 11,
    category: 'WATER_PIPE_LEAK',
    severity_level: 'HIGH',
    incident_ids: ['INC-2026-003'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    last_activity_at: new Date().toISOString()
  },
  {
    id: 'HOT-DEL-04',
    name: 'Hauz Khas Heritage & Transit Sector',
    zone_name: 'South Zone',
    center_latitude: 28.5494,
    center_longitude: 77.2001,
    radius_meters: 400,
    incident_count: 9,
    category: 'GARBAGE_DUMP',
    severity_level: 'MEDIUM',
    incident_ids: ['INC-2026-004'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    last_activity_at: new Date().toISOString()
  }
];

// ================= 5. AUDIT EVENTS =================
export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-01',
    incident_id: 'INC-2026-001',
    event_type: 'INCIDENT_CREATED',
    action: 'CITIZEN_REPORT_INTAKE',
    reason: 'Case logged via citizen GPS mobile report. AI triage classified as POTHOLE_ROAD_DAMAGE.',
    actor: 'CITIZEN_REPORTER',
    structured_metadata: { tracking_id: 'REP-DEL-001', geofence: 'Connaught Place' },
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'EVT-02',
    incident_id: 'INC-2026-001',
    event_type: 'DEPARTMENT_ASSIGNED',
    action: 'AUTO_TRIAGE_DISPATCH',
    reason: 'Auto-routed to Roads & Public Works Department (Delhi PWD). SLA timer set to 8.0h.',
    actor: 'AUTONOMOUS_TRIAGE_ENGINE',
    structured_metadata: { department_id: 'DEP-ROADS', sla_hours: 8 },
    timestamp: new Date(Date.now() - 7000000).toISOString()
  },
  {
    id: 'EVT-03',
    incident_id: 'INC-2026-001',
    event_type: 'CONTRACTOR_DISPATCHED',
    action: 'WORK_ORDER_ISSUANCE',
    reason: 'Work order issued to Apex Road Infrastructure Ltd. Rapid repair crew dispatched.',
    actor: 'PWD_DISPATCHER',
    structured_metadata: { contractor: 'Apex Road Infrastructure Ltd' },
    timestamp: new Date(Date.now() - 5400000).toISOString()
  },
  {
    id: 'EVT-04',
    incident_id: 'INC-2026-004',
    event_type: 'CLOSURE_SUBMITTED',
    action: 'EVIDENCE_SUBMISSION',
    reason: 'Contractor uploaded post-cleanup visual evidence photo. Geofence verification passed.',
    actor: 'FIELD_SUPERVISOR',
    structured_metadata: { photo_sha256: 'a9f24c810e7b23...' },
    timestamp: new Date(Date.now() - 1800000).toISOString()
  }
];

// ================= 6. CONTRACTORS & PERFORMANCE (NEW DELHI) =================
export const MOCK_CONTRACTORS: ContractorItem[] = [
  {
    id: 'CON-DEL-PWD-01',
    name: 'Apex Road Infrastructure Ltd',
    agency_type: 'Empanelled Municipal Contractor',
    contact_person: 'Rajesh Singhania',
    email: 'rajesh@apexroads.in',
    phone: '+91 98110 44210',
    license_no: 'DL-MCD-ROAD-2022-881',
    trust_score: 92,
    active_contracts_count: 2,
    is_active: true,
    confirmed_penalties: 25000,
    confirmed_bonuses: 50000,
    assessments_count: 3,
    created_at: new Date(Date.now() - 86400000 * 180).toISOString()
  },
  {
    id: 'CON-DEL-DJB-01',
    name: 'Jal Hydro Utilities & Pipelines',
    agency_type: 'Empanelled Municipal Contractor',
    contact_person: 'Sunita Verma',
    email: 'verma@jalhydro.co.in',
    phone: '+91 98712 33411',
    license_no: 'DL-DJB-HYD-2021-409',
    trust_score: 86,
    active_contracts_count: 1,
    is_active: true,
    confirmed_penalties: 15000,
    confirmed_bonuses: 20000,
    assessments_count: 2,
    created_at: new Date(Date.now() - 86400000 * 210).toISOString()
  },
  {
    id: 'CON-DEL-MCD-01',
    name: 'CleanCity Waste Management Corp',
    agency_type: 'Public-Private Partnership',
    contact_person: 'Manish Tiwari',
    email: 'm.tiwari@cleancityindia.org',
    phone: '+91 99100 88234',
    license_no: 'DL-MCD-SWM-2023-112',
    trust_score: 95,
    active_contracts_count: 2,
    is_active: true,
    confirmed_penalties: 0,
    confirmed_bonuses: 75000,
    assessments_count: 4,
    created_at: new Date(Date.now() - 86400000 * 120).toISOString()
  },
  {
    id: 'CON-DEL-BRPL-01',
    name: 'BrightGrid Municipal Power Solutions',
    agency_type: 'Empanelled Contractor',
    contact_person: 'Harish Chopra',
    email: 'h.chopra@brightgrid.in',
    phone: '+91 98102 77123',
    license_no: 'DL-DISCOM-STLT-2020-044',
    trust_score: 89,
    active_contracts_count: 1,
    is_active: true,
    confirmed_penalties: 8000,
    confirmed_bonuses: 30000,
    assessments_count: 2,
    created_at: new Date(Date.now() - 86400000 * 150).toISOString()
  }
];

export const MOCK_CONTRACTOR_ASSESSMENTS: PerformanceAssessmentItem[] = [
  {
    id: 'ASM-DEL-01',
    contractor_id: 'CON-DEL-PWD-01',
    contractor_name: 'Apex Road Infrastructure Ltd',
    contract_id: 'CNT-PWD-2025-01',
    incident_id: 'INC-2026-001',
    assessment_type: 'PENALTY_RECOMMENDATION',
    clause_reference: 'Clause 4.1: ₹500/hr breach penalty for unaddressed high-priority potholes beyond 24h',
    breach_duration_hours: 14,
    recommended_amount: 7000,
    final_amount: 7000,
    status: 'DETECTED',
    evidence_summary: 'Automated telemetry recorded 38 hours elapsed time on high-traffic Connaught Place arterial road against 24-hour contractual SLA guarantee.',
    official_decision_notes: 'Under review by PWD Executive Engineer. Initial penalty calculated.',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'ASM-DEL-02',
    contractor_id: 'CON-DEL-DJB-01',
    contractor_name: 'Jal Hydro Utilities & Pipelines',
    contract_id: 'CNT-DJB-2025-01',
    incident_id: 'INC-2026-003',
    assessment_type: 'PENALTY_RECOMMENDATION',
    clause_reference: 'Clause 8.3: Verification failure triggers mandatory re-excavation with penalty deduction',
    breach_duration_hours: 0,
    recommended_amount: 10000,
    final_amount: 10000,
    status: 'OFFICIAL_APPROVAL',
    evidence_summary: 'Failed geofence closure: Post-repair photo uploaded from 180m away from Nehru Place water main valve. Re-inspection ordered.',
    contractor_response: 'GPS drift occurred inside commercial underground parking basement. Field supervisor dispatched with manual log.',
    official_decision_notes: 'Contractor explanation rejected; photo metadata clearly captured adjacent commercial plaza, not pipeline trench.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'ASM-DEL-03',
    contractor_id: 'CON-DEL-MCD-01',
    contractor_name: 'CleanCity Waste Management Corp',
    contract_id: 'CNT-MCD-2025-01',
    incident_id: 'INC-2026-004',
    assessment_type: 'BONUS_RECOMMENDATION',
    clause_reference: 'Clause 2.4: Expedited sanitation incentive bonus for zero-overflow compliance',
    breach_duration_hours: 0,
    recommended_amount: 15000,
    final_amount: 15000,
    status: 'RECONCILED',
    evidence_summary: '100% on-time clearance achieved across all 12 commercial dhalaos in Hauz Khas Heritage ward during festive weekend.',
    official_decision_notes: 'Confirmed and reconciled by Municipal Finance Officer. Credited in monthly billing settlement.',
    approved_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

// ================= 7. WHISTLEBLOWER CASES (NEW DELHI) =================
export const MOCK_WHISTLEBLOWER_CASES: WhistleblowerCaseItem[] = [
  {
    id: 'WB-8F92-4C10',
    title: 'Substandard bitumen binder ratio on South Delhi arterial resurfacing',
    allegation_category: 'SUBSTANDARD_WORKS',
    ward_id: 'WARD-44',
    ward_name: 'Hauz Khas Heritage & Urban Ward',
    suspect_organization: 'Apex Road Infrastructure Ltd',
    status: 'UNDER_REVIEW',
    verification_label: 'CORROBORATING_PHYSICAL_EVIDENCE',
    narrative_preview: 'Contractor deployed low-viscosity emulsion instead of VG-30 bitumen grade specified in tender document PWD/HQ/MAINT/2025/1108. Core samples show 30% binder deficiency.',
    attachments_count: 2,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'WB-3A19-9B21',
    title: 'Unauthorized commercial encroachment directly over stormwater trunk drain',
    allegation_category: 'ILLEGAL_CONSTRUCTION',
    ward_id: 'WARD-43',
    ward_name: 'Karol Bagh Commercial & Residential',
    suspect_organization: 'Private Builder Consortium',
    status: 'ACTION_RECOMMENDED',
    verification_label: 'VERIFIED_IRREGULARITY',
    narrative_preview: 'Three-story commercial storage shed erected over open municipal drain reserve without building sanction, causing monsoon backflow in Ward 43.',
    attachments_count: 3,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

export const MOCK_WHISTLEBLOWER_DETAIL = {
  id: 'WB-8F92-4C10',
  case_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0',
  allegation_category: 'SUBSTANDARD_WORKS',
  title: 'Substandard bitumen binder ratio on South Delhi arterial resurfacing',
  narrative: 'Contractor deployed low-viscosity emulsion instead of VG-30 bitumen grade specified in tender document PWD/HQ/MAINT/2025/1108. Core samples taken at night show 30% binder deficiency leading to surface raveling.',
  ward_id: 'WARD-44',
  ward_name: 'Hauz Khas Heritage & Urban Ward',
  suspect_organization: 'Apex Road Infrastructure Ltd',
  is_anonymous: true,
  contact_channel: 'proton-secure-handle@internal',
  status: 'UNDER_REVIEW',
  verification_label: 'CORROBORATING_PHYSICAL_EVIDENCE',
  investigation_outcome: 'Field audit team dispatched with portable pavement core drill on 2026-10-22. Lab density tests confirm bitumen binder deficiency. Statutory notice drafted.',
  created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  audit_logs: [
    {
      id: 'LOG-01',
      action: 'CASE_REGISTERED',
      details: 'Confidential encrypted dossier submitted via citizen whistleblower gateway.',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
    },
    {
      id: 'LOG-02',
      action: 'TRIAGE_COMPLETED',
      details: 'Ombudsman verified prima facie evidence and flagged for laboratory asphalt core testing.',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ]
};

// ================= 8. MUNICIPAL FUNDS & WARDS (NEW DELHI) =================
export const MOCK_MUNICIPAL_FUNDS: MunicipalFundsSummary = {
  financial_year: 'FY 2025-26',
  city: 'New Delhi',
  total_approved_budget: 685000000, // ₹68.5 Cr
  total_allocated_amount: 620000000,
  total_funds_released: 485000000,
  total_expenditure_recorded: 412000000,
  total_outstanding_commitments: 73000000,
  remaining_approved_balance: 200000000,
  overall_utilization_pct: 84.95,
  total_projects: 42,
  completed_projects: 24,
  delayed_projects: 3,
  in_progress_projects: 15,
  data_source: 'Delhi Municipal Corporation (MCD/NDMC) Fiscal Ledger & State Audit Registry',
  reporting_period: 'Q3 FY 2025-26',
  last_verified_at: new Date().toISOString(),
  is_synthetic_notice: 'Verified Fiscal Registry Synchronization'
};

export const MOCK_WARD_BUDGETS: WardBudgetItem[] = [
  {
    ward_id: 'WARD-42',
    ward_number: '42',
    ward_name: 'Connaught Place / Central Ward',
    zone: 'Central Zone',
    city: 'New Delhi',
    councillor_name: 'Smt. Sunita Sharma',
    population: 85000,
    approved_budget: 12500000,
    allocated_amount: 12000000,
    funds_released: 9500000,
    expenditure_recorded: 8200000,
    remaining_balance: 4300000,
    utilization_pct: 86.31,
    active_projects_count: 3,
    completed_projects_count: 5
  },
  {
    ward_id: 'WARD-43',
    ward_number: '43',
    ward_name: 'Karol Bagh Commercial & Residential',
    zone: 'West Zone',
    city: 'New Delhi',
    councillor_name: 'Shri Rajesh Verma',
    population: 125000,
    approved_budget: 14000000,
    allocated_amount: 13500000,
    funds_released: 11000000,
    expenditure_recorded: 9800000,
    remaining_balance: 4200000,
    utilization_pct: 89.09,
    active_projects_count: 4,
    completed_projects_count: 6
  },
  {
    ward_id: 'WARD-44',
    ward_number: '44',
    ward_name: 'Hauz Khas Heritage & Urban Ward',
    zone: 'South Zone',
    city: 'New Delhi',
    councillor_name: 'Dr. Meenakshi Lekhi',
    population: 98000,
    approved_budget: 16500000,
    allocated_amount: 15000000,
    funds_released: 12000000,
    expenditure_recorded: 10400000,
    remaining_balance: 6100000,
    utilization_pct: 86.67,
    active_projects_count: 3,
    completed_projects_count: 4
  },
  {
    ward_id: 'WARD-45',
    ward_number: '45',
    ward_name: 'Civil Lines / University Enclave',
    zone: 'North Zone',
    city: 'New Delhi',
    councillor_name: 'Shri Amit Goel',
    population: 110000,
    approved_budget: 11500000,
    allocated_amount: 10500000,
    funds_released: 8500000,
    expenditure_recorded: 7200000,
    remaining_balance: 4300000,
    utilization_pct: 84.71,
    active_projects_count: 2,
    completed_projects_count: 5
  },
  {
    ward_id: 'WARD-46',
    ward_number: '46',
    ward_name: 'Nehru Place Commercial Hub & Kalkaji',
    zone: 'South-East Zone',
    city: 'New Delhi',
    councillor_name: 'Smt. Priyanka Gupta',
    population: 105000,
    approved_budget: 15000000,
    allocated_amount: 14000000,
    funds_released: 11500000,
    expenditure_recorded: 9900000,
    remaining_balance: 5100000,
    utilization_pct: 86.09,
    active_projects_count: 3,
    completed_projects_count: 4
  }
];

export const MOCK_PROJECTS: MunicipalProject[] = [
  {
    id: 'PRJ-DEL-01',
    ward_id: 'WARD-42',
    ward_number: '42',
    ward_name: 'Connaught Place / Central Ward',
    department_id: 'DEP-ROADS',
    title: 'Connaught Place Radial Roads Asphalt Milling & Resurfacing',
    description: 'Complete cold-planing of worn asphalt layer and application of 50mm dense bituminous macadam with tactile curb paving.',
    category: 'ROAD_WORKS',
    sanctioned_amount: 18500000,
    expenditure_to_date: 12200000,
    contractor_name: 'Apex Road Infrastructure Ltd',
    tender_reference: 'DEL-PWD-W42-RD01',
    status: 'IN_PROGRESS',
    progress_pct: 65.0,
    milestones: [],
    start_date: new Date(Date.now() - 86400000 * 45).toISOString(),
    expected_completion_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    financial_year: 'FY 2025-26',
    is_synthetic: true
  },
  {
    id: 'PRJ-DEL-02',
    ward_id: 'WARD-43',
    ward_number: '43',
    ward_name: 'Karol Bagh Commercial & Residential',
    department_id: 'DEP-WATER',
    title: 'Karol Bagh Market Stormwater Trunk Drain Desilting & Culvert Upgrade',
    description: 'Mechanical desilting of 4.2km trunk storm sewer and replacement of cracked concrete cover slabs.',
    category: 'DRAINAGE',
    sanctioned_amount: 14000000,
    expenditure_to_date: 9500000,
    contractor_name: 'Jal Hydro Utilities & Pipelines',
    tender_reference: 'DEL-DJB-W43-DR02',
    status: 'IN_PROGRESS',
    progress_pct: 78.0,
    milestones: [],
    start_date: new Date(Date.now() - 86400000 * 60).toISOString(),
    expected_completion_date: new Date(Date.now() + 86400000 * 20).toISOString(),
    financial_year: 'FY 2025-26',
    is_synthetic: true
  }
];

// ================= 9. COMMUNITY PROPOSALS (NEW DELHI) =================
export const MOCK_PROPOSALS: CommunityProposalItem[] = [
  {
    id: 'PROP-DEL-01',
    ward_id: 'WARD-42',
    ward_number: '42',
    ward_name: 'Connaught Place / Central Ward',
    title: 'Installation of Solar-Powered Smart LED Streetlights with Security Mesh',
    description: 'Replace obsolete sodium vapor lamps across radial lanes with energy-efficient solar smart lights featuring automated twilight dimming.',
    category: 'CIVIC_INFRASTRUCTURE',
    estimated_cost: 1450000,
    financial_year: 'FY 2025-26',
    expected_public_benefit: 'Improves nighttime pedestrian safety and reduces municipal electricity consumption by 42%.',
    submitted_by_type: 'CITIZEN',
    total_votes_count: 382,
    status: 'ACTIVE_VOTING',
    options: [
      { id: 'OPT-1', title: 'Support Project & Allocate Ward Funds', votes_count: 350 },
      { id: 'OPT-2', title: 'Oppose Project', votes_count: 32 }
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'PROP-DEL-02',
    ward_id: 'WARD-44',
    ward_number: '44',
    ward_name: 'Hauz Khas Heritage & Urban Ward',
    title: 'Permeable Bio-Swale Corridor & Monsoon Runoff Retention',
    description: 'Construct natural roadside bio-swales along Deer Park perimeter to absorb road runoff and recharge Delhi groundwater aquifer.',
    category: 'WATER_CONSERVATION',
    estimated_cost: 2800000,
    financial_year: 'FY 2025-26',
    expected_public_benefit: 'Harvests 95,000 litres of rainwater per storm, eliminating chronic waterlogging at village entrance.',
    submitted_by_type: 'CITIZEN',
    total_votes_count: 512,
    status: 'ACTIVE_VOTING',
    options: [
      { id: 'OPT-1', title: 'Approve Bio-Swale Implementation', votes_count: 480 },
      { id: 'OPT-2', title: 'Defer for Engineering Review', votes_count: 32 }
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

// ================= 10. REWARDS & LEADERBOARD (NEW DELHI) =================
export const MOCK_REWARDS: RewardCatalogItem[] = [
  {
    id: 'REW-DEL-01',
    title: 'Delhi Metro Smart Card Pass (₹250 Travel Credit)',
    description: 'Direct metro balance top-up valid across all DMRC Yellow, Blue, Violet and Airport Express lines.',
    category: 'PUBLIC_TRANSIT',
    credits_cost: 250,
    is_partner_verified: true,
    partner_name: 'Delhi Metro Rail Corporation (DMRC)',
    terms_summary: 'Valid for 90 days across the entire Delhi NCR metro transit network.'
  },
  {
    id: 'REW-DEL-02',
    title: 'Municipal Property Tax Rebate Voucher (₹500)',
    description: 'Direct rebate voucher applicable towards online annual property tax assessment.',
    category: 'TAX_REBATE',
    credits_cost: 500,
    is_partner_verified: true,
    partner_name: 'Municipal Corporation of Delhi (MCD Revenue Dept)',
    terms_summary: 'Apply directly during online property tax assessment filing.'
  },
  {
    id: 'REW-DEL-03',
    title: 'Delhi Urban Green Canopy Tree Planting Certificate',
    description: 'Native neem, amaltas, or peepal tree planted in Delhi Ridge Park with GPS coordinates and plaque.',
    category: 'ECO_INITIATIVE',
    credits_cost: 150,
    is_partner_verified: true,
    partner_name: 'Delhi Parks & Gardens Society',
    terms_summary: 'Includes digital geo-tagged photo certificate with latitude/longitude coordinates.'
  }
];

export const MOCK_LEADERBOARD: LeaderboardRankItem[] = [
  {
    rank: 1,
    display_name: 'Aarav Sharma',
    ward_name: 'Connaught Place / Central Ward',
    ward_number: '42',
    total_earned_credits: 1420,
    badge_tier: 'PLATINUM_GUARDIAN'
  },
  {
    rank: 2,
    display_name: 'Priya Malhotra',
    ward_name: 'Hauz Khas Heritage & Urban Ward',
    ward_number: '44',
    total_earned_credits: 1180,
    badge_tier: 'GOLD_CIVIC_HERO'
  },
  {
    rank: 3,
    display_name: 'Rajesh Goel',
    ward_name: 'Karol Bagh Commercial',
    ward_number: '43',
    total_earned_credits: 950,
    badge_tier: 'GOLD_CIVIC_HERO'
  },
  {
    rank: 4,
    display_name: 'Sunita Rao',
    ward_name: 'Civil Lines University Enclave',
    ward_number: '45',
    total_earned_credits: 820,
    badge_tier: 'SILVER_CONTRIBUTOR'
  }
];

// ================= 11. EMERGENCY RESOURCES (NEW DELHI) =================
export const MOCK_EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    id: 'EMERG-DEL-01',
    name: 'National Emergency Response Support System (ERSS)',
    category: 'GENERAL',
    phone_number: '112',
    alternate_phone: '100',
    jurisdiction: 'National & Delhi NCR Central Control',
    available_hours: '24/7/365',
    source_url: 'https://112.gov.in',
    last_verified_at: new Date().toISOString(),
    verification_status: 'OFFICIAL_GOVERNMENT_HOTLINE',
    description: 'Integrated unified emergency service for immediate police, fire, ambulance, and disaster dispatch.',
    address: 'Police Headquarters, Jai Singh Road, New Delhi 110001',
    latitude: 28.6270,
    longitude: 77.2180,
    is_active: true
  },
  {
    id: 'EMERG-DEL-02',
    name: 'Delhi Police Barakhamba Road Police Station',
    category: 'POLICE',
    phone_number: '+91 11 2341 2235',
    alternate_phone: '112',
    jurisdiction: 'New Delhi District (Connaught Place & Mandi House)',
    available_hours: '24/7 All Days',
    source_url: 'https://delhipolice.gov.in',
    last_verified_at: new Date().toISOString(),
    verification_status: 'OFFICIAL_GOVERNMENT_HOTLINE',
    description: 'Local primary police station with dedicated mobile patrol vans (PCR).',
    address: 'Barakhamba Road, Near Statesman House, New Delhi 110001',
    latitude: 28.6300,
    longitude: 77.2250,
    is_active: true
  },
  {
    id: 'EMERG-DEL-03',
    name: 'Dr. Ram Manohar Lohia (RML) Hospital Trauma Center',
    category: 'AMBULANCE',
    phone_number: '+91 11 2336 5525',
    alternate_phone: '102',
    jurisdiction: 'Central & New Delhi Zone',
    available_hours: '24/7 Emergency Casualty',
    source_url: 'https://rmlh.nic.in',
    last_verified_at: new Date().toISOString(),
    verification_status: 'OFFICIAL_GOVERNMENT_HOTLINE',
    description: 'Level-1 Central Government trauma center with 24-hour surgical triage and cardiac ICU.',
    address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi 110001',
    latitude: 28.6240,
    longitude: 77.2020,
    is_active: true
  },
  {
    id: 'EMERG-DEL-04',
    name: 'Delhi Fire Service Headquarters',
    category: 'FIRE',
    phone_number: '101',
    alternate_phone: '+91 11 2341 4000',
    jurisdiction: 'Delhi State Operational Command',
    available_hours: '24/7 Immediate Response',
    source_url: 'https://dfs.delhigovt.nic.in',
    last_verified_at: new Date().toISOString(),
    verification_status: 'OFFICIAL_GOVERNMENT_HOTLINE',
    description: 'Central fire brigade dispatch with heavy hydraulic ladder units and hazmat containment.',
    address: 'Connaught Circus, Barakhamba, New Delhi 110001',
    latitude: 28.6330,
    longitude: 77.2200,
    is_active: true
  },
  {
    id: 'EMERG-DEL-05',
    name: 'AIIMS Jai Prakash Narayan Apex Trauma Centre',
    category: 'AMBULANCE',
    phone_number: '+91 11 2618 8000',
    alternate_phone: '108',
    jurisdiction: 'South Delhi & Regional Trauma Care',
    available_hours: '24/7 Super-Specialty',
    source_url: 'https://aiims.edu',
    last_verified_at: new Date().toISOString(),
    verification_status: 'OFFICIAL_GOVERNMENT_HOTLINE',
    description: 'Premier national level-1 trauma care facility with helipad and multi-organ critical resuscitation.',
    address: 'Chaudhary Jhandu Singh Marg, Raj Nagar, Safdarjung Enclave, New Delhi 110029',
    latitude: 28.5670,
    longitude: 77.2100,
    is_active: true
  }
];

// ================= 12. NEWS (NEW DELHI) =================
export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'NEWS-DEL-01',
    title: 'Delhi Municipal Council Approves ₹68 Cr Pre-Monsoon Drainage Modernization',
    summary: 'Council passes infrastructure package prioritizing 18 chronic waterlogging corridors across Connaught Place, Karol Bagh and Ring Road underpasses.',
    category: 'INFRASTRUCTURE',
    geographic_scope: 'CITY',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    is_live: true,
    source_name: 'Delhi Civic Gazette',
    source_url: 'https://mcdonline.nic.in/news/drainage-2026',
    published_at: new Date(Date.now() - 14400000).toISOString(),
    retrieved_at: new Date().toISOString(),
    ai_summary: 'CivicHelp AI Analysis: This initiative directly targets 3 active hotspots in Karol Bagh and Connaught Place. Citizens can track work orders on the Municipal Funds tab.',
    related_incident_count: 3
  },
  {
    id: 'NEWS-DEL-02',
    title: 'Delhi Health Advisory: Intensive Anti-Larval Measures in Stagnant Water Pockets',
    summary: 'Public health inspection squads begin automated drone and door-to-door spraying following intermittent pre-monsoon showers.',
    category: 'HEALTH_ADVISORY',
    geographic_scope: 'STATE',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    is_live: true,
    source_name: 'Delhi Department of Health',
    source_url: 'https://delhi.gov.in/health/bulletin-apr26',
    published_at: new Date(Date.now() - 36000000).toISOString(),
    retrieved_at: new Date().toISOString(),
    ai_summary: 'CivicHelp AI Analysis: Direct correlation with ongoing drain blockage reports. Reports classified under WATERLOGGING_FLOOD are now automatically prioritized.',
    related_incident_count: 2
  }
];

// ================= 13. OPERATIONAL FEED (NEW DELHI) =================
export const MOCK_OPERATIONAL_FEED = [
  {
    id: 'ALERT-DEL-01',
    severity: 'CRITICAL',
    event_type: 'OVERDUE_SLA',
    status: 'PENDING_ACTION',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    title: 'SLA Breach: Main Water Pipe Burst on Outer Ring Road',
    explanation: 'Incident #INC-2026-003 exceeded the 4-hour critical resolution window near Nehru Place. Soil erosion risk elevated.',
    tracking_id: 'REP-DEL-003',
    department_id: 'DEP-WATER',
    ward_id: 'WARD-46',
    data_origin: 'Automated Telemetry Engine',
    action_url: '/government/incidents/INC-2026-003'
  },
  {
    id: 'ALERT-DEL-02',
    severity: 'HIGH',
    event_type: 'FAILED_CLOSURE',
    status: 'PENDING_ACTION',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    title: 'Closure Rejected: PWD Repair Photo Deviation > 50m',
    explanation: 'Contractor uploaded post-repair proof from 142m away from Lajpat Nagar Ring Road coordinates. Auto-reopened.',
    tracking_id: 'REP-DEL-006',
    department_id: 'DEP-ROADS',
    ward_id: 'WARD-44',
    data_origin: 'Cryptographic Geofence Audit',
    action_url: '/government/verification'
  },
  {
    id: 'ALERT-DEL-03',
    severity: 'HIGH',
    event_type: 'SPATIAL_HOTSPOT',
    status: 'PENDING_ACTION',
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    title: 'Cluster Alert: 18 Incidents in Connaught Place Urban Node',
    explanation: 'Density threshold exceeded within 450m radius. PWD rapid cold-mix asphalt crew dispatch recommended.',
    tracking_id: 'HOT-DEL-01',
    department_id: 'DEP-ROADS',
    ward_id: 'WARD-42',
    data_origin: 'Spatial Hotspot Classifier',
    action_url: '/government/hotspots'
  },
  {
    id: 'ALERT-DEL-04',
    severity: 'MEDIUM',
    event_type: 'SLA_APPROACHING',
    status: 'PENDING_ACTION',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    title: 'SLA Expiring in 2h: 4 Broken Streetlights on Arya Samaj Road',
    explanation: 'Incident #INC-2026-002 assigned to BSES/NDMC Power is at 80% SLA elapsed time.',
    tracking_id: 'REP-DEL-002',
    department_id: 'DEP-LIGHTS',
    ward_id: 'WARD-43',
    data_origin: 'SLA Monitoring Worker',
    action_url: '/government/incidents/INC-2026-002'
  }
];

// ================= 14. INTELLIGENCE (RECURRING, ROOT CAUSES, ESCALATIONS) =================
export const MOCK_RECURRING: RecurringIncident[] = [
  {
    incident_id: 'INC-2026-001',
    tracking_id: 'REP-DEL-001',
    title: 'Severe crater on Radial Road 3 near Barakhamba',
    category: 'POTHOLE_ROAD_DAMAGE',
    priority: 4,
    status: 'IN_PROGRESS',
    location_description: 'Connaught Place Radial Road 3',
    latitude: 28.6315,
    longitude: 77.2167,
    reopen_count: 2,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    prior_incident_ids: ['INC-PREV-8812', 'INC-PREV-9014']
  },
  {
    incident_id: 'INC-2026-008',
    tracking_id: 'REP-DEL-008',
    title: 'Choked underground sewer line backflowing onto public footpath',
    category: 'SEWAGE_OVERFLOW',
    priority: 4,
    status: 'IN_PROGRESS',
    location_description: 'Chandni Chowk Main Heritage Promenade',
    latitude: 28.6562,
    longitude: 77.2300,
    reopen_count: 3,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    prior_incident_ids: ['INC-PREV-7711', 'INC-PREV-8142']
  }
];

export const MOCK_ROOT_CAUSES: RootCauseHypothesis[] = [
  {
    hypothesis: 'Sub-surface water pipe seepage eroding granular asphalt road base in Connaught Place Radial Corridor',
    supporting_incident_ids: ['INC-2026-001', 'INC-PREV-8812'],
    categories: ['POTHOLE_ROAD_DAMAGE', 'WATER_PIPE_LEAK'],
    incident_count: 5,
    cluster_center: { lat: 28.6315, lon: 77.2167 },
    confidence: 'HIGH_CORRELATION',
    criteria: 'Repeated asphalt failure directly atop aged cast iron water distribution pipe line',
    disclaimer: 'Generated by Autonomous Incident Intelligence Mesh'
  },
  {
    hypothesis: 'Pre-monsoon silt accumulation and solid waste clogging in Karol Bagh market culvert',
    supporting_incident_ids: ['INC-2026-002', 'INC-2026-008'],
    categories: ['SEWAGE_OVERFLOW', 'WATERLOGGING_FLOOD'],
    incident_count: 8,
    cluster_center: { lat: 28.6514, lon: 77.1907 },
    confidence: 'HIGH_CORRELATION',
    criteria: 'Silt depth exceeds 60% of pipe diameter during dry season',
    disclaimer: 'Generated by Autonomous Incident Intelligence Mesh'
  }
];

export const MOCK_ESCALATIONS: EscalationRecord[] = [
  {
    id: 'ESC-DEL-01',
    incident_id: 'INC-2026-006',
    tier: 1,
    tier_name: 'TIER_1_SUPERVISOR',
    authority_title: 'PWD Executive Engineer (South Zone)',
    reason: 'Geofence deviation failure on closure submission. Auto-reopened and escalated.',
    triggered_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_at: null
  },
  {
    id: 'ESC-DEL-02',
    incident_id: 'INC-2026-003',
    tier: 2,
    tier_name: 'TIER_2_DEPARTMENT_HEAD',
    authority_title: 'Chief Engineer (Delhi Jal Board)',
    reason: 'Critical potable water supply main pipe breach exceeded 4h SLA window.',
    triggered_at: new Date(Date.now() - 1800000).toISOString(),
    resolved_at: null
  }
];

export const MOCK_UNCONFIRMED_REPORTS = [
  {
    id: 'REP-DEL-011',
    tracking_id: 'REP-DEL-011',
    incident_id: 'INC-2026-011',
    text: 'Water accumulation observed under AIIMS underpass during commute. Pavement starting to submerge.',
    language: 'en',
    category: 'WATERLOGGING_FLOOD',
    location_mode: 'UNCONFIRMED',
    location_status: 'LOCATION_UNCONFIRMED',
    latitude: 28.5672,
    longitude: 77.2100,
    address: 'Near AIIMS Emergency Gate Underpass, Ring Road, New Delhi 110029',
    observation_time: 'Evening commute (Approx 18:30)',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_synthetic: true
  }
];
