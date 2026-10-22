import { useMemo, useState } from 'react';

function makeProtocol(name, round) {
  const base = `${name || 'ELEITOR'}-${round}-${Date.now().toString(36).toUpperCase()}`;
  let h = 2166136261;
  for (let i = 0; i < base.length; i++) {
    h ^= base.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `JEK-2026-T${round}-${hex}`;
}

export default function Done({ voterName, round = 1, preview, previewAdmin, onResults, onHome }) {
  const [copied, setCopied] = useState(false);
  const timestamp = useMemo(
    () =>
      new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  );
  const protocol = useMemo(() => makeProtocol(voterName, round), [voterName, round]);
  const displayVoter = voterName || 'Eleitor(a) Katequista';

  const shareText = `✅ *COMPROVANTE OFICIAL DE VOTAÇÃO — JEK 2026*\n🏛️ Justiça Eleitoral Katequista (${round}º Turno)\n👤 Eleitor(a): *${displayVoter}*\n📍 Zona 001 · Seção Katequese\n🕒 Data/Hora: ${timestamp}\n🔐 Protocolo: \`${protocol}\`\n\nJá exerci meu dever cívico na Urna da Katequese! 🗳️🔥`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* navegador sem clipboard */
    }
  }

  return (
    <main className="ballot">
      <header className="ballot-top">
        <span>JEK — JUSTIÇA ELEITORAL KATEQUISTA · {round}º TURNO</span>
        <b>URNA ELETRÔNICA · VOTO CONCLUÍDO</b>
      </header>

      <section className="machine machine-done" aria-label="Votação encerrada">
        <div className="screen-bezel">
          <div className="screen screen-fim" aria-live="assertive">
            <div className="fim-center">
              <h1>FIM</h1>
            </div>
            <div className="fim-bottom">
              <p className="fim-note">
                {preview
                  ? 'Simulação concluída. Nenhum voto foi gravado na apuração oficial.'
                  : 'Seu voto foi registrado com segurança na JEK. Obrigado por participar!'}
              </p>
              <span className="fim-votou">VOTOU</span>
            </div>
          </div>
        </div>

        <article className="jek-receipt" aria-label="Comprovante Oficial de Votação JEK">
          <div className="jek-receipt-head">
            <div className="jek-receipt-seal">JEK</div>
            <div>
              <span className="jek-receipt-kicker">Justiça Eleitoral Katequista · Eleições 2026</span>
              <h2>Comprovante Oficial de Comparecimento</h2>
            </div>
            <span className="jek-receipt-stamp">{preview ? 'SIMULAÇÃO' : 'VOTOU ✓'}</span>
          </div>

          <dl className="jek-receipt-grid">
            <div>
              <dt>Eleitor(a)</dt>
              <dd>{displayVoter}</dd>
            </div>
            <div>
              <dt>Etapa</dt>
              <dd>{round}º Turno Oficial</dd>
            </div>
            <div>
              <dt>Zona / Seção</dt>
              <dd>Zona 001 · Seção Katequese</dd>
            </div>
            <div>
              <dt>Data e Hora</dt>
              <dd>{timestamp}</dd>
            </div>
            <div className="wide">
              <dt>Protocolo de Autenticidade (Voto Secreto)</dt>
              <dd className="jek-protocol">{protocol}</dd>
            </div>
          </dl>

          <div className="jek-receipt-actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn jek-whatsapp-btn"
            >
              📲 Compartilhar no WhatsApp do Grupo
            </a>
            <button type="button" className="btn btn-dark" onClick={copyReceipt}>
              {copied ? '✓ Comprovante Copiado!' : '📋 Copiar Comprovante'}
            </button>
          </div>
        </article>

        <div className="done-actions-bar">
          {previewAdmin && (
            <button type="button" className="btn btn-primary" onClick={onResults}>
              Ver resultados de teste
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onHome}>
            Voltar ao início
          </button>
        </div>
      </section>
    </main>
  );
}
