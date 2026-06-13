import { useEffect, useState } from 'react';

// Ticks once a second while `running` is true, so live timers/stats update.
export function useNow(running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);
  return now;
}
