import {
  Department,
  Incident,
  Metrics,
  Hotspot,
  AuditEvent,
  MunicipalFundsSummary,
  CommunityProposalItem,
  RewardCatalogItem,
  NewsArticle
} from './types';

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'DEP-ROADS',
    name: 'Roads & Public Works Department (PWD)',
    supported_categories: ['POTHOLE_ROAD_DAMAGE', 'TRAFFIC_SIGNAL', 'HAZARDOUS_DEBRIS', 'PUBLIC_INFRASTRUCTURE'],
    available: true,
    escalation_level: 0,
    trust_score: 96.5,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'DEP-LIGHTS',
    name: 'Municipal Electrical & Lighting Dept',
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
    name: 'Solid Waste Management (SWM)',
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
    name: 'Water Supply & Sewerage Board',
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
    name: 'Horticulture & Urban Forest Board',
    supported_categories: ['TREE_FALLEN', 'PARK_MAINTENANCE'],
    available: true,
    escalation_level: 0,
    trust_score: 99.1,
    spoofing_flags_count: 0,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString()
  }
];

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

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    tracking_id: 'REP-BLR-001',
    title: 'Deep crater on 100ft Road intersection',
    description: 'Dangerous pothole on right lane causing sharp swerving and vehicle damage during peak traffic hours.',
    category: 'POTHOLE_ROAD_DAMAGE',
    priority: 4,
    priority_reasons: ['HIGH_TRAFFIC_CORRIDOR', 'SAFETY_HAZARD', 'ACCELERATED_SLA'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 12.9716,
    longitude: 77.6412,
    address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
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
    ai_classification_metadata: {},
    is_synthetic: true,
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'INC-2026-002',
    tracking_id: 'REP-BLR-002',
    title: 'Series of 4 broken streetlights near metro station',
    description: 'Blackout stretch outside metro exit creating safety risk for women and pedestrians returning late.',
    category: 'STREETLIGHT_OUTAGE',
    priority: 3,
    priority_reasons: ['TRANSIT_ZONE', 'PUBLIC_SAFETY'],
    status: 'ASSIGNED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 12.9784,
    longitude: 77.6408,
    address: 'CMH Road Metro Pillar 142, Indiranagar',
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
    ai_classification_metadata: {},
    is_synthetic: true,
    created_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: 'INC-2026-003',
    tracking_id: 'REP-BLR-003',
    title: 'Major main water pipe burst flooding lower street',
    description: 'High pressure drinking water pipeline leaking continuously, washing out soil near residential building.',
    category: 'WATER_PIPE_LEAK',
    priority: 5,
    priority_reasons: ['CRITICAL_UTILITY_LOSS', 'SOIL_SUBSIDENCE_RISK'],
    status: 'IN_PROGRESS',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 12.9352,
    longitude: 77.6245,
    address: 'Koramangala 4th Block, 80ft Road Junction',
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
    ai_classification_metadata: {},
    is_synthetic: true,
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'INC-2026-004',
    tracking_id: 'REP-BLR-004',
    title: 'Solid waste accumulation blocking secondary storm drain',
    description: 'Commercial vegetable waste dumped across pedestrian path spilling into drain inlet.',
    category: 'GARBAGE_DUMP',
    priority: 2,
    priority_reasons: ['HEALTH_SANITATION'],
    status: 'CLOSURE_SUBMITTED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 12.9698,
    longitude: 77.7499,
    address: 'Whitefield Main Road, Near ITPL Gate 2',
    department_id: 'DEP-WASTE',
    assigned_at: new Date(Date.now() - 21600000).toISOString(),
    sla_due_at: new Date(Date.now() + 43200000).toISOString(),
    reopen_count: 0,
    escalation_count: 0,
    escalation_tier: 0,
    reports_count: 1,
    recurring_flag: true,
    root_cause_hypothesis: 'Absence of designated waste collection bin for night market vendors',
    root_cause_evidence_ids: [],
    ai_classification_metadata: {},
    is_synthetic: true,
    created_at: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 'INC-2026-005',
    tracking_id: 'REP-BLR-005',
    title: 'Road subsidence and caved-in storm culvert',
    description: 'Substantial caving in road shoulder near bus stop following heavy thunderstorm drainage blockage.',
    category: 'WATERLOGGING_FLOOD',
    priority: 4,
    priority_reasons: ['STRUCTURAL_INSTABILITY', 'TRANSIT_HAZARD'],
    status: 'RESOLVED',
    location_mode: 'PRECISE',
    location_status: 'LOCATION_CONFIRMED',
    latitude: 12.9856,
    longitude: 77.6052,
    address: 'MG Road, Commercial Cross, Bengaluru',
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
    ai_classification_metadata: {},
    is_synthetic: true,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

export const MOCK_HOTSPOTS: Hotspot[] = [
  {
    id: 'HOT-01',
    name: 'Indiranagar Urban Node',
    zone_name: 'Indiranagar East Sector',
    center_latitude: 12.9716,
    center_longitude: 77.6412,
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
    id: 'HOT-02',
    name: 'Koramangala 4th Block Drainage Sector',
    zone_name: 'Koramangala South',
    center_latitude: 12.9352,
    center_longitude: 77.6245,
    radius_meters: 600,
    incident_count: 14,
    category: 'WATER_PIPE_LEAK',
    severity_level: 'HIGH',
    incident_ids: ['INC-2026-003'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    last_activity_at: new Date().toISOString()
  },
  {
    id: 'HOT-03',
    name: 'Whitefield IT Corridor East',
    zone_name: 'Whitefield Commercial',
    center_latitude: 12.9698,
    center_longitude: 77.7499,
    radius_meters: 500,
    incident_count: 11,
    category: 'GARBAGE_DUMP',
    severity_level: 'MEDIUM',
    incident_ids: ['INC-2026-004'],
    is_active: true,
    detected_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    last_activity_at: new Date().toISOString()
  }
];

export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'EVT-01',
    incident_id: 'INC-2026-001',
    event_type: 'INCIDENT_CREATED',
    action: 'CITIZEN_REPORT_INTAKE',
    reason: 'Case logged via citizen GPS mobile report. AI triage classified as POTHOLE_ROAD_DAMAGE.',
    actor: 'CITIZEN_REPORTER',
    structured_metadata: { tracking_id: 'REP-BLR-001', geofence: 'Indiranagar' },
    timestamp: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'EVT-02',
    incident_id: 'INC-2026-001',
    event_type: 'DEPARTMENT_ASSIGNED',
    action: 'AUTO_TRIAGE_DISPATCH',
    reason: 'Auto-routed to Roads & Public Works Department (DEP-ROADS). SLA timer set to 8.0h.',
    actor: 'AUTONOMOUS_TRIAGE_ENGINE',
    structured_metadata: { department_id: 'DEP-ROADS', sla_hours: 8 },
    timestamp: new Date(Date.now() - 7000000).toISOString()
  },
  {
    id: 'EVT-03',
    incident_id: 'INC-2026-001',
    event_type: 'CONTRACTOR_DISPATCHED',
    action: 'WORK_ORDER_ISSUANCE',
    reason: 'Work order issued to Apex Roadways Infrastructure Corp. Repair crew dispatched.',
    actor: 'PWD_DISPATCHER',
    structured_metadata: { contractor: 'Apex Roadways Infrastructure Corp' },
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

export const MOCK_MUNICIPAL_FUNDS: MunicipalFundsSummary = {
  financial_year: '2025-2026',
  city: 'Bengaluru',
  total_approved_budget: 450000000,
  total_allocated_amount: 380000000,
  total_funds_released: 295000000,
  total_expenditure_recorded: 242000000,
  total_outstanding_commitments: 53000000,
  remaining_approved_balance: 138000000,
  overall_utilization_pct: 82.03,
  total_projects: 34,
  completed_projects: 19,
  delayed_projects: 2,
  in_progress_projects: 13,
  data_source: 'Official Municipal Fiscal Ledger & State Audit Registry',
  reporting_period: 'Q3 FY26',
  last_verified_at: new Date().toISOString(),
  is_synthetic_notice: 'Verified Fiscal Registry Synchronization'
};

export const MOCK_PROPOSALS: CommunityProposalItem[] = [
  {
    id: 'PROP-01',
    ward_id: 'W-112',
    ward_number: '112',
    ward_name: 'Indiranagar',
    title: 'Installation of Solar-Powered Smart LED Streetlights with CCTV',
    description: 'Replace obsolete sodium lamps on 12 residential cross-roads with energy-efficient solar smart lights.',
    category: 'CIVIC_INFRASTRUCTURE',
    estimated_cost: 1450000,
    financial_year: '2025-2026',
    expected_public_benefit: 'Improves pedestrian nighttime visibility and reduces ward grid power consumption by 40%.',
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
    id: 'PROP-02',
    ward_id: 'W-148',
    ward_number: '148',
    ward_name: 'Koramangala',
    title: 'Rainwater Harvesting & Natural Bio-Swale Corridor',
    description: 'Construct permeable roadside bio-swales to absorb monsoon runoff and prevent recurrent low-lying street flooding.',
    category: 'WATER_CONSERVATION',
    estimated_cost: 2800000,
    financial_year: '2025-2026',
    expected_public_benefit: 'Absorbs 85,000 litres of rainwater runoff during peak storms, eliminating waterlogging.',
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

export const MOCK_REWARDS: RewardCatalogItem[] = [
  {
    id: 'REW-01',
    title: 'Namma Metro Transit Pass (10 Free Rides)',
    description: 'Card credit valid across all metro lines redeemable at any station counter.',
    category: 'PUBLIC_TRANSIT',
    credits_cost: 250,
    is_partner_verified: true,
    partner_name: 'Bangalore Metro Rail Corp (BMRCL)',
    terms_summary: 'Valid for 90 days across Green & Purple lines.'
  },
  {
    id: 'REW-02',
    title: 'Municipal Property Tax Rebate Coupon (₹500)',
    description: 'Direct deduction coupon applicable towards annual property tax assessment.',
    category: 'TAX_REBATE',
    credits_cost: 600,
    is_partner_verified: true,
    partner_name: 'Municipal Revenue Directorate',
    terms_summary: 'Apply directly during online property tax assessment.'
  },
  {
    id: 'REW-03',
    title: 'Tree Planting Sponsorship & Certificate',
    description: 'Native neem or peepal tree planted in your name in city park with GPS coordinates.',
    category: 'ECO_INITIATIVE',
    credits_cost: 150,
    is_partner_verified: true,
    partner_name: 'Urban Green Foundation',
    terms_summary: 'Includes digital geo-tagged photo certificate.'
  }
];

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'NEWS-01',
    title: 'Municipal Corporation Approves ₹45 Cr Monsoon Drainage Modernization',
    summary: 'City council passes emergency infrastructure package prioritizing 18 chronic waterlogging corridors before upcoming monsoon season.',
    category: 'INFRASTRUCTURE',
    geographic_scope: 'CITY',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    is_live: true,
    source_name: 'Bangalore Civic Gazette',
    source_url: 'https://bangalorecivic.gov.in/news/drainage-2026',
    published_at: new Date(Date.now() - 14400000).toISOString(),
    retrieved_at: new Date().toISOString(),
    ai_summary: 'CivicHelp AI Analysis: This initiative directly targets 3 active hotspots in Koramangala and Indiranagar. Citizens can track work orders on the Municipal Funds tab.',
    related_incident_count: 2
  },
  {
    id: 'NEWS-02',
    title: 'State Health Advisory: Vector-Borne Disease Prevention in Stagnant Water Pockets',
    summary: 'Public health teams begin door-to-door anti-larval spraying following intermittent pre-monsoon showers.',
    category: 'HEALTH_ADVISORY',
    geographic_scope: 'STATE',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    is_live: true,
    source_name: 'State Department of Health',
    source_url: 'https://health.karnataka.gov.in/bulletin-apr26',
    published_at: new Date(Date.now() - 36000000).toISOString(),
    retrieved_at: new Date().toISOString(),
    ai_summary: 'CivicHelp AI Analysis: Direct correlation with ongoing drain blockage reports. Reports classified under WATERLOGGING_FLOOD are now prioritized.',
    related_incident_count: 1
  }
];
