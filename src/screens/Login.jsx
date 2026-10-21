import { useState } from 'react';
import { api } from '../api.js';

const TEST_NAME = 'teste catequese 2026';
const TEST_CODE = 'CATEQUESE-2026-TESTE';

export default function Login({ onLogin, onBack }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onLogin((await api('auth', { name, code })).token);
    } catch (err) {
      // Só no `npm run dev` (sem Functions): entra em modo de demonstração.
      if (import.meta.env.DEV && !err.status) {
        onLogin(name.trim().toLowerCase() === TEST_NAME && code === TEST_CODE ? 'preview-admin' : 'preview');
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="card">
      <button type="button" className="back" onClick={onBack}>← Voltar</button>
      <div className="brand-mark" aria-hidden="true">✓</div>
      <p className="eyebrow">Votações do Grupo Katequese · 2026</p>
      <h1>Identifique-se para votar</h1>
      <p className="lead">Use seu nome e o código individual que o grupo enviou para você.</p>
      <form onSubmit={submit}>
        <label>
          Seu nome
          <input value={name} onChange={e => setName(e.target.value)} autoComplete="off" autoCapitalize="words" required />
        </label>
        <label>
          Código individual secreto
          <input value={code} onChange={e => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck="false" required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Validando...' : 'Entrar para votar'}</button>
      </form>
      <small className="fine">Eleição privada do grupo. O voto é secreto e só pode ser dado uma vez.</small>
    </main>
  );
}
