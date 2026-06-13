import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY = 'pubtrail.v2';
const OLD_KEY = 'pubtrail.v1';

// Totals for a list of pubs. Shared by the live crawl and history cards.
export function computeStats(pubs) {
  const pints = pubs.reduce((s, p) => s + (+p.pints || 0), 0);
  const mins = pubs.reduce((s, p) => s + (+p.mins || 0), 0);
  const pace = mins ? (pints / (mins / 60)).toFixed(1) : '–';
  return { count: pubs.length, pints, mins, pace };
}

const EMPTY_CURRENT = { pubs: [], startedAt: null };

function loadInitial() {
  // v2 store?
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY));
    if (v2 && v2.current && Array.isArray(v2.history)) return v2;
  } catch {
    /* ignore */
  }
  // Migrate a v1 flat array into a current session.
  try {
    const old = JSON.parse(localStorage.getItem(OLD_KEY));
    if (Array.isArray(old) && old.length) {
      return { current: { pubs: old, startedAt: Date.now() }, history: [] };
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

/**
 * Pub-crawl state: a live "current" session plus an archive of finished ones,
 * all persisted to localStorage.
 */
export function usePubs() {
  const [store, setStore] = useState(loadInitial);
  const [lastAddedId, setLastAddedId] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(store));
  }, [store]);

  const pubs = store.current.pubs;
  const history = store.history;

  const addPub = useCallback((draft) => {
    const pub = {
      id: `${Date.now()}${Math.floor(Math.random() * 99)}`,
      name: draft.name,
      pints: Math.max(0, parseInt(draft.pints, 10) || 0),
      mins: Math.max(0, parseInt(draft.mins, 10) || 0),
      vibe: draft.vibe,
      notes: draft.notes?.trim() || '',
      lat: draft.lat ?? null,
      lon: draft.lon ?? null,
    };
    setStore((s) => ({
      ...s,
      current: { startedAt: s.current.startedAt ?? Date.now(), pubs: [...s.current.pubs, pub] },
    }));
    setLastAddedId(pub.id);
    return pub.id;
  }, []);

  const removePub = useCallback((id) => {
    setStore((s) => ({ ...s, current: { ...s.current, pubs: s.current.pubs.filter((p) => p.id !== id) } }));
  }, []);

  // Archive the live crawl into history and start fresh.
  const finishSession = useCallback(() => {
    setStore((s) => {
      if (!s.current.pubs.length) return s;
      const session = {
        id: `s${Date.now()}`,
        startedAt: s.current.startedAt ?? Date.now(),
        endedAt: Date.now(),
        pubs: s.current.pubs,
      };
      return { current: { ...EMPTY_CURRENT }, history: [session, ...s.history] };
    });
    setLastAddedId(null);
  }, []);

  const deleteSession = useCallback((id) => {
    setStore((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) }));
  }, []);

  const loadDemo = useCallback(() => {
    setStore((s) => ({ ...s, current: { pubs: DEMO, startedAt: Date.now() } }));
    setLastAddedId('d5');
  }, []);

  const clearAll = useCallback(() => {
    setStore((s) => ({ ...s, current: { ...EMPTY_CURRENT } }));
    setLastAddedId(null);
  }, []);

  const stats = useMemo(() => computeStats(pubs), [pubs]);

  return {
    pubs,
    stats,
    history,
    lastAddedId,
    addPub,
    removePub,
    finishSession,
    deleteSession,
    loadDemo,
    clearAll,
  };
}
