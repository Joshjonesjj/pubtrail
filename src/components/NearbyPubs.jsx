import { useState } from 'react';
import { fetchNearbyPubs } from '../lib/geo';
import { fmtDist } from '../lib/format';

// "Find pubs near me" — reads GPS, lists nearby pubs from OpenStreetMap,
// and reports the chosen one back via onPick.
export default function NearbyPubs({ onPick }) {
  const [status, setStatus] = useState('idle'); // idle | locating | searching | done | error
  const [pubs, setPubs] = useState([]);
  const [error, setError] = useState('');

  const find = () => {
    if (!('geolocation' in navigator)) {
      setStatus('error');
      setError('This device/browser does not support location.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus('searching');
        try {
          const list = await fetchNearbyPubs(pos.coords.latitude, pos.coords.longitude);
          setPubs(list);
          setStatus('done');
          if (!list.length) setError('No pubs found within ~600 m. Type the name in manually below.');
        } catch {
          setStatus('error');
          setError('Could not reach the pub database. Check your connection and try again.');
        }
      },
      (err) => {
        setStatus('error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — allow location for this site and try again.'
            : 'Could not get your location. Try again outdoors or with GPS on.'
        );
      },
      // Coarser but much faster fix (network/cell vs waiting for GPS lock),
      // and reuse a recent location to skip the wait entirely.
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  };

  const busy = status === 'locating' || status === 'searching';
  const busyLabel = status === 'locating' ? '📡 Getting your location…' : '🔎 Finding pubs near you…';

  return (
    <div className="nearby">
      <button type="button" className="btn ghost nearby-btn" onClick={find} disabled={busy}>
        {busy ? busyLabel : '📍 Find pubs near me'}
      </button>

      {error && <div className="nearby-msg">{error}</div>}

      {status === 'done' && pubs.length > 0 && (
        <div className="nearby-list">
          {pubs.map((p) => (
            <button
              type="button"
              key={p.id}
              className="nearby-item"
              onClick={() => onPick(p)}
              title={`Check in to ${p.name}`}
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
