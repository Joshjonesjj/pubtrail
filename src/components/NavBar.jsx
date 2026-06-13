import { useState } from 'react';

const ITEMS = [
  { id: 'crawl', emoji: '🍺', label: 'Just Crawl', desc: 'Pick a pub and start drinking' },
  { id: 'plan', emoji: '🗺️', label: 'Pint Planning', desc: 'Plan a route before you head out' },
  { id: 'locals', emoji: '🍻', label: 'My Locals', desc: 'Your pubs, spend & history' },
];

// Sticky top bar with a hamburger that opens a left-hand drawer for switching
// between the app's three modes.
export default function NavBar({ view, onSelect }) {
  const [open, setOpen] = useState(false);
  const active = ITEMS.find((i) => i.id === view);

  const select = (id) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <>
      <header className="topbar">
        <button className="hamburger" aria-label="Open menu" onClick={() => setOpen(true)}>
          <span />
          <span />
          <span />
        </button>
        <div className="topbar-title">🍺 PubTrail</div>
        <div className="topbar-mode">{active?.label}</div>
      </header>

      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} />}

      <nav className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head">
          <span>🍺 PubTrail</span>
          <button className="drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
        </div>
        {ITEMS.map((it) => (
          <button key={it.id} className={`drawer-item${view === it.id ? ' active' : ''}`} onClick={() => select(it.id)}>
            <span className="di-emoji">{it.emoji}</span>
            <span className="di-text">
              <span className="di-label">{it.label}</span>
              <span className="di-desc">{it.desc}</span>
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
