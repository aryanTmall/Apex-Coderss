# CivicHelp — Hackathon Demonstration & Judging Script

**Theme:** “From Citizen Reports to Verified Resolution” — Smart Cities / Civic Issue Management  
**Key Differentiators:** Interactive Geolocated Marker Clustering, Accessible Category Palette, Public Intelligence Feed inside Citizen Hub, Live Emergency Dispatch ETA via OSRM, Autonomous Recovery from Failed Closure, Google Gemini AI Copilot, and Tamper-Evident SHA-256 Audit Chain.

---

## 1. Quick Startup (1-Click)

1. Double-click `launch.bat` in the project root (or run `python launcher.py`).
2. Both FastAPI backend (`http://127.0.0.1:8000`) and Vite frontend (`http://localhost:5173`) boot automatically and open your default browser.
3. Open `http://localhost:5173/public` for the Public Citizen Hub.

---

## 2. 4-Minute Demonstration Walkthrough for Judges

### 00:00 – 01:00 | City-Wide Interactive Map with Category Colors & Clustering (`/public`)
- **Start at `/public` (Public Citizen Hub):**
  - Scroll down to the **City-Wide Civic Issues Map** section.
  - **Marker Clustering:** Point out the dark-ops cluster circles showing incident counts (glowing cyan for `<10`, amber for `10-50`, red for `50+`). Zoom in or click a cluster to see it expand smoothly into individual pins!
  - **Accessible Category Colors & Symbols:**
    - Show that every category has its own distinct color:
      - Orange: Potholes / Road Damage
      - Yellow: Streetlights & Electrical
      - Green: Garbage & Sanitation
      - Blue: Water Leaks
      - Purple: Drainage & Sewers
      - Cyan: Waterlogging & Flooding
      - Red: Traffic Signals
      - Brown: Public Infrastructure
    - Click **"Legend"** to show that each category also has a distinct geometric shape (circle, square, diamond, octagon, hexagon, triangle) and interior SVG icon so color-blind users can instantly differentiate them.
  - **Clickable Marker Details:**
    - Click any pin on the map.
    - Notice the popup and the slide-out tactical drawer showing tracking ID, title, category, priority, exact address, and SLA status.
    - Click **"My Location" (GPS)**: Observe the map acquire browser coordinates, drop a pulsing blue location ring, and instantly compute:
      *"📍 Distance: 2.3 km from your current GPS position"*.
    - Point out the **"Directions ↗"** button that opens turn-by-turn navigation in Google Maps!
  - **Unlocated Reports Tab:**
    - Click **"Unlocated (X)"**: Show that reports filed without GPS are cleanly listed in an amber triage queue rather than having fake coordinates fabricated!

---

### 01:00 – 01:50 | Public Intelligence Feed inside Citizen Hub (`/public#intelligence-feed`)
- **Scroll to Public Intelligence Feed (Directly inside `/public`):**
  - Point out that citizens have direct access to civic intelligence without leaving the hub.
  - **Geographic Scopes:** Switch between `Around Me` (uses device GPS), `City` (Delhi), `State` (Delhi NCR), `National`, and `Global Cities`.
  - **Real Source Attribution:** Highlight verified publisher citations (*Delhi Municipal Corporation, Delhi Smart City Mission, MoHUA*), publication dates, and original source links.
  - **AI Civic Impact Summaries:** Point out the purple sparkled AI insight explaining in plain language why the news matters to local residents.
  - **Connect Intelligence to Live Incidents:**
    - Click **"X Active Incidents"** badge on a drainage or pothole article.
    - Observe the seamless link back to the map with matching filters pre-applied!

---

