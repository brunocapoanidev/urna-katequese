import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useColinha } from '../colinha.js';

const TEST_CODE = 'CATEQUESE-2026-TESTE';

export default function Login({ onLogin, onBack, preview = false, round = 1, initialCode = '' }) {
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [votersStatus, setVotersStatus] = useState([]);
  const { colinha } = useColinha();

  useEffect(() => {
    if (!preview) return;
    api('preview-status').then(result => setVotersStatus(result.voters || [])).catch(() => setVotersStatus([]));
  }, [preview]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('auth', { code, preview });
      onLogin(preview ? { token: 'preview-hidden', name: result.name } : result);
    } catch (err) {
      if (import.meta.env.DEV && !err.status) {
        onLogin({ token: code === TEST_CODE ? 'preview-admin' : 'preview', name: code === TEST_CODE ? 'Teste Catequese 2026' : 'Eleitor' });
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="jek-terminal-page">
      <section className="card jek-login-card">
        <div className="jek-login-top">
          <button type="button" className="back" onClick={onBack}>← Voltar ao site</button>
          <span className="jek-zone-pill">Zona 001 · Seção Katequese</span>
        </div>
        <div className="jek-crest-row">
          <div className="brand-mark jek-crest" aria-hidden="true">JEK</div>
          <div>
            <p className="eyebrow">Justiça Eleitoral Katequista · {round}º Turno</p>
            <h1>Terminal do Mesário</h1>
          </div>
        </div>
        <p className="lead">{preview ? 'Modo de Simulação da JEK: digite seu código individual para testar a urna.' : `Identifique-se com seu código individual secreto para habilitar a Urna Eletrônica no ${round}º Turno.`}</p>
        {(colinha.president || colinha.deputy) && (
          <div className="jek-login-colinha">
            <span>📋 Sua Colinha salva para a urna:</span>
            <div>{colinha.president && <b>Pres: {colinha.president.number}</b>}{round === 1 && colinha.deputy && <b>Dep: {colinha.deputy.number}</b>}</div>
          </div>
        )}
        <form onSubmit={submit}>
          <label>
            Código Individual de Habilitação (e-Título JEK)
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex.: XXXX-XXXX" autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Habilitando Urna Eletrônica...' : `Habilitar Urna · ${round}º Turno`}</button>
        </form>
        <div className="jek-security-seal"><span>🔒 Sigilo garantido: o código apenas libera a cabine e nunca é vinculado ao voto.</span></div>
        {preview && (
          <section className="preview-presence" aria-label="Lista de participação">
            <div className="preview-presence-head">
              <div><p className="eyebrow">Acompanhamento da eleição</p><h2>Quem já votou</h2></div>
              <strong>{votersStatus.filter(v => v.status === 'voted').length} / {votersStatus.length}</strong>
            </div>
            <p className="fine">A lista mostra somente presença. O voto de cada pessoa continua secreto.</p>
            <div className="preview-presence-list">
              {votersStatus.map(voter => <div className="preview-presence-row" key={voter.id}><span>{voter.name}</span><b className={`preview-presence-status ${voter.status}`}>{voter.status === 'voted' ? 'Votou' : voter.status === 'pending' ? 'Em processamento' : 'Não votou'}</b></div>)}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
