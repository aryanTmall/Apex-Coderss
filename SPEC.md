# CivicHelp — Architectural Specification (SPEC)

> **Source of Truth:** Never rename APIs, database columns, or payload structures without updating this document.

---

## 1. Primary Goal & Problem Statement
Smart Cities & Civic Issue Management: **“From Citizen Reports to Verified Resolution”**.
The complete automated operational loop:
`Report Intake` &rarr; `Classification & Severity` &rarr; `Multi-Factor Duplicate Linking` &rarr; `Department Routing` &rarr; `SLA Monitoring` &rarr; `5-Point Autonomous Closure Verification` &rarr; `Autonomous Reopen & Governance Escalation` &rarr; `Tamper-Evident SHA-256 Audit Chain`.

---

## 2. Visual System & Portal Segregation

### Public Citizen Portal (`/public` & `/`)
- **Landing Narrative:** Three.js 3D nocturnal city instanced mesh with dynamic camera and interactive nodes.
- **Citizen Hub (`/public`):**
  - Instant tracking input, 4 quick services (Report, Emergency, News, Track), real-time operational stats.
  - **City-Wide Geospatial Issue Map:** Interactive Leaflet map with `leaflet.markercluster`, centralized category colors, color-blind shapes, clickable details side drawer, and unlocated reports tab.
  - **Public Intelligence Feed:** Embedded directly inside Citizen Hub with 5 geographic tiers (`Around Me`, `City`, `State`, `National`, `Global`), search, topic filters, AI civic impact summaries, and links to matching complaints on the map.
  - **Nearest Emergency Services & Live Dispatch ETA:** Live road routing ETA via OSRM to verified police, fire, trauma medical, and disaster stations.
- **Dedicated Emergency Hub (`/emergency`):** Verified hotline directory (112, 100, 101, 108, 1091, etc.) plus nearest station routing ETA.
- **Downloadable PDF Summaries:** Official municipal vector PDF summary with SHA-256 integrity stamp available on `/app/report` and `/app/track`.

### Government Operations Portal (`/government/login` & `/government/*`)
- **Authentication:** PBKDF2-HMAC-SHA256 password hashing (100,000 rounds) + JWT Bearer tokens with 8-hour expiry.
- **Role-Based Access Control (RBAC):**
  - `ADMIN`: Full system configuration, demo datasets, escalation overrides.
  - `REVIEWER`: Incident triage, unconfirmed location corroboration, manual duplicate reviews.
  - `OPERATOR`: Department assignments, contractor closure reviews.
  - `FIELD_OFFICER`: Field task status updates.
