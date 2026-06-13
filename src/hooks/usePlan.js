import { useCallback, useEffect, useState } from 'react';

const KEY = 'pubtrail.plan';

// An ordered, persisted list of planned pub stops.
export function usePlan() {
  const [plan, setPlan] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(plan));
  }, [plan]);

  const addStop = useCallback((pub) => {
    setPlan((p) => {
      if (p.some((s) => s.id === pub.id)) return p; // no dupes
      return [...p, { id: pub.id, name: pub.name, lat: pub.lat, lon: pub.lon }];
    });
  }, []);

  const removeStop = useCallback((id) => setPlan((p) => p.filter((s) => s.id !== id)), []);

  const move = useCallback((id, dir) => {
    setPlan((p) => {
      const i = p.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const clearPlan = useCallback(() => setPlan([]), []);
  const loadPlan = useCallback((stops) => setPlan(stops), []);

  return { plan, addStop, removeStop, move, clearPlan, loadPlan };
}
