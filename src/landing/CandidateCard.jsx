const photoStyle = c =>
  c.photo
    ? {
        backgroundImage: `url(${c.photo})`,
        backgroundPosition: `${c.photoPosition || '50%'} center`,
        backgroundSize: c.photoSize || undefined,
      }
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

function Deputy({ deputy, isSaved, onPick }) {
  return (
    <li className={`lp-deputy${isSaved ? ' is-saved' : ''}`}>
      <Photo candidate={deputy} className="lp-photo-sm" />
      <div className="lp-deputy-info">
        <span className="lp-deputy-name">{deputy.name}</span>
        {onPick && (
          <button
            type="button"
            className={`lp-pin-btn${isSaved ? ' is-active' : ''}`}
            onClick={() => onPick(deputy)}
          >
            {isSaved ? '✓ Na colinha' : '+ Colinha'}
          </button>
        )}
      </div>
      <span className="lp-deputy-number">{deputy.number}</span>
    </li>
  );
}

export default function CandidateCard({
  president,
  deputies,
  isRunoffFinalist = false,
  savedPresidentId,
  savedDeputyId,
  onPickPresident,
  onPickDeputy,
}) {
  const { name, number, party, slogan } = president;
  const isPresSaved = savedPresidentId === president.id;

  return (
    <article className={`lp-card${isRunoffFinalist ? ' is-finalist' : ''}${isPresSaved ? ' is-saved' : ''}`} aria-labelledby={`cand-${president.id}`}>
      <div className="lp-card-media">
        <Photo candidate={president} className="lp-photo-lg" />
        {isRunoffFinalist && <span className="lp-finalist-badge">Finalista · 2º Turno</span>}
        <div className="lp-number">
          <span>Número</span>
          <strong>{number}</strong>
        </div>
        {onPickPresident && (
          <button
            type="button"
            className={`lp-card-pin${isPresSaved ? ' is-active' : ''}`}
            onClick={() => onPickPresident(president)}
          >
            {isPresSaved ? '✓ Presidente na Colinha' : '📌 Anotar na Colinha'}
          </button>
        )}
      </div>

      <div className="lp-card-body">
        <div className="lp-card-head">
          {party && <span className="lp-kicker">{party}</span>}
          <h3 id={`cand-${president.id}`}>{name}</h3>
          {slogan && <p className="lp-slogan">“{slogan}”</p>}
        </div>

        {deputies.length > 0 && (
          <div className="lp-ticket">
            <span className="lp-kicker">Deputados da chapa (4 de 6 são eleitos)</span>
            <ul>
              {deputies.map(d => (
                <Deputy
                  key={d.id}
                  deputy={d}
                  isSaved={savedDeputyId === d.id}
                  onPick={onPickDeputy}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
