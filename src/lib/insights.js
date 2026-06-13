import { computeStats } from '../hooks/usePubs';
import { crowDistance } from './geo';

// Use the stored walking distance if we have it, else a crow-flies estimate.
function sessionMeters(s) {
  if (s.walk?.meters != null) return s.walk.meters;
  const geo = s.pubs.filter((p) => p.lat != null && p.lon != null);
  return geo.length >= 2 ? crowDistance(geo) : 0;
}

function computeBadges(totals, bests) {
  return [
    { id: 'first', emoji: '🍺', label: 'First Round', desc: 'Finish your first crawl', earned: totals.crawls >= 1 },
    { id: 'regular', emoji: '🪪', label: 'Regular', desc: 'Log 5 crawls', earned: totals.crawls >= 5 },
    { id: 'marathon', emoji: '🏃', label: 'Pub Marathon', desc: '5+ pubs in one night', earned: bests.mostPubs >= 5 },
    { id: 'explorer', emoji: '🧭', label: 'Explorer', desc: 'Visit 10 different pubs', earned: totals.uniquePubs >= 10 },
    { id: 'century', emoji: '💯', label: 'Century Club', desc: '100 pints all-time', earned: totals.pints >= 100 },
    { id: 'hauler', emoji: '🥾', label: 'Long Hauler', desc: '3+ km in one night', earned: bests.furthestMeters >= 3000 },
    { id: 'trail', emoji: '🗺️', label: 'Trailblazer', desc: '10 km walked all-time', earned: totals.meters >= 10000 },
    { id: 'night', emoji: '🌙', label: 'All-Nighter', desc: 'A 5-hour crawl', earned: bests.longestMins >= 300 },
  ];
}

/**
 * Aggregate every finished crawl into all-time totals, personal bests,
 * per-pub averages (incl. mean pint price), badges, and the set of
 * geocoded pubs for the "your locals" map.
 */
export function computeInsights(history) {
  const totals = { crawls: history.length, stops: 0, uniquePubs: 0, pints: 0, mins: 0, meters: 0, spend: 0 };
  const bests = { mostPubs: 0, mostPints: 0, longestMins: 0, furthestMeters: 0, biggestSpend: 0, bestPace: 0 };
  const pubMap = new Map();

  history.forEach((s) => {
    const st = computeStats(s.pubs);
    totals.stops += st.count;
    totals.pints += st.pints;
    totals.mins += st.mins;
    totals.spend += st.spend;
    const m = sessionMeters(s);
    totals.meters += m;

    bests.mostPubs = Math.max(bests.mostPubs, st.count);
    bests.mostPints = Math.max(bests.mostPints, st.pints);
    bests.longestMins = Math.max(bests.longestMins, st.mins);
    bests.furthestMeters = Math.max(bests.furthestMeters, m);
    bests.biggestSpend = Math.max(bests.biggestSpend, st.spend);
    bests.bestPace = Math.max(bests.bestPace, st.mins ? st.pints / (st.mins / 60) : 0);

    s.pubs.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      let e = pubMap.get(key);
      if (!e) {
        e = { name: p.name, visits: 0, pints: 0, mins: 0, spend: 0, priceSum: 0, priceN: 0, vibeSum: 0, vibeN: 0, lat: null, lon: null, log: [] };
        pubMap.set(key, e);
      }
      const stopSpend = p.pricePerPint != null ? (+p.pints || 0) * p.pricePerPint : 0;
      e.visits += 1;
      e.pints += +p.pints || 0;
      e.mins += +p.mins || 0;
      e.spend += stopSpend;
      if (p.pricePerPint != null) {
        e.priceSum += p.pricePerPint;
        e.priceN += 1;
      }
      if (p.vibe) {
        e.vibeSum += p.vibe;
        e.vibeN += 1;
      }
      if (p.lat != null && p.lon != null && e.lat == null) {
        e.lat = p.lat;
        e.lon = p.lon;
      }
      e.log.push({
        date: s.startedAt || s.endedAt,
        sessionId: s.id,
        sessionName: s.name || null,
        pints: +p.pints || 0,
        mins: +p.mins || 0,
        spend: stopSpend,
        priced: p.pricePerPint != null,
        vibe: p.vibe || null,
      });
    });
  });

  // Rich per-pub records for the "My Locals" view.
  const locals = [...pubMap.values()]
    .map((e) => ({
      name: e.name,
      visits: e.visits,
      pints: e.pints,
      mins: e.mins,
      spend: e.spend,
      avgPrice: e.priceN ? e.priceSum / e.priceN : null,
      avgVibe: e.vibeN ? e.vibeSum / e.vibeN : null,
      lat: e.lat,
      lon: e.lon,
      log: e.log.sort((a, b) => b.date - a.date),
    }))
    .sort((a, b) => b.visits - a.visits || b.spend - a.spend);

  totals.uniquePubs = locals.length;

  const priced = locals.filter((p) => p.avgPrice != null).sort((a, b) => a.avgPrice - b.avgPrice);
  const avgPrice = priced.length ? priced.reduce((s, p) => s + p.avgPrice, 0) / priced.length : null;

  return {
    totals,
    bests,
    locals,
    priced,
    avgPrice,
    geoPubs: locals.filter((p) => p.lat != null && p.lon != null),
    badges: computeBadges(totals, bests),
  };
}
