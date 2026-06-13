import { useMemo } from 'react';

// Background bubbles drifting up the page.
export default function AmbientBubbles({ count = 22 }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const size = 6 + Math.random() * 22;
        return {
          size,
          left: Math.random() * 100,
          duration: 8 + Math.random() * 12,
          delay: Math.random() * 10,
        };
      }),
    [count]
  );

  return (
    <div className="bubbles" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}vw`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
