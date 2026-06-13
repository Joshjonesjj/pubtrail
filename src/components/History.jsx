import { useState } from 'react';
import RouteMap from './RouteMap';
import { computeStats } from '../hooks/usePubs';
import { fmtDate, fmtTime } from '../lib/format';

// One archived crawl: summary row that expands to show its route + stops.
function Session({ session, onDelete }) {
  const [open, setOpen] = useState(false);
  const stats = computeStats(session.pubs);

  return (
    <div className={`session${open ? ' open' : ''}`}>
      <button type="button" className="session-head" onClick={() => setOpen((o) => !o)}>
        <div className="session-when">
          <span className="session-date">{fmtDate(session.startedAt || session.endedAt)}</span>
          <span className="session-sub">{stats.count} pubs · {stats.pints} pints · {fmtTime(stats.mins)}</span>
        </div>
        <span className="session-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="session-body">
          <RouteMap pubs={session.pubs} />
          <ul className="session-stops">
            {session.pubs.map((p, i) => (
              <li key={p.id}>
                <span className="ss-n">{i + 1}</span>
                <span className="ss-name">{p.name}</span>
                <span className="ss-meta">{p.pints}🍺 · {fmtTime(p.mins)}</span>
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

export default function History({ history, onDelete }) {
  if (!history.length) return null;
  return (
    <section className="card history-card">
      <div className="section-title">Past Crawls</div>
      <div className="history">
        {history.map((s) => (
          <Session key={s.id} session={s} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}
