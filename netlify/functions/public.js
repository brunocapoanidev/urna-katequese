import { data, json, bad, handler } from './_lib.js';

export default handler(async req => {
  if (req.method !== 'GET') return bad('Método inválido', 405);
  const d = await data();
  return json({ config: { status: d.config.status }, presidents: d.presidents, deputies: d.deputies });
});
