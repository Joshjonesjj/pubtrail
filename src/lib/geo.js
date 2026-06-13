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

/**
 * Look up pubs/bars near a coordinate using the free Overpass API
 * (OpenStreetMap data — no API key required). Returns up to 10 results
 * sorted by distance: { id, name, lat, lon, dist }.
 */
export async function fetchNearbyPubs(lat, lon, radius = 600) {
  const filter = '["amenity"~"^(pub|bar|biergarten)$"]';
  const query = `[out:json][timeout:20];(
    node${filter}(around:${radius},${lat},${lon});
    way${filter}(around:${radius},${lat},${lon});
  );out center tags;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);

  const json = await res.json();
  const here = { lat, lon };

  const pubs = (json.elements || [])
    .map((el) => {
      const plat = el.lat ?? el.center?.lat;
      const plon = el.lon ?? el.center?.lon;
      const name = el.tags?.name;
      if (plat == null || plon == null || !name) return null;
      return { id: `${el.type}/${el.id}`, name, lat: plat, lon: plon, dist: distanceMeters(here, { lat: plat, lon: plon }) };
    })
    .filter(Boolean);

  // Dedupe by name (chains / mapped twice as node + way).
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
