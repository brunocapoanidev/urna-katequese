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
      <div className="brand-mark" aria-hidden="true">✓</div>
      <p className="eyebrow">Administração</p>
      <h1>Painel da eleição</h1>
      <form onSubmit={submit}>
        <label>
          Senha de administrador
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </main>
  );
}

function Results({ r, names }) {
  const winner = names.get(r.winner);
  const bars = list => {
    const top = Math.max(1, ...list.map(c => c.votes));
    return list.map(c => (
      <div key={c.id} className={`rank-row${r.winner === c.id || r.elected?.includes(c.id) ? ' win' : ''}`}>
        <span className="rank-name">{c.name} <small>{c.number}</small></span>
        <span className="rank-bar"><i style={{ width: `${(c.votes / top) * 100}%` }} /></span>
        <b>{c.votes}</b>
      </div>
    ));
  };

  return (
    <section className="panel">
      <h2>Apuração</h2>
      <p className="lead">{r.votes} voto(s) contado(s) de {r.registered} eleitor(es) cadastrado(s).</p>

      <div className="winner">
        <span>Presidente eleito</span>
        <strong>{winner || 'Nenhum voto válido'}</strong>
        {r.ties.president && <small>Empate em votos: venceu o menor número eleitoral.</small>}
      </div>

      <h3>Presidente</h3>
      {bars(r.presidents)}
      <p className="note">Brancos: {r.blank.president} · Nulos: {r.null?.president || 0}</p>

      <h3>Deputados <small>(3 mais votados são eleitos)</small></h3>
      {bars(r.deputies)}
      <p className="note">
        Brancos: {r.blank.deputy} · Nulos: {r.null?.deputy || 0}
        {r.ties.deputies && ' · Empate na última vaga: venceu o menor número eleitoral.'}
      </p>
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

  async function count() {
    setBusy(true);
    try {
      setResults(await api('admin', { action: 'results' }, token));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  }

  if (!info) {
    return (
      <main className="card wide">
        <h1>Painel da eleição</h1>
        {error ? <p className="error" role="alert">{error}</p> : <p className="lead">Carregando…</p>}
        <button type="button" className="btn btn-ghost" onClick={() => onLogout()}>Sair</button>
      </main>
    );
  }

  const { phase, config } = info;
  const skew = info.now - Date.now();
  const { total, voted, pending } = info.stats;
  const names = new Map([...info.presidents, ...info.deputies].map(c => [c.id, c.name]));

  return (
    <main className="admin-page">
      <header className="admin-head">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Painel da eleição</h1>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => onLogout()}>Sair</button>
      </header>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="panel">
        <div className="status-row">
          <span className={`pill ${PHASE[phase].css}`}>{PHASE[phase].label}</span>
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
          <div><span>Participaram</span><strong>{voted} / {total}</strong></div>
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
            {phase === 'closed' && <button type="button" className="btn btn-dark" disabled={busy} onClick={count}>Apurar resultado</button>}
          </div>
        )}
        {phase === 'open' && <p className="note">A apuração só fica disponível depois do encerramento. Não divulgue resultados antes disso.</p>}
      </section>

      <section className="panel">
        <Schedule key={`${config.opensAt}|${config.closesAt}`} config={config} busy={busy} onSave={change} />
      </section>

      {results && <Results r={results} names={names} />}
    </main>
  );
}

export default function Admin() {
  const [token, setToken] = useState(recall);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    document.title = 'Painel · Votações do Grupo Katequese';
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
