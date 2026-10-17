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

// Public Overpass mirrors. These are volunteer-run and come and go: by Oct 2026
// overpass-api.de answered 406 and the others flipped between working and
// 500/504 — so they're raced against Nominatim (below) rather than relied on.
const OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Abort a request that hangs, so one stuck server can't stall the search.
function fetchWithTimeout(url, opts = {}, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// Raw {id, name, lat, lon} candidates -> the 10 nearest unique pubs with `dist`.
function rankNearby(candidates, lat, lon) {
  const here = { lat, lon };
  const seen = new Set();
  return candidates
    .filter((p) => p.name && Number.isFinite(p.lat) && Number.isFinite(p.lon))
    .map((p) => ({ ...p, dist: distanceMeters(here, p) }))
    .sort((a, b) => a.dist - b.dist)
    .filter((p) => {
      // Dedupe by name (a place is often mapped twice, e.g. as node + way).
      const key = p.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

async function overpassPubs(url, lat, lon, radius) {
  const filter = '["amenity"~"^(pub|bar|biergarten)$"]';
  const query = `[out:json][timeout:15];(
    node${filter}(around:${radius},${lat},${lon});
    way${filter}(around:${radius},${lat},${lon});
  );out center tags;`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const json = await res.json();
  return (json.elements || []).map((el) => ({
    id: `${el.type}/${el.id}`,
    name: el.tags?.name,
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
  }));
}

// Pubs inside a square box around a point, via OpenStreetMap's own Nominatim
// search (reliable, but capped at 40 results ranked by prominence, not distance).
async function nominatimBox(lat, lon, radius) {
  const dLat = radius / 111320;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const box = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].join(',');
  const res = await fetchWithTimeout(
    `https://nominatim.openstreetmap.org/search?format=json&limit=40&bounded=1&amenity=pub&viewbox=${box}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  return data.map((r) => ({ id: `${r.osm_type}/${r.osm_id}`, name: r.name, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
}

async function nominatimPubs(lat, lon, radius) {
  // Search tight first: that 40-result cap would otherwise drop the pub you're
  // standing in from a busy area. Widen only if very little is that close.
  const near = await nominatimBox(lat, lon, Math.min(radius, 250));
  if (near.length >= 5 || radius <= 250) return near;
  return [...near, ...(await nominatimBox(lat, lon, radius))];
}

/**
 * Pubs/bars near a coordinate from free OpenStreetMap services (no API key).
 * Returns up to 10 results sorted by distance: { id, name, lat, lon, dist },
 * [] if the area genuinely has none, and throws only if every source fails.
 */
export async function fetchNearbyPubs(lat, lon, radius = 600) {
  let answered = false;
  const keep = (list) => {
    answered = true;
    const ranked = rankNearby(list, lat, lon);
    if (!ranked.length) throw new Error('no results');
    return ranked;
  };

  const overpass = Promise.any(OVERPASS.map((url) => overpassPubs(url, lat, lon, radius).then(keep)));
  const nominatim = nominatimPubs(lat, lon, radius).then(keep);

  // Overpass has the most complete data, so prefer it — but if Nominatim
  // answers first, only give Overpass a moment longer before using Nominatim.
  const best = await Promise.any([
    overpass,
    nominatim.then((list) =>
      Promise.race([overpass, delay(1500)]).then(
        (op) => op ?? list,
        () => list
      )
    ),
  ]).catch(() => null);

  if (best) return best;
  if (answered) return []; // sources replied, there's just nothing nearby
  throw new Error('All pub sources failed');
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

/**
 * Geocode a place/area name to a coordinate via OpenStreetMap Nominatim
 * (keyless). Returns { lat, lon, label } or null.
 */
export async function geocodePlace(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocode ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  const r = data[0];
  return { lat: parseFloat(r.lat), lon: parseFloat(r.lon), label: r.display_name };
}
