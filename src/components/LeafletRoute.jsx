import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Numbered amber pin (no image assets — avoids Leaflet's bundler icon issue).
function numberedIcon(n, current) {
  return L.divIcon({
    className: 'pt-pin',
    html: `<div class="pt-pin-inner${current ? ' current' : ''}">${n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

const FOOT_ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/';

/**
 * Real OpenStreetMap (dark) map with the pub stops as pins and the genuine
 * walking path between them (falls back to a straight line if routing fails).
 */
export default function LeafletRoute({ pubs }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const pubsRef = useRef(pubs);
  pubsRef.current = pubs;

  // Only re-run the heavy update when the geocoded stops actually change
  // (not on every parent re-render, e.g. the per-second live timer tick).
  const sig = useMemo(
    () =>
      pubs
        .filter((p) => p.lat != null && p.lon != null)
        .map((p) => `${p.id}:${p.lat.toFixed(5)},${p.lon.toFixed(5)}`)
        .join('|'),
    [pubs]
  );

  // Create the map once.
  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);
    map.setView([51.5074, -0.1278], 13);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Draw pins + route whenever the set of geocoded stops changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const geo = pubsRef.current.filter((p) => p.lat != null && p.lon != null);
    if (!geo.length) return;

    geo.forEach((p, i) => {
      L.marker([p.lat, p.lon], { icon: numberedIcon(i + 1, p.id === '__active') })
        .addTo(layer)
        .bindTooltip(p.name, { direction: 'top', offset: [0, -14] });
    });

    const pinBounds = L.latLngBounds(geo.map((p) => [p.lat, p.lon]));
    map.invalidateSize();
    map.fitBounds(pinBounds, { padding: [44, 44], maxZoom: 17 });

    if (geo.length < 2) return;

    // Straight dashed line as an instant fallback while the route loads.
    const fallback = L.polyline(geo.map((p) => [p.lat, p.lon]), {
      color: '#ffcf5c',
      weight: 3,
      opacity: 0.45,
      dashArray: '4 8',
    }).addTo(layer);

    let cancelled = false;
    const coords = geo.map((p) => `${p.lon},${p.lat}`).join(';');
    fetch(`${FOOT_ROUTER}${coords}?overview=full&geometries=geojson`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('route failed'))))
      .then((data) => {
        if (cancelled) return;
        const line = data?.routes?.[0]?.geometry?.coordinates;
        if (!line?.length) return;
        layer.removeLayer(fallback);
        const latlngs = line.map(([lon, lat]) => [lat, lon]);
        L.polyline(latlngs, { color: '#ffcf5c', weight: 9, opacity: 0.22 }).addTo(layer); // glow
        L.polyline(latlngs, { color: '#ffcf5c', weight: 4, opacity: 0.95 }).addTo(layer); // route
        map.fitBounds(L.latLngBounds(latlngs).extend(pinBounds), { padding: [44, 44], maxZoom: 17 });
      })
      .catch(() => {
        /* keep the straight-line fallback */
      });

    return () => {
      cancelled = true;
    };
  }, [sig]);

  return <div ref={elRef} className="map-leaflet" />;
}
