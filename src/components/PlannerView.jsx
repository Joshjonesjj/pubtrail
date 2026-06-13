import { useMemo, useState } from 'react';
import LeafletRoute from './LeafletRoute';
import { fetchNearbyPubs, geocodePlace } from '../lib/geo';
import { planLink } from '../lib/plan';
import { fmtDist, fmtWalk, fmtMoney } from '../lib/format';

export default function PlannerView({ insights, plan, addStop, removeStop, move, clearPlan }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | locating | searching | done | error
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Average pint price per pub from your own history, keyed by name.
  const priceByName = useMemo(() => {
    const m = new Map();
    insights.locals.forEach((l) => l.avgPrice != null && m.set(l.name.trim().toLowerCase(), l.avgPrice));
    return m;
  }, [insights]);

  const planPriced = plan.map((s) => ({ ...s, avgPrice: priceByName.get(s.name.trim().toLowerCase()) ?? null }));
  const known = planPriced.filter((s) => s.avgPrice != null);
  const estRound = known.reduce((a, b) => a + b.avgPrice, 0);
  const estPint = known.length ? estRound / known.length : null;
  const planIds = new Set(plan.map((s) => s.id));

  const runSearch = async (lat, lon) => {
    setStatus('searching');
    setError('');
    try {
      const list = await fetchNearbyPubs(lat, lon, 1200);
      setResults(list);
      setStatus('done');
      if (!list.length) setError('No pubs found around there. Try a different area.');
    } catch {
      setStatus('error');
      setError('Search failed — try again in a moment.');
    }
  };

  const searchPlace = async () => {
    if (!query.trim()) return;
    setStatus('searching');
    setError('');
    try {
      const place = await geocodePlace(query.trim());
      if (!place) {
        setStatus('error');
        setError('Couldn’t find that place — try being more specific.');
        return;
      }
      await runSearch(place.lat, place.lon);
    } catch {
      setStatus('error');
      setError('Search failed — try again in a moment.');
    }
  };

  const searchNearMe = () => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('This device doesn’t support location.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => runSearch(pos.coords.latitude, pos.coords.longitude),
      () => {
        setStatus('error');
        setError('Location denied — search by place name instead.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  };

  const share = async () => {
    const link = planLink(plan);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My PubTrail plan', text: 'Join my pub crawl 🍻', url: link });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      prompt('Copy this plan link:', link);
    }
  };

  const busy = status === 'locating' || status === 'searching';

  return (
    <main className="wrap">
      <section className="card">
        <div className="section-title">Pint Planning</div>
        <p className="checkin-hint">Build a crawl before you head out — search an area, add stops in order, and see the walking route and rough cost. 🗺️</p>

        <div className="plan-search">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
            placeholder="Search a place or area (e.g. Camden, London)"
          />
          <button className="btn" onClick={searchPlace} disabled={busy}>Search</button>
        </div>
        <button className="btn ghost nearby-btn" onClick={searchNearMe} disabled={busy}>
          {status === 'locating' ? '📡 Locating…' : status === 'searching' ? '🔎 Searching…' : '📍 Search near me'}
        </button>
        {error && <div className="nearby-msg">{error}</div>}

        {status === 'done' && results.length > 0 && (
          <div className="nearby-list">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="nearby-item"
                onClick={() => addStop(p)}
                disabled={planIds.has(p.id)}
                title={`Add ${p.name} to your plan`}
              >
                <span className="nearby-name">🍺 {p.name}</span>
                <span className="nearby-dist">{planIds.has(p.id) ? 'added ✓' : fmtDist(p.dist)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {plan.length > 0 && (
        <section className="card">
          <div className="section-title">Your plan · {plan.length} stop{plan.length === 1 ? '' : 's'}</div>

          <ol className="plan-list">
            {planPriced.map((s, i) => (
              <li key={s.id}>
                <span className="pl-n">{i + 1}</span>
                <span className="pl-name">{s.name}</span>
                {s.avgPrice != null && <span className="pl-price">{fmtMoney(s.avgPrice)}/pt</span>}
                <span className="plan-actions">
                  <button className="del" title="Move up" onClick={() => move(s.id, -1)} disabled={i === 0}>↑</button>
                  <button className="del" title="Move down" onClick={() => move(s.id, 1)} disabled={i === plan.length - 1}>↓</button>
                  <button className="del" title="Remove" onClick={() => removeStop(s.id)}>✕</button>
                </span>
              </li>
            ))}
          </ol>

          <div className="plan-summary">
            {routeInfo && <span>🚶 {fmtDist(routeInfo.meters)} · {fmtWalk(routeInfo.seconds)} walk</span>}
            {estPint != null && <span>🍺 avg pint <b>{fmtMoney(estPint)}</b></span>}
            {known.length > 0 && (
              <span>💷 a pint at each priced stop ≈ <b>{fmtMoney(estRound)}</b> <small>({known.length}/{plan.length} from your history)</small></span>
            )}
          </div>

          <div className="map-stage" style={{ marginTop: 14 }}>
            <LeafletRoute pubs={plan} onInfo={setRouteInfo} />
          </div>

          <div className="data-row" style={{ marginTop: 14 }}>
            <button className="btn" onClick={share}>{copied ? 'Link copied ✓' : '🔗 Share plan'}</button>
            <button className="btn ghost" onClick={() => confirm('Clear this plan?') && clearPlan()}>Clear plan</button>
          </div>
          <p className="price-hint" style={{ marginTop: 10 }}>
            Sharing sends a link that loads this exact route on a friend’s phone.
          </p>
        </section>
      )}
    </main>
  );
}
