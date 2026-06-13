import { useMemo, useRef } from 'react';
import AllPubsMap from './AllPubsMap';
import { computeInsights } from '../lib/insights';
import { fmtTime, fmtDist, fmtMoney } from '../lib/format';

function Tile({ value, label }) {
  return (
    <div className="stat-tile">
      <div className="st-val">{value}</div>
      <div className="st-lbl">{label}</div>
    </div>
  );
}

export default function StatsPanel({ history, exportData, importData }) {
  const insights = useMemo(() => computeInsights(history), [history]);
  const fileRef = useRef(null);

  if (!history.length) return null;

  const { totals, bests, badges, priced, avgPrice, geoPubs } = insights;

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pubtrail-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!confirm('Import this backup? It will replace your current data.')) return;
        if (!importData(parsed)) alert('That file doesn’t look like a PubTrail backup.');
      } catch {
        alert('Could not read that file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="card stats-panel">
      <div className="section-title">Your Stats</div>

      <h4 className="panel-sub">All-time</h4>
      <div className="panel-tiles">
        <Tile value={totals.crawls} label="Crawls" />
        <Tile value={totals.uniquePubs} label="Pubs" />
        <Tile value={totals.pints} label="Pints" />
        <Tile value={fmtTime(totals.mins)} label="Time" />
        <Tile value={totals.meters ? fmtDist(totals.meters) : '—'} label="Walked" />
        <Tile value={totals.spend ? fmtMoney(totals.spend) : '—'} label="Spent" />
      </div>

      <h4 className="panel-sub">Personal bests</h4>
      <div className="panel-tiles">
        <Tile value={bests.mostPubs} label="Pubs / night" />
        <Tile value={bests.mostPints} label="Pints / night" />
        <Tile value={fmtTime(bests.longestMins)} label="Longest" />
        <Tile value={bests.furthestMeters ? fmtDist(bests.furthestMeters) : '—'} label="Furthest" />
        <Tile value={bests.biggestSpend ? fmtMoney(bests.biggestSpend) : '—'} label="Big night" />
        <Tile value={bests.bestPace ? bests.bestPace.toFixed(1) : '—'} label="Best pace" />
      </div>

      <h4 className="panel-sub">Badges</h4>
      <div className="badges">
        {badges.map((b) => (
          <div key={b.id} className={`badge${b.earned ? ' earned' : ''}`} title={b.desc}>
            <span className="badge-emoji">{b.emoji}</span>
            <span className="badge-label">{b.label}</span>
          </div>
        ))}
      </div>

      <h4 className="panel-sub">Pint price guide</h4>
      {priced.length ? (
        <>
          {avgPrice != null && <p className="price-avg">Your average pint: <b>{fmtMoney(avgPrice)}</b></p>}
          <ul className="price-list">
            {priced.map((p) => (
              <li key={p.name}>
                <span className="pl-name">{p.name}</span>
                <span className="pl-visits">{p.visits}×</span>
                <span className="pl-price">{fmtMoney(p.avgPrice)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="price-hint">Add a price per pint when you check in and a guide to your pubs will build up here. 🍺</p>
      )}

      {geoPubs.length > 0 && (
        <>
          <h4 className="panel-sub">Your locals</h4>
          <div className="map-stage locals-map">
            <AllPubsMap pubs={geoPubs} />
          </div>
        </>
      )}

      <h4 className="panel-sub">Your data</h4>
      <div className="data-row">
        <button className="btn ghost" onClick={doExport}>⬇️ Export backup</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>⬆️ Import backup</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onFile} />
      </div>
    </section>
  );
}
