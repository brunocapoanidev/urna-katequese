import { getStore } from '@netlify/blobs';
import presidentsSeed from '../../data/presidents.json' with { type: 'json' };
import deputiesSeed from '../../data/deputies.json' with { type: 'json' };
import votersSeed from '../../data/voters.json' with { type: 'json' };
import electionSeed from '../../data/election.json' with { type: 'json' };
import { digest, isDev, verify } from './_crypto.js';
import { votersFromEnv } from './_voters.js';

export { digest, isDev, safeEqual, token } from './_crypto.js';
export { phase, fmt } from './_schedule.js';

const rawStore = () => getStore('urna-katequese-v1');

export const store = {
  get: (...args) => rawStore().get(...args),
  set: (...args) => rawStore().set(...args),
  setJSON: (...args) => rawStore().setJSON(...args),
  list: (...args) => rawStore().list(...args),
  delete: (...args) => rawStore().delete(...args),
};

export const json = (data, status = 200) =>
  Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const bad = (message, status = 400) => json({ error: message }, status);

export const participationPrefix = (round = 1) => (round === 2 ? 'participation-r2/' : 'participation/');
export const votesPrefix = (round = 1) => (round === 2 ? 'votes-r2/' : 'votes/');

export const activePresidents = (presidents, cfg) => {
  if (cfg?.round === 2 && Array.isArray(cfg.runoffIds) && cfg.runoffIds.length >= 2) {
    const filtered = presidents.filter(p => cfg.runoffIds.includes(p.id));
    if (filtered.length >= 2) return filtered;
  }
  return presidents;
};

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
    x = { status: 'auto', tieBreak: 'candidate-number', seats: 4, round: 1, runoffIds: [], ...electionSeed };
    await store.setJSON('config', x, { onlyIfNew: true });
  } else {
    // Garante 4 vagas de deputado e campos de turno em configurações já existentes.
    const seats = x.seats === 3 || !x.seats ? 4 : x.seats;
    const round = x.round === 2 ? 2 : 1;
    const runoffIds = Array.isArray(x.runoffIds) ? x.runoffIds : [];
    x = { ...x, seats, round, runoffIds };
  }
  return x;
}

export async function collection(name, seed) {
  let x = await store.get(`lists/${name}`, { type: 'json' });
  if (!x) {
    x = seed;
    await store.setJSON(`lists/${name}`, x, { onlyIfNew: true });
  } else if (Array.isArray(seed) && Array.isArray(x)) {
    // Mantém números, nomes, fotos e propostas sincronizados com os arquivos data/*.json
    const seedSignature = JSON.stringify(seed);
    if (JSON.stringify(x) !== seedSignature) {
      x = seed;
      await store.setJSON(`lists/${name}`, x);
    }
  }
  return x;
}

export async function turnoutStats(round = 1, total = 19) {
  try {
    const prefix = participationPrefix(round);
    const { blobs } = await store.list({ prefix });
    const values = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const valid = values.filter(Boolean);
    const voted = valid.filter(v => v.state === 'done').length;
    const pending = valid.filter(v => v.state === 'pending').length;
    return { total, voted, pending };
  } catch {
    return { total, voted: 0, pending: 0 };
  }
}

export async function closedRoundVotes(round = 1) {
  try {
    const pPrefix = participationPrefix(round);
    const vPrefix = votesPrefix(round);
    const { blobs: pBlobs } = await store.list({ prefix: pPrefix });
    const pValues = await Promise.all(pBlobs.map(b => store.get(b.key, { type: 'json' })));
    const referenced = new Set(pValues.filter(Boolean).map(p => p.voteId));
    const { blobs: vBlobs } = await store.list({ prefix: vPrefix });
    const vValues = await Promise.all(vBlobs.map(b => store.get(b.key, { type: 'json' })));
    return vBlobs
      .map((b, i) => ({ id: b.key.slice(vPrefix.length), value: vValues[i] }))
      .filter(x => x.value && referenced.has(x.id))
      .map(x => ({ president: x.value.president, deputy: x.value.deputy, castAt: x.value.castAt }))
      .sort((a, b) => String(a.castAt || '').localeCompare(String(b.castAt || '')));
  } catch {
    return [];
  }
}

const DEV_TEST_VOTERS = [
  ...votersSeed.filter(v => v.testOnly),
  { id: 'teste-local', name: 'Eleitor de Teste', code: 'TESTE-2026', testOnly: true },
];

export const data = async () => {
  const baseVoters = votersFromEnv() ?? (await collection('voters', votersSeed));
  const voters = isDev()
    ? [...baseVoters.filter(v => !v.testOnly), ...DEV_TEST_VOTERS]
    : baseVoters;
  return {
    presidents: await collection('presidents', presidentsSeed),
    deputies: await collection('deputies', deputiesSeed),
    voters,
    config: await config(),
  };
};

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** Limita tentativas de login erradas por identificador (código do eleitor ou "admin"). */
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
