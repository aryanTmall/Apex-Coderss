import L from 'leaflet';

export type MapTileStyle = 'google' | 'osm' | 'dark' | 'satellite';

export interface MapLayerConfig {
  id: MapTileStyle;
  label: string;
  url: string;
  subdomains?: string | string[];
  maxZoom: number;
  attribution: string;
}

export const MAP_LAYERS: Record<MapTileStyle, MapLayerConfig> = {
  google: {
    id: 'google',
    label: 'Google Maps',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  osm: {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  },
  dark: {
    id: 'dark',
    label: 'Dark Tactical',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri',
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Satellite',
  },
};

export function createTileLayer(style: MapTileStyle = 'google'): L.TileLayer {
  const cfg = MAP_LAYERS[style] || MAP_LAYERS.google;
  return L.tileLayer(cfg.url, {
    maxZoom: cfg.maxZoom,
    subdomains: cfg.subdomains || 'abc',
    attribution: cfg.attribution,
  });
}
