---
name: Nocturne Operations
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#171c25'
  surface-container: '#1b2029'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2f0'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dfe2f0'
  inverse-on-surface: '#2c303b'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#cebdff'
  on-secondary: '#381385'
  secondary-container: '#4f319c'
  on-secondary-container: '#bea8ff'
  tertiary: '#3cddc7'
  on-tertiary: '#003731'
  tertiary-container: '#00a392'
  on-tertiary-container: '#00302a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e8ddff'
  secondary-fixed-dim: '#cebdff'
  on-secondary-fixed: '#21005e'
  on-secondary-fixed-variant: '#4f319c'
  tertiary-fixed: '#62fae3'
  tertiary-fixed-dim: '#3cddc7'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005047'
  background: '#0f131d'
  on-background: '#dfe2f0'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  display-md:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-metric:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  mono-metric:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system embodies a modern "night operations" command center tailored for autonomous civic-resolution workflows. It merges high-stakes municipal accountability with high-precision autonomous intelligence. 

The aesthetic blends disciplined technical minimalism with tactical depth: deep obsidian substrates, crisp hairline delineations, and targeted emissive state signifiers. The interface conveys calculated urgency, institutional integrity, and calm oversight under pressure. Restraint governs visual execution—accents serve strictly as functional status indicators and operational cues rather than decorative luminescence.

## Colors
The palette leverages a deep void background with layered optical surfaces that maintain contrast without fatigue:

- **Base Canvas**: `#070B14` (Deep Night Void)
- **Surfaces**: 
  - `surface-1`: `#0F1626` (Primary structural panels and standard card backgrounds)
  - `surface-2`: `#151D30` (Elevated overlays, popovers, nested sub-panels, and active hover targets)
  - `surface-3`: `#1D263D` (Selected states, active chips, and inner containers)
- **Hairline Borders**: `rgba(255, 255, 255, 0.08)` across standard components; subtle accent tints on active focus states.
- **Typography**:
  - Primary Text: `#E6EAF2`
  - Secondary/Muted Text: `#8B95A9`
  - Subtle/Tertiary: `#525D73`
- **Functional Semantics**:
  - **Civic Blue (`#3B82F6`)**: Primary operations, systemic routing, and interactive selections.
  - **AI-Agent Violet (`#A78BFA`)**: Agentic automated actions, synthesis runs, and bot provenance.
  - **Verified Teal (`#2DD4BF`)**: Validated evidence, positive resolution, and telemetry health.
  - **SLA-Risk Amber (`#F59E0B`)**: Ticking SLA countdowns, degradation warnings, and escalations.
  - **Breached/Alert Red (`#F43F5E`)**: SLA breaches, citizen emergency flags, and network failures.

Never flood backgrounds with saturated color. Use solid fills or low-opacity tinted washes (`0.08` to `0.15`) coupled with high-contrast text and border treatments.

## Typography
The system employs an authoritative structural pairing: an editorial serif for display scales and metric readouts, grounded by a clean, neutral sans-serif for operational interface controls, logs, and metadata.

- **Serif Scale**: Reserved strictly for high-tier section display headers and primary KPI numeric callouts. This introduces an institutional, deliberate presence, elevating municipal resolution tracking above utilitarian dashboards.
- **Sans-Serif Scale**: Applied to all operational dense data sets, action controls, form elements, and dynamic timelines. Rendered with tabular numbers (`font-variant-numeric: tabular-nums`) across SLA timers, timestamps, and case identifiers to prevent visual jumping during real-time updates.

## Layout & Spacing
Built on a strict 8px operational rhythm (with a 4px half-step for micro-tags and inline metrics). 

- **Grid Structure**: 12-column fluid grid system across desktop (>= 1280px) with 24px gutters (`gutter-lg`) and 32px canvas margins (`margin-lg`). 8-column layout for tablets with 16px gutters, collapsing to a single-column layout on mobile viewports (< 768px) with 16px margins.
- **Console Layout**: The primary workspace adheres to an operations layout:
  - Top navigation: Fixed 56px height.
  - Left panel: Fixed 320px filter, queue, and SLA-triage column.
  - Center panel: Flexible workpane for active case evidence, agent run logs, and citizen dispatch.
  - Right panel: Collapsible 360px agent inspector and action verification deck.
- **Density Rules**: Maintain high spatial efficiency. Component-level gaps standardly leverage `space-xs` (4px) to `space-sm` (8px). Structural groupings leverage `space-md` (16px).

## Elevation & Depth
Elevation is expressed through tonal gradation and emissive glows rather than classical drop shadows:

- **Surface Tiers**:
  - `Base`: `#070B14` (Empty field, background viewport)
  - `Panel / Card`: `#0F1626` bounded by 1px solid `rgba(255, 255, 255, 0.08)`
  - `Floating Overlays / Modals`: `#151D30` with `box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12)`
