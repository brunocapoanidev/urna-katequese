import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import './titulo.css';

const DEVICE_KEY = 'jek-device-id-v1';
const SAVED_TITLE_KEY = 'jek-my-title-v1';

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'local-session-device';
  }
}

function readCachedTitle() {
  try {
    const raw = localStorage.getItem(SAVED_TITLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedTitle(title) {
  try {
    if (title) localStorage.setItem(SAVED_TITLE_KEY, JSON.stringify(title));
    else localStorage.removeItem(SAVED_TITLE_KEY);
  } catch {
    /* sem storage */
  }
}

function TituloCard({ title, canVote, onGoVote, onGoSocial, onSwitchView }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const issuedDate = new Date(title.issuedAt || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const maskedCode = title.code ? `${title.code.slice(0, 2)}**-*${title.code.slice(-2)}` : '****-****';

  const shareMessage = `🪪 *TÍTULO DE ELEITOR KATEQUISTA — e-TÍTULO JEK 2026*\n🏛️ Justiça Eleitoral Katequista\n👤 Eleitor(a): *${title.name}*\n🔢 Inscrição JEK: \`${title.inscription}\`\n📍 Zona ${title.zone} · Seção ${title.section}\n✅ Situação: *${title.voted ? `VOTOU NO ${title.round}º TURNO` : 'ELEITOR QUITE COM A RESENHA'}*\n🔐 Código da Urna: \`${maskedCode}\` *(protegido)*\n\nAcabei de emitir meu Título Oficial da JEK! 🗳️🔥`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(title.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignora */
    }
  }

  return (
    <div className="et-card-wrap">
      <article className="et-document" aria-label="Carteirinha Oficial do Título de Eleitor Katequista">
        <header className="et-doc-header">
          <div className="et-doc-coat" aria-hidden="true">
            <span>JEK</span>
          </div>
          <div className="et-doc-titles">
            <span className="et-doc-republic">REPÚBLICA FEDERATIVA DA KATEQUESE</span>
            <h2>TÍTULO DE ELEITOR KATEQUISTA</h2>
            <small>JUSTIÇA ELEITORAL KATEQUISTA · VIA DIGITAL OFICIAL (e-TÍTULO)</small>
          </div>
          <span className={`et-doc-status${title.voted ? ' is-voted' : ''}`}>
            {title.voted ? `VOTOU · ${title.round}ºT ✓` : 'ELEITOR QUITE ✓'}
          </span>
        </header>

        <div className="et-doc-body">
          <div className="et-doc-main">
            <div className="et-field et-field-name">
              <span>NOME DO(A) ELEITOR(A) KATEQUISTA</span>
              <strong>{title.name.toUpperCase()}</strong>
            </div>

            <div className="et-field-grid">
              <div className="et-field">
                <span>Nº DE INSCRIÇÃO JEK</span>
                <strong>{title.inscription}</strong>
              </div>
              <div className="et-field">
                <span>DATA DE EMISSÃO</span>
                <strong>{issuedDate}</strong>
              </div>
              <div className="et-field">
                <span>ZONA ELEITORAL</span>
                <strong>{title.zone}</strong>
              </div>
              <div className="et-field">
                <span>SEÇÃO ELEITORAL</span>
                <strong>{title.section}</strong>
              </div>
            </div>
          </div>

          <aside className="et-doc-qr-box" aria-label="Selo de Autenticidade JEK">
            <svg viewBox="0 0 80 80" className="et-qr-svg" aria-hidden="true">
              <rect x="4" y="4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="11" y="11" width="8" height="8" fill="currentColor" />
              <rect x="54" y="4" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="61" y="11" width="8" height="8" fill="currentColor" />
              <rect x="4" y="54" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="4" />
              <rect x="11" y="61" width="8" height="8" fill="currentColor" />
              <rect x="34" y="10" width="6" height="6" fill="currentColor" />
              <rect x="34" y="24" width="12" height="6" fill="currentColor" />
              <rect x="12" y="34" width="14" height="6" fill="currentColor" />
              <rect x="34" y="36" width="10" height="10" fill="currentColor" />
              <rect x="52" y="34" width="18" height="6" fill="currentColor" />
              <rect x="34" y="54" width="6" height="16" fill="currentColor" />
              <rect x="48" y="50" width="12" height="8" fill="currentColor" />
              <rect x="64" y="56" width="10" height="18" fill="currentColor" />
              <rect x="48" y="66" width="10" height="10" fill="currentColor" />
            </svg>
            <small>AUTENTICADO JEK</small>
          </aside>
        </div>

        <footer className="et-code-vault">
          <div className="et-code-info">
            <span>🔐 SEU CÓDIGO INDIVIDUAL SECRETO DA URNA:</span>
            <strong className="et-secret-code">
              {showCode ? title.code : maskedCode}
            </strong>
            <small>Código vinculado exclusivamente a {title.name}. Não compartilhe seu código completo.</small>
          </div>
          <div className="et-code-buttons">
            <button type="button" className="et-btn-sm" onClick={() => setShowCode(s => !s)}>
              {showCode ? '🙈 Ocultar' : '👁️ Revelar'}
            </button>
            <button type="button" className="et-btn-sm et-btn-gold" onClick={copyCode}>
              {copied ? '✓ Copiado!' : '📋 Copiar Código'}
            </button>
          </div>
        </footer>
      </article>

      <div className="et-card-actions">
        {onGoSocial && (
          <button
            type="button"
            className="et-action-primary"
            onClick={onGoSocial}
          >
            𝕏 Entrar na Rede Social Oficial (Katequese X)
          </button>
        )}
        {canVote && (
          <button
            type="button"
            className="et-action-primary"
            onClick={() => onGoVote(title.code)}
          >
            🗳️ Ir para a Urna Votar com meu Título
          </button>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="et-action-whatsapp"
        >
          📲 Compartilhar meu Título no Grupo (código protegido)
        </a>
        <button type="button" className="et-action-ghost" onClick={onSwitchView}>
          Ver lista dos 19 eleitores do grupo
        </button>
      </div>
    </div>
  );
}

export default function Titulo({ canVote, onBack, onGoVote, onGoSocial }) {
  const [voters, setVoters] = useState([]);
  const [myTitle, setMyTitle] = useState(readCachedTitle);
  const [showListAnyway, setShowListAnyway] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [secretCode, setSecretCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const deviceId = getDeviceId();

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/.netlify/functions/title?deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.voters)) setVoters(d.voters);
        if (d.myTitle) {
          setMyTitle(d.myTitle);
          writeCachedTitle(d.myTitle);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deviceId]);

  useEffect(load, [load]);

  async function handleEmitWithCode(e) {
    e.preventDefault();
    if (!selectedVoter) return;
    setBusy(true);
    setError('');
    try {
      const res = await api('title', {
        action: 'claim',
        voterId: selectedVoter.id,
        code: secretCode,
        deviceId,
      });
      setMyTitle(res.myTitle);
      writeCachedTitle(res.myTitle);
      setShowListAnyway(false);
      setSelectedVoter(null);
      setSecretCode('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const claimedCount = voters.filter(v => v.claimed).length;

  return (
    <div className="et-page">
      <header className="et-top">
        <div className="et-wrap et-top-row">
          <button type="button" className="et-back" onClick={onBack}>
            ← Início
          </button>
          <div className="et-brand">
            <span className="et-brand-badge">e-TÍTULO JEK</span>
            <strong>Título Katequista</strong>
          </div>
          {myTitle && showListAnyway && (
            <button
              type="button"
              className="et-btn-sm et-btn-gold"
              onClick={() => setShowListAnyway(false)}
            >
              🪪 Meu Título
            </button>
          )}
        </div>
      </header>

      <main className="et-wrap et-main">
        {myTitle && !showListAnyway ? (
          <TituloCard
            title={myTitle}
            canVote={canVote}
            onGoVote={onGoVote}
            onGoSocial={onGoSocial}
            onSwitchView={() => setShowListAnyway(true)}
          />
        ) : (
          <section className="et-desk">
            <div className="et-desk-head">
              <div>
                <span className="et-kicker">Justiça Eleitoral Katequista · Validação Oficial</span>
                <h1>Emita seu Título de Eleitor Katequista</h1>
                <p>
                  Clique no seu nome na lista dos <b>19 integrantes</b> abaixo e informe o{' '}
                  <b>código individual secreto de 8 caracteres</b> que você recebeu no WhatsApp. O sistema só libera o
                  Título se o código pertencer exatamente ao eleitor selecionado!
                </p>
              </div>
              <div className="et-desk-tabs">
                <span className="et-desk-tab is-active">
                  🪪 {claimedCount} de 19 Títulos Katequistas já emitidos
                </span>
              </div>
            </div>

            {selectedVoter && (
              <div
                className="et-modal-backdrop"
                onClick={() => {
                  setSelectedVoter(null);
                  setSecretCode('');
                  setError('');
                }}
              >
                <form
                  className="et-modal-card"
                  onClick={e => e.stopPropagation()}
                  onSubmit={handleEmitWithCode}
                >
                  <div className="et-modal-top">
                    <div>
                      <span className="et-kicker">🔐 Validação de Identidade Eleitoral</span>
                      <h3>Emitir Título de {selectedVoter.name}</h3>
                    </div>
                    <button
                      type="button"
                      className="et-close-btn"
                      onClick={() => {
                        setSelectedVoter(null);
                        setSecretCode('');
                        setError('');
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <p>
                    Digite abaixo o <b>código secreto de 8 caracteres</b> (ex.: <code>XXXX-XXXX</code>) enviado no
                    WhatsApp para <b>{selectedVoter.name}</b>:
                  </p>

                  <label>
                    Código Secreto de {selectedVoter.name}
                    <input
                      value={secretCode}
                      onChange={e => setSecretCode(e.target.value)}
                      placeholder="Ex.: XXXX-XXXX"
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck="false"
                      autoFocus
                      required
                    />
                  </label>

                  {error && <p className="et-error" role="alert">{error}</p>}

                  <div className="et-modal-actions">
                    <button type="submit" className="et-action-primary" disabled={busy}>
                      {busy ? 'Conferindo código...' : `🪪 Validar e Abrir Título de ${selectedVoter.name}`}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <p className="et-loading">Carregando lista oficial dos 19 eleitores…</p>
            ) : (
              <div className="et-voters-grid">
                {voters.map(v => {
                  const isSelected = selectedVoter?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`et-voter-item${v.claimed ? ' is-claimed' : ''}${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        setSelectedVoter(v);
                        setSecretCode('');
                        setError('');
                      }}
                    >
                      <div className="et-voter-avatar">
                        {v.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="et-voter-info">
                        <strong>{v.name}</strong>
                        <small>Inscrição: {v.inscription}</small>
                      </div>
                      <div className="et-voter-badges">
                        {v.voted && <span className="et-tag-voted">Votou ✓</span>}
                        <span className={`et-tag-status${v.claimed ? ' is-locked' : ''}`}>
                          {v.claimed ? '✓ Emitido' : '🪪 Emitir'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
