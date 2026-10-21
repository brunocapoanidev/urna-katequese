export function findCandidateByNumber(candidates, number) {
  if (!Array.isArray(candidates) || typeof number !== 'string') return null;
  return candidates.find(candidate => candidate?.number === number) || null;
}
