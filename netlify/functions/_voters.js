import { safeEqual } from './_crypto.js';

// Nome sem caixa, sem acento e sem espaços repetidos: "João  Pedro" == "joao pedro".
export const normName = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

// Código sem caixa, hífen ou espaço: "k7m4-9qdx" == "K7M4 9QDX".
export const normCode = s => String(s ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();

const MIN_CODE_LENGTH = 6;

/** Acha o eleitor pelo nome + código. Eleitor sem código válido nunca é encontrado. */
export function findVoter(voters, name, code) {
  const n = normName(name);
  const c = normCode(code);
  if (!n || c.length < MIN_CODE_LENGTH) return null;
  const match = voters.find(v => normName(v.name) === n && normCode(v.code).length >= MIN_CODE_LENGTH && safeEqual(normCode(v.code), c));
  return match ?? null;
}

/** Lista de eleitores vinda da variável de ambiente VOTERS_JSON (ou null se não houver/for inválida). */
export function votersFromEnv(raw = process.env.VOTERS_JSON) {
  try {
    const list = JSON.parse(raw || 'null');
    return Array.isArray(list) && list.length ? list : null;
  } catch {
    return null;
  }
}
