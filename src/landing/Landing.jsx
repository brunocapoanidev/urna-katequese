import { useRef } from 'react';
import './landing.css';
import CandidateCard from './CandidateCard.jsx';
import PosterCarousel from './PosterCarousel.jsx';
import PartyProposals from './PartyProposals.jsx';
import Countdown from './Countdown.jsx';
import { when, whenShort } from '../time.js';
import { useColinha } from '../colinha.js';

const STEPS = [
  { title: 'Entre com seu código JEK', text: 'Digite apenas o código individual secreto que você recebeu da organização.' },
  { title: 'Use sua Colinha na Urna', text: 'Vote primeiro para Presidente (2 dígitos) e depois para Deputado (4 dígitos). São 4 deputados eleitos!' },
  { title: 'Pegue seu Comprovante Oficial', text: 'Confira a foto na tela, aperte CONFIRMA e compartilhe seu comprovante oficial da JEK no grupo.' },
];

const VOTING_WINDOW = 'Sáb. 15h até dom. 17h';

const STATUS_LABEL = { scheduled: 'Votação em breve', open: 'Votação aberta', closed: 'Votação encerrada' };

const byNumber = (a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true });

export default function Landing({ presidents, deputies, config, turnout, skew = 0, onVote, onApuracao, onTitulo, onSocial, onPreview }) {
  const previewClicks = useRef(0);
  const { colinha, togglePresident, toggleDeputy, clearColinha } = useColinha();
  const ordered = [...presidents].sort(byNumber);
  // Sem servidor (npm run dev) não há config: a tela inicial libera o botão para testar.
  const status = config?.status ?? 'open';
  const round = config?.round || 1;
  const seats = config?.seats || 4;
  const runoffIds = config?.runoffIds || [];
  const label = config && STATUS_LABEL[status];
  const canVote = status === 'open';

  const voteAction = () => {
    if (canVote) return onVote();
    if (status !== 'scheduled') return;
    previewClicks.current += 1;
    if (previewClicks.current === 20) {
      previewClicks.current = 0;
      onPreview();
    }
  };

  const period = config?.opensAt && config?.closesAt ? `${whenShort(config.opensAt)} até ${whenShort(config.closesAt)}` : VOTING_WINDOW;
  const voteLabel = status === 'scheduled' ? 'A votação ainda não abriu' : 'Votação encerrada';
  const posters = ordered.flatMap(p => (p.posters || []).map(x => ({ ...x, label: `${p.name} · ${p.number}` })));

  const totalVoters = turnout?.total ?? 19;
  const votedCount = turnout?.voted ?? 0;
  const turnoutPct = totalVoters > 0 ? Math.min(100, Math.round((votedCount / totalVoters) * 100)) : 0;

  const runoffFinalists = round === 2 && runoffIds.length >= 2
    ? ordered.filter(p => runoffIds.includes(p.id))
    : [];

  const hasColinha = Boolean(colinha.president || colinha.deputy);

  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-wrap lp-header-row">
          <div className="lp-brand">
            <div className="lp-brand-mark" aria-hidden="true">
              <span>JEK</span>
            </div>
            <div className="lp-brand-text">
              <span>Justiça Eleitoral Katequista</span>
              <small>Eleições Oficiais 2026 · {round}º Turno</small>
            </div>
          </div>
          <nav aria-label="Principal" className="lp-nav">
            <a href="#candidatos" className="lp-nav-link">Candidatos</a>
            <a href="#propostas" className="lp-nav-link">Propostas</a>
            <button type="button" className="lp-nav-apuracao" onClick={onSocial}>
              <img src="/logo-kx.jpg" alt="" className="lp-kx-icon" />
              Rede Social
            </button>
            <button type="button" className="lp-nav-apuracao" onClick={onTitulo}>
              🪪 Meu Título
            </button>
            <button type="button" className="lp-nav-apuracao" onClick={onApuracao}>
              <i aria-hidden="true" />
              Apurações
            </button>
            <button type="button" className="lp-pill" onClick={voteAction} disabled={status === 'closed'}>{canVote ? 'Votar agora' : label}</button>
          </nav>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-status-row">
              {label && (
                <span className="lp-status">
                  <i className={status === 'open' ? 'on' : status === 'scheduled' ? 'wait' : 'off'} />
                  {label}
                </span>
              )}
              <span className="lp-round-badge">
                {round === 2 ? '⚡ 2º Turno Presidencial' : '🗳️ 1º Turno Geral'}
              </span>
            </div>

            <h1>
              {round === 2 ? (
                <>Decisão em 2º Turno.<br />Vote na Urna da JEK.</>
              ) : (
                <>Conheça os candidatos.<br />Escolha com consciência.</>
              )}
            </h1>
            <p>
              {round === 2
                ? 'Nenhum candidato atingiu mais de 50% no 1º turno. Agora a disputa final para Presidente está entre os dois mais votados!'
                : `Compare as propostas para Presidente e os ${deputies.length} candidatos a Deputado (${seats} serão eleitos). Monte sua colinha e registre seu voto na JEK.`}
            </p>
            {status === 'scheduled' && (
              <>
                <Countdown target={config.opensAt} skew={skew} label="A votação abre em" />
                <p className="lp-when">{when(config.opensAt)}</p>
              </>
            )}
            {status === 'open' && config?.closesAt && <Countdown target={config.closesAt} skew={skew} label="A votação encerra em" />}
            <div className="lp-actions">
              <button type="button" className="lp-btn lp-btn-primary" onClick={voteAction} disabled={status === 'closed'}>
                {canVote ? `Ir para a Urna (${round}º Turno)` : voteLabel}
                {canVote && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={onSocial}>
                <img src="/logo-kx.jpg" alt="" className="lp-kx-icon-lg" />
                Rede Social KateX
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={onTitulo}>
                🪪 Emitir Meu Título JEK
              </button>
              <button type="button" className="lp-btn lp-btn-ghost" onClick={onApuracao}>
                📊 Central de Apurações
              </button>
            </div>
          </div>

          <aside className="lp-facts" aria-label="Resumo da eleição JEK">
            <div className="lp-facts-top">
              <span className="lp-kicker">Boletim Oficial · JEK 2026</span>
              <span className="lp-zone-tag">Zona 001 · Seção Katequese</span>
            </div>
            <dl>
              <div>
                <dt>Presidente</dt>
                <dd>{round === 2 ? '2 Finalistas' : `${presidents.length} Chapas`}</dd>
                <small>1 vaga + 2º turno</small>
              </div>
              <div>
                <dt>Deputados</dt>
                <dd>{seats} de {deputies.length}</dd>
                <small>4 mais votados eleitos</small>
              </div>
              <div className="wide">
                <dt>Período de votação ({round}º Turno)</dt>
                <dd>{period}</dd>
              </div>
            </dl>

            <div className="lp-quorum" aria-label="Quórumômetro de participação">
              <div className="lp-quorum-head">
                <span>Quórumômetro JEK ({round}º Turno)</span>
                <strong>{votedCount} / {totalVoters} votaram ({turnoutPct}%)</strong>
              </div>
              <div className="lp-quorum-bar" role="progressbar" aria-valuemin="0" aria-valuemax={totalVoters} aria-valuenow={votedCount}>
                <i style={{ width: `${turnoutPct}%` }} />
              </div>
              <small>
                {votedCount === 0
                  ? 'Aguardando os primeiros votos da galera na urna.'
                  : votedCount >= totalVoters
                    ? '100% dos eleitores já compareceram às urnas!'
                    : `Faltam ${Math.max(0, totalVoters - votedCount)} katequista(s) exercerem o voto!`}
              </small>
            </div>

            <p className="lp-secret">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              Sigilo garantido pela JEK: ninguém vê em quem você votou.
            </p>
          </aside>
        </div>
      </section>

      <section id="candidatos" className="lp-candidates">
        <div className="lp-wrap lp-stack">
          {runoffFinalists.length === 2 && (
            <div className="lp-runoff-banner">
              <div>
                <span className="lp-kicker">Disputa Final · 2º Turno JEK</span>
                <h2>Finalistas à Presidência do Grupo</h2>
                <p>No 2º turno você vota apenas para Presidente entre os dois candidatos abaixo.</p>
              </div>
              <div className="lp-runoff-chips">
                {runoffFinalists.map(f => (
                  <span key={f.id} className="lp-runoff-chip">
                    <strong>{f.number}</strong> {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="lp-intro">
            <div>
              <h2>Candidatos e Colinha Eleitoral</h2>
              <p>Clique em <b>“Anotar na Colinha”</b> no seu candidato para levar os números salvos direto para a tela da urna!</p>
            </div>
            <span>4 de 6 deputados são eleitos</span>
          </div>
          <div className="lp-grid">
            {ordered.map(p => (
              <CandidateCard
                key={p.id}
                president={p}
                deputies={deputies.filter(d => d.presidentId === p.id).sort(byNumber)}
                isRunoffFinalist={round === 2 && runoffIds.includes(p.id)}
                savedPresidentId={colinha.president?.id}
                savedDeputyId={colinha.deputy?.id}
                onPickPresident={togglePresident}
                onPickDeputy={toggleDeputy}
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
                <h2>Santinhos e materiais de campanha</h2>
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
          <h2>Como funciona a eleição na JEK</h2>
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
          <h2>Pronto para votar na JEK?</h2>
          <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={voteAction} disabled={status === 'closed'}>{canVote ? 'Entrar na Cabine de Votação' : voteLabel}</button>
          <small>JEK — Justiça Eleitoral Katequista · Simulação privada do grupo, sem vínculo governamental.</small>
        </div>
      </section>

      {hasColinha && (
        <aside className="lp-colinha-dock" aria-label="Sua Colinha Eleitoral JEK">
          <div className="lp-wrap lp-colinha-inner">
            <div className="lp-colinha-items">
              <span className="lp-colinha-tag">📋 Minha Colinha JEK:</span>
              <span>
                Presidente: <strong>{colinha.president ? `${colinha.president.number} (${colinha.president.name})` : '—'}</strong>
              </span>
              {round === 1 && (
                <span>
                  Deputado: <strong>{colinha.deputy ? `${colinha.deputy.number} (${colinha.deputy.name})` : '—'}</strong>
                </span>
              )}
            </div>
            <div className="lp-colinha-actions">
              <button type="button" className="lp-colinha-clear" onClick={clearColinha}>Limpar</button>
              {canVote && (
                <button type="button" className="lp-pill" onClick={voteAction}>
                  Ir para a Urna →
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
