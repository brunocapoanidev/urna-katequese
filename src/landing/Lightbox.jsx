import { useEffect, useRef, useState } from 'react';

const SWIPE_MIN = 50;

export default function Lightbox({ posters, start, onClose }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const closeBtn = useRef(null);
  const touchX = useRef(null);
  const many = posters.length > 1;

  const move = d => {
    setI(n => Math.max(0, Math.min(posters.length - 1, n + d)));
    setZoom(false);
  };

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = e => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (touchX.current === null || zoom) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= SWIPE_MIN) move(dx < 0 ? 1 : -1);
  };

  const p = posters[i];

  return (
    <div className="lp-lightbox" role="dialog" aria-modal="true" aria-label={p.alt}>
      <div className="lp-lightbox-bar">
        <span>{many ? `${i + 1} / ${posters.length}` : ''}</span>
        <button ref={closeBtn} type="button" className="lp-lightbox-close" onClick={onClose} aria-label="Fechar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="lp-lightbox-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClick={e => e.target === e.currentTarget && onClose()}>
        <img
          src={p.src}
          alt={p.alt}
          className={zoom ? 'zoom' : ''}
          onClick={() => setZoom(z => !z)}
          draggable="false"
        />
      </div>

      <p className="lp-lightbox-hint">{zoom ? 'Toque para reduzir' : 'Toque na imagem para ler de perto'}</p>

      {many && (
        <>
          <button type="button" className="lp-arrow lp-arrow-prev" onClick={() => move(-1)} disabled={i === 0} aria-label="Imagem anterior">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="lp-arrow lp-arrow-next" onClick={() => move(1)} disabled={i === posters.length - 1} aria-label="Próxima imagem">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
}
