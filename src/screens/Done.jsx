export default function Done({ preview, previewAdmin, onResults, onHome }) {
  return (
    <main className="card done">
      <div className="done-check" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
      </div>
      <h1>FIM</h1>
      <p className="lead">{preview ? 'Simulação concluída. Nenhum voto foi registrado.' : 'Seu voto foi registrado com sucesso. Obrigado por participar!'}</p>
      <div className="row">
        {previewAdmin && <button type="button" className="btn btn-primary" onClick={onResults}>Ver resultados</button>}
        <button type="button" className="btn btn-dark" onClick={onHome}>Voltar ao início</button>
      </div>
    </main>
  );
}
