import L from 'leaflet';

// OpenStreetMap's own raster tiles: free, no key. They're a light style, so CSS
// darkens them to match the app (see `.map-leaflet .leaflet-tile-pane`).
// Carto's dark tiles, used before, started serving "API key required"
// placeholders in 2026.
export function addBaseMap(map) {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);
}
