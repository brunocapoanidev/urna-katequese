import { getStore } from '@netlify/blobs';
import presidentsSeed from '../../data/presidents.json' with { type: 'json' };
import deputiesSeed from '../../data/deputies.json' with { type: 'json' };
import votersSeed from '../../data/voters.json' with { type: 'json' };
import electionSeed from '../../data/election.json' with { type: 'json' };
import { digest, verify } from './_crypto.js';
import { votersFromEnv } from './_voters.js';

export { digest, isDev, safeEqual, token } from './_crypto.js';
export { phase, fmt } from './_schedule.js';

export const store = getStore('urna-katequese-v1');

export const json = (data, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const bad = (message, status = 400) => json({ error: message }, status);

/** Envolve uma function: erros viram respostas JSON em vez de páginas de erro. */
export const handler = fn => async (req, context) => {
  try {
    return await fn(req, context);
  } catch (e) {
    if (e instanceof SyntaxError) return bad('Requisição inválida.');
    console.error(e);
    return bad('Erro interno. Tente novamente em instantes.', 500);
  }
};

/** Lê o corpo JSON; um corpo ausente ou malformado vira {}. */
export const body = async req => {
  try {
    return (await req.json()) ?? {};
  } catch {
    return {};
  }
};

export const auth = (req, role = 'admin') => verify(req.headers.get('authorization'), role);

export async function config() {
  let x = await store.get('config', { type: 'json' });
  if (!x) {
    // status 'auto': abre e fecha sozinha pelos horários de data/election.json (editáveis em /admin).
    x = { status: 'auto', tieBreak: 'candidate-number', seats: 3, ...electionSeed };
    await store.setJSON('config', x, { onlyIfNew: true });
  }
  return x;
}

export async function collection(name, seed) {
  let x = await store.get(`lists/${name}`, { type: 'json' });
  if (!x) {
    x = seed;
    await store.setJSON(`lists/${name}`, x, { onlyIfNew: true });
  }
  return x;
}

// Os códigos dos eleitores não ficam no repositório: a variável VOTERS_JSON (Netlify) é a
// fonte da verdade e é lida a cada chamada, sem copiar para o Blobs. Sem ela, vale a lista
// de data/voters.json (que não traz códigos válidos).

export const data = async () => ({
  presidents: await collection('presidents', presidentsSeed),
  deputies: await collection('deputies', deputiesSeed),
  voters: votersFromEnv() ?? (await collection('voters', votersSeed)),
  config: await config(),
});

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** Limita tentativas de login erradas por identificador (nome do eleitor ou "admin"). */
export async function attempts(scope, id) {
  const key = `throttle/${scope}/${await digest(String(id).trim().toLowerCase())}`;
  const rec = await store.get(key, { type: 'json' });
  const fresh = rec && Date.now() - rec.first < ATTEMPT_WINDOW_MS;
  return {
    blocked: Boolean(fresh && rec.count >= MAX_ATTEMPTS),
    fail: () => store.setJSON(key, { count: (fresh ? rec.count : 0) + 1, first: fresh ? rec.first : Date.now() }),
    clear: () => (rec ? store.delete(key) : undefined),
  };
}
