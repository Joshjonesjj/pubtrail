// Encode/decode a planned crawl to a short URL-safe code so it can be shared
// as a link that loads the route on a friend's phone.

function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(code) {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

export function encodePlan(plan) {
  const compact = plan.map((p) => [Number(p.lat.toFixed(5)), Number(p.lon.toFixed(5)), p.name]);
  return toBase64Url(JSON.stringify(compact));
}

export function decodePlan(code) {
  try {
    const arr = JSON.parse(fromBase64Url(code));
    if (!Array.isArray(arr)) return null;
    return arr
      .map(([lat, lon, name], i) => ({ id: `p${i}_${lat}_${lon}`, lat, lon, name: name || 'Pub' }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  } catch {
    return null;
  }
}

export function planLink(plan) {
  return `${location.origin}${location.pathname}?plan=${encodePlan(plan)}`;
}
