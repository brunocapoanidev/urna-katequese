import { store, auth, data, json, bad, body, handler, phase, digest, participationPrefix, votesPrefix, activePresidents } from './_lib.js';
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
async function countedVotes(round = 1) {
  const claims = await readAll(participationPrefix(round));
  const referenced = new Set(claims.map(c => c.value.voteId));
  return (await readAll(votesPrefix(round))).filter(v => referenced.has(v.id)).map(v => v.value);
}

async function overview(d) {
  const round = d.config.round || 1;
  const participationEntries = await readAll(participationPrefix(round));
  const participation = participationEntries.map(p => p.value);
  const doneHashes = new Set(participationEntries.filter(p => p.value?.state === 'done').map(p => p.id));
  const titleEntries = await readAll('titles/');
  const titlesMap = new Map(titleEntries.map(t => [t.id, t.value]));

  const count = state => participation.filter(p => p.state === state).length;
  const realVoters = d.voters.filter(v => !v.testOnly);

  const votersStatus = await Promise.all(
    realVoters.map(async v => {
      const h = await digest(v.id);
      const t = titlesMap.get(v.id);
      return {
        id: v.id,
        name: v.name,
        claimed: Boolean(t),
        issuedAt: t?.issuedAt || null,
        voted: doneHashes.has(h),
      };
    }),
  );

  const { voters, ...rest } = d;
  return {
    ...rest,
    phase: phase(d.config),
    now: Date.now(),
    votersStatus,
    stats: {
      total: realVoters.length,
      voted: count('done'),
      pending: count('pending'),
      titlesClaimed: titleEntries.length,
    },
  };
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

  if (action === 'resetTitle' && payload.voterId) {
    await store.delete(`titles/${payload.voterId}`);
    return json({ ok: true });
  }

  if (action === 'startRound2') {
    if (phase(d.config) === 'open') return bad('Encerre o 1º turno antes de iniciar o 2º turno.', 409);
    const votesR1 = await countedVotes(1);
    const r1 = tally(votesR1, d.presidents, d.deputies, d.config.seats || 4, 1);
    const candidates = Array.isArray(payload.runoffIds) && payload.runoffIds.length === 2
      ? payload.runoffIds
      : r1.presidents.slice(0, 2).map(p => p.id);
    if (candidates.length < 2) return bad('Não há candidatos suficientes para o 2º turno.');
    const next = {
      ...d.config,
      round: 2,
      runoffIds: candidates,
      status: payload.openNow ? 'open' : 'closed',
    };
    await store.setJSON('config', next);
    return json({ ok: true, round: 2, runoffIds: candidates });
  }

  if (action === 'setRound') {
    const targetRound = payload.round === 2 ? 2 : 1;
    const next = { ...d.config, round: targetRound };
    await store.setJSON('config', next);
    return json({ ok: true, round: targetRound });
  }

  if (action === 'saveList' && LISTS.includes(payload.name) && Array.isArray(payload.items)) {
    if (phase(d.config) === 'open') return bad('Listas não podem ser alteradas com a votação aberta.', 409);
    await store.setJSON(`lists/${payload.name}`, payload.items);
    return json({ ok: true });
  }

  if (action === 'results') {
    const targetRound = payload.round === 1 || payload.round === 2 ? payload.round : (d.config.round || 1);
    if (targetRound === (d.config.round || 1) && phase(d.config) !== 'closed') {
      return bad('A apuração só é liberada depois que a votação for encerrada.', 409);
    }
    const votes = await countedVotes(targetRound);
    const presList = targetRound === 2 ? activePresidents(d.presidents, { ...d.config, round: 2 }) : d.presidents;
    const realVotersCount = d.voters.filter(v => !v.testOnly).length;
    return json({
      ...tally(votes, presList, d.deputies, d.config.seats || 4, targetRound),
      registered: realVotersCount,
    });
  }

  return bad('Ação inválida.');
});
