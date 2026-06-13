import { useEffect, useRef } from 'react';

const LABELS = ['Sober', 'First sip', 'Getting there', 'Half cut', 'Merry', 'Last orders', '🍻 Empty!'];

// Fixed pint, bottom-right, that empties as you scroll the page.
export default function DrainingPint({ progress }) {
  const bubbleRefs = useRef([]);

  // Beer top edge slides from full (y=30) to empty (y=156).
  const topFull = 30;
  const bottom = 156;
  const y = topFull + progress * (bottom - topFull);
  const height = Math.max(0, bottom - y);
  const foamY = Math.max(28, y - 6);
  const label = LABELS[Math.min(LABELS.length - 1, Math.floor(progress * LABELS.length))];

  // Inner bubbles drifting upward inside the glass.
  useEffect(() => {
    const bases = [120, 135, 110];
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      bubbleRefs.current.forEach((b, i) => {
        if (!b) return;
        const cy = bases[i] - ((t * 20 + i * 40) % 90);
        b.setAttribute('cy', cy);
        b.setAttribute('opacity', 0.6 - ((bases[i] - cy) / 90) * 0.5);
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="pint-fixed" title="Scroll to drink up 🍺">
      <span className="label">{label}</span>
      <svg viewBox="0 0 100 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id="glassClip">
            <path d="M22,12 L78,12 L73,150 Q72,156 66,156 L34,156 Q28,156 27,150 Z" />
          </clipPath>
          <linearGradient id="pintBeerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd86b" />
            <stop offset="100%" stopColor="#e08c1a" />
          </linearGradient>
          <linearGradient id="glassGloss" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,.35)" />
            <stop offset="18%" stopColor="rgba(255,255,255,.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <g clipPath="url(#glassClip)">
          <rect x="20" y={y} width="60" height={height} fill="url(#pintBeerGrad)" />
          <rect x="20" y={foamY} width="60" height="12" fill="#fff6e0" rx="3" style={{ opacity: progress > 0.97 ? 0 : 1 }} />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              ref={(el) => (bubbleRefs.current[i] = el)}
              cx={[40, 58, 50][i]}
              cy={[120, 135, 110][i]}
              r={[2.4, 1.8, 2][i]}
              fill="rgba(255,255,255,.6)"
            />
          ))}
        </g>

        <path
          d="M22,12 L78,12 L73,150 Q72,156 66,156 L34,156 Q28,156 27,150 Z"
          fill="none"
          stroke="rgba(255,255,255,.55)"
          strokeWidth="3"
        />
        <path d="M22,12 L78,12 L73,150 Q72,156 66,156 L34,156 Q28,156 27,150 Z" fill="url(#glassGloss)" />
      </svg>
    </div>
  );
}
