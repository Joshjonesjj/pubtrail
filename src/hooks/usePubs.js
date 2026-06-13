import { useCallback, useEffect, useState } from 'react';
import { fetchFootRoute } from '../lib/geo';

const KEY = 'pubtrail.v3';
const KEY_V2 = 'pubtrail.v2';
const KEY_V1 = 'pubtrail.v1';

// Totals for completed stops, optionally including the live (active) pub.
// `now` lets the active pub's elapsed time count up in real time.
const spendOf = (p) => (p.pricePerPint != null ? (+p.pints || 0) * p.pricePerPint : 0);

export function computeStats(pubs, active = null, now = Date.now()) {
  let pints = pubs.reduce((s, p) => s + (+p.pints || 0), 0);
  let mins = pubs.reduce((s, p) => s + (+p.mins || 0), 0);
  let spend = pubs.reduce((s, p) => s + spendOf(p), 0);
  let count = pubs.length;
  if (active) {
    pints += +active.pints || 0;
    mins += Math.max(0, Math.round((now - active.checkedInAt) / 60000));
    spend += spendOf(active);
    count += 1;
  }
  const pace = mins ? (pints / (mins / 60)).toFixed(1) : '–';
  return { count, pints, mins, pace, spend };
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
  { id: 'd1', name: 'The Red Lion', pints: 2, mins: 55, vibe: 4, notes: 'Started strong, proper pint of bitter.', pricePerPint: 5.2 },
  { id: 'd2', name: 'The Crown & Anchor', pints: 1, mins: 40, vibe: 3, notes: 'Quick one, decent jukebox.', pricePerPint: 4.8 },
  { id: 'd3', name: 'The Foxhound', pints: 3, mins: 75, vibe: 5, notes: 'Best ale of the night, stayed for the quiz.', pricePerPint: 6.1 },
  { id: 'd4', name: 'The Ship Inn', pints: 2, mins: 50, vibe: 4, notes: '', pricePerPint: 5.5 },
  { id: 'd5', name: 'The Last Orders', pints: 1, mins: 30, vibe: 2, notes: 'Cheeky nightcap before the taxi home.', pricePerPint: 4.5 },
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
    pricePerPint: active.pricePerPint ?? null,
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
        active: { name, lat: lat ?? null, lon: lon ?? null, pints: 0, vibe: 4, notes: '', pricePerPint: null, checkedInAt: Date.now() },
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
  const setActivePrice = useCallback(
    (v) => patchActive({ pricePerPint: v === '' || v == null ? null : Math.max(0, parseFloat(v) || 0) }),
    [patchActive]
  );

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

  // Edit a checked-out stop (e.g. fix the pint count or price).
  const editPub = useCallback((id, patch) => {
    setStore((s) => ({ ...s, current: { ...s.current, pubs: s.current.pubs.map((p) => (p.id === id ? { ...p, ...patch } : p)) } }));
  }, []);

  // Re-open a stop: pull it back into the active pub, preserving elapsed time.
  const reopenPub = useCallback((id) => {
    setStore((s) => {
      if (s.current.active) return s; // already in a pub
      const stop = s.current.pubs.find((p) => p.id === id);
      if (!stop) return s;
      const checkedInAt = Date.now() - Math.max(0, +stop.mins || 0) * 60000;
      const active = {
        name: stop.name,
        lat: stop.lat ?? null,
        lon: stop.lon ?? null,
        pints: +stop.pints || 0,
        vibe: stop.vibe ?? 4,
        notes: stop.notes || '',
        pricePerPint: stop.pricePerPint ?? null,
        checkedInAt,
      };
      return { ...s, current: { ...s.current, active, pubs: s.current.pubs.filter((p) => p.id !== id) } };
    });
  }, []);

  const patchSession = useCallback((id, data) => {
    setStore((s) => ({ ...s, history: s.history.map((h) => (h.id === id ? { ...h, ...data } : h)) }));
  }, []);

  const renameSession = useCallback((id, name) => patchSession(id, { name: name?.trim() || null }), [patchSession]);

  const exportData = useCallback(() => store, [store]);
  const importData = useCallback((parsed) => {
    if (parsed?.current && Array.isArray(parsed.history)) {
      setStore(parsed);
      return true;
    }
    return false;
  }, []);

  // End the night: check out the active pub (if any), archive the crawl, then
  // fetch + store the real walking distance/time in the background.
  const finishSession = useCallback(() => {
    let cur = store.current;
    if (cur.active) {
      cur = { ...cur, pubs: [...cur.pubs, closeActive(cur.active, Date.now())], active: null };
    }
    if (!cur.pubs.length) {
      setStore((s) => ({ ...s, current: { ...EMPTY_CURRENT } }));
      return;
    }
    const id = `s${Date.now()}`;
    const session = { id, startedAt: cur.startedAt ?? Date.now(), endedAt: Date.now(), pubs: cur.pubs, walk: null };
    setStore((s) => ({ current: { ...EMPTY_CURRENT }, history: [session, ...s.history] }));
    setLastAddedId(null);

    const geo = cur.pubs.filter((p) => p.lat != null && p.lon != null);
    if (geo.length >= 2) {
      fetchFootRoute(geo)
        .then((r) => {
          if (!r) return;
          // Downsample the geometry so the stored route stays small.
          const step = Math.max(1, Math.ceil(r.coordinates.length / 80));
          const coordinates = r.coordinates.filter((_, i) => i % step === 0 || i === r.coordinates.length - 1);
          patchSession(id, { walk: { meters: r.meters, seconds: r.seconds, coordinates } });
        })
        .catch(() => {});
    }
  }, [store, patchSession]);

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
    setActivePrice,
    checkOut,
    finishSession,
    deleteSession,
    removePub,
    editPub,
    reopenPub,
    renameSession,
    exportData,
    importData,
    loadDemo,
    clearAll,
  };
}