### 01:50 – 02:45 | Emergency Services & Live Dispatch ETA (`/public#emergency-eta` or `/emergency`)
- **Scroll to Nearest Emergency Services & Dispatch ETA:**
  - **Live GPS Acquisition:** Notice the status indicator showing "GPS Lock" with live accuracy radius (e.g., `±15m`), with a manual city sector dropdown fallback if GPS is denied.
  - **Service Type Tabs:** Switch between *All Services*, *Police Stations*, *Fire & Rescue*, *Trauma & Hospitals*, *Disaster Command*.
  - **Real OSRM Road Routing ETA:**
    - Point to the **Nearest Eligible Station** card (e.g., *Connaught Place Police Station* or *AIIMS Trauma Center*).
    - Show the calculated road travel time and driving distance:
      *"7 MIN // 4.3 km road route (Source: OSRM Live Routing Engine)"*.
    - Emphasize that CivicHelp **never fabricates ETAs**: if routing fails, straight-line distance is explicitly marked with *"Live ETA unavailable"*.
  - **Interactive Actions:**
    - Click **"Call Station"** (direct `tel:` dialer).
    - Click **"Directions"** to open turn-by-turn directions.
  - **Life-Safety Disclaimer:** Highlight the warning banner reminding citizens to dial **112 directly** for immediate dispatch.

---

### 02:45 – 03:30 | Uber/Swiggy Report Intake & Downloadable PDF (`/app/report`)
- **Navigate to `/app/report`:**
  - Demonstrate the **Uber/Swiggy Pin Dropper**:
    - Drag the map: notice the crosshair lifts up with an expanded shadow, and drops with an animated ripple wave.
    - Show the **Area Complaint Density Badge** alerting citizens to nearby active reports within 150m.
  - Demonstrate **"Left the Scene" Mode**: allows citizens who reported from home to enter landmarks without fabricating fake GPS coordinates.
  - Drag and drop a photo: show the browser computing the **SHA-256 cryptographic hash** in real time.
  - Submit the report:
    - View the instant modal confirmation.
    - Click **"Download Official PDF Summary"**: downloads a vector-grade, municipal-branded PDF generated by ReportLab with an embedded SHA-256 integrity seal.

---

### 03:30 – 04:00 | Autonomous Closure Verification & Geofence Spoofing Forensics (`/app/verification`)
- **Navigate to `/app/verification`:**
  - Open an assigned incident and simulate a fraudulent contractor closure:
    - Enter completion notes (*"Pothole filled and road smoothed"*).
    - Provide GPS coordinates 350 meters away from the actual site.
  - Click **"Submit Closure Evidence"**:
    - Watch CivicHelp's 5-point verification engine **autonomously reject the claim**!
    - Case transitions to `REOPENED`, priority escalates from P4 to P5, and SLA deadline recalculates.
  - **Visual Geofence Breach Map:**
    - Inspect the dual-pin map showing the 50m green allowed perimeter, red contractor marker, and dashed red breach vector.
    - Point out the **Contractor Spoofing Warning** and the algorithmic trust score penalty (-15%).

---

## 3. Summary of Hackathon Winning Differentiators

1. **True Full-Stack Implementation:** 64/64 backend automated tests passing, 0-error TypeScript Vite build, and SQLite persistence.
2. **Municipal Fund Tracker (`/public/funds`):** Ward-wise municipal expenditure, contractor project allocations, and verifiable deliverable milestones.
3. **Contractor Accountability & Penalty Lifecycle (`/government/contractors`):** Empanelled contractor scorecards, automated penalty calculations from failed closures, and official approval workflow.
4. **Participatory Budgeting & Ward Consultations (`/public/participation`):** Direct democracy with 1-vote SHA-256 ballot integrity and duplicate vote prevention.
5. **Civic Rewards & Leaderboard (`/public/rewards`):** Append-only points ledger, privacy-preserving leaderboard, and digital municipal voucher catalogue.
6. **Multilingual AI Voice Assistant:** 1-click speech parsing in Hindi (हिंदी), English, and Hinglish with Gemini entity extraction.
7. **WhatsApp & SMS Bot Simulator:** Conversational issue intake, real-time status lookup, and compliance opt-out testing right inside the browser.
8. **Confidential Whistleblower Portal (`/public/confidential-report`):** 48-character cryptographic secret tokens with zero PII logging and restricted auditor console.
9. **Interactive Map with Accessible Category Colors & Clustering:** 14 distinct categories with color-blind shapes, `leaflet.markercluster`, and unlocated reports drawer.
10. **Emergency Services with Live Road Routing ETA:** Real OSRM driving routes, distance calculations, and zero-fabrication fallback.
