import { useState } from 'react';
import { clearPreviewVotes, readPreviewVotes } from '../api.js';
import presidents from '../../data/presidents.json';
import deputies from '../../data/deputies.json';

function Ranking({ title, list, votes, field }) {
  const rows = list
    .map(c => ({ ...c, total: votes.filter(v => v[field] === c.id).length }))
    .sort((a, b) => b.total - a.total);
  const top = Math.max(1, ...rows.map(r => r.total));
  return (
    <section className="rank">
      <h2>{title}</h2>
      {rows.map(r => (
        <div key={r.id} className="rank-row">
          <span className="rank-name">{r.name}</span>
          <span className="rank-bar"><i style={{ width: `${(r.total / top) * 100}%` }} /></span>
          <b>{r.total}</b>
        </div>
      ))}
    </section>
  );
}

/** Resultado da simulação local; a apuração de verdade fica em /admin. */
export default function PreviewResults({ onBack }) {
  const [votes, setVotes] = useState(readPreviewVotes);
  return (
    <main className="card wide">
      <p className="eyebrow">Somente demonstração · JEK</p>
      <h1>Resultado de teste</h1>
      <p className="lead">{votes.length} voto(s) de demonstração nesta aba.</p>
      <Ranking title="Presidente (1 vaga · 2º turno se <= 50%)" list={presidents} votes={votes} field="president" />
      <p className="note">Brancos: {votes.filter(v => v.president === 'blank').length} · Nulos: {votes.filter(v => v.president === 'null').length}</p>
      <Ranking title="Deputados (4 de 6 são eleitos)" list={deputies} votes={votes} field="deputy" />
      <p className="note">Brancos: {votes.filter(v => v.deputy === 'blank').length} · Nulos: {votes.filter(v => v.deputy === 'null').length}</p>
      <div className="row">
        <button type="button" className="btn btn-dark" onClick={onBack}>Voltar</button>
        <button type="button" className="btn btn-ghost" onClick={() => { clearPreviewVotes(); setVotes([]); }}>Limpar testes</button>
      </div>
    </main>
  );
}
