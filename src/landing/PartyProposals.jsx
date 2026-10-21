export function formatDeputyLine(deputies, presidentId) {
  if (!Array.isArray(deputies)) return '';
  return deputies
    .filter(deputy => deputy.presidentId === presidentId)
    .map(deputy => `${deputy.name} (${deputy.number})`)
    .join(' e ');
}

export default function PartyProposals({ presidents, deputies }) {
  const parties = presidents.filter(president => president.proposals?.length > 0);

  if (parties.length === 0) return null;

  return (
    <section id="propostas" className="lp-platform" aria-labelledby="platform-title">
      <div className="lp-wrap">
        <div className="lp-platform-shell">
          <div className="lp-platform-head">
            <span className="lp-kicker">Planos de cada chapa</span>
            <h2 id="platform-title">Propostas dos partidos</h2>
            <p>Conheça as ideias, compromissos e combinados que cada chapa leva para a eleição.</p>
          </div>

          <div className="lp-platform-grid">
            {parties.map(president => (
              <article className="lp-platform-card" key={president.id}>
                <header className="lp-platform-card-head">
                  {president.party && <span className="lp-kicker">{president.party}</span>}
                  <h3>{president.name}</h3>
                  <p className="lp-platform-deputies">Deputados: {formatDeputyLine(deputies, president.id) || 'Não informados'}</p>
                  {president.slogan && <p className="lp-platform-slogan">“{president.slogan}”</p>}
                </header>
                <ol className="lp-platform-list">
                  {president.proposals.map((proposal, index) => (
                    <li className="lp-platform-item" key={proposal.title}>
                      <span className="lp-platform-index">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <h4>{proposal.title}</h4>
                        <p>{proposal.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
