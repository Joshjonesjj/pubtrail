import { useEffect, useRef, useState } from 'react';
import LeafletRoute from './LeafletRoute';

const H = 300;

// Builds a smooth GPS-style trace winding through the pub pins (SVG fallback).
function buildLayout(pubs, width) {
  const padX = 60;
  const padY = 50;
  const usableW = width - padX * 2;
  const n = pubs.length;

  const pts = pubs.map((_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const x = padX + t * usableW;
    const y = H / 2 + Math.sin(t * Math.PI * 2 + 0.6) * (H / 2 - padY);
    return { x, y };
  });

  let d = pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }
  return { pts, d };
}

// Stylised SVG route — used when stops have no real coordinates.
function SvgRoute({ pubs }) {
  const wrapRef = useRef(null);
  const pathRef = useRef(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 900));
    ro.observe(el);
    setWidth(el.clientWidth || 900);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let dash = 0;
    let raf;
    const march = () => {
      dash = (dash + 0.4) % 12;
      if (pathRef.current) pathRef.current.setAttribute('stroke-dashoffset', dash);
      raf = requestAnimationFrame(march);
    };
    raf = requestAnimationFrame(march);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { pts, d } = buildLayout(pubs, width);

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <svg width="100%" height="100%">
        <path d={d} fill="none" stroke="rgba(255,207,92,.25)" strokeWidth="12" strokeLinecap="round" />
        <path ref={pathRef} d={d} fill="none" stroke="#ffcf5c" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="2 10" />
        {pts.map((pt, i) => {
          const name = pubs[i].name;
          const labelY = pt.y > H / 2 ? pt.y + 30 : pt.y - 22;
          return (
            <g key={pubs[i].id}>
              <circle cx={pt.x} cy={pt.y} r="14" fill="rgba(245,166,35,.18)" />
              <circle cx={pt.x} cy={pt.y} r="8" fill="#ffcf5c" stroke="#2b1a10" strokeWidth="2" />
              <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#2b1a10">
                {i + 1}
              </text>
              <text x={pt.x} y={labelY} textAnchor="middle" fontSize="11" fill="#e7c99a">
                {name.length > 16 ? `${name.slice(0, 15)}…` : name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function RouteMap({ pubs, onRouteInfo }) {
  const hasCoords = pubs.some((p) => p.lat != null && p.lon != null);

  return (
    <section className="card map-card">
      <div className="section-title">{hasCoords ? 'The Route · walking path' : 'The Route'}</div>
      <div className="map-stage">
        {pubs.length === 0 && (
          <div className="map-empty">Your route will draw itself here as you check in to pubs. 🗺️</div>
        )}
        {pubs.length > 0 && (hasCoords ? <LeafletRoute pubs={pubs} onInfo={onRouteInfo} /> : <SvgRoute pubs={pubs} />)}
      </div>
    </section>
  );
}
