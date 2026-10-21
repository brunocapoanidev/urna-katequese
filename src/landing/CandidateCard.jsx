const photoStyle = c =>
  c.photo
    ? { backgroundImage: `url(${c.photo})`, backgroundPosition: `${c.photoPosition || '50%'} center` }
    : undefined;

function Photo({ candidate, className }) {
  return (
    <div
      className={`lp-photo ${className}`}
      style={photoStyle(candidate)}
      role={candidate.photo ? 'img' : undefined}
      aria-label={candidate.photo ? `Foto de ${candidate.name}` : undefined}
    >
      {!candidate.photo && (
        <svg width="56%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      )}
    </div>
  );
}

function Deputy({ deputy }) {
  return (
    <li className="lp-deputy">
      <Photo candidate={deputy} className="lp-photo-sm" />
      <span className="lp-deputy-name">{deputy.name}</span>
      <span className="lp-deputy-number">{deputy.number}</span>
    </li>
  );
}

export default function CandidateCard({ president, deputies }) {
  const { name, number, party, slogan } = president;
  return (
    <article className="lp-card" aria-labelledby={`cand-${president.id}`}>
      <div className="lp-card-media">
        <Photo candidate={president} className="lp-photo-lg" />
        <div className="lp-number">
          <span>Número</span>
          <strong>{number}</strong>
        </div>
      </div>

      <div className="lp-card-body">
        <div className="lp-card-head">
          {party && <span className="lp-kicker">{party}</span>}
          <h3 id={`cand-${president.id}`}>{name}</h3>
          {slogan && <p className="lp-slogan">“{slogan}”</p>}
        </div>

        {deputies.length > 0 && (
          <div className="lp-ticket">
            <span className="lp-kicker">Deputados da chapa</span>
            <ul>
              {deputies.map(d => (
                <Deputy key={d.id} deputy={d} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
