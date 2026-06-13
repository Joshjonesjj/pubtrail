import { fmtTime } from '../lib/format';

// The Strava-style headline metrics. `extra` appends live tiles (e.g. distance,
// spend) when that data is available mid-crawl.
export default function StatGrid({ stats, extra = [] }) {
  const items = [
    { num: stats.count, lbl: 'Pubs' },
    { num: stats.pints, lbl: 'Pints' },
    { num: stats.mins ? fmtTime(stats.mins) : '0m', lbl: 'On the lash' },
    { num: stats.pace, lbl: 'Pints / hr' },
    ...extra,
  ];
  return (
    <section className="stats card">
      {items.map((s) => (
        <div className="stat" key={s.lbl}>
          <div className="num">{s.num}</div>
          <div className="lbl">{s.lbl}</div>
        </div>
      ))}
    </section>
  );
}
