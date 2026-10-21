import { useEffect, useState } from 'react';

/** Hora "do servidor": o relógio do aparelho mais a diferença medida na última resposta. */
function useNow(skew) {
  const [now, setNow] = useState(() => Date.now() + skew);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + skew), 1000);
    return () => clearInterval(id);
  }, [skew]);
  return now;
}

export default function Countdown({ target, skew = 0, label }) {
  const left = Math.max(0, Math.floor((Date.parse(target) - useNow(skew)) / 1000));
  const parts = [
    ['dias', Math.floor(left / 86400)],
    ['horas', Math.floor((left % 86400) / 3600)],
    ['min', Math.floor((left % 3600) / 60)],
    ['seg', left % 60],
  ];
  return (
    <div className="lp-countdown">
      {label && <span className="lp-countdown-label">{label}</span>}
      <div className="lp-countdown-grid" role="timer" aria-live="off">
        {parts.map(([name, value]) => (
          <div key={name}>
            <strong>{String(value).padStart(2, '0')}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
