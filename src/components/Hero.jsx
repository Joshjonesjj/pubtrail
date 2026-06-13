// Top hero banner with the PubTrail logo + tagline.
export default function Hero() {
  return (
    <header className="hero">
      <div className="logo">
        <svg className="mug" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <rect x="12" y="16" width="30" height="40" rx="5" fill="url(#beerGrad)" stroke="#fff6e0" strokeWidth="3" />
          <rect x="12" y="14" width="30" height="10" rx="4" fill="#fff6e0" />
          <path d="M42,24 h8 a8,8 0 0 1 8,8 v6 a8,8 0 0 1 -8,8 h-8" fill="none" stroke="#fff6e0" strokeWidth="3" />
          <circle cx="22" cy="40" r="2" fill="rgba(255,255,255,.5)" />
          <circle cx="32" cy="46" r="1.6" fill="rgba(255,255,255,.5)" />
        </svg>
        <h1>PubTrail</h1>
      </div>
      <p className="tagline">
        Track your crawl like an athlete tracks a marathon. Map the route, clock your time at each pub, and count every
        pint along the way. 🍻
      </p>
      <div className="scroll-hint">▾ Check in to your first pub ▾</div>
    </header>
  );
}
