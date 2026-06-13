import { usePubs, computeStats } from './hooks/usePubs';
import { useScrollProgress } from './hooks/useScrollProgress';
import { useNow } from './hooks/useNow';
import AmbientBubbles from './components/AmbientBubbles';
import ScrollProgress from './components/ScrollProgress';
import Hero from './components/Hero';
import StatGrid from './components/StatGrid';
import RouteMap from './components/RouteMap';
import ActivePub from './components/ActivePub';
import CheckInForm from './components/CheckInForm';
import Timeline from './components/Timeline';
import History from './components/History';

export default function App() {
  const {
    pubs,
    active,
    history,
    lastAddedId,
    checkIn,
    addPint,
    setPints,
    setActiveVibe,
    setActiveNotes,
    checkOut,
    finishSession,
    deleteSession,
    removePub,
    loadDemo,
    clearAll,
  } = usePubs();

  const progress = useScrollProgress();
  const now = useNow(!!active); // ticks each second while you're in a pub

  const stats = computeStats(pubs, active, now);
  const started = !!active || pubs.length > 0; // hide stats/map until the first check-in

  // Show where you are now as the latest pin on the route.
  const routePubs = active
    ? [...pubs, { id: '__active', name: active.name, pints: active.pints, mins: 0, vibe: active.vibe, lat: active.lat, lon: active.lon }]
    : pubs;

  return (
    <>
      {/* Shared gradient used by every inline beer-mug glyph. */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="beerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd86b" />
            <stop offset="100%" stopColor="#e08c1a" />
          </linearGradient>
        </defs>
      </svg>

      <ScrollProgress progress={progress} />
      <AmbientBubbles />

      <Hero />

      <main className="wrap">
        {started && <StatGrid stats={stats} />}
        {started && <RouteMap pubs={routePubs} />}

        {active ? (
          <ActivePub
            active={active}
            now={now}
            onAddPint={addPint}
            onSetPints={setPints}
            onSetVibe={setActiveVibe}
            onSetNotes={setActiveNotes}
            onCheckOut={checkOut}
          />
        ) : (
          <>
            <CheckInForm onCheckIn={checkIn} continuing={pubs.length > 0} />
            {pubs.length > 0 && (
              <section className="card endnight-card">
                <div className="endnight-row">
                  <div>
                    <div className="en-title">Done for the night?</div>
                    <div className="en-sub">Save this crawl to your history and start fresh.</div>
                  </div>
                  <button
                    className="btn finish"
                    onClick={() => {
                      if (confirm('End the night and save this crawl to your history?')) finishSession();
                    }}
                  >
                    🏁 End the night
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        <Timeline pubs={pubs} lastAddedId={lastAddedId} onRemove={removePub} onLoadDemo={loadDemo} onClear={clearAll} />
        <History history={history} onDelete={deleteSession} />
      </main>

      <footer>
        Built for the love of the local. Your crawl is saved in this browser only — nothing leaves your device. <br />
        <b>PubTrail</b> · drink responsibly, walk it off. 🚶‍♂️🍻
      </footer>
    </>
  );
}
