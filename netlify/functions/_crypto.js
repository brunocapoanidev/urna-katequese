const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');

export const VOTER_TTL_MS = 15 * 60 * 1000;
export const ADMIN_TTL_MS = 2 * 60 * 60 * 1000;

export const isDev = () => process.env.CONTEXT === 'dev' || process.env.NETLIFY_DEV === 'true';

export async function digest(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

// Sem AUTH_SECRET os tokens poderiam ser forjados; só o ambiente local usa um valor padrão.
function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (isDev()) return 'dev-only-change-me-please-123456789';
  throw new Error('AUTH_SECRET não configurado no ambiente.');
}

export async function sign(text) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(text)));
}

// Comparação em tempo constante, para não vazar o quanto uma tentativa chegou perto.
export function safeEqual(a, b) {
  a = String(a);
  b = String(b);
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function token(payload, ttl = VOTER_TTL_MS) {
  const raw = btoa(JSON.stringify({ ...payload, exp: Date.now() + ttl }));
  return `${raw}.${await sign(raw)}`;
}

/** Valida o cabeçalho Authorization e devolve o payload do token, ou null. */
export async function verify(header, role) {
  const [raw, sig] = String(header || '').replace('Bearer ', '').split('.');
  if (!raw || !sig || !safeEqual(sig, await sign(raw))) return null;
  try {
    const payload = JSON.parse(atob(raw));
    return payload.role === role && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
