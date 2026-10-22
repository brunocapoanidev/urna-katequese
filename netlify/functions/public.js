import { data, json, bad, handler, phase, turnoutStats, closedRoundVotes } from './_lib.js';

export default handler(async req => {
  if (req.method !== 'GET') return bad('Método inválido', 405);
  const d = await data();
  const { opensAt, closesAt, round = 1, seats = 4, runoffIds = [] } = d.config;
  const currentPhase = phase(d.config);
  const realVotersCount = d.voters.filter(v => !v.testOnly).length;
  const turnout = await turnoutStats(round, realVotersCount);
  const votes = currentPhase === 'closed' ? await closedRoundVotes(round) : null;
  // `now` deixa a contagem regressiva do site seguir o relógio do servidor, não o do celular.
  const config = { status: currentPhase, opensAt, closesAt, now: Date.now(), round, seats, runoffIds };
  return json({ config, turnout, votes, presidents: d.presidents, deputies: d.deputies });
});
