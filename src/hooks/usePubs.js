import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY = 'pubtrail.v1';

function loadInitial() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

const DEMO = [
  { id: 'd1', name: 'The Red Lion', pints: 2, mins: 55, vibe: 4, notes: 'Started strong, proper pint of bitter.' },
  { id: 'd2', name: 'The Crown & Anchor', pints: 1, mins: 40, vibe: 3, notes: 'Quick one, decent jukebox.' },
  { id: 'd3', name: 'The Foxhound', pints: 3, mins: 75, vibe: 5, notes: 'Best ale of the night, stayed for the quiz.' },
  { id: 'd4', name: 'The Ship Inn', pints: 2, mins: 50, vibe: 4, notes: '' },
  { id: 'd5', name: 'The Last Orders', pints: 1, mins: 30, vibe: 2, notes: 'Cheeky nightcap before the taxi home.' },
];

/**
 * Pub-crawl state backed by localStorage, plus derived stats.
 */
export function usePubs() {
  const [pubs, setPubs] = useState(loadInitial);
  const [lastAddedId, setLastAddedId] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pubs));
  }, [pubs]);

  const addPub = useCallback((draft) => {
    const pub = {
      id: `${Date.now()}${Math.floor(Math.random() * 99)}`,
      name: draft.name,
      pints: Math.max(0, parseInt(draft.pints, 10) || 0),
      mins: Math.max(0, parseInt(draft.mins, 10) || 0),
      vibe: draft.vibe,
      notes: draft.notes?.trim() || '',
    };
    setPubs((prev) => [...prev, pub]);
    setLastAddedId(pub.id);
    return pub.id;
  }, []);

  const removePub = useCallback((id) => {
    setPubs((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const loadDemo = useCallback(() => {
    setPubs(DEMO);
    setLastAddedId('d5');
  }, []);

  const clearAll = useCallback(() => {
    setPubs([]);
    setLastAddedId(null);
  }, []);

  const stats = useMemo(() => {
    const pints = pubs.reduce((s, p) => s + (+p.pints || 0), 0);
    const mins = pubs.reduce((s, p) => s + (+p.mins || 0), 0);
    const pace = mins ? (pints / (mins / 60)).toFixed(1) : '–';
    return { count: pubs.length, pints, mins, pace };
  }, [pubs]);

  return { pubs, stats, lastAddedId, addPub, removePub, loadDemo, clearAll };
}
