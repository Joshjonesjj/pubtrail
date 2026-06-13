import { usePubs } from './hooks/usePubs';
import { useScrollProgress } from './hooks/useScrollProgress';
import AmbientBubbles from './components/AmbientBubbles';
import ScrollProgress from './components/ScrollProgress';
import DrainingPint from './components/DrainingPint';
import Hero from './components/Hero';
import StatGrid from './components/StatGrid';
import RouteMap from './components/RouteMap';
import CheckInForm from './components/CheckInForm';
import Timeline from './components/Timeline';

export default function App() {
  const { pubs, stats, lastAddedId, addPub, removePub, loadDemo, clearAll } = usePubs();
  const progress = useScrollProgress();

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
      <DrainingPint progress={progress} />

      <Hero />

      <main className="wrap">
        <StatGrid stats={stats} />
        <RouteMap pubs={pubs} />
        <CheckInForm onAdd={addPub} />
        <Timeline
          pubs={pubs}
          lastAddedId={lastAddedId}
          onRemove={removePub}
          onLoadDemo={loadDemo}
          onClear={clearAll}
        />
      </main>

      <footer>
        Built for the love of the local. Your crawl is saved in this browser only — nothing leaves your device. <br />
        <b>PubTrail</b> · drink responsibly, walk it off. 🚶‍♂️🍻
      </footer>
    </>
  );
}
