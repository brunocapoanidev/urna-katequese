import { useRef, useState } from 'react';
import Lightbox from './Lightbox.jsx';

const Chevron = ({ dir }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

/** Carrossel horizontal de santinhos; tocar numa imagem abre a versão ampliada. */
export default function PosterCarousel({ posters }) {
  const track = useRef(null);
  const [open, setOpen] = useState(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const scrollByPage = dir => {
    const el = track.current;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onScroll = e => {
    const el = e.currentTarget;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };

  return (
    <div className="lp-carousel">
      <div ref={track} className="lp-track" onScroll={onScroll} tabIndex={0} aria-label="Santinhos dos candidatos">
        {posters.map((p, i) => (
          <figure key={p.src} className="lp-poster">
            <button type="button" className="lp-poster-btn" onClick={() => setOpen(i)} aria-label={`Ampliar: ${p.alt}`}>
              <img src={p.src} alt={p.alt} width={p.width} height={p.height} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" draggable="false" />
              <span className="lp-zoom-hint" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" /></svg>
                Ampliar
              </span>
            </button>
            <figcaption>
              {p.label}
              <span>{i + 1}/{posters.length}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <button type="button" className="lp-arrow lp-arrow-prev" onClick={() => scrollByPage(-1)} disabled={edge.start} aria-label="Anterior"><Chevron dir="prev" /></button>
      <button type="button" className="lp-arrow lp-arrow-next" onClick={() => scrollByPage(1)} disabled={edge.end} aria-label="Próximo"><Chevron dir="next" /></button>

      {open !== null && <Lightbox posters={posters} start={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
