import PintGlass from './PintGlass';

// The live "you're in this pub" screen: running timer, tap-to-add pints,
// manual pint entry, vibe + notes, and check-out.
export default function ActivePub({ active, now, onAddPint, onSetPints, onSetVibe, onSetNotes, onCheckOut }) {
  const elapsedSec = Math.max(0, Math.floor((now - active.checkedInAt) / 1000));
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60);
  const s = elapsedSec % 60;
  const clock = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;

  return (
    <section className="card active-card">
      <div className="section-title">🍻 You're in</div>

      <div className="active-head">
        <h2 className="active-name">{active.name}</h2>
        <div className="active-clock" title="Time at this pub">⏱️ {clock}</div>
      </div>

      <div className="pint-counter">
        <PintGlass pints={active.pints} />
        <div className="pc-count">
          <span className="pc-num">{active.pints}</span>
          <span className="pc-lbl">pint{active.pints === 1 ? '' : 's'} so far</span>
        </div>
        <button className="btn pint-plus" onClick={onAddPint}>＋1 🍺</button>
      </div>

      <div className="pc-manual">
        <span className="pc-hint">or set the count exactly</span>
        <div className="pc-stepper">
          <button type="button" className="step" onClick={() => onSetPints(active.pints - 1)} disabled={active.pints <= 0}>－</button>
          <input type="number" min="0" value={active.pints} onChange={(e) => onSetPints(e.target.value)} />
          <button type="button" className="step" onClick={() => onSetPints(active.pints + 1)}>＋</button>
        </div>
      </div>

      <div className="field full">
        <label>Vibe</label>
        <div className="vibe-pick">
          {[1, 2, 3, 4, 5].map((v) => (
            <span key={v} className={v <= active.vibe ? 'on' : ''} onClick={() => onSetVibe(v)}>
              🍺
            </span>
          ))}
        </div>
      </div>

      <div className="field full">
        <label htmlFor="aNotes">Notes</label>
        <textarea
          id="aNotes"
          value={active.notes}
          onChange={(e) => onSetNotes(e.target.value)}
          placeholder="Cracking ale, dodgy karaoke..."
        />
      </div>

      <button className="btn add checkout" onClick={onCheckOut}>
        🚪 Check out of {active.name}
      </button>
    </section>
  );
}
