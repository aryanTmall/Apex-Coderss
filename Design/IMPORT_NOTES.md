# Stitch Design Import Notes — CivicHelp

## 1. Archives & Directories Discovered
The design assets were discovered in the `Design/` directory under `stitch_civichelp`:
- `Design/stitch_civichelp/civichelp_landing_page_desktop/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/civichelp_landing_page_mobile/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/incident_detail_civ_2024_9841_escalated/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/nocturne_operations/` (`DESIGN.md`)
- `Design/stitch_civichelp/operations_console/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/report_a_civic_issue/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/style_guide_components/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/track_civic_resolution/` (`code.html`, `screen.png`)
- `Design/stitch_civichelp/verification_simulation_console/` (`code.html`, `screen.png`)

All original code and screenshot exports have been strictly preserved.

---

## 2. Identified Screens and Route Mapping

| Stitch Screen | Intended Route | Description |
|---|---|---|
| `civichelp_landing_page_desktop` & `mobile` | `/` | Public cinematic landing page with WebGL 3D procedural night city, storytelling chapters (Report, Link, Prove, Recover), real backend metrics, and CTAs. |
| `operations_console` | `/app` | Tactical command center with live KPI cards, interactive incident map, filterable incident queue, live telemetry feed, and department workload. |
| `report_a_civic_issue` | `/app/report` | Citizen incident intake with category selector, bilingual UI toggle, location lock, map picker, description telemetry, and tracking ID generation. |
| `track_civic_resolution` | `/app/track` & `/app/track/:trackingId` | Citizen-facing tracking portal showing timeline, canonical incident status, SLA clock, verification verdict, and duplicate grouping notice. |
| `incident_detail_civ_2024_9841_escalated` | `/app/incidents/:id` | Full operational incident inspector with status badges, priority reasons, SLA countdown, linked citizen reports, closure checks, and audit history. |
| `verification_simulation_console` | `/app/simulation` & `/app/verification` | Operator verification desk with check results (5 mandatory criteria), review modal (Approve/Reopen/Assign), and simulation control center. |
| *Custom (Consistent Design)* | `/app/departments` | Department availability, category mappings, and fallback routing management. |
| *Custom (Consistent Design)* | `/app/intelligence` | Civic memory, 30-day recurring incidents, and 7-day multi-incident root cause hypotheses. |

---

## 3. Assets and Tokens Reused
- **Design System ("Nocturne Operations")**:
  - Base canvas: `#070B14` (Deep Night Void)
  - Surface 1: `#0F1626`
  - Surface 2: `#151D30`
  - Surface 3: `#1D263D`
  - Borders: `rgba(255, 255, 255, 0.08)`
  - Civic Blue: `#3B82F6`
  - AI-Agent Violet: `#A78BFA`
  - Verified Teal: `#2DD4BF`
  - SLA Amber: `#F59E0B`
  - Breached Red: `#F43F5E`
- **Typography & Geometry**:
  - Newsreader for display headers and metric numerals.
  - Inter for crisp operational telemetry, labels, and form controls.
  - 14px outer corner radius for primary modules and cards; 8px for inner controls.
  - Compact uppercase status chips with active indicator dots.
  - Mandatory platform banner: `DEMO ENVIRONMENT — SYNTHETIC DATA`.

---

## 4. Adaptations Made
1. **Component Modularization**: Converted single-file static HTML Stitch prototypes into maintainable React + TypeScript components (`StatusChip`, `PriorityBadge`, `AgentBadge`, `SlaTimer`, `KpiCard`, `TimelineItem`, `EvidenceCheckItem`, `IncidentMap`).
2. **Dynamic Data Binding**: Replaced all hardcoded values with real typed models connected to FastAPI endpoints.
3. **Interactive Maps**: Replaced static image mockups with interactive Leaflet + OpenStreetMap components supporting live coordinates, status pins, and radius markers.
4. **Cinematic 3D Scene**: Built a Three.js procedural night city with instanced building geometry, glowing incident beacons, and scroll progression for the landing page hero, with automatic fallback when WebGL is unavailable.
5. **Simulation Controls**: Wired the simulation buttons directly to backend seed and scenario APIs with confirmation dialogs.
