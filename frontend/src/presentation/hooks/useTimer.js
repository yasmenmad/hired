import { useState, useRef, useCallback } from 'react';
export default function useTimer() {
  const [s, setS] = useState(0);
  const ref = useRef(null);
  const start = useCallback(() => { setS(0); clearInterval(ref.current); ref.current = setInterval(() => setS(x => x+1), 1000); }, []);
  const stop  = useCallback(() => clearInterval(ref.current), []);
  const fmt   = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  return { seconds: s, formatted: fmt(s), start, stop };
}
