import { store, auth, data, json, bad, body, handler, phase } from './_lib.js';
import { checkSchedule } from './_schedule.js';
import { tally } from './_tally.js';

const STATUSES = ['auto', 'open', 'closed'];
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
  return { ...rest, phase: phase(d.config), now: Date.now(), stats: { total: voters.length, voted: count('done'), pending: count('pending') } };
}

export default handler(async req => {
  if (!(await auth(req))) return bad('Acesso administrativo necessário.', 401);
  const d = await data();

  if (req.method === 'GET') return json(await overview(d));
  if (req.method !== 'POST') return bad('Método inválido', 405);

  const { action, payload = {} } = await body(req);

  if (action === 'config') {
    const next = { ...d.config };
    if (payload.status !== undefined) {
      if (!STATUSES.includes(payload.status)) return bad('Status inválido.');
      next.status = payload.status;
    }
    if ('opensAt' in payload || 'closesAt' in payload) {
      const s = checkSchedule({ opensAt: payload.opensAt, closesAt: payload.closesAt });
      if (s.error) return bad(s.error);
      next.opensAt = s.opensAt;
      next.closesAt = s.closesAt;
    }
    await store.setJSON('config', next);
    return json({ ok: true });
  }

  if (action === 'saveList' && LISTS.includes(payload.name) && Array.isArray(payload.items)) {
    if (phase(d.config) === 'open') return bad('Listas não podem ser alteradas com a votação aberta.', 409);
    await store.setJSON(`lists/${payload.name}`, payload.items);
    return json({ ok: true });
  }

  if (action === 'results') {
    if (phase(d.config) !== 'closed') return bad('A apuração só é liberada depois que a votação for encerrada.', 409);
    const votes = await countedVotes();
    return json({ ...tally(votes, d.presidents, d.deputies, d.config.seats), registered: d.voters.length });
  }

  return bad('Ação inválida.');
});
