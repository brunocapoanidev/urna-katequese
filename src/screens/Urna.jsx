import { useState } from 'react';
import { api } from '../api.js';
import { urnaSound } from '../sound.js';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const STAGES = {
  president: { title: 'PRESIDENTE', list: d => d.presidents },
  deputy: { title: 'DEPUTADO', list: d => d.deputies },
};

export default function Urna({ token, data, onDone }) {
  const [stage, setStage] = useState('president');
  const [digits, setDigits] = useState('');
  const [blank, setBlank] = useState(false);
  const [nullVote, setNullVote] = useState(false);
  const [error, setError] = useState('');
  const [president, setPresident] = useState(null);
  const [sending, setSending] = useState(false);

  const list = STAGES[stage].list(data);
  const maxLen = Math.max(...list.map(c => c.number.length));
  const candidate = digits ? list.find(c => c.number === digits) : null;
  const ally = candidate?.presidentId && data.presidents.find(p => p.id === candidate.presidentId);
  const notFound = !blank && digits.length === maxLen && !candidate;

  const reset = () => {
    setDigits('');
    setBlank(false);
    setNullVote(false);
    setError('');
  };
  const press = n => {
    setBlank(false);
    setNullVote(false);
    setError('');
    setDigits(d => (d.length < maxLen ? d + n : d));
  };

  async function confirm() {
    if (sending) return;
    if (notFound && !nullVote) {
      setNullVote(true);
      return setError('VOTO NULO — pressione CONFIRMA novamente para confirmar.');
    }
    const pick = blank ? 'blank' : candidate?.id || (nullVote ? 'null' : null);
    if (!pick) return setError('Digite um número válido ou escolha BRANCO.');

    if (stage === 'president') {
      setPresident(pick);
      setStage('deputy');
      reset();
      return;
    }
    if (token.startsWith('preview')) return onDone({ president, deputy: pick });

    setSending(true);
    try {
      await api('vote', { president, deputy: pick }, token);
      onDone();
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  }

  const message = error || (blank ? 'VOTO EM BRANCO' : notFound ? 'Número não encontrado. Pressione CORRIGE ou BRANCO.' : 'Digite o número do candidato');

  return (
    <main className="ballot">
      <header className="ballot-top">
        <span>VOTAÇÕES DO GRUPO KATEQUESE</span>
        <b>URNA ELETRÔNICA</b>
      </header>

      <section className="machine">
        <div className="screen" aria-live="polite">
          <p className="cargo">SEU VOTO PARA</p>
          <h2>{STAGES[stage].title}</h2>
          <div className="number" aria-label={`Número digitado: ${digits || 'nenhum'}`}>
            {Array.from({ length: maxLen }, (_, i) => <span key={i}>{digits[i] || ''}</span>)}
          </div>

          {candidate ? (
            <div className="candidate">
              <div className="candidate-info">
                <strong>{candidate.name}</strong>
                <span>Número: {candidate.number}</span>
                {candidate.party && <span>{candidate.party}</span>}
                {ally && <span>Apoia: {ally.name}</span>}
              </div>
              {candidate.photo && (
                <div
                  className="candidate-photo"
                  role="img"
                  aria-label={`Foto de ${candidate.name}`}
                  style={{ backgroundImage: `url(${candidate.photo})`, backgroundPosition: `${candidate.photoPosition || '50%'} center`, backgroundSize: candidate.photoSize || undefined }}
                />
              )}
            </div>
          ) : (
            <p className={`instruction${error || notFound ? ' warn' : ''}`}>{message}</p>
          )}

          <p className="review">Confira seus dados e pressione CONFIRMA</p>
        </div>

        <div className="keys">
          <div className="digits">
            {DIGITS.map(n => (
              <button key={n} type="button" className={`key${n === 0 ? ' key-zero' : ''}`} onClick={() => press(String(n))}>{n}</button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="act white" onClick={() => { reset(); setBlank(true); }}>BRANCO</button>
            <button type="button" className="act orange" onClick={reset}>CORRIGE</button>
            <button type="button" className="act green" disabled={sending} onClick={() => { urnaSound(); confirm(); }}>
              {sending ? 'ENVIANDO…' : 'CONFIRMA'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
