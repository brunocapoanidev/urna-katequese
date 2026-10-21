import { describe, expect, it } from 'vitest';
import deputies from '../data/deputies.json';
import { findCandidateByNumber } from '../src/candidates.js';

describe('seleção de deputado na urna', () => {
  it('encontra Anderson pelo número eleitoral completo', () => {
    expect(findCandidateByNumber(deputies, '3869')).toMatchObject({
      id: 'anderson',
      name: 'Anderson',
      number: '3869',
    });
  });

  it('não converte entrada não textual em número eleitoral válido', () => {
    expect(findCandidateByNumber(deputies, 3869)).toBeNull();
    expect(findCandidateByNumber(deputies, '386')).toBeNull();
    expect(findCandidateByNumber(deputies, '38690')).toBeNull();
  });
});
