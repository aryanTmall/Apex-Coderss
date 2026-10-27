export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shapeName: 'circle' | 'square' | 'diamond' | 'hexagon' | 'triangle' | 'octagon';
  shortCode: string;
  description: string;
  svgIcon: string; // SVG path for inner pin icon
}

export const CATEGORY_PALETTE: Record<string, CategoryConfig> = {
  pothole: {
    id: 'pothole',
    label: 'Potholes / Road Damage',
    color: '#F97316', // Orange
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#EA580C',
    shapeName: 'circle',
    shortCode: 'POT',
    description: 'Road surface craters, sunken trenches, broken asphalt, and bitumen collapse',
    svgIcon: '<path d="M4 19h16M7 15l2-8h6l2 8M9 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  },
  streetlight: {
    id: 'streetlight',
    label: 'Streetlight Problems',
    color: '#EAB308', // Yellow
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#CA8A04',
    shapeName: 'square',
    shortCode: 'LGT',
    description: 'Non-functional streetlights, leaning poles, dark stretches, and exposed wiring',
    svgIcon: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" stroke-width="2"/>',
  },
  garbage: {
    id: 'garbage',
    label: 'Garbage / Waste Accumulation',
    color: '#22C55E', // Green
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#16A34A',
    shapeName: 'diamond',
    shortCode: 'GAR',
    description: 'Overflowing public bins, unauthorized dumping, rotting debris, and uncollected waste',
    svgIcon: '<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="currentColor" stroke-width="2"/>',
  },
  water_leak: {
    id: 'water_leak',
    label: 'Water Leakage / Pipeline',
    color: '#3B82F6', // Blue
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#2563EB',
    shapeName: 'circle',
    shortCode: 'WTK',
    description: 'Burst potable water mains, gushing municipal valves, and foundation pipe fissures',
    svgIcon: '<path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="currentColor" stroke-width="2"/>',
  },
  drainage: {
    id: 'drainage',
    label: 'Drainage / Sewer Issues',
    color: '#A855F7', // Purple
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#9333EA',
    shapeName: 'octagon',
    shortCode: 'DRN',
    description: 'Choked underground sewers, backflowing runoff basins, and damaged drain covers',
    svgIcon: '<path d="M4 12h16M4 6h16M4 18h16M10 3v18M14 3v18" stroke="currentColor" stroke-width="2"/>',
  },
  waterlogging: {
    id: 'waterlogging',
    label: 'Waterlogging & Flooding',
    color: '#06B6D4', // Cyan
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#0891B2',
    shapeName: 'hexagon',
    shortCode: 'LOG',
    description: 'Submerged underpasses, deep street standing water, and monsoon flash inundation',
    svgIcon: '<path d="M2 12c2.5-3 5.5-3 8 0s5.5 3 8 0M2 17c2.5-3 5.5-3 8 0s5.5 3 8 0" stroke="currentColor" stroke-width="2"/>',
  },
  traffic_signal: {
    id: 'traffic_signal',
    label: 'Traffic Obstruction / Signals',
    color: '#EF4444', // Red
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#DC2626',
    shapeName: 'triangle',
    shortCode: 'TRF',
    description: 'Failed traffic light controllers, stuck amber signals, and carriageway obstructions',
    svgIcon: '<rect x="6" y="2" width="12" height="20" rx="3" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/>',
  },
  infrastructure: {
    id: 'infrastructure',
    label: 'Public Infrastructure Damage',
    color: '#B45309', // Brown
    bgColor: 'rgba(180, 83, 9, 0.15)',
    borderColor: '#92400E',
    shapeName: 'square',
    shortCode: 'INF',
    description: 'Cracked bridge handrails, damaged concrete barriers, and collapsed public bus shelters',
    svgIcon: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6M9 18h6" stroke="currentColor" stroke-width="2"/>',
  },
  footpath: {
    id: 'footpath',
    label: 'Damaged Sidewalks & Footpaths',
    color: '#D97706', // Amber
    bgColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: '#B45309',
    shapeName: 'hexagon',
    shortCode: 'FTP',
    description: 'Missing pavement cover slabs, root-heaved paver blocks, and fall hazards',
    svgIcon: '<path d="M4 19h16M7 5v14M17 5v14M7 10h10M7 14h10" stroke="currentColor" stroke-width="2"/>',
  },
  sanitation: {
    id: 'sanitation',
    label: 'Public Sanitation & Restrooms',
    color: '#10B981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#059669',
    shapeName: 'circle',
    shortCode: 'SAN',
    description: 'Unsanitary municipal toilet blocks, non-functional taps, and broken washroom facilities',
    svgIcon: '<path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-1V7a5 5 0 00-5-5z" stroke="currentColor" stroke-width="2"/>',
  },
  park: {
    id: 'park',
    label: 'Park & Horticulture Maintenance',
    color: '#84CC16', // Lime
    bgColor: 'rgba(132, 204, 22, 0.15)',
    borderColor: '#65A30D',
    shapeName: 'octagon',
    shortCode: 'PRK',
    description: 'Uprooted tree branches, damaged children park swings, and overgrown public weeds',
    svgIcon: '<path d="M12 2L7 10h3l-3 7h10l-3-7h3L12 2zM12 17v5" stroke="currentColor" stroke-width="2"/>',
  },
  noise: {
    id: 'noise',
    label: 'Noise & Public Nuisance',
    color: '#F43F5E', // Rose
    bgColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#E11D48',
    shapeName: 'triangle',
    shortCode: 'NOI',
    description: 'Commercial diesel generator noise post-midnight and high-decibel environmental violations',
    svgIcon: '<path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="currentColor" stroke-width="2"/>',
  },
  stray_animal: {
    id: 'stray_animal',
    label: 'Stray-Animal Concerns',
    color: '#6366F1', // Indigo
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#4F46E5',
    shapeName: 'circle',
    shortCode: 'STR',
    description: 'Rabid stray dog packs, injured animals blocking traffic, and veterinary rescue calls',
    svgIcon: '<circle cx="12" cy="14" r="4" stroke="currentColor" stroke-width="2"/><circle cx="7" cy="8" r="2" fill="currentColor"/><circle cx="17" cy="8" r="2" fill="currentColor"/><circle cx="12" cy="5" r="2" fill="currentColor"/>',
  },
  other: {
    id: 'other',
    label: 'Other / Unclassified Issue',
    color: '#64748B', // Slate Grey
    bgColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#475569',
    shapeName: 'square',
    shortCode: 'OTH',
    description: 'Custom citizen complaints and unlisted municipal operational vectors',
    svgIcon: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2"/>',
  },
};

export const ALL_CATEGORIES = Object.values(CATEGORY_PALETTE);

export function getCategoryConfig(categoryKey?: string | null): CategoryConfig {
  if (!categoryKey) return CATEGORY_PALETTE.other;
  const key = categoryKey.toLowerCase().trim();
  if (CATEGORY_PALETTE[key]) return CATEGORY_PALETTE[key];

  // Partial substring match
  if (key.includes('pothole') || key.includes('road')) return CATEGORY_PALETTE.pothole;
  if (key.includes('light') || key.includes('electric')) return CATEGORY_PALETTE.streetlight;
  if (key.includes('garbage') || key.includes('waste')) return CATEGORY_PALETTE.garbage;
  if (key.includes('water_leak') || key.includes('pipe') || key.includes('leak')) return CATEGORY_PALETTE.water_leak;
  if (key.includes('drain') || key.includes('sewer')) return CATEGORY_PALETTE.drainage;
  if (key.includes('waterlog') || key.includes('flood')) return CATEGORY_PALETTE.waterlogging;
  if (key.includes('traffic') || key.includes('signal')) return CATEGORY_PALETTE.traffic_signal;
  if (key.includes('infra') || key.includes('bridge')) return CATEGORY_PALETTE.infrastructure;
  if (key.includes('footpath') || key.includes('sidewalk')) return CATEGORY_PALETTE.footpath;
  if (key.includes('toilet') || key.includes('sanitation')) return CATEGORY_PALETTE.sanitation;
  if (key.includes('park') || key.includes('tree')) return CATEGORY_PALETTE.park;
  if (key.includes('noise') || key.includes('nuisance')) return CATEGORY_PALETTE.noise;
  if (key.includes('animal') || key.includes('dog') || key.includes('cattle')) return CATEGORY_PALETTE.stray_animal;

  return CATEGORY_PALETTE.other;
}

export function getCategoryColor(categoryKey?: string | null): string {
  return getCategoryConfig(categoryKey).color;
}
