const byNumber = (a, b) => Number(a.number) - Number(b.number);

function rank(list, votes, field) {
  const counts = new Map();
  for (const v of votes) counts.set(v[field], (counts.get(v[field]) || 0) + 1);
  return list
    .map(c => ({ ...c, votes: counts.get(c.id) || 0 }))
    .sort((a, b) => b.votes - a.votes || byNumber(a, b));
}

/**
 * Apuração JEK (Justiça Eleitoral Katequista).
 * Desempate: menor número eleitoral.
 * Presidente:
 *  - No 1º turno (`round === 1`), se houver votos válidos e o 1º colocado não atingir mais de 50%
 *    dos votos válidos (`votes <= validPresidentVotes / 2`) havendo um 2º colocado com votos > 0,
 *    habilita o 2º turno (`secondRound: true`) entre os 2 mais votados (`runoff`).
 *  - Deputados: os `seats` (padrão 4 de 6) mais votados são eleitos no 1º turno, independente de aliança.
 */
export function tally(votes, presidents, deputies, seats = 4, round = 1) {
  const ranked = rank(presidents, votes, 'president');
  const rankedDeputies = rank(deputies, votes, 'deputy');
  const tied = (list, n) => list.length > n && list[n - 1].votes > 0 && list[n - 1].votes === list[n].votes;

  const validPresidentVotes = ranked.reduce((sum, c) => sum + c.votes, 0);
  const validDeputyVotes = rankedDeputies.reduce((sum, c) => sum + c.votes, 0);

  const presidentsWithPct = ranked.map(c => ({
    ...c,
    pct: validPresidentVotes > 0 ? Number(((c.votes / validPresidentVotes) * 100).toFixed(1)) : 0,
  }));

  const deputiesWithPct = rankedDeputies.map(c => ({
    ...c,
    pct: validDeputyVotes > 0 ? Number(((c.votes / validDeputyVotes) * 100).toFixed(1)) : 0,
  }));

  const hasMajority = validPresidentVotes > 0 && ranked[0]?.votes > validPresidentVotes / 2;
  const secondRound = Boolean(
    round === 1 &&
      ranked.length >= 2 &&
      validPresidentVotes > 0 &&
      !hasMajority &&
      ranked[1]?.votes > 0,
  );
  const runoff = secondRound ? [ranked[0].id, ranked[1].id] : [];

  return {
    round,
    votes: votes.length,
    validVotes: {
      president: validPresidentVotes,
      deputy: validDeputyVotes,
    },
    presidents: presidentsWithPct,
    deputies: deputiesWithPct,
    winner: ranked[0]?.votes > 0 ? ranked[0].id : null,
    firstRoundWinner: !secondRound && ranked[0]?.votes > 0 ? ranked[0].id : null,
    secondRound,
    runoff,
    seats,
    elected: rankedDeputies.slice(0, seats).filter(d => d.votes > 0).map(d => d.id),
    ties: { president: tied(ranked, 1), deputies: tied(rankedDeputies, seats) },
    blank: {
      president: votes.filter(v => v.president === 'blank').length,
      deputy: votes.filter(v => v.deputy === 'blank').length,
    },
    null: {
      president: votes.filter(v => v.president === 'null').length,
      deputy: votes.filter(v => v.deputy === 'null').length,
    },
  };
}
