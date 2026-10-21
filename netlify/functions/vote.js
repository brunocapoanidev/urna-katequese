import { store, auth, data, json, bad, body, handler, digest, isDev } from './_lib.js';

const isValid = (choice, list) => choice === 'blank' || choice === 'null' || list.some(x => x.id === choice);

export default handler(async req => {
  const user = await auth(req, 'voter');
  if (!user) return bad('Sessão inválida. Identifique-se novamente.', 401);
  if (req.method !== 'POST') return bad('Método inválido', 405);

  const { president, deputy } = await body(req);
  const d = await data();
  if (d.config.status !== 'open') return bad('Votação encerrada.', 403);
  if (!isValid(president, d.presidents) || !isValid(deputy, d.deputies)) return bad('Voto inválido.');

  if (user.testOnly && isDev()) return json({ ok: true, testOnly: true });

  const claimKey = `participation/${await digest(user.voterId)}`;
  const voteId = crypto.randomUUID();
  const claim = { state: 'pending', voteId, createdAt: new Date().toISOString() };

  const alreadyClaimed = async () => {
    const prior = await store.get(claimKey, { type: 'json' });
    if (!prior) return null;
    return prior.state === 'done'
      ? bad('Voto já registrado! Você já participou desta eleição e não poderá votar novamente.', 409)
      : bad('Seu voto está em processamento. Não envie novamente; contate a organização se a mensagem persistir.', 409);
  };

  const earlier = await alreadyClaimed();
  if (earlier) return earlier;
  const won = await store.setJSON(claimKey, claim, { onlyIfNew: true });
  if (!won.modified) return (await alreadyClaimed()) ?? bad('Não foi possível registrar agora. Tente novamente.', 409);

  try {
    await store.setJSON(`votes/${voteId}`, { president, deputy, castAt: new Date().toISOString() }, { onlyIfNew: true });
    await store.setJSON(claimKey, { ...claim, state: 'done', completedAt: new Date().toISOString() });
    return json({ ok: true });
  } catch {
    return bad('Não foi possível concluir. Seu registro ficou em processamento; não tente votar de novo.', 503);
  }
});
