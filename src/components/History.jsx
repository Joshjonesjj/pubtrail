import { useState } from 'react';
import RouteMap from './RouteMap';
import { computeStats } from '../hooks/usePubs';
import { crowDistance } from '../lib/geo';
import { shareCrawl } from '../lib/shareCard';
import { fmtDate, fmtTime, fmtDist, fmtWalk } from '../lib/format';

// Mini route preview. Uses the real walking geometry when stored, else a
// straight crow-flies sketch between the stops.
function RouteThumb({ pubs, line }) {
  const geo = pubs.filter((p) => p.lat != null && p.lon != null);
  if (geo.length < 2) return null;

  const W = 132;
  const H = 76;
  const pad = 12;
  // Bounds taken from the route line if present, else the pub coords.
  const lonLat = line?.length ? line.map(([lon, lat]) => ({ lat, lon })) : geo;
  const minLat = Math.min(...lonLat.map((p) => p.lat));
  const maxLat = Math.max(...lonLat.map((p) => p.lat));
  const minLon = Math.min(...lonLat.map((p) => p.lon));
  const maxLon = Math.max(...lonLat.map((p) => p.lon));
  const spanLat = maxLat - minLat || 1e-6;
  const spanLon = maxLon - minLon || 1e-6;
  const project = (lat, lon) => ({
    x: pad + ((lon - minLon) / spanLon) * (W - pad * 2),
    y: pad + (1 - (lat - minLat) / spanLat) * (H - pad * 2),
  });

  const pathPts = line?.length ? line.map(([lon, lat]) => project(lat, lon)) : geo.map((p) => project(p.lat, p.lon));
  const dots = geo.map((p) => project(p.lat, p.lon));
  const d = pathPts.map((pt, i) => `${i ? 'L' : 'M'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`).join(' ');

  return (
    <svg className="route-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke="#ffcf5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      {dots.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={i === 0 ? '#6dd36d' : i === dots.length - 1 ? '#ff8a6b' : '#ffcf5c'} />
      ))}
    </svg>
  );
}

function Tile({ value, label }) {
  return (
    <div className="stat-tile">
      <div className="st-val">{value}</div>
      <div className="st-lbl">{label}</div>
    </div>
  );
}

// One archived crawl, presented as a workout-style recap.
function Session({ session, onDelete, onRename }) {
  const [open, setOpen] = useState(false);
  const stats = computeStats(session.pubs);
  const geo = session.pubs.filter((p) => p.lat != null && p.lon != null);

  const meters = session.walk?.meters ?? (geo.length >= 2 ? crowDistance(geo) : null);
  const distanceLabel = meters != null ? fmtDist(meters) : '—';
  const walkLabel = session.walk?.seconds != null ? fmtWalk(session.walk.seconds) : null;

  const topPub = [...session.pubs].sort((a, b) => b.pints - a.pints || (b.vibe || 0) - (a.vibe || 0))[0];
  const longest = [...session.pubs].sort((a, b) => b.mins - a.mins)[0];

  const rename = () => {
    const n = prompt('Name this crawl:', session.name || '');
    if (n !== null) onRename(session.id, n);
  };

  return (
    <div className={`session${open ? ' open' : ''}`}>
      <div className="session-headrow">
        <div className="session-titles">
          {session.name && <div className="session-name">{session.name}</div>}
          <div className="session-date">{fmtDate(session.startedAt || session.endedAt)}</div>
        </div>
        <div className="session-actions">
          <button className="icon-btn" title="Name this crawl" onClick={rename}>✎</button>
          <button className="icon-btn" title="Share" onClick={() => shareCrawl(session)}>📤</button>
        </div>
      </div>

      <div className="session-top">
        <RouteThumb pubs={session.pubs} line={session.walk?.coordinates} />
        <div className="session-summary">
          <div className="session-tiles">
            <Tile value={stats.count} label="Pubs" />
            <Tile value={stats.pints} label="Pints" />
            <Tile value={fmtTime(stats.mins)} label="Time" />
            <Tile value={stats.pace} label="Pints/hr" />
            <Tile value={distanceLabel} label="Distance" />
            {stats.spend > 0 ? <Tile value={`£${stats.spend.toFixed(2)}`} label="Spent" /> : walkLabel ? <Tile value={walkLabel} label="Walked" /> : null}
          </div>
        </div>
      </div>

      {(topPub || longest) && (
        <div className="session-highlights">
          {topPub && topPub.pints > 0 && (
            <span>🏆 Most pints: <b>{topPub.name}</b> ({topPub.pints})</span>
          )}
          {longest && longest.mins > 0 && (
            <span>⏱️ Longest stop: <b>{longest.name}</b> ({fmtTime(longest.mins)})</span>
          )}
        </div>
      )}

      <button type="button" className="session-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide details ▴' : 'Show route & stops ▾'}
      </button>

      {open && (
        <div className="session-body">
          <RouteMap pubs={session.pubs} />
          <ul className="session-stops">
            {session.pubs.map((p, i) => (
              <li key={p.id}>
                <span className="ss-n">{i + 1}</span>
                <span className="ss-name">{p.name}</span>
                <span className="ss-meta">
                  {p.pints}🍺 · {fmtTime(p.mins)}
                  {p.pricePerPint != null ? ` · £${p.pricePerPint.toFixed(2)}/pt` : ''}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn ghost session-del"
            onClick={() => {
              if (confirm('Delete this saved crawl?')) onDelete(session.id);
            }}
          >
            🗑️ Delete this crawl
          </button>
        </div>
      )}
    </div>
  );
}

export default function History({ history, onDelete, onRename }) {
  if (!history.length) return null;
  return (
    <section className="card history-card">
      <div className="section-title">Past Crawls</div>
      <div className="history">
        {history.map((s) => (
          <Session key={s.id} session={s} onDelete={onDelete} onRename={onRename} />
        ))}
      </div>
    </section>
  );
}
