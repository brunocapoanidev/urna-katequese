import './landing.css';
import CandidateCard from './CandidateCard.jsx';
import PosterCarousel from './PosterCarousel.jsx';
import PartyProposals from './PartyProposals.jsx';
import Countdown from './Countdown.jsx';
import { when, whenShort } from '../time.js';

const STEPS = [
  { title: 'Entre com seu código', text: 'Use seu nome e o código individual que você recebeu do grupo.' },
  { title: 'Digite os números', text: 'Primeiro o número do presidente, depois o do deputado. Você também pode votar em branco.' },
  { title: 'Confira e confirme', text: 'Veja a foto e o nome na tela e aperte CONFIRMA. O voto é secreto e só vale uma vez.' },
];

const VOTING_WINDOW = 'Sáb. 15h até dom. 17h';

const STATUS_LABEL = { scheduled: 'Votação em breve', open: 'Votação aberta', closed: 'Votação encerrada' };

const byNumber = (a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true });

export default function Landing({ presidents, deputies, config, skew = 0, onVote }) {
  const ordered = [...presidents].sort(byNumber);
  // Sem servidor (npm run dev) não há config: a tela inicial libera o botão para testar.
  const status = config?.status ?? 'open';
  const label = config && STATUS_LABEL[status];
  const canVote = status === 'open';
  const period = config?.opensAt && config?.closesAt ? `${whenShort(config.opensAt)} até ${whenShort(config.closesAt)}` : VOTING_WINDOW;
  const voteLabel = status === 'scheduled' ? 'A votação ainda não abriu' : 'Votação encerrada';
  const posters = ordered.flatMap(p => (p.posters || []).map(x => ({ ...x, label: `${p.name} · ${p.number}` })));

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-wrap lp-header-row">
          <div className="lp-brand">
            <div className="lp-brand-mark" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <div className="lp-brand-text">
              <span>Votações do Grupo Katequese</span>
              <small>Eleição 2026</small>
            </div>
          </div>
          <nav aria-label="Principal" className="lp-nav">
            <a href="#candidatos" className="lp-nav-link">Candidatos</a>
            <a href="#como-votar" className="lp-nav-link">Como votar</a>
            <button type="button" className="lp-pill" onClick={onVote} disabled={!canVote}>{canVote ? 'Votar agora' : label}</button>
          </nav>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            {label && (
              <span className="lp-status">
                <i className={status === 'open' ? 'on' : status === 'scheduled' ? 'wait' : 'off'} />
                {label}
              </span>
            )}
            <h1>Conheça os candidatos.<br />Escolha com consciência.</h1>
            <p>Veja as propostas de cada candidato a presidente e os deputados de cada chapa. Quando estiver pronto, registre o seu voto.</p>
            {status === 'scheduled' && (
              <>
                <Countdown target={config.opensAt} skew={skew} label="A votação abre em" />
                <p className="lp-when">{when(config.opensAt)}</p>
              </>
            )}
            {status === 'open' && config?.closesAt && <Countdown target={config.closesAt} skew={skew} label="A votação encerra em" />}
            <div className="lp-actions">
              <button type="button" className="lp-btn lp-btn-primary" onClick={onVote} disabled={!canVote}>
                {canVote ? 'Ir para a votação' : voteLabel}
                {canVote && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              </button>
              <a href="#propostas" className="lp-btn lp-btn-ghost">Ver propostas</a>
            </div>
          </div>

          <aside className="lp-facts" aria-label="Resumo da eleição">
            <span className="lp-kicker">Informações da eleição</span>
            <dl>
              <div><dt>Presidentes</dt><dd>{presidents.length}</dd></div>
              <div><dt>Deputados</dt><dd>{deputies.length}</dd></div>
              <div className="wide"><dt>Período de votação</dt><dd>{period}</dd></div>
            </dl>
            <p className="lp-secret">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              Voto secreto: ninguém vê em quem você votou.
            </p>
          </aside>
        </div>
      </section>

      <section id="candidatos" className="lp-candidates">
        <div className="lp-wrap lp-stack">
          <div className="lp-intro">
            <div>
              <h2>Candidatos e propostas</h2>
              <p>Cada candidato tem um número. É ele que você vai digitar na urna.</p>
            </div>
            <span>Ordem por número</span>
          </div>
          <div className="lp-grid">
            {ordered.map(p => (
              <CandidateCard
                key={p.id}
                president={p}
                deputies={deputies.filter(d => d.presidentId === p.id).sort(byNumber)}
              />
            ))}
          </div>
        </div>
      </section>

      {posters.length > 0 && (
        <section id="santinhos" className="lp-material">
          <div className="lp-wrap">
            <div className="lp-posters">
              <div className="lp-posters-head">
                <h2>Santinhos e propostas</h2>
                <p>Deslize para ver todos. Toque em uma imagem para ampliar e ler de perto.</p>
              </div>
              <PosterCarousel posters={posters} />
            </div>
          </div>
        </section>
      )}

      <PartyProposals presidents={ordered} deputies={deputies} />

      <section id="como-votar" className="lp-how">
        <div className="lp-wrap">
          <h2>Como votar</h2>
          <ol className="lp-steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="lp-step-n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-wrap lp-cta-inner">
          <h2>Pronto para votar?</h2>
          <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onVote} disabled={!canVote}>{canVote ? 'Votar agora' : voteLabel}</button>
          <small>Simulação privada, não é um sistema oficial do governo.</small>
        </div>
      </section>
    </div>
  );
}
