import { fmtTime } from '../lib/format';

// The Strava-style headline metrics.
export default function StatGrid({ stats }) {
  const items = [
    { num: stats.count, lbl: 'Pubs' },
    { num: stats.pints, lbl: 'Pints' },
    { num: stats.mins ? fmtTime(stats.mins) : '0m', lbl: 'On the lash' },
    { num: stats.pace, lbl: 'Pints / hr' },
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
