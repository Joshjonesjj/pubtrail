import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Marker sized a touch by how often you've been there.
function pubIcon(visits) {
  const big = visits > 1;
  return L.divIcon({
    className: 'pt-pin',
    html: `<div class="pt-pin-inner${big ? ' current' : ''}" style="width:${big ? 30 : 24}px;height:${big ? 30 : 24}px;font-size:${big ? 13 : 11}px">🍺</div>`,
    iconSize: [big ? 30 : 24, big ? 30 : 24],
    iconAnchor: [big ? 15 : 12, big ? 15 : 12],
  });
}

// A dark map pinning every distinct pub you've checked into.
export default function AllPubsMap({ pubs }) {
  const elRef = useRef(null);

  useEffect(() => {
    const geo = pubs.filter((p) => p.lat != null && p.lon != null);
    const map = L.map(elRef.current, { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    if (geo.length) {
      geo.forEach((p) => {
        L.marker([p.lat, p.lon], { icon: pubIcon(p.visits) })
          .addTo(map)
          .bindTooltip(`${p.name} · ${p.visits} visit${p.visits === 1 ? '' : 's'}`, { direction: 'top', offset: [0, -12] });
      });
      map.fitBounds(L.latLngBounds(geo.map((p) => [p.lat, p.lon])), { padding: [44, 44], maxZoom: 16 });
    } else {
      map.setView([51.5074, -0.1278], 12);
    }
    setTimeout(() => map.invalidateSize(), 60);
    return () => map.remove();
  }, [pubs]);

  return <div ref={elRef} className="map-leaflet" />;
}
