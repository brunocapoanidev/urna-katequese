const CONFIRM_SRC = '/sounds/confirma-urna.mp3';
const END_SRC = '/sounds/urnaeletronica.mp3';

let activeAudio = null;
let sharedCtx = null;
let activeOsc = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new Ctx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

/** Interrompe imediatamente qualquer som em execução para nunca duplicar ou embolar áudios. */
export function stopUrnaSounds() {
  try {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
  } catch {
    /* ignora erro ao pausar */
  }
  try {
    if (activeOsc) {
      activeOsc.stop();
      activeOsc.disconnect();
      activeOsc = null;
    }
  } catch {
    /* ignora se já parou */
  }
}

function playSingleAudio(src, fallback) {
  stopUrnaSounds();
  try {
    if (typeof window === 'undefined' || typeof window.Audio !== 'function') {
      return fallback();
    }
    const audio = new window.Audio(src);
    audio.preload = 'auto';
    activeAudio = audio;
    audio.onended = () => {
      if (activeAudio === audio) activeAudio = null;
    };
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        if (activeAudio === audio) activeAudio = null;
        fallback();
      });
    }
  } catch {
    fallback();
  }
}

function playShortTone(freqStart, freqEnd, duration) {
  try {
    if (activeOsc) {
      try {
        activeOsc.stop();
        activeOsc.disconnect();
      } catch {
        /* já encerrado */
      }
      activeOsc = null;
    }
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqStart, t);
    if (freqEnd) osc.frequency.setValueAtTime(freqEnd, t + duration * 0.45);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    activeOsc = osc;
    osc.onended = () => {
      if (activeOsc === osc) activeOsc = null;
    };
    osc.start(t);
    osc.stop(t + duration);
  } catch {
    /* sem áudio */
  }
}

/** Bip curto e seco ao apertar teclas numéricas, Branco ou Corrige (nunca sobrepõe). */
export function urnaClickSound() {
  playShortTone(1050, null, 0.055);
}

/** Som real de confirmação de etapa (1º cargo — confirma-urna.mp3), sem duplicar. */
export function urnaConfirmSound() {
  playSingleAudio(CONFIRM_SRC, () => playShortTone(950, 1250, 0.22));
}

/** Som real de encerramento da votação (FIM — urnaeletronica.mp3), cortando qualquer som anterior. */
export function urnaEndSound() {
  playSingleAudio(END_SRC, () => playShortTone(950, 1250, 0.32));
}

/** Mantido por compatibilidade. */
export function urnaSound() {
  urnaEndSound();
}

/** Tick suave de chegada de lote na página de Apuração. */
export function apuracaoTickSound() {
  playShortTone(680, null, 0.032);
}

/** Alerta sonoro de virada na liderança durante a Apuração. */
export function apuracaoLeadChangeSound() {
  playShortTone(740, 1110, 0.14);
}
