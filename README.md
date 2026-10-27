# CivicHelp — Autonomous Civic Incident Intelligence Platform

> **Problem Statement:** “From Citizen Reports to Verified Resolution” — Smart Cities / Civic Issue Management  
> **Signature Differentiators:** Autonomous Recovery from Failed Resolution, Interactive Geolocated Marker Clustering, Shared Accessible Category Palette, Public Intelligence Feed inside Citizen Hub, Live Emergency Dispatch ETA via OSRM, Google Gemini AI Copilot, 450 Realistic Demo Records, Cryptographic PDF Reports, and Tamper-Evident SHA-256 Audit Chain.

---

## 1. System Overview

CivicHelp is an end-to-end operational platform engineered for smart city municipal governance. When citizens report civic issues (such as road hazards, water leaks, blocked drainage, streetlight failures, or garbage dumping), CivicHelp autonomously:

1. **Intakes & Classifies** via a 4-step wizard supporting 14 municipal categories and custom unlisted vectors.
2. **Offers Dual Reporting Modes:**
   - **`PRECISE` Mode:** Uber/Swiggy-style CartoDB dark map with address search, HTML5 GPS lock, animated center crosshair pin, live reverse-geocoding, and 150m complaint density auto-escalation detection.
   - **`UNCONFIRMED` Mode:** For citizens reporting after leaving the area; accepts approximate locality and observation time without fabricating false GPS coordinates, routing into an operator triage queue.
3. **Displays Every Reported Issue on an Interactive Clustered Map:**
   - **Marker Clustering:** Uses Leaflet MarkerCluster with tactile dark-theme glow badges to display hundreds of incidents smoothly without map clutter.
   - **Accessible Category Palette:** Centralized color coding (Orange for Roads, Yellow for Lights, Green for Waste, Blue for Water, Purple for Sewers, Cyan for Floods, Red for Traffic, Brown for Infrastructure, etc.) paired with distinct geometric shapes and interior SVG glyphs for color-blind accessibility.
   - **Clickable Details Drawer:** Instant popup and side panel displaying report tracking ID, category, status, priority, exact address, distance from user (via HTML5 GPS), SLA deadline, and 1-click turn-by-turn directions.
   - **Unlocated Reports Tab:** Separate list for reports without confirmed GPS coordinates. Never fabricates coordinates.
4. **Features Public Intelligence Feed inside Public Citizen Hub (`/public`):**
   - 5 geographic tiers (`Around Me`, `City`, `State`, `National`, `Global`).
   - Verified publisher source links, publication timestamps, topic filtering, and search.
   - Grounded AI civic relevance summaries explaining local community impact.
   - Direct links connecting news bulletins to active matching complaints on the map.
5. **Provides Emergency Services with Live Road Routing ETA:**
   - Real-time road distance and estimated arrival time calculated using OSRM live driving routes to verified physical police, fire, trauma medical, and disaster stations.
   - Graceful fallback: If routing is unavailable, displays "Live ETA unavailable" with straight-line distance; never fabricates false ETAs.
   - Browser GPS acquisition with accuracy circle, plus manual city zone selector fallback if GPS is denied.
   - Direct click-to-call for 112, 100, 101, 108, and local station desks.
6. **Secures Evidence with SHA-256 Cryptographic Integrity:** Real multipart uploads stored locally, streaming SHA-256 hash calculation, and an on-demand cryptographic verification endpoint.
7. **Detects & Links Duplicates** using a multi-factor scoring formula (50% text similarity + 35% Haversine geographic proximity + 15% category match) to group reports without deleting individual citizen submissions.
8. **Detects Spatial Hotspots & Root Causes:** Computes clusters of &ge;3 incidents within a 150m radius occurring within 7 days and generates multi-vector infrastructure hypotheses.
9. **Enforces Multi-Tier Governance Escalation:**
   - **Tier 0:** Routine department handling.
   - **Tier 1:** Field Supervisor escalation (SLA breach / initial reopen).
   - **Tier 2:** Ward Authority escalation (repeated reopen / >48h breach).
   - **Tier 3:** City Commissioner escalation (critical institutional hazard / 3x reopen).
