const byNumber = (a, b) => Number(a.number) - Number(b.number);

function rank(list, votes, field) {
  const counts = new Map();
  for (const v of votes) counts.set(v[field], (counts.get(v[field]) || 0) + 1);
  return list
    .map(c => ({ ...c, votes: counts.get(c.id) || 0 }))
    .sort((a, b) => b.votes - a.votes || byNumber(a, b));
}

/**
 * Apuração. Desempate: menor número eleitoral.
 * Presidente: o mais votado. Deputados: os `seats` mais votados, independente de aliança.
 * `tie` indica empate em votos na disputa, resolvido pelo número.
 */
export function tally(votes, presidents, deputies, seats = 3) {
  const ranked = rank(presidents, votes, 'president');
  const rankedDeputies = rank(deputies, votes, 'deputy');
  const tied = (list, n) => list.length > n && list[n - 1].votes > 0 && list[n - 1].votes === list[n].votes;

  return {
    votes: votes.length,
    presidents: ranked,
    deputies: rankedDeputies,
    winner: ranked[0]?.votes > 0 ? ranked[0].id : null,
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
