import { useCallback, useEffect, useState } from 'react';

const KEY = 'pubtrail.v3';
const KEY_V2 = 'pubtrail.v2';
const KEY_V1 = 'pubtrail.v1';

// Totals for completed stops, optionally including the live (active) pub.
// `now` lets the active pub's elapsed time count up in real time.
export function computeStats(pubs, active = null, now = Date.now()) {
  let pints = pubs.reduce((s, p) => s + (+p.pints || 0), 0);
  let mins = pubs.reduce((s, p) => s + (+p.mins || 0), 0);
  let count = pubs.length;
  if (active) {
    pints += +active.pints || 0;
    mins += Math.max(0, Math.round((now - active.checkedInAt) / 60000));
    count += 1;
  }
  const pace = mins ? (pints / (mins / 60)).toFixed(1) : '–';
  return { count, pints, mins, pace };
}

const EMPTY_CURRENT = { pubs: [], startedAt: null, active: null };

function loadInitial() {
  try {
    const v3 = JSON.parse(localStorage.getItem(KEY));
    if (v3?.current && Array.isArray(v3.history)) return v3;
  } catch {
    /* ignore */
  }
  // Migrate v2 ({current:{pubs,startedAt}, history}) -> add active:null.
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY_V2));
    if (v2?.current && Array.isArray(v2.history)) {
      return {
        current: { pubs: v2.current.pubs || [], startedAt: v2.current.startedAt || null, active: null },
        history: v2.history,
      };
    }
  } catch {
    /* ignore */
  }
  // Migrate v1 flat array.
  try {
    const old = JSON.parse(localStorage.getItem(KEY_V1));
    if (Array.isArray(old) && old.length) {
      return { current: { pubs: old, startedAt: Date.now(), active: null }, history: [] };
    }
  } catch {
    /* ignore */
  }
  return { current: { ...EMPTY_CURRENT }, history: [] };
}

const DEMO = [
  { id: 'd1', name: 'The Red Lion', pints: 2, mins: 55, vibe: 4, notes: 'Started strong, proper pint of bitter.' },
  { id: 'd2', name: 'The Crown & Anchor', pints: 1, mins: 40, vibe: 3, notes: 'Quick one, decent jukebox.' },
  { id: 'd3', name: 'The Foxhound', pints: 3, mins: 75, vibe: 5, notes: 'Best ale of the night, stayed for the quiz.' },
  { id: 'd4', name: 'The Ship Inn', pints: 2, mins: 50, vibe: 4, notes: '' },
  { id: 'd5', name: 'The Last Orders', pints: 1, mins: 30, vibe: 2, notes: 'Cheeky nightcap before the taxi home.' },
];

// Build a completed-stop record from an active pub at checkout time.
function closeActive(active, now) {
  const mins = Math.max(0, Math.round((now - active.checkedInAt) / 60000));
  return {
    id: `co${now}${Math.floor(Math.random() * 99)}`,
    name: active.name,
    pints: +active.pints || 0,
    mins,
    vibe: active.vibe,
    notes: (active.notes || '').trim(),
    lat: active.lat ?? null,
    lon: active.lon ?? null,
  };
}

/**
 * Crawl state with a live check-in/check-out flow:
 *  - current.active: the pub you're in right now (timer + live pint count)
 *  - current.pubs:   stops you've already checked out of tonight
 *  - history:        finished crawls
 */
export function usePubs() {
  const [store, setStore] = useState(loadInitial);
  const [lastAddedId, setLastAddedId] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(store));
  }, [store]);

  const { pubs, active } = store.current;
  const history = store.history;

  const checkIn = useCallback(({ name, lat, lon }) => {
    setStore((s) => ({
      ...s,
      current: {
        ...s.current,
        startedAt: s.current.startedAt ?? Date.now(),
        active: { name, lat: lat ?? null, lon: lon ?? null, pints: 0, vibe: 4, notes: '', checkedInAt: Date.now() },
      },
    }));
  }, []);

  const patchActive = useCallback((patch) => {
    setStore((s) => (s.current.active ? { ...s, current: { ...s.current, active: { ...s.current.active, ...patch } } } : s));
  }, []);

  const addPint = useCallback(() => {
    setStore((s) =>
      s.current.active
        ? { ...s, current: { ...s.current, active: { ...s.current.active, pints: (+s.current.active.pints || 0) + 1 } } }
        : s
    );
  }, []);

  const setPints = useCallback(
    (n) => patchActive({ pints: Math.max(0, parseInt(n, 10) || 0) }),
    [patchActive]
  );
  const setActiveVibe = useCallback((v) => patchActive({ vibe: v }), [patchActive]);
  const setActiveNotes = useCallback((t) => patchActive({ notes: t }), [patchActive]);

  const checkOut = useCallback(() => {
    setStore((s) => {
      if (!s.current.active) return s;
      const stop = closeActive(s.current.active, Date.now());
      setLastAddedId(stop.id);
      return { ...s, current: { ...s.current, pubs: [...s.current.pubs, stop], active: null } };
    });
  }, []);

  const removePub = useCallback((id) => {
    setStore((s) => ({ ...s, current: { ...s.current, pubs: s.current.pubs.filter((p) => p.id !== id) } }));
  }, []);

  // End the night: check out the active pub (if any) and archive the crawl.
  const finishSession = useCallback(() => {
    setStore((s) => {
      let cur = s.current;
      if (cur.active) {
        cur = { ...cur, pubs: [...cur.pubs, closeActive(cur.active, Date.now())], active: null };
      }
      if (!cur.pubs.length) return { ...s, current: { ...EMPTY_CURRENT } };
      const session = { id: `s${Date.now()}`, startedAt: cur.startedAt ?? Date.now(), endedAt: Date.now(), pubs: cur.pubs };
      return { current: { ...EMPTY_CURRENT }, history: [session, ...s.history] };
    });
    setLastAddedId(null);
  }, []);

  const deleteSession = useCallback((id) => {
    setStore((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
  }, []);

  const loadDemo = useCallback(() => {
    setStore((s) => ({ ...s, current: { pubs: DEMO, startedAt: Date.now(), active: null } }));
    setLastAddedId('d5');
  }, []);

  const clearAll = useCallback(() => {
    setStore((s) => ({ ...s, current: { ...EMPTY_CURRENT } }));
    setLastAddedId(null);
  }, []);

  return {
    pubs,
    active,
    history,
    lastAddedId,
    checkIn,
    addPint,
    setPints,
    setActiveVibe,
    setActiveNotes,
    checkOut,
    finishSession,
    deleteSession,
    removePub,
    loadDemo,
    clearAll,
  };
}
