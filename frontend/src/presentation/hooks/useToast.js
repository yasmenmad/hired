import { useState, useRef, useCallback } from 'react';
export default function useToast() {
  const [msg, setMsg]       = useState('');
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const toast = useCallback(m => {
    setMsg(m); setVisible(true);
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setVisible(false), 2600);
  }, []);
  return { msg, visible, toast };
}
