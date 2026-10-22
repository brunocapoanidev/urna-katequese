import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Countdown from '../landing/Countdown.jsx';
import { when } from '../time.js';
import './admin.css';

const KEY = 'urna-admin-token';
const remember = token => {
  try {
    token ? sessionStorage.setItem(KEY, token) : sessionStorage.removeItem(KEY);
  } catch {
    /* sem armazenamento: o login só não sobrevive a recarregar a página */
  }
};
const recall = () => {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};

const photoStyle = c =>
  c?.photo
    ? {
        backgroundImage: `url(${c.photo})`,
        backgroundPosition: `${c.photoPosition || '50%'} center`,
        backgroundSize: c.photoSize || undefined,
      }
    : undefined;

function AdminLogin({ onLogin, notice }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(notice || '');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin((await api('auth', { adminPassword: password })).token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <div className="brand-mark" aria-hidden="true">JEK</div>
      <p className="eyebrow">Justiça Eleitoral Katequista · Administração</p>
      <h1>Painel Oficial da Eleição</h1>
      <form onSubmit={submit}>
        <label>
          Senha de administrador JEK
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Entrando...' : 'Entrar no Painel'}</button>
      </form>
    </main>
  );
}

function Results({ r, currentRound, busy, onStartRound2, onLoadRoundResults }) {
  const resultRound = r.round || 1;
  const seats = r.seats || 4;
  const electedSet = new Set(r.elected || []);
  const winnerObj = r.presidents.find(p => p.id === (resultRound === 1 ? r.firstRoundWinner : r.winner));
  const runoffObjs = (r.runoff || []).map(id => r.presidents.find(p => p.id === id)).filter(Boolean);
  const abstention = Math.max(0, (r.registered || 0) - r.votes);

  const bars = (list, isPresident) => {
    const top = Math.max(1, ...list.map(c => c.votes));
    return list.map((c, idx) => {
      const isWin = isPresident
        ? (resultRound === 1 ? r.firstRoundWinner === c.id : r.winner === c.id)
        : electedSet.has(c.id);
      const isRunoff = isPresident && r.secondRound && r.runoff?.includes(c.id);
      return (
        <div key={c.id} className={`rank-row${isWin || isRunoff ? ' win' : ''}`}>
          <span className="rank-name">
            {idx + 1}º · {c.name} <small>({c.number})</small>
            {isWin && <em className="bu-badge-elected">ELEITO</em>}
            {isRunoff && <em className="bu-badge-runoff">2º TURNO</em>}
          </span>
          <span className="rank-bar"><i style={{ width: `${(c.votes / top) * 100}%` }} /></span>
          <b className="rank-votes">{c.votes} <small>({c.pct ?? 0}%)</small></b>
        </div>
      );
    });
  };

  return (
    <section className="panel bu-panel">
      <div className="bu-header">
        <div>
          <p className="eyebrow">Boletim de Urna Oficial · JEK 2026</p>
          <h2>Apuração Oficial ({resultRound}º Turno)</h2>
        </div>
        <div className="bu-round-switch">
          <button
            type="button"
            className={`btn btn-sm ${resultRound === 1 ? 'btn-dark' : 'btn-ghost'}`}
            disabled={busy}
            onClick={() => onLoadRoundResults(1)}
          >
            1º Turno
          </button>
          {currentRound === 2 && (
            <button
              type="button"
              className={`btn btn-sm ${resultRound === 2 ? 'btn-dark' : 'btn-ghost'}`}
              disabled={busy}
              onClick={() => onLoadRoundResults(2)}
            >
              2º Turno
            </button>
          )}
        </div>
      </div>

      <div className="bu-summary-grid">
        <div><span>Aptos a votar</span><strong>{r.registered}</strong></div>
        <div><span>Comparecimento</span><strong>{r.votes}</strong></div>
        <div><span>Abstenção</span><strong>{abstention}</strong></div>
        <div><span>Válidos (Pres.)</span><strong>{r.validVotes?.president ?? 0}</strong></div>
      </div>

      {/* Proclamação Presidencial: Eleito ou 2º Turno */}
      {r.secondRound && runoffObjs.length === 2 ? (
        <div className="bu-runoff-card">
          <span className="bu-kicker">⚡ Nenhum candidato atingiu mais de 50% dos votos válidos</span>
          <h3>2º TURNO PRESIDENCIAL DEFINIDO!</h3>
          <p>Os dois candidatos mais votados avançam para a disputa final no 2º Turno da JEK:</p>
          <div className="bu-finalists-grid">
            {runoffObjs.map((cand, idx) => (
              <div key={cand.id} className="bu-finalist">
                <div className="bu-avatar" style={photoStyle(cand)} />
                <div>
                  <span className="bu-rank-tag">{idx + 1}º Colocado · Nº {cand.number}</span>
                  <strong>{cand.name}</strong>
                  <small>{cand.votes} voto(s) · {cand.pct ?? 0}% dos válidos</small>
                </div>
              </div>
            ))}
          </div>
          {currentRound === 1 && (
            <div className="bu-runoff-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => onStartRound2(runoffObjs.map(c => c.id), true)}
              >
                ⚡ Abrir 2º Turno Agora com estes 2 Finalistas
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={busy}
                onClick={() => onStartRound2(runoffObjs.map(c => c.id), false)}
              >
                Preparar 2º Turno (Encerrado)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="winner bu-winner-card">
          {winnerObj && <div className="bu-winner-avatar" style={photoStyle(winnerObj)} />}
          <div className="bu-winner-info">
            <span>Presidente Eleito ({resultRound}º Turno)</span>
            <strong>{winnerObj ? `${winnerObj.name} (${winnerObj.number})` : 'Nenhum voto válido'}</strong>
            {winnerObj && (
              <small>
                {winnerObj.votes} voto(s) ({winnerObj.pct ?? 0}% dos votos válidos)
                {r.ties.president ? ' · Desempate pelo menor número eleitoral.' : ''}
              </small>
            )}
          </div>
        </div>
      )}

      <h3>Votação para Presidente ({resultRound}º Turno)</h3>
      {bars(r.presidents, true)}
      <p className="note">
        Válidos: {r.validVotes?.president ?? 0} · Brancos: {r.blank.president} · Nulos: {r.null?.president || 0}
      </p>

      {resultRound === 1 && (
        <>
          <div className="bu-deputies-head">
            <h3>Deputados Eleitos <small>({seats} de {r.deputies.length} vagas eleitas)</small></h3>
          </div>

          <div className="bu-podium-grid">
            {r.deputies.slice(0, seats).filter(d => d.votes > 0).map((dep, idx) => (
              <div key={dep.id} className="bu-podium-card">
                <div className="bu-podium-avatar" style={photoStyle(dep)} />
                <div className="bu-podium-meta">
                  <span className="bu-podium-place">{idx + 1}º Eleito · Nº {dep.number}</span>
                  <strong>{dep.name}</strong>
                  <small>{dep.votes} voto(s) ({dep.pct ?? 0}%)</small>
                </div>
              </div>
            ))}
          </div>

          <h3>Classificação Geral de Deputados (4 de 6 são eleitos)</h3>
          {bars(r.deputies, false)}
          <p className="note">
            Válidos: {r.validVotes?.deputy ?? 0} · Brancos: {r.blank.deputy} · Nulos: {r.null?.deputy || 0}
            {r.ties.deputies && ' · Empate na última vaga: venceu o menor número eleitoral.'}
          </p>
        </>
      )}
    </section>
  );
}

const PHASE = {
  open: { label: 'Votação aberta', css: 'on' },
  scheduled: { label: 'Votação agendada', css: 'wait' },
  closed: { label: 'Votação encerrada', css: 'off' },
};
const MODE = {
  auto: 'Automático: abre e encerra pelo horário abaixo.',
  open: 'Aberta manualmente, sem seguir o horário.',
  closed: 'Encerrada manualmente, sem seguir o horário.',
};
const CONFIRM = {
  open: 'Abrir a votação agora, sem esperar o horário? Os eleitores poderão votar imediatamente.',
  closed: 'Encerrar a votação agora? Ninguém mais conseguirá votar e a apuração será liberada.',
  auto: 'Voltar ao modo automático? A votação passa a seguir o horário de abertura e encerramento.',
};

const pad = n => String(n).padStart(2, '0');
const toInput = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromInput = value => (value ? new Date(value).toISOString() : null);

function Schedule({ config, busy, onSave }) {
  const [opensAt, setOpensAt] = useState(toInput(config.opensAt));
  const [closesAt, setClosesAt] = useState(toInput(config.closesAt));
  const dirty = opensAt !== toInput(config.opensAt) || closesAt !== toInput(config.closesAt);

  return (
    <form className="schedule" onSubmit={e => { e.preventDefault(); onSave({ opensAt: fromInput(opensAt), closesAt: fromInput(closesAt) }); }}>
      <h3>Horário da votação</h3>
      <label>Abre em<input type="datetime-local" value={opensAt} onChange={e => setOpensAt(e.target.value)} required /></label>
      <label>Encerra em<input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)} required /></label>
      <p className="note">No fuso do seu aparelho. Antes do horário de abertura, o site mostra a contagem regressiva e ninguém consegue entrar.</p>
      <button className="btn btn-dark" disabled={busy || !dirty}>Salvar horário</button>
    </form>
  );
}

