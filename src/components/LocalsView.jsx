import { useState } from 'react';
import AllPubsMap from './AllPubsMap';
import { fmtDate, fmtTime, fmtMoney } from '../lib/format';

function Tile({ value, label }) {
  return (
    <div className="stat-tile">
      <div className="st-val">{value}</div>
      <div className="st-lbl">{label}</div>
    </div>
  );
}

function Local({ pub }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`local${open ? ' open' : ''}`}>
      <button type="button" className="local-head" onClick={() => setOpen((o) => !o)}>
        <div className="local-titles">
          <div className="local-name">🍺 {pub.name}</div>
          <div className="local-sub">
            {pub.visits} visit{pub.visits === 1 ? '' : 's'}
            {pub.avgPrice != null ? ` · avg ${fmtMoney(pub.avgPrice)}/pt` : ''}
            {pub.avgVibe != null ? ` · ${pub.avgVibe.toFixed(1)}★` : ''}
          </div>
        </div>
        <span className="local-spent">{pub.spend > 0 ? fmtMoney(pub.spend) : ''}</span>
        <span className="local-chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="local-body">
          <div className="panel-tiles">
            <Tile value={pub.visits} label="Visits" />
            <Tile value={pub.pints} label="Pints" />
            <Tile value={fmtTime(pub.mins)} label="Time" />
            <Tile value={pub.spend > 0 ? fmtMoney(pub.spend) : '—'} label="Spent" />
            <Tile value={pub.avgPrice != null ? fmtMoney(pub.avgPrice) : '—'} label="Avg pint" />
            <Tile value={pub.avgVibe != null ? `${pub.avgVibe.toFixed(1)}★` : '—'} label="Avg vibe" />
          </div>

          {pub.lat != null && pub.lon != null && (
            <div className="map-stage locals-map">
              <AllPubsMap pubs={[pub]} />
            </div>
          )}

          <h4 className="panel-sub">Visit log</h4>
          <ul className="visit-log">
            {pub.log.map((v, i) => (
              <li key={i}>
                <span className="vl-date">{fmtDate(v.date)}</span>
                {v.sessionName ? <span className="vl-name">{v.sessionName}</span> : null}
                <span className="vl-meta">
                  {v.pints}🍺 · {fmtTime(v.mins)}
                  {v.priced ? ` · ${fmtMoney(v.spend)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function LocalsView({ insights }) {
  const { locals, geoPubs } = insights;

  return (
    <main className="wrap">
      <section className="card">
        <div className="section-title">My Locals</div>
        {locals.length === 0 ? (
          <p className="price-hint">Finish a crawl and the pubs you visit will build up here — tap any one to see your full history with it. 🍻</p>
        ) : (
          <>
            {geoPubs.length > 0 && (
              <div className="map-stage locals-map" style={{ marginBottom: 16 }}>
                <AllPubsMap pubs={geoPubs} />
              </div>
            )}
            <div className="locals-list">
              {locals.map((p) => (
                <Local key={p.name} pub={p} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
