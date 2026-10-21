import { store, auth, data, json, bad, body, handler } from './_lib.js';
import { tally } from './_tally.js';

const STATUSES = ['open', 'closed'];
const LISTS = ['presidents', 'deputies', 'voters'];

const readAll = async prefix => {
  const { blobs } = await store.list({ prefix });
  const values = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
  return blobs.map((b, i) => ({ id: b.key.slice(prefix.length), value: values[i] })).filter(x => x.value);
};

// Só conta o voto que a participação do eleitor aponta. Se dois envios simultâneos do mesmo
// eleitor passarem, sobra um voto referenciado e o outro fica órfão (ignorado na apuração).
async function countedVotes() {
  const claims = await readAll('participation/');
  const referenced = new Set(claims.map(c => c.value.voteId));
  return (await readAll('votes/')).filter(v => referenced.has(v.id)).map(v => v.value);
}

async function overview(d) {
  const participation = (await readAll('participation/')).map(p => p.value);
  const count = state => participation.filter(p => p.state === state).length;
  const { voters, ...rest } = d;
  return { ...rest, stats: { total: voters.length, voted: count('done'), pending: count('pending') } };
}

export default handler(async req => {
  if (!(await auth(req))) return bad('Acesso administrativo necessário.', 401);
  const d = await data();

  if (req.method === 'GET') return json(await overview(d));
  if (req.method !== 'POST') return bad('Método inválido', 405);

  const { action, payload = {} } = await body(req);

  if (action === 'config') {
    if (!STATUSES.includes(payload.status)) return bad('Status inválido.');
    await store.setJSON('config', { ...d.config, status: payload.status });
    return json({ ok: true });
  }

  if (action === 'saveList' && LISTS.includes(payload.name) && Array.isArray(payload.items)) {
    if (d.config.status === 'open') return bad('Listas não podem ser alteradas com a votação aberta.', 409);
    await store.setJSON(`lists/${payload.name}`, payload.items);
    return json({ ok: true });
  }

  if (action === 'results') {
    if (d.config.status !== 'closed') return bad('Encerre a votação antes da apuração.', 409);
    const votes = await countedVotes();
    return json({ ...tally(votes, d.presidents, d.deputies, d.config.seats), registered: d.voters.length });
  }

  return bad('Ação inválida.');
});
