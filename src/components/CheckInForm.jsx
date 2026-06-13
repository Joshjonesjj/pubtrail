import { useState } from 'react';
import NearbyPubs from './NearbyPubs';

// Pick or name a pub and check in. Pints + time are tracked live afterwards.
export default function CheckInForm({ onCheckIn, continuing }) {
  const [name, setName] = useState('');
  const [coords, setCoords] = useState(null);

  const pickNearby = (pub) => {
    setName(pub.name);
    setCoords({ lat: pub.lat, lon: pub.lon });
  };

  const submit = () => {
    if (!name.trim()) return;
    onCheckIn({ name: name.trim(), lat: coords?.lat ?? null, lon: coords?.lon ?? null });
    setName('');
    setCoords(null);
  };

  return (
    <section className="card form-card">
      <div className="section-title">{continuing ? 'Open the tab at your next pub' : 'Start your crawl'}</div>

      <NearbyPubs onPick={pickNearby} />

      <div className="field full">
        <label htmlFor="fName">
          Pub name {coords && <span className="loc-tag">📍 location attached</span>}
        </label>
        <input
          id="fName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setCoords(null); // typing a different name clears the attached pin
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="The Crown & Anchor"
        />
      </div>

      <button className="btn add" onClick={submit}>
        {continuing ? '🍺 Check in to the next pub' : '🍺 Check in'}
      </button>
    </section>
  );
}
