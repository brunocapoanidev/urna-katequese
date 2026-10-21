import { store, data, json, bad, body, handler, attempts, digest, isDev, safeEqual, token } from './_lib.js';
import { ADMIN_TTL_MS } from './_crypto.js';

const norm = s => String(s ?? '').trim().toLocaleLowerCase('pt-BR');
const TOO_MANY = 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';

async function adminLogin(password) {
  const limit = await attempts('admin', 'admin');
  if (limit.blocked) return bad(TOO_MANY, 429);
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== 'string' || !safeEqual(password, expected)) {
    await limit.fail();
    return bad('Acesso negado', 401);
  }
  await limit.clear();
  return json({ token: await token({ role: 'admin' }, ADMIN_TTL_MS) });
}

export default handler(async req => {
  if (req.method !== 'POST') return bad('Método inválido', 405);
  const { name, code, adminPassword } = await body(req);

  if (adminPassword !== undefined) return adminLogin(adminPassword);

  const limit = await attempts('voter', norm(name));
  if (limit.blocked) return bad(TOO_MANY, 429);

  const d = await data();
  const voter = d.voters.find(v => norm(v.name) === norm(name) && safeEqual(v.code, String(code ?? '')));
  // O eleitor de teste só existe no ambiente local; em produção ele não entra.
  if (!voter || (voter.testOnly && !isDev())) {
    await limit.fail();
    return bad('Nome ou código inválido.', 401);
  }
  await limit.clear();

  if (voter.testOnly) return json({ token: await token({ role: 'voter', voterId: voter.id, testOnly: true }) });

  const participation = await store.get(`participation/${await digest(voter.id)}`, { type: 'json' });
  if (participation?.state === 'done') {
    return bad('Voto já registrado! Você já participou desta eleição e não poderá votar novamente.', 409);
  }
  if (d.config.status !== 'open') return bad('A votação não está aberta no momento.', 403);
  return json({ token: await token({ role: 'voter', voterId: voter.id }) });
});
