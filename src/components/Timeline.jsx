import { useEffect, useRef, useState } from 'react';
import Mug from './Mug';
import { fmtTime } from '../lib/format';

// A single crawl stop. Reveals on scroll; the newest stop gets a pour flash
// and scrolls itself into view.
function Stop({ pub, isNewest, onRemove }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setShown(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (isNewest && ref.current) {
      const t = setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
      return () => clearTimeout(t);
    }
  }, [isNewest]);

  const mugs = Math.min(+pub.pints || 0, 8);

  return (
    <div ref={ref} className={`stop${shown ? ' in' : ''}${isNewest ? ' pour' : ''}`}>
      <div className="dot" />
      <div className="body">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{pub.name}</h3>
          <div className="meta">
            <span>⏱️ <b>{fmtTime(pub.mins)}</b></span>
            <span>🍺 <b>{pub.pints}</b> pint{pub.pints === 1 ? '' : 's'}</span>
            {pub.vibe ? <span className="vibe">{'🍺'.repeat(pub.vibe)}</span> : null}
          </div>
          {pub.notes ? <div className="notes">“{pub.notes}”</div> : null}
        </div>
        <div className="pints">
          {mugs > 0 ? (
            Array.from({ length: mugs }, (_, i) => <Mug key={i} />)
          ) : (
            <span style={{ color: '#9c7d50', fontSize: 13 }}>soft drinks 🥤</span>
          )}
        </div>
        <button className="del" title="Remove" onClick={() => onRemove(pub.id)}>
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Timeline({ pubs, lastAddedId, onRemove, onLoadDemo, onClear }) {
  return (
    <>
      <div className="toolbar">
        <div className="ttl">Your Crawl</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn ghost" onClick={onLoadDemo}>
            Load demo crawl
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (pubs.length && confirm('Clear the whole crawl? This cannot be undone.')) onClear();
            }}
          >
            Clear all
          </button>
        </div>
      </div>
      <div className="timeline">
        {pubs.length === 0 ? (
          <div style={{ color: '#9c7d50', padding: '10px 4px' }}>
            No stops yet — check in to your first pub above. 🍺
          </div>
        ) : (
          pubs.map((p) => (
            <Stop key={p.id} pub={p} isNewest={p.id === lastAddedId} onRemove={onRemove} />
          ))
        )}
      </div>
    </>
  );
}
