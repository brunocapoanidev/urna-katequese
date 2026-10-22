import { useCallback, useEffect, useState } from 'react';

const KEY = 'jek-colinha-v1';
const EVENT = 'jek-colinha-change';

export function readColinha() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      president: parsed?.president || null,
      deputy: parsed?.deputy || null,
    };
  } catch {
    return { president: null, deputy: null };
  }
}

export function writeColinha(next) {
  try {
    const current = readColinha();
    const updated = { ...current, ...next };
    localStorage.setItem(KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT));
    return updated;
  } catch {
    return next;
  }
}

export function clearColinha() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* sem localStorage */
  }
}

export function useColinha() {
  const [colinha, setColinha] = useState(readColinha);

  useEffect(() => {
    const sync = () => setColinha(readColinha());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const togglePresident = useCallback(candidate => {
    const cur = readColinha();
    const next = cur.president?.id === candidate.id ? null : { id: candidate.id, name: candidate.name, number: candidate.number };
    writeColinha({ president: next });
  }, []);

  const toggleDeputy = useCallback(candidate => {
    const cur = readColinha();
    const next = cur.deputy?.id === candidate.id ? null : { id: candidate.id, name: candidate.name, number: candidate.number };
    writeColinha({ deputy: next });
  }, []);

  return { colinha, togglePresident, toggleDeputy, clearColinha };
}
