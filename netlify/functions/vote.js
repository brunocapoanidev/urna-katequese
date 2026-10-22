import { store, auth, data, json, bad, body, handler, digest, isDev, phase, participationPrefix, votesPrefix, activePresidents } from './_lib.js';

const isValid = (choice, list) => choice === 'blank' || choice === 'null' || list.some(x => x.id === choice);

export default handler(async req => {
  const user = await auth(req, 'voter');
  if (!user) return bad('Sessão inválida. Identifique-se novamente.', 401);
  if (req.method !== 'POST') return bad('Método inválido', 405);

  const { president, deputy } = await body(req);
  const d = await data();
  if (phase(d.config) !== 'open') return bad('A votação não está aberta.', 403);

  const round = d.config.round || 1;
  const validPresidents = activePresidents(d.presidents, d.config);
  const effectiveDeputy = round === 2 ? (deputy ?? 'blank') : deputy;

  if (!isValid(president, validPresidents) || !isValid(effectiveDeputy, d.deputies)) {
    return bad('Voto inválido.');
  }

  if (user.testOnly && isDev()) return json({ ok: true, testOnly: true, round });

  const claimKey = `${participationPrefix(round)}${await digest(user.voterId)}`;
  const voteId = crypto.randomUUID();
  const claim = { state: 'pending', voteId, round, createdAt: new Date().toISOString() };

  const alreadyClaimed = async () => {
    const prior = await store.get(claimKey, { type: 'json' });
    if (!prior) return null;
    return prior.state === 'done'
      ? bad(`Voto já registrado no ${round}º turno! Você já participou desta etapa.`, 409)
      : bad('Seu voto está em processamento. Não envie novamente; contate a organização se a mensagem persistir.', 409);
  };

  const earlier = await alreadyClaimed();
  if (earlier) return earlier;
  const won = await store.setJSON(claimKey, claim, { onlyIfNew: true });
  if (!won.modified) return (await alreadyClaimed()) ?? bad('Não foi possível registrar agora. Tente novamente.', 409);

  try {
    await store.setJSON(`${votesPrefix(round)}${voteId}`, { president, deputy: effectiveDeputy, round, castAt: new Date().toISOString() }, { onlyIfNew: true });
    await store.setJSON(claimKey, { ...claim, state: 'done', completedAt: new Date().toISOString() });
    return json({ ok: true, round });
  } catch {
    return bad('Não foi possível concluir. Seu registro ficou em processamento; não tente votar de novo.', 503);
  }
});
