import { useState } from 'react';

const EMPTY = { name: '', pints: '1', mins: '45', notes: '' };

// Form for checking in to a pub.
export default function CheckInForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const [vibe, setVibe] = useState(4);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) return;
    onAdd({ ...form, name: form.name.trim(), vibe });
    setForm(EMPTY);
    setVibe(4);
  };

  return (
    <section className="card form-card">
      <div className="section-title">Check in to a pub</div>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="fName">Pub name</label>
          <input
            id="fName"
            value={form.name}
            onChange={set('name')}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="The Crown & Anchor"
          />
        </div>
        <div className="field">
          <label htmlFor="fPints">Pints 🍺</label>
          <input id="fPints" type="number" min="0" step="1" value={form.pints} onChange={set('pints')} />
        </div>
        <div className="field">
          <label htmlFor="fMins">Minutes ⏱️</label>
          <input id="fMins" type="number" min="0" step="5" value={form.mins} onChange={set('mins')} />
        </div>
        <div className="field full">
          <label>Vibe</label>
          <div className="vibe-pick">
            {[1, 2, 3, 4, 5].map((v) => (
              <span key={v} className={v <= vibe ? 'on' : ''} onClick={() => setVibe(v)}>
                🍺
              </span>
            ))}
          </div>
        </div>
        <div className="field full">
          <label htmlFor="fNotes">Notes (optional)</label>
          <textarea id="fNotes" value={form.notes} onChange={set('notes')} placeholder="Cracking ale, dodgy karaoke..." />
        </div>
      </div>
      <button className="btn add" onClick={submit}>
        ＋ Add this stop to the crawl
      </button>
    </section>
  );
}
