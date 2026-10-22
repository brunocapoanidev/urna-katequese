import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { findCandidateByNumber } from '../candidates.js';
import { urnaClickSound, urnaConfirmSound, urnaEndSound } from '../sound.js';
import { useColinha } from '../colinha.js';

const DIGITS = [
  { n: '1', braille: '⠼⠁' },
  { n: '2', braille: '⠼⠃' },
  { n: '3', braille: '⠼⠉' },
  { n: '4', braille: '⠼⠙' },
  { n: '5', braille: '⠼⠑' },
  { n: '6', braille: '⠼⠋' },
  { n: '7', braille: '⠼⠛' },
  { n: '8', braille: '⠼⠓' },
  { n: '9', braille: '⠼⠊' },
  { n: '0', braille: '⠼⠚' },
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function Urna({ token, data, voterName, onDone }) {
  const [stage, setStage] = useState('president');
  const [digits, setDigits] = useState('');
  const [blank, setBlank] = useState(false);
  const [nullVote, setNullVote] = useState(false);
  const [error, setError] = useState('');
  const [president, setPresident] = useState(null);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const { colinha } = useColinha();

  const round = data?.config?.round || 1;
  const runoffIds = data?.config?.runoffIds || [];
  const activePresidents =
    round === 2 && runoffIds.length >= 2
      ? data.presidents.filter(p => runoffIds.includes(p.id))
      : data.presidents;

  const currentStage =
    stage === 'president'
      ? { title: 'PRESIDENTE', photoLabel: 'Presidente', list: activePresidents }
      : { title: 'DEPUTADO', photoLabel: 'Deputado', list: data.deputies };

  const list = currentStage.list;
  const maxLen = Math.max(...list.map(c => c.number.length));
  const candidate = digits ? findCandidateByNumber(list, digits) : null;
  const ally = candidate?.presidentId && data.presidents.find(p => p.id === candidate.presidentId);
  const notFound = !blank && digits.length === maxLen && !candidate;
  const isComplete = blank || digits.length === maxLen;

  const reset = useCallback(() => {
    setDigits('');
    setBlank(false);
    setNullVote(false);
    setError('');
  }, []);

  const press = useCallback(
    n => {
      if (sending || recording) return;
      urnaClickSound();
      setBlank(false);
      setNullVote(false);
      setError('');
      setDigits(d => (d.length < maxLen ? d + n : d));
    },
    [maxLen, sending, recording],
  );

  const handleBlank = useCallback(() => {
    if (sending || recording) return;
    urnaClickSound();
    reset();
    setBlank(true);
  }, [reset, sending, recording]);

  const handleReset = useCallback(() => {
    if (sending || recording) return;
    urnaClickSound();
    reset();
  }, [reset, sending, recording]);

  const confirm = useCallback(async () => {
    if (sending || recording) return;
    if (notFound && !nullVote) {
      urnaClickSound();
      setNullVote(true);
      return setError('VOTO NULO — pressione CONFIRMA novamente para confirmar.');
    }
    const pick = blank ? 'blank' : candidate?.id || (nullVote ? 'null' : null);
    if (!pick) {
      urnaClickSound();
      return setError('Digite o número completo do candidato ou aperte BRANCO.');
    }

    // No 1º turno, após Presidente vai para Deputado. No 2º turno, vota apenas para Presidente!
    if (stage === 'president' && round === 1) {
      urnaConfirmSound();
      setPresident(pick);
      setStage('deputy');
      reset();
      return;
    }

    const finalPresident = stage === 'president' ? pick : president;
    const finalDeputy = stage === 'president' ? 'blank' : pick;

    if (token.startsWith('preview')) {
      setRecording(true);
      await sleep(500);
      urnaEndSound();
      return onDone({ president: finalPresident, deputy: finalDeputy });
    }

    setSending(true);
    setRecording(true);
    try {
      await Promise.all([
        api('vote', { president: finalPresident, deputy: finalDeputy }, token),
        sleep(500),
      ]);
      urnaEndSound();
      onDone();
    } catch (e) {
      setRecording(false);
      setSending(false);
      setError(e.message);
    }
  }, [sending, recording, notFound, nullVote, blank, candidate, stage, round, token, president, reset, onDone]);

  useEffect(() => {
    const onKeyDown = e => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleBlank();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [press, handleReset, confirm, handleBlank]);

  const hasColinha = Boolean(colinha.president || (round === 1 && colinha.deputy));

  return (
    <main className="ballot">
      <header className="ballot-top">
        <span>JEK — JUSTIÇA ELEITORAL KATEQUISTA · {round}º TURNO</span>
        <b>ZONA 001 · URNA ELETRÔNICA OFICIAL</b>
      </header>

      {hasColinha && (
        <div className="urna-colinha-strip" aria-label="Sua Colinha Eleitoral">
          <span>📋 <b>Sua Colinha JEK:</b></span>
          {colinha.president && (
            <span>
              Presidente: <strong>{colinha.president.number}</strong> ({colinha.president.name})
            </span>
          )}
          {round === 1 && colinha.deputy && (
            <span>
              Deputado: <strong>{colinha.deputy.number}</strong> ({colinha.deputy.name})
            </span>
          )}
        </div>
      )}

      <section className="machine" aria-label="Urna Eletrônica">
        <div className="screen-bezel">
          <div className="screen" aria-live="polite">
            {recording ? (
              <div className="screen-recording">
                <div className="recording-box">
                  <span className="recording-label">GRAVANDO</span>
                  <div className="recording-bar" role="progressbar" aria-label="Gravando voto">
                    <i />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="screen-main">
                  <div className="screen-left">
                    <div className="voter-tag-row">
                      {voterName && <p className="voter-tag">Eleitor(a): <strong>{voterName}</strong></p>}
                      <span className="round-screen-tag">{round}º TURNO</span>
                    </div>
                    <p className="cargo">SEU VOTO PARA</p>
                    <h2 className="cargo-title">{currentStage.title}</h2>

                    {!blank && (
                      <div className="number-row">
                        <span className={`number-label${digits.length > 0 ? ' is-visible' : ''}`}>Número:</span>
                        <div className="number" aria-label={`Número digitado: ${digits || 'nenhum'}`}>
                          {Array.from({ length: maxLen }, (_, i) => {
                            const isCurrent = i === digits.length && !blank;
                            return (
                              <span
                                key={i}
                                className={`number-box${isCurrent ? ' is-cursor' : ''}${digits[i] ? ' is-filled' : ''}`}
                              >
                                {digits[i] || ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {candidate && (
                      <dl className="candidate-details">
                        <div className="detail-row">
                          <dt>Nome:</dt>
                          <dd className="candidate-name">{candidate.name}</dd>
                        </div>
                        {candidate.party && (
                          <div className="detail-row">
                            <dt>Partido:</dt>
                            <dd>{candidate.party}</dd>
                          </div>
                        )}
                        {ally && (
                          <div className="detail-row">
                            <dt>Chapa:</dt>
                            <dd>{ally.name} ({ally.number})</dd>
                          </div>
                        )}
                      </dl>
                    )}

                    {blank && (
                      <div className="vote-banner">
                        <strong className="blink-slow">VOTO EM BRANCO</strong>
                      </div>
                    )}

                    {notFound && (
                      <div className="null-block">
                        <p className="wrong-number">NÚMERO ERRADO</p>
                        <strong className="vote-null blink-slow">VOTO NULO</strong>
                      </div>
                    )}

                    {error && (
                      <p className="instruction warn" role="alert">
                        {error}
                      </p>
                    )}
                  </div>

                  {candidate?.photo && (
                    <aside className="screen-right">
                      <figure className="candidate-frame">
                        <div
                          className="candidate-photo"
                          role="img"
                          aria-label={`Foto de ${candidate.name}`}
                          style={{
                            backgroundImage: `url(${candidate.photo})`,
                            backgroundPosition: `${candidate.photoPosition || '50%'} center`,
                            backgroundSize: candidate.photoSize || undefined,
                          }}
                        />
                        <figcaption>{currentStage.photoLabel}</figcaption>
                      </figure>
                    </aside>
                  )}
                </div>

                <footer className={`screen-footer${isComplete ? ' is-visible' : ''}`}>
                  <p className="footer-title">Aperte a tecla:</p>
                  <p className="footer-line">
                    <b>CONFIRMA</b> para <b>CONFIRMAR</b> este voto
                  </p>
                  <p className="footer-line">
                    <b>CORRIGE</b> para <b>REINICIAR</b> este voto
                  </p>
                </footer>
              </>
            )}
          </div>
        </div>

        <div className="terminal-panel">
          <div className="justice-header">
            <div className="justice-coat" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="1.8" />
                <path d="M18 5l3.2 6.8L28 13l-5 4.8 1.2 7L18 21.5 11.8 24.8l1.2-7-5-4.8 6.8-1.2L18 5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="18" cy="18" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="justice-title">
              <strong>JUSTIÇA ELEITORAL</strong>
              <span>JEK · GRUPO KATEQUESE 2026</span>
            </div>
          </div>

          <div className="keys">
            <div className="digits">
              {DIGITS.map(({ n, braille }) => (
                <button
                  key={n}
                  type="button"
                  className={`key${n === '0' ? ' key-zero' : ''}`}
                  onClick={() => press(n)}
                >
                  <span className="key-num">{n}</span>
                  <span className="key-braille" aria-hidden="true">{braille}</span>
                </button>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="act white" onClick={handleBlank}>
                <span>BRANCO</span>
              </button>
              <button type="button" className="act orange" onClick={handleReset}>
                <span>CORRIGE</span>
              </button>
              <button type="button" className="act green" disabled={sending || recording} onClick={confirm}>
                <span>{sending ? 'GRAVANDO' : 'CONFIRMA'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
