import { useRef, useState } from 'react';
import { fetchNearbyPubs } from '../lib/geo';
import { fmtDist } from '../lib/format';

// "Find pubs near me" — reads GPS, lists nearby pubs from OpenStreetMap,
// and reports the chosen one back via onPick (which checks you in).
export default function NearbyPubs({ onPick, pickVerb = 'Check in to' }) {
  const [status, setStatus] = useState('idle'); // idle | locating | searching | done | error
  const [pubs, setPubs] = useState([]);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(600);
  const lastPos = useRef(null);

  const search = (pos, r) => {
    setStatus('searching');
    setError('');
    fetchNearbyPubs(pos.coords.latitude, pos.coords.longitude, r)
      .then((list) => {
        setPubs(list);
        setStatus('done');
        if (!list.length) setError(`No pubs found within ${r >= 1000 ? `${r / 1000} km` : `${r} m`}.`);
      })
      .catch(() => {
        setStatus('error');
        setError('Could not reach the pub database. Check your connection and try again.');
      });
  };

  const find = () => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('This device/browser does not support location.');
      return;
    }
    setStatus('locating');
    setError('');
    setRadius(600);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        lastPos.current = pos;
        search(pos, 600);
      },
      (err) => {
        setStatus('error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — allow location for this site and try again.'
            : 'Could not get your location. Try again outdoors or with GPS on.'
        );
      },
      // Coarser but much faster fix, and reuse a recent location to skip the wait.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  };

  const widen = () => {
    if (!lastPos.current) return find();
    const next = radius >= 2000 ? 5000 : 2000;
    setRadius(next);
    search(lastPos.current, next);
  };

  const busy = status === 'locating' || status === 'searching';
  const busyLabel = status === 'locating' ? '📡 Getting your location…' : '🔎 Finding pubs near you…';

  return (
    <div className="nearby">
      <button type="button" className="btn ghost nearby-btn" onClick={find} disabled={busy}>
        {busy ? busyLabel : '📍 Find pubs near me'}
      </button>

      {error && <div className="nearby-msg">{error}</div>}

      {status === 'done' && pubs.length === 0 && radius < 5000 && (
        <button type="button" className="btn ghost nearby-wider" onClick={widen} disabled={busy}>
          🔭 Search a wider area
        </button>
      )}

      {status === 'done' && pubs.length > 0 && (
        <div className="nearby-list">
          {pubs.map((p) => (
            <button
              type="button"
              key={p.id}
              className="nearby-item"
              onClick={() => onPick(p)}
              title={`${pickVerb} ${p.name}`}
            >
              <span className="nearby-name">🍺 {p.name}</span>
              <span className="nearby-dist">{fmtDist(p.dist)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