10. **Embeds Google Gemini AI Copilot:** Powered by the official `google-genai` SDK (`gemini-2.5-flash`) with grounded RAG querying real-time database state, tracking telemetry, and verified emergency hotlines, backed by a deterministic local FAQ fallback.
11. **Provides Downloadable Municipal PDF Summaries:** Server-side vector PDF generation via ReportLab (`/api/reports/{id}/summary.pdf` and `/api/track/{id}/summary.pdf`) with embedded SHA-256 cryptographic hashes and unconfirmed location warning banners.
12. **Segregates Public & Government Portals:**
    - **Public Citizen Hub (`/public`):** Citizen tracking hub, issue map (`/public/map`), intelligence news feed (`/public/intelligence`), emergency ETA (`/emergency`), municipal funds transparency (`/public/funds`), ward voting (`/public/participation`), civic rewards (`/public/rewards`), and confidential whistleblower intake (`/public/confidential-report`).
    - **Government Operations Portal (`/government`):** Secure access protected by PBKDF2-HMAC-SHA256 password hashing, JWT authentication, and Role-Based Access Control (`ADMIN`, `REVIEWER`, `DEPARTMENT_OPERATOR`, `FIELD_OFFICER`, `FINANCE_OFFICER`, `WHISTLEBLOWER_AUDITOR`). Structured into 6 collapsible sidebar sections (Operations, Intelligence, Departments & Vendors, Citizen Programs, Protected Cases, Tools) with a dedicated Government Operational Intelligence Feed.
13. **Autonomously Verifies Closure Claims** against 5 mandatory criteria (`has_description_and_photo`, `within_50m`, `after_assignment`, `completion_keywords`, `no_contradicting_reports`).
14. **Autonomously Recovers from Invalid Closures:** Rejection immediately reopens the case, increments priority (+1, capped at 5), advances the escalation tier, recalculates the SLA deadline, and deducts contractor trust score (-15%).
15. **Maintains a Tamper-Evident SHA-256 Audit Chain:** Chronological hash-linked ledger recording every citizen report, state transition, supervisor override, and geofence breach.
16. **Government Operational Intelligence Feed:** Dedicated engine (`/api/intelligence/operational-feed`) aggregating real-time database state events: overdue SLAs, approaching SLA deadlines, unassigned high-priority work, failed closures, contractor anomalies, and spatial hotspots, with operator acknowledgment tracking.

---

## 2. Technology Stack

### Backend
- **Framework:** Python 3.11+ / 3.14 compatible, FastAPI, Pydantic V2, SQLAlchemy 2.x
- **Routing & ETA:** Open Source Routing Machine (OSRM) driving profile with 5-minute server-side memory caching & Haversine fallback
- **AI / LLM:** Google GenAI SDK (`google-genai` v2.33.0), model `gemini-2.5-flash` with grounded RAG & deterministic fallback
- **Security & Auth:** PBKDF2-HMAC-SHA256 password hashing (100,000 rounds), PyJWT 2.15.0 Bearer tokens
- **PDF Generation:** ReportLab 5.1.0 vector graphics engine
- **Storage:** SQLite (`civichelp.db`) with timezone-aware `UTCDateTime` TypeDecorator and non-destructive schema migrations
- **Testing:** Pytest 9.1.1, HTTPX TestClient (**69 automated tests, 100% pass**)
- **Server:** Uvicorn

### Frontend
- **Framework:** React 18, Vite 5, TypeScript
- **Styling:** Tailwind CSS ("Nocturne Operations" dark mode design system)
- **Maps & Clustering:** Leaflet 1.9.4 & `leaflet.markercluster` with CartoDB Dark Matter / Google / OSM / Satellite tiles
- **Accessibility:** Color-blind safe category shapes and interior SVG glyphs
- **AI Chatbot:** Floating glassmorphic copilot with model telemetry badge and 1-click answer copy
- **3D Hero:** Three.js procedural night-city instanced mesh (lazy-loaded for landing page only)
- **Icons:** Lucide React

---

## 3. Quick Start (Windows 11)

### 1-Click Launch (Recommended)
Double-click `launch.bat` in the root folder (or run `python launcher.py`).
- Public Portal: `http://localhost:5173/public`
- Emergency 112 Hub & ETA: `http://localhost:5173/emergency`
- Civic Intelligence: `http://localhost:5173/public/intelligence`
- Government Portal: `http://localhost:5173/government/login`
- Operations Console: `http://localhost:5173/app`
- Backend API Docs: `http://127.0.0.1:8000/docs`

### Default Government Login Credentials
| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@civichelp.gov.in` | `Admin@CivicHelp2026` | Full system control, resets, escalations |
| **Reviewer** | `reviewer@civichelp.gov.in` | `Reviewer@CivicHelp2026` | Incident triage, unconfirmed location corroboration |
| **Operator** | `pwd.operator@civichelp.gov.in` | `Operator@CivicHelp2026` | Department assignments, closure verification |

*(1-click credential quick-fill pills are provided directly on `/government/login`)*

### Seeding 450 Demo Records
```powershell
# Via Backend CLI:
cd backend
python -m app.seed_demo_data --count 450

