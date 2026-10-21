/** Bip da urna ao confirmar. Falha em silêncio se o navegador não permitir áudio. */
export function urnaSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.setValueAtTime(1250, t + 0.12);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    /* sem áudio */
  }
}
