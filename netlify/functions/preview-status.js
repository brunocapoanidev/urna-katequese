import { store, data, json, bad, handler, digest, participationPrefix } from './_lib.js';

/** Lista somente presença; nunca devolve escolhas de voto ou códigos. */
export default handler(async req => {
  if (req.method !== 'GET') return bad('Método inválido', 405);

  const d = await data();
  const round = d.config.round || 1;
  const prefix = participationPrefix(round);
  const voters = d.voters.filter(v => !v.testOnly);

  const status = await Promise.all(voters.map(async voter => {
    const participation = await store.get(`${prefix}${await digest(voter.id)}`, { type: 'json' });
    return {
      id: voter.id,
      name: voter.name,
      status: participation?.state === 'done' ? 'voted' : participation?.state === 'pending' ? 'pending' : 'missing',
    };
  }));

  return json({ round, voters: status });
});