- **Glassmorphism**: Applied selectively to top sticky app bars and docked contextual action strips using `background: rgba(15, 22, 38, 0.75)` combined with `backdrop-filter: blur(12px)` and a bottom border of `1px solid rgba(255, 255, 255, 0.06)`.
- **Inner Emissive Glows**: Critical action targets and active agent status indicators utilize directional inner glows: `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.12), inset 0 0 12px -2px rgba(59, 130, 246, 0.15)`.

## Shapes
Geometry is disciplined and structured:

- **Cards & Primary Modules**: 14px outer corner radius (`0.875rem`).
- **Inner Controls & Secondary Panels**: 8px radius (`0.5rem`) creating harmonious concentric borders with the 14px parent frame.
- **Badges, Status Chips & Micro Tags**: 4px radius (`0.25rem`) for tactical compactness, avoiding overly bubbly or fully rounded pill styles on mission data.
- **Pill Exceptions**: The top-level "Demo environment — synthetic data" banner and dynamic live triage status pills adopt a 9999px radius to distinguish platform-level notifications from structural content cards.

## Components

### Buttons
- **Primary Tactical**: `#3B82F6` solid fill with `#FFFFFF` text. Inset top highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`). Hover transitions to `#2563EB` with `box-shadow: 0 0 16px rgba(59, 130, 246, 0.35)`. Height: 36px; padding: 0 14px; 8px radius.
- **Secondary Tactical**: Surface `#151D30` with border `1px solid rgba(255, 255, 255, 0.08)`. Text: `#E6EAF2`. Hover adds `border-color: rgba(255, 255, 255, 0.18)` and background `#1D263D`.
- **Agent Action (AI Trigger)**: Background `rgba(167, 139, 250, 0.12)` with `1px solid rgba(167, 139, 250, 0.3)`. Text: `#A78BFA`.

### Badges & Chips
- **StatusChip**: Compact height (22px). Background: `rgba(currentColor, 0.1)`. Border: `1px solid rgba(currentColor, 0.25)`. Font: 11px uppercase `label-sm`. Contains an active 6px indicator dot.
- **PriorityBadge**: Color-coded indicator (P1 Breached: Red `#F43F5E`, P2 Elevated: Amber `#F59E0B`, P3 Standard: Blue `#3B82F6`). Monospaced, high-contrast typography.
- **AgentBadge**: Displays agent avatar/icon with violet label (`#A78BFA`), subtle background `rgba(167, 139, 250, 0.08)`, and border `rgba(167, 139, 250, 0.2)`. Demonstrates autonomous reasoning state ("Routing Engine", "Resolution Bot 04").
- **Mandatory Demo Environment Badge**: Centered or docked pill badge. Background: `rgba(245, 158, 11, 0.12)`. Border: `1px solid rgba(245, 158, 11, 0.3)`. Text: `#F59E0B`. Label: `DEMO ENVIRONMENT — SYNTHETIC DATA` in `10px` tracking `0.08em` uppercase.

### Metric & Operational Displays
- **SlaTimer**: Monospace display showing remaining resolution window (e.g., `01:42:19`). Dynamically updates color threshold: Teal (> 4h), Amber (< 2h), Red (breached/imminent). Accompanied by a 2px micro-progress bar.
- **KpiCard**: 14px radius `#0F1626` base, 1px border `rgba(255, 255, 255, 0.08)`. Top section houses label and tertiary spark indicator; bottom displays large serif metric (`headline-metric`) alongside a delta indicator.
- **TimelineItem**: Vertical node architecture with hairline connecting track (`rgba(255, 255, 255, 0.08)`). Nodes indicate agent triage, human intervention, or citizen inputs with distinct glyphs and precise timestamps.
- **EvidenceCheck**: Interactive list items for multi-modal civic verification (imagery, telemetry, geofence validation). Includes an interactive state checkbox, confidence score pill (e.g., `98.4% Confidence`), and asset preview modal trigger.

### Inputs & Selection Controls
- **Input Fields**: Height: 38px. Background: `#070B14`. Border: `1px solid rgba(255, 255, 255, 0.1)`. Focus: `1px solid #3B82F6` with an emissive blue glow `box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2)`. Placeholder: `#525D73`.
- **Checkboxes & Radios**: 16x16px base, background `#070B14`, border `1px solid rgba(255, 255, 255, 0.2)`. Active check utilizes `#3B82F6` with sharp high-contrast internal tick marks.

### Empty States
- **EmptyState**: Centered within target surface with low-opacity vector crosshair, faint `#151D30` boundary rings, and clean informational copy with primary action: "Await incoming dispatches or run manual case ingestion."