- **Theme:** "Nocturne Operations" dark mode (#0B0F17 background, slate cards, emerald/teal verified, amber SLA warning, rose breach/rejected, indigo AI copilot).

---

## 3. Hard Architectural Rules

1. **Deterministic State Machine:** Status transitions, SLA deadlines, priority recalculations, and closure verdicts are controlled strictly by deterministic code, never arbitrary LLM outputs.
2. **Atomic Recovery:** Every closure rejection executes in a single database transaction: transitions to `REOPENED`, increments priority (`+1`, capped at 5), advances governance escalation tier, recalculates SLA deadline from `SimClock`, deducts contractor trust score (-15%), and appends an immutable audit event.
3. **Simulated Clock (`SimClock`):** All SLA computations, timeouts, and time travel rely on `SimClock` for reproducible automated testing.
4. **Data Isolation:** All synthetic demo records are strictly tagged with `is_demo=True` and `dataset="DEMO"`, allowing 1-click generation (450 records) and 1-click purge without touching live citizen submissions.
5. **Zero Secret Leakage:** Gemini API keys, JWT signing secrets, and admin passwords remain exclusively server-side.
6. **Reportlab PDF Typography:** Server-side PDF generation is deterministic, styled with municipal headers and footers, and embeds report SHA-256 hashes.
7. **Tamper-Evident Audit Chaining:** Every `AuditEvent` includes an `event_hash` computed over `incident_id + timestamp + action + previous_hash`, guaranteeing an unbroken blockchain-style audit log.
8. **Routing & Dispatch ETA Integrity:** Road distances and estimated arrival times are calculated via real OSRM routing. If unavailable, straight-line distance is explicitly marked with "Live ETA unavailable"; ETAs are never fabricated.

---

## 4. Statuses & Legal Transitions

- **Statuses:** `NEW`, `ASSIGNED`, `IN_PROGRESS`, `CLOSURE_SUBMITTED`, `RESOLVED`, `REOPENED`, `NEEDS_REVIEW`, `ESCALATED`.
- **Allowed Transitions:**
  - `NEW` &rarr; `ASSIGNED` | `NEEDS_REVIEW`
  - `ASSIGNED` &rarr; `IN_PROGRESS` | `CLOSURE_SUBMITTED` | `ESCALATED` | `NEEDS_REVIEW`
  - `IN_PROGRESS` &rarr; `CLOSURE_SUBMITTED` | `ESCALATED` | `NEEDS_REVIEW`
  - `CLOSURE_SUBMITTED` &rarr; `RESOLVED` | `REOPENED` | `NEEDS_REVIEW`
  - `RESOLVED` &rarr; `REOPENED` (only via contradicting report or supervisor review)
  - `REOPENED` &rarr; `ASSIGNED` | `ESCALATED` | `NEEDS_REVIEW`
  - `NEEDS_REVIEW` &rarr; `RESOLVED` | `REOPENED` | `ASSIGNED`
  - `ESCALATED` &rarr; `ASSIGNED` | `IN_PROGRESS` | `CLOSURE_SUBMITTED` | `NEEDS_REVIEW`

- **Governance Escalation Tiers:**
  - `Tier 0`: Routine Department Handling
  - `Tier 1`: Field Supervisor Escalation (triggered on SLA breach or first reopen)
  - `Tier 2`: Ward Authority Escalation (triggered on repeated reopen or >48h SLA breach)
  - `Tier 3`: City Commissioner Escalation (critical institutional asset hazard / 3x reopen)

---

## 5. Database Entities

- **User:** `id`, `email`, `hashed_password`, `salt`, `full_name`, `role`, `department_id?`, `is_active`, `created_at`, `last_login_at`
- **EmergencyResource:** `id`, `name`, `category`, `number`, `alternate_number?`, `description?`, `jurisdiction`, `is_active`, `priority_rank`, `verified_at`
- **EmergencyStation:** `id`, `name`, `service_type`, `address`, `latitude`, `longitude`, `phone_number`, `alternate_phone?`, `operating_status`, `status_verified`, `data_source`, `last_verified_at`, `capabilities`, `dispatch_integrated`, `is_active`
- **NewsArticle:** `id`, `title`, `summary`, `source_name`, `source_url?`, `published_at`, `retrieved_at`, `geographic_scope`, `city?`, `state?`, `country`, `category`, `is_live`, `cached_until?`
- **CitizenReport:** `id`, `tracking_id`, `text`, `language`, `category`, `custom_category?`, `location_mode`, `location_status`, `latitude?`, `longitude?`, `address?`, `approximate_locality?`, `observation_time?`, `photo_ref?`, `created_at`, `incident_id`, `is_demo`, `dataset`
- **Incident:** `id`, `tracking_id`, `title`, `category`, `custom_category?`, `priority`, `priority_reasons[]`, `status`, `location_mode`, `location_status`, `latitude?`, `longitude?`, `address?`, `approximate_locality?`, `department_id`, `created_at`, `assigned_at`, `sla_due_at`, `resolved_at`, `reopen_count`, `escalation_count`, `escalation_tier`, `reports_count`, `recurring_flag`, `hotspot_id?`, `is_demo`, `dataset`
- **Attachment:** `id`, `incident_id?`, `report_id?`, `storage_key`, `original_filename`, `mime_type`, `file_size`, `sha256_hash`, `uploaded_at`, `verified_at`, `verification_status`
- **ClosureSubmission:** `id`, `incident_id`, `description`, `photo_ref`, `latitude`, `longitude`, `submitted_at`, `verdict`, `verdict_reasons[]`, `individual_checks`
- **AuditEvent:** `id`, `incident_id`, `timestamp`, `actor`, `action`, `event_type`, `reason`, `from_status`, `to_status`, `structured_metadata`, `previous_hash`, `event_hash`
- **Department:** `id`, `name`, `supported_categories[]`, `available`, `fallback_department_id?`, `trust_score`, `spoofing_penalty_count`
- **Hotspot:** `id`, `name`, `category`, `zone_name`, `center_latitude`, `center_longitude`, `radius_meters`, `incident_count`, `severity_level`, `incident_ids[]`, `detected_at`, `is_active`

---

## 6. Complete API Surface (Prefix `/api`)

### Core Civic & Reports
- `POST /reports` — Ingests citizen report (supports PRECISE and UNCONFIRMED modes)
- `GET /reports` & `GET /reports/{id}` — Lists and retrieves citizen reports
- `GET /reports/{id}/summary.pdf` — Downloads official vector PDF summary
- `GET /track/{tracking_id}` — Citizen tracking telemetry (zero PII)
- `GET /track/{tracking_id}/summary.pdf` — Citizen tracking PDF download

### Incident Operations & Verification
- `GET /incidents` & `GET /incidents/{id}` — Incident list and full detail (supports category, status, priority, `has_coords`, search filters)
- `POST /incidents/{id}/closure` — Evaluates closure against 5 algorithmic checks
- `POST /incidents/{id}/review` — Supervisor override (`APPROVE`, `REOPEN`, `ASSIGN`)
- `GET /incidents/density` — Live 150m complaint density auto-escalation check

### Emergency Services & Dispatch Routing ETA
- `GET /emergency/services` — Verified hotlines (112, 100, 101, 108, etc.)
- `GET /emergency/stations` — Verified physical stations (Police, Fire, Medical, Disaster)
- `GET /emergency/nearest?lat=...&lon=...&type=...&limit=...` — Nearest stations with live road routing ETA via OSRM
- `GET /emergency/eta?lat=...&lon=...&station_id=...` — Specific station route calculation

### Public Intelligence
- `GET /news/articles` — 5-tier public intelligence feed (`Around Me`, `City`, `State`, `National`, `Global`) enriched with AI relevance and active incident links

### Government Authentication (RBAC)
- `POST /api/auth/login` — Authenticates government official, returns JWT
- `GET /api/auth/me` — Returns authenticated profile and permissions
- `POST /api/auth/logout` — Revokes session

### AI Copilot & Telemetry
- `POST /chat` — Gemini AI copilot with grounded RAG and local fallback
- `GET /chat/status` — Live AI provider health and active model

### Evidence & Cryptography
- `POST /attachments` — Multipart upload with real-time SHA-256 calculation
- `POST /attachments/{id}/verify` — Re-computes file hash on disk to confirm tamper-proof integrity

### Simulation & Demo Data
- `POST /simulation/seed-demo-450` — Generates 450 Delhi NCR incidents + 40 duplicates
- `POST /simulation/reset-demo-450` — Cleans demo records without touching live data
- `POST /simulation/bad-closure` — Triggers bad closure to demonstrate autonomous recovery
- `POST /simulation/advance-time` — Advances SimClock and triggers SLA escalation scanner
