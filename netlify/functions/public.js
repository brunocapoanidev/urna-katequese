import { data, json, bad, handler, phase } from './_lib.js';

export default handler(async req => {
  if (req.method !== 'GET') return bad('Método inválido', 405);
  const d = await data();
  const { opensAt, closesAt } = d.config;
  // `now` deixa a contagem regressiva do site seguir o relógio do servidor, não o do celular.
  const config = { status: phase(d.config), opensAt, closesAt, now: Date.now() };
  return json({ config, presidents: d.presidents, deputies: d.deputies });
});
