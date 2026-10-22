import { useState } from 'react';

const byNumber = (a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true });

const photoStyle = c =>
  c?.photo
    ? {
        backgroundImage: `url(${c.photo})`,
        backgroundPosition: `${c.photoPosition || '50%'} center`,
        backgroundSize: c.photoSize || undefined,
      }
    : undefined;

export function formatDeputyLine(deputies, presidentId) {
  if (!Array.isArray(deputies)) return '';
  return deputies
    .filter(deputy => deputy.presidentId === presidentId)
    .map(deputy => `${deputy.name} (${deputy.number})`)
    .join(' e ');
}

export function normalizeProposals(proposals) {
  if (!Array.isArray(proposals)) return [];
  return proposals
    .map((item, idx) => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? { title: `Proposta ${idx + 1}`, text } : null;
      }
      if (item && typeof item === 'object') {
        const title = String(item.title ?? '').trim();
        const text = String(item.text ?? '').trim();
        return title || text ? { title: title || `Proposta ${idx + 1}`, text } : null;
      }
      return null;
    })
    .filter(Boolean);
}

function CandidateAvatar({ candidate, className = '' }) {
  return (
    <div
      className={`lp-photo ${className}`}
      style={photoStyle(candidate)}
      role={candidate?.photo ? 'img' : undefined}
      aria-label={candidate?.photo ? `Foto de ${candidate.name}` : undefined}
    >
      {!candidate?.photo && (
        <svg width="56%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      )}
    </div>
  );
}

function DeputyProposalCard({ deputy }) {
  const proposals = normalizeProposals(deputy.proposals);

  return (
    <div className="lp-dep-card">
      <div className="lp-dep-card-head">
        <CandidateAvatar candidate={deputy} className="lp-dep-avatar" />
        <div className="lp-dep-meta">
          <div className="lp-dep-title-row">
            <h5>{deputy.name}</h5>
            <span className="lp-dep-badge" title="Número do deputado na urna">
              <small>Nº</small> {deputy.number}
            </span>
          </div>
          <span className="lp-dep-role">Candidato a Deputado</span>
          {deputy.slogan && <p className="lp-dep-slogan">“{deputy.slogan}”</p>}
        </div>
      </div>

      {proposals.length > 0 ? (
        <ul className="lp-dep-prop-list">
          {proposals.map((proposal, index) => (
            <li key={`${deputy.id}-${proposal.title}-${index}`} className="lp-dep-prop-item">
              <span className="lp-dep-prop-dot" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <strong>{proposal.title}</strong>
                {proposal.text && <p>{proposal.text}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lp-dep-empty">Propostas individuais em atualização pela chapa.</p>
      )}
    </div>
  );
}

export default function PartyProposals({ presidents = [], deputies = [] }) {
  const [activeParty, setActiveParty] = useState('all');

  const parties = presidents.filter(
    president =>
      president.proposals?.length > 0 ||
      deputies.some(d => d.presidentId === president.id && d.proposals?.length > 0),
  );

  if (parties.length === 0) return null;

  const visibleParties =
    activeParty === 'all' ? parties : parties.filter(p => p.id === activeParty);

  return (
    <section id="propostas" className="lp-platform" aria-labelledby="platform-title">
      <div className="lp-wrap">
        <div className="lp-platform-shell">
          <div className="lp-platform-top">
            <div className="lp-platform-head">
              <span className="lp-kicker">Planos de governo e bancada</span>
              <h2 id="platform-title">Propostas das chapas e deputados</h2>
              <p>
                Compare os compromissos de cada candidato a presidente e veja também as propostas
                individuais dos deputados de cada partido.
              </p>
            </div>

            {parties.length > 1 && (
              <div className="lp-party-tabs" role="tablist" aria-label="Filtrar propostas por chapa">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeParty === 'all'}
                  className={`lp-party-tab${activeParty === 'all' ? ' is-active' : ''}`}
                  onClick={() => setActiveParty('all')}
                >
                  Todas as chapas
                  <span className="lp-party-tab-count">{parties.length}</span>
                </button>
                {parties.map(president => {
                  const shortParty = president.party ? president.party.split('—')[0].trim() : president.name;
                  const isActive = activeParty === president.id;
                  return (
                    <button
                      key={president.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`lp-party-tab${isActive ? ' is-active' : ''}`}
                      onClick={() => setActiveParty(president.id)}
                    >
                      <span className="lp-party-tab-num">{president.number}</span>
                      <span>{shortParty} · {president.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lp-platform-stack">
            {visibleParties.map(president => {
              const presProposals = normalizeProposals(president.proposals);
              const partyDeputies = deputies
                .filter(deputy => deputy.presidentId === president.id)
                .sort(byNumber);
              const deputyNames = formatDeputyLine(deputies, president.id);

              return (
                <article className="lp-chapa" key={president.id}>
                  <header className="lp-chapa-banner">
                    <div className="lp-chapa-identity">
                      <div className="lp-chapa-avatar-wrap">
                        <CandidateAvatar candidate={president} className="lp-chapa-avatar" />
                        <span className="lp-chapa-number" title="Número do presidente na urna">
                          <small>VOTE</small>
                          <strong>{president.number}</strong>
                        </span>
                      </div>

                      <div className="lp-chapa-copy">
                        {president.party && <span className="lp-chapa-party">{president.party}</span>}
                        <h3>{president.name}</h3>
                        {president.slogan && <p className="lp-chapa-slogan">“{president.slogan}”</p>}
                        <p className="lp-platform-deputies">
                          Deputados da chapa: <strong>{deputyNames || 'Não informados'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="lp-chapa-stats" aria-label="Resumo da chapa">
                      <div>
                        <span>Presidência</span>
                        <strong>{presProposals.length} propostas</strong>
                      </div>
                      <div>
                        <span>Bancada</span>
                        <strong>{partyDeputies.length} deputados</strong>
                      </div>
                    </div>
                  </header>

                  <div className="lp-chapa-body">
                    {presProposals.length > 0 && (
                      <div className="lp-chapa-block">
                        <div className="lp-chapa-block-head">
                          <div>
                            <span className="lp-kicker">Plano da Presidência · Nº {president.number}</span>
                            <h4>Diretrizes de {president.name}</h4>
                          </div>
                          <span className="lp-chapa-pill">{presProposals.length} eixos</span>
                        </div>

                        <ol className="lp-prop-grid">
                          {presProposals.map((proposal, index) => (
                            <li className="lp-prop-card" key={`${president.id}-${proposal.title}`}>
                              <div className="lp-prop-card-top">
                                <span className="lp-platform-index">{String(index + 1).padStart(2, '0')}</span>
                                <h5>{proposal.title}</h5>
                              </div>
                              <p>{proposal.text}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {partyDeputies.length > 0 && (
                      <div className="lp-chapa-block lp-chapa-block-deps">
                        <div className="lp-chapa-block-head">
                          <div>
                            <span className="lp-kicker">Bancada do Partido</span>
                            <h4>Propostas dos Deputados da Chapa</h4>
                          </div>
                          <span className="lp-chapa-pill lp-chapa-pill-gold">
                            {partyDeputies.length} {partyDeputies.length === 1 ? 'candidato' : 'candidatos'}
                          </span>
                        </div>

                        <div className="lp-dep-prop-grid">
                          {partyDeputies.map(deputy => (
                            <DeputyProposalCard key={deputy.id} deputy={deputy} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