function Dashboard({ token, onLogout }) {
  const [info, setInfo] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);

  const fail = useCallback(err => {
    if (err.status === 401) onLogout('Sessão expirada. Entre novamente.');
    else setError(err.message);
  }, [onLogout]);

  const load = useCallback(
    () => api('admin', undefined, token).then(x => { setInfo(x); setError(''); }).catch(fail),
    [token, fail],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => !document.hidden && load(), 15000);
    return () => clearInterval(timer);
  }, [load]);

  async function change(payload) {
    setBusy(true);
    try {
      await api('admin', { action: 'config', payload }, token);
      setConfirming(null);
      setResults(null);
      setError('');
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function count(roundParam) {
    setBusy(true);
    try {
      const payload = roundParam ? { round: roundParam } : {};
      setResults(await api('admin', { action: 'results', payload }, token));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function startRound2(runoffIds, openNow = true) {
    setBusy(true);
    try {
      await api('admin', { action: 'startRound2', payload: { runoffIds, openNow } }, token);
      setResults(null);
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function setRound(targetRound) {
    setBusy(true);
    try {
      await api('admin', { action: 'setRound', payload: { round: targetRound } }, token);
      setResults(null);
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  async function resetTitle(voterId) {
    setBusy(true);
    try {
      await api('admin', { action: 'resetTitle', payload: { voterId } }, token);
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  if (!info) {
    return (
      <main className="card wide">
        <h1>Painel da eleição · JEK</h1>
        {error ? <p className="error" role="alert">{error}</p> : <p className="lead">Carregando…</p>}
        <button type="button" className="btn btn-ghost" onClick={() => onLogout()}>Sair</button>
      </main>
    );
  }

  const { phase, config } = info;
  const round = config.round || 1;
  const skew = info.now - Date.now();
  const { total, voted, pending } = info.stats;

  return (
    <main className="admin-page">
      <header className="admin-head">
        <div>
          <p className="eyebrow">JEK — Justiça Eleitoral Katequista · {round}º Turno</p>
          <h1>Painel da Eleição</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => onLogout()}>Sair</button>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="panel">
        <div className="status-row">
          <div className="status-badges">
            <span className={`pill ${PHASE[phase].css}`}>{PHASE[phase].label}</span>
            <span className="pill round-pill">{round}º Turno Ativo</span>
          </div>
          <button type="button" className="link" onClick={load}>Atualizar</button>
        </div>
        <p className="note">{MODE[config.status] || MODE.auto}</p>
        {phase === 'scheduled' && config.opensAt && (
          <div className="admin-countdown">
            <Countdown target={config.opensAt} skew={skew} label="Abre em" />
            <p className="note">{when(config.opensAt)}</p>
          </div>
        )}
        {phase === 'open' && config.status === 'auto' && config.closesAt && (
          <p className="note">Encerra automaticamente {when(config.closesAt)}.</p>
        )}

        <div className="stats">
          <div><span>Participaram ({round}º Turno)</span><strong>{voted} / {total}</strong></div>
          <div><span>Faltam votar</span><strong>{Math.max(0, total - voted - pending)}</strong></div>
          <div><span>Em processamento</span><strong>{pending}</strong></div>
        </div>
        <div className="meter" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={voted}>
          <i style={{ width: `${total ? (voted / total) * 100 : 0}%` }} />
        </div>
        {pending > 0 && (
          <p className="note">
            "Em processamento" é um voto interrompido no meio do envio. Se persistir depois do encerramento,
            o eleitor precisa de apoio da organização.
          </p>
        )}

        {confirming ? (
          <div className="confirm">
            <p>{CONFIRM[confirming]}</p>
            <div className="row">
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => change({ status: confirming })}>
                {busy ? 'Aguarde...' : 'Confirmar'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setConfirming(null)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="row">
            {phase !== 'open' && <button type="button" className="btn btn-primary" onClick={() => setConfirming('open')}>Abrir agora</button>}
            {phase === 'open' && <button type="button" className="btn btn-dark" onClick={() => setConfirming('closed')}>Encerrar agora</button>}
            {config.status !== 'auto' && <button type="button" className="btn btn-ghost" onClick={() => setConfirming('auto')}>Seguir o horário</button>}
            {phase === 'closed' && <button type="button" className="btn btn-dark" disabled={busy} onClick={() => count(round)}>Apurar {round}º Turno</button>}
            {phase === 'closed' && round === 1 && (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => startRound2(undefined, false)}>
                Ativar 2º Turno
              </button>
            )}
            {phase === 'closed' && round === 2 && (
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRound(1)}>
                Voltar ao 1º Turno
              </button>
            )}
          </div>
        )}
        {phase === 'open' && <p className="note">A apuração só fica disponível depois do encerramento. Não divulgue resultados antes disso.</p>}
      </section>

      <section className="panel">
        <Schedule key={`${config.opensAt}|${config.closesAt}`} config={config} busy={busy} onSave={change} />
      </section>

      {Array.isArray(info.votersStatus) && (
        <section className="panel">
          <div className="status-row">
            <div>
              <h3>Controle de Títulos e Presença ({info.votersStatus.length} Eleitores)</h3>
              <p className="note">
                Acompanhe quem já retirou o e-Título JEK no site e quem já votou. Se alguém esquecer o PIN de 4 dígitos
                ou emitir o título errado, clique em <b>Liberar Título</b>.
              </p>
            </div>
            <span className="pill">
              {info.stats.titlesClaimed || 0} / {info.votersStatus.length} títulos emitidos
            </span>
          </div>

          <div className="admin-voters-grid">
            {info.votersStatus.map(v => (
              <div key={v.id} className="admin-voter-row">
                <div className="admin-voter-name">
                  <strong>{v.name}</strong>
                  <div className="admin-voter-tags">
                    <span className={`admin-mini-tag${v.claimed ? ' is-ok' : ''}`}>
                      {v.claimed ? '🪪 Título emitido' : '⏳ Sem título'}
                    </span>
                    <span className={`admin-mini-tag${v.voted ? ' is-voted' : ''}`}>
                      {v.voted ? '🗳️ Votou ✓' : 'Falta votar'}
                    </span>
                  </div>
                </div>
                {v.claimed && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    disabled={busy}
                    onClick={() => resetTitle(v.id)}
                  >
                    🔓 Liberar Título
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {results && (
        <Results
          r={results}
          currentRound={round}
          busy={busy}
          onStartRound2={startRound2}
          onLoadRoundResults={count}
        />
      )}
    </main>
  );
}

export default function Admin() {
  const [token, setToken] = useState(recall);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Painel JEK · Votações do Grupo Katequese';
  }, []);

  const login = t => {
    remember(t);
    setNotice('');
    setToken(t);
  };
  const logout = message => {
    remember('');
    setNotice(typeof message === 'string' ? message : '');
    setToken('');
  };

  return token ? <Dashboard token={token} onLogout={logout} /> : <AdminLogin onLogin={login} notice={notice} />;
}
