// Geolocation helpers: distance maths + nearby-pub lookup via OpenStreetMap.

// Great-circle distance between two {lat, lon} points, in metres.
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Public Overpass mirrors — we try them in order if one is busy/rate-limited.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function parseElements(elements, lat, lon) {
  const here = { lat, lon };
  const pubs = (elements || [])
    .map((el) => {
      const plat = el.lat ?? el.center?.lat;
      const plon = el.lon ?? el.center?.lon;
      const name = el.tags?.name;
      if (plat == null || plon == null || !name) return null;
      return { id: `${el.type}/${el.id}`, name, lat: plat, lon: plon, dist: distanceMeters(here, { lat: plat, lon: plon }) };
    })
    .filter(Boolean);

  // Dedupe by name (a place is often mapped twice as node + way).
  const seen = new Set();
  const unique = pubs.filter((p) => {
    const key = p.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => a.dist - b.dist);
  return unique.slice(0, 10);
}

/**
 * Look up pubs/bars near a coordinate using the free Overpass API
 * (OpenStreetMap data — no API key required). Returns up to 10 results
 * sorted by distance: { id, name, lat, lon, dist }.
 */
export async function fetchNearbyPubs(lat, lon, radius = 600) {
  const filter = '["amenity"~"^(pub|bar|biergarten)$"]';
  const query = `[out:json][timeout:15];(
    node${filter}(around:${radius},${lat},${lon});
    way${filter}(around:${radius},${lat},${lon});
  );out center tags;`;
  const body = 'data=' + encodeURIComponent(query);

  // Fire all mirrors at once and take whichever responds first — this avoids
  // long waits when one server happens to be busy/rate-limited.
  const attempts = ENDPOINTS.map((url) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).then(
      async (res) => {
        if (!res.ok) throw new Error(`Overpass ${res.status}`);
        const json = await res.json();
        return parseElements(json.elements, lat, lon);
      }
    )
  );

  return Promise.any(attempts); // rejects with AggregateError only if all fail
}

const FOOT_ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot/';

/**
 * Walking route through an ordered list of {lat, lon} points.
 * Returns { coordinates:[[lon,lat]...], meters, seconds } or null.
 */
export async function fetchFootRoute(geoPubs) {
  if (geoPubs.length < 2) return null;
  const coords = geoPubs.map((p) => `${p.lon},${p.lat}`).join(';');
  const res = await fetch(`${FOOT_ROUTER}${coords}?overview=full&geometries=geojson`);
  if (!res.ok) throw new Error(`route ${res.status}`);
  const data = await res.json();
  const r = data?.routes?.[0];
  if (!r?.geometry?.coordinates?.length) return null;
  return { coordinates: r.geometry.coordinates, meters: r.distance, seconds: r.duration };
}

// Sum of straight-line hops — a fast, offline fallback for total distance.
export function crowDistance(geoPubs) {
  let m = 0;
  for (let i = 1; i < geoPubs.length; i++) m += distanceMeters(geoPubs[i - 1], geoPubs[i]);
  return m;
}