# Or via REST API:
curl -X POST http://127.0.0.1:8000/api/simulation/seed-demo-450
```

### Running Test Suite
```powershell
# Backend pytest suite (57 tests, 100% pass)
cd backend
pytest -v

# Frontend build check (0 errors, 0 warnings)
cd frontend
npm run build
```

---

## 4. REST API Reference

| Endpoint | Method | Description |
|---|:---:|---|
| `/api/health` | GET | Service health, version, and simulated UTC clock offset |
| `/api/reports` | POST | Ingests report (supports `PRECISE` and `UNCONFIRMED` modes) |
| `/api/reports/{id}/summary.pdf` | GET | Downloads official vector PDF summary with SHA-256 seal |
| `/api/incidents` | GET | Lists canonical incidents with status, category, priority, coords, and search filters |
| `/api/incidents/{id}` | GET | Returns full incident details with evidence, audit, and escalation records |
| `/api/incidents/{id}/closure` | POST | Submits contractor closure evaluated against 5 verification criteria |
| `/api/incidents/{id}/review` | POST | Human supervisor override (`APPROVE`, `REOPEN`, `ASSIGN`) |
| `/api/incidents/density` | GET | Queries nearby active complaint density for priority boost |
| `/api/emergency/services` | GET | Public emergency directory (112, 100, 101, 108, etc.) |
| `/api/emergency/stations` | GET | Verified physical stations (Police, Fire, Medical, Disaster) |
| `/api/emergency/nearest` | GET | Finds nearest stations by user GPS with live road routing ETA |
| `/api/emergency/eta` | GET | Calculates route distance & travel time to a specific station |
| `/api/news/articles` | GET | Public intelligence feed with 5 geographic tiers & incident links |
| `/api/auth/login` | POST | Government user authentication (PBKDF2 + JWT token) |
| `/api/auth/me` | GET | Returns authenticated user profile and permissions |
| `/api/auth/logout` | POST | Clears authenticated session |
| `/api/attachments` | POST | Multipart file upload with real-time SHA-256 calculation |
| `/api/attachments/{id}/verify` | POST | Recalculates file hash on disk to confirm tamper-proof integrity |
| `/api/location/search` | GET | Address, sector, and landmark search with gazetteer fallback |
| `/api/location/reverse` | GET | Coordinate reverse-geocoding into human-readable street names |
| `/api/intelligence/hotspots` | GET | Spatial hotspots (&ge;3 incidents within 150m in 7 days) |
| `/api/intelligence/unconfirmed-reports` | GET | Unconfirmed location reports triage queue |
| `/api/intelligence/corroborate/{id}` | POST | Operator corroborates coordinates for unconfirmed reports |
| `/api/intelligence/escalations` | GET | Governance escalation records (Supervisor, Ward, Commissioner) |
| `/api/chat` | POST | Google Gemini AI Copilot with grounded RAG & local fallback |
| `/api/chat/status` | GET | AI provider status report (Gemini or Local RAG Engine) |
| `/api/track/{tracking_id}` | GET | Public citizen tracking endpoint (sanitized, zero PII) |
| `/api/track/{tracking_id}/summary.pdf` | GET | Citizen downloadable official PDF tracking summary |
| `/api/simulation/seed-demo-450` | POST | Seeds 450 Delhi NCR demo records + 40 linked duplicates |
| `/api/simulation/reset-demo-450` | POST | Cleans synthetic demo records without touching citizen data |
| `/api/simulation/bad-closure` | POST | Simulates invalid closure triggering autonomous recovery |
| `/api/simulation/advance-time` | POST | Advances simulated clock and triggers SLA escalation scanner |

---

## 5. Advanced Civic Accountability & Citizen Participation Modules

### Module 1: Municipal Fund Tracker (`/public/funds`)
- **Ward-Wise Municipal Outlay:** Public transparency dashboard tracking capital allocation versus recorded expenditure across 5 Delhi municipal wards (FY 2025-26).
- **Physical Milestone Verification:** Direct linkage between municipal projects, empanelled contractors, and verifiable deliverables.
- **CSV Data Interoperability:** Public 1-click CSV export and finance officer CSV import.
- **Endpoints:** `GET /api/funds/summary`, `GET /api/funds/wards`, `GET /api/funds/projects`, `POST /api/funds/import-csv`.

### Module 6: Contractor Performance, Penalties & Bonuses (`/government/contractors`)
- **Auditable Scorecards:** Tracks empanelled municipal contractors with real-time trust scores (0-100%).
- **Automated Penalty Engine:** Calculates contractual penalties from SLA breaches and reopened failed closures.
- **Legal Workflow Lifecycle:** Enforces transition through `DETECTED` &rarr; `EVIDENCE_REVIEW` &rarr; `CALCULATED` &rarr; `CONTRACTOR_NOTIFIED` &rarr; `DISPUTED/ACCEPTED` &rarr; `OFFICIAL_APPROVAL` &rarr; `BILLING_ADJUSTMENT_PENDING` &rarr; `RECONCILED`.
- **Endpoints:** `GET /api/contractors`, `GET /api/contractors/{id}`, `GET /api/contractors/assessments`, `POST /api/contractors/assessments/{id}/transition`.

### Module 3: Community Polls & Participatory Budgeting (`/public/participation`)
- **Direct Democracy:** Citizens vote on ward-level capital project designs (e.g. Solar Smart Poles vs Feeder Lane Lights).
- **Ballot Integrity:** 1-vote-per-participant enforced via SHA-256 cryptographic ballot fingerprints; duplicate attempts rejected with HTTP 409 Conflict.
- **Government Action Tracking:** Officials record formal deliberation status (`UNDER_CONSIDERATION`, `APPROVED`, `REJECTED`, `DEFERRED`).
- **Endpoints:** `GET /api/participation/proposals`, `POST /api/participation/proposals`, `POST /api/participation/proposals/{id}/vote`, `POST /api/participation/proposals/{id}/decision`.

### Module 2: Civic Rewards & Leaderboard (`/public/rewards`)
- **Append-Only Points Ledger:** Earn verified civic credits for valid reports (+50), additional evidence (+20), resolution confirmations (+30), and participatory votes (+10).
- **Anti-Abuse Engine:** Server-enforced daily cap (250 pts/24h) and non-negative balance reconciliation.
- **Voucher Catalogue:** Instant alphanumeric voucher issuance for Delhi Metro single-journey discounts, municipal parking waivers, and native tree sapling adoption.
- **Privacy-Preserving Leaderboard:** Pseudonymous handles (`CivicHero_SouthDelhi`, `EcoWarrior_Dwarka`) with ward badges.
- **Endpoints:** `GET /api/rewards/catalog`, `GET /api/rewards/leaderboard`, `GET /api/rewards/account`, `POST /api/rewards/earn`, `POST /api/rewards/redeem`.

### Module 4: Multilingual AI Voice Assistant
- **Speech-to-Text Integration:** Web Speech API microphone intake with 1-click preset samples in Hindi (हिंदी), English, and Hinglish.
- **Gemini AI Entity Extraction:** Extracts category, concise formal title, clarified description, landmark location hint, language, and urgency rating.
- **Review-Before-Submit:** Citizen inspects extracted fields in a modal before populating the intake form.
- **Endpoints:** `POST /api/voice/parse`.

### Module 5: WhatsApp & SMS Reporting Bot (`/api/messaging/*`)
- **Provider-Independent Layer:** Inbound webhooks compatible with Twilio / WhatsApp Business API alongside an interactive browser simulator modal.
- **Conversational State Machine:** Accepts freeform issue intake (`Pothole near Saket Metro`), automated tracking lookup (`STATUS <id>`), and compliance opt-in/opt-out (`STOP`, `START`).
- **Idempotency:** Unique `external_message_id` deduplication prevents re-processing duplicate incoming webhooks.
- **Endpoints:** `POST /api/messaging/whatsapp/webhook`, `POST /api/messaging/sms/webhook`, `POST /api/messaging/sandbox/simulate`, `GET /api/messaging/history`.

### Module 7: Confidential Whistleblower Portal (`/public/confidential-report` & `/government/whistleblower`)
- **Cryptographic Anonymity:** Strict zero-PII intake generating a 48-character secret case token (`secrets.token_hex(24)`).
- **Segregated Data & Storage:** Dedicated `WhistleblowerCase` entities with isolated encrypted storage in `uploads/confidential/`.
- **Token-Based Anonymous Inquiries:** Citizens check investigation status and formal outcomes using their secret token without revealing identity.
- **Auditor Console:** Restricted to `WHISTLEBLOWER_AUDITOR` role with tamper-evident audit logging of all case inspections.
- **Endpoints:** `POST /api/whistleblower/submit`, `GET /api/whistleblower/track`, `GET /api/whistleblower/cases`, `GET /api/whistleblower/cases/{id}`, `POST /api/whistleblower/cases/{id}/status`.
