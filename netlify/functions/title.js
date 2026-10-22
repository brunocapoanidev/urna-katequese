import {
  store,
  data,
  json,
  bad,
  body,
  handler,
  attempts,
  digest,
  safeEqual,
  participationPrefix,
} from './_lib.js';
import { findVoterByCode, normCode } from './_voters.js';

const TITLE_PREFIX = 'titles/';

function makeInscription(index) {
  const seq = String(index + 1).padStart(4, '0');
  const check = String(((index + 1) * 17 + 26) % 90 + 10);
  return `${seq} 2026 00${check}`;
}

async function readTitlesMap() {
  try {
    const { blobs } = await store.list({ prefix: TITLE_PREFIX });
    const values = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const map = new Map();
    blobs.forEach((b, i) => {
      if (values[i]) map.set(b.key.slice(TITLE_PREFIX.length), values[i]);
    });
    return map;
  } catch {
    return new Map();
  }
}

async function readVotedSet(voters, round = 1) {
  try {
    const prefix = participationPrefix(round);
    const { blobs } = await store.list({ prefix });
    const values = await Promise.all(blobs.map(b => store.get(b.key, { type: 'json' })));
    const doneHashes = new Set();
    blobs.forEach((b, i) => {
      if (values[i]?.state === 'done') doneHashes.add(b.key.slice(prefix.length));
    });
    const votedIds = new Set();
    for (const v of voters) {
      const h = await digest(v.id);
      if (doneHashes.has(h)) votedIds.add(v.id);
    }
    return votedIds;
  } catch {
    return new Set();
  }
}

function buildTitlePayload(voter, index, rec, voted, round) {
  return {
    id: voter.id,
    name: voter.name,
    code: voter.code || 'CÓDIGO-LOCAL',
    inscription: makeInscription(index),
    zone: '001',
    section: `0${String(index + 1).padStart(2, '0')} · Katequese`,
    issuedAt: rec?.issuedAt || new Date().toISOString(),
    voted,
    round,
  };
}

export default handler(async req => {
  const d = await data();
  const realVoters = d.voters.filter(v => !v.testOnly);
  const round = d.config.round || 1;
  const titlesMap = await readTitlesMap();
  const votedSet = await readVotedSet(realVoters, round);

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const deviceId = String(url.searchParams.get('deviceId') || '').trim();
    const deviceHash = deviceId ? await digest(deviceId) : '';

    let myTitle = null;
    const list = realVoters.map((v, idx) => {
      const rec = titlesMap.get(v.id);
      const isVoted = votedSet.has(v.id);
      if (rec && deviceHash && rec.deviceHash === deviceHash) {
        myTitle = buildTitlePayload(v, idx, rec, isVoted, round);
      }
      return {
        id: v.id,
        name: v.name,
        inscription: makeInscription(idx),
        claimed: Boolean(rec),
        voted: isVoted,
      };
    });

    return json({ round, voters: list, myTitle });
  }

  if (req.method !== 'POST') return bad('Método inválido', 405);

  const { action, voterId, code, deviceId } = await body(req);
  const cleanDevice = String(deviceId || '').trim();
  const deviceHash = cleanDevice ? await digest(cleanDevice) : '';
  const inputCode = normCode(code);

  if (inputCode.length < 6) {
    return bad('Digite o código secreto de 8 caracteres que você recebeu no WhatsApp.');
  }

  // Consulta rápida somente pelo código
  if (action === 'lookupCode') {
    const limit = await attempts('title-code', inputCode);
    if (limit.blocked) return bad('Muitas tentativas incorretas. Aguarde alguns minutos.', 429);

    const voter = findVoterByCode(d.voters, code);
    if (!voter) {
      await limit.fail();
      return bad('Código inválido. Confira o código de 8 caracteres enviado no seu WhatsApp.', 401);
    }
    await limit.clear();

    const idx = Math.max(0, realVoters.findIndex(v => v.id === voter.id));
    const existing = titlesMap.get(voter.id);
    const rec = existing || {
      voterId: voter.id,
      deviceHash,
      issuedAt: new Date().toISOString(),
    };
    if (!voter.testOnly) {
      await store.setJSON(`${TITLE_PREFIX}${voter.id}`, { ...rec, deviceHash: deviceHash || rec.deviceHash });
    }
    const isVoted = votedSet.has(voter.id);
    return json({ myTitle: buildTitlePayload(voter, idx, rec, isVoted, round) });
  }

  // Emissão ou abertura do Título selecionando o Nome + validando se o Código pertence àquele Nome!
  const idx = realVoters.findIndex(v => v.id === voterId);
  if (idx === -1) return bad('Eleitor não encontrado na lista oficial.');
  const voter = realVoters[idx];

  const limit = await attempts('title-claim', voter.id);
  if (limit.blocked) {
    return bad('Muitas tentativas incorretas para este eleitor. Aguarde 10 minutos.', 429);
  }

  const expectedCode = normCode(voter.code);
  if (!expectedCode || expectedCode.length < 6 || !safeEqual(expectedCode, inputCode)) {
    await limit.fail();
    return bad(
      `Código inválido para ${voter.name}! O código informado não corresponde a este eleitor.`,
      401,
    );
  }
  await limit.clear();

  const existing = titlesMap.get(voter.id);
  const rec = {
    voterId: voter.id,
    deviceHash: deviceHash || existing?.deviceHash || '',
    issuedAt: existing?.issuedAt || new Date().toISOString(),
  };

  await store.setJSON(`${TITLE_PREFIX}${voter.id}`, rec);
  const isVoted = votedSet.has(voter.id);
  return json({ myTitle: buildTitlePayload(voter, idx, rec, isVoted, round) });
});
