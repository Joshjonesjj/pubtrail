// Small formatting helpers shared across components.

export function fmtTime(mins) {
  mins = Math.round(mins);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// e.g. "Sat 13 Jun 2026"
export function fmtDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Distance in metres -> friendly string.
export function fmtDist(m) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
