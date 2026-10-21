import { describe, it, expect } from 'vitest';
import { findVoter, normName, normCode, votersFromEnv } from '../netlify/functions/_voters.js';

const voters = [
  { id: 'joao-pedro', name: 'João Pedro', code: 'K7M4-9QDX' },
  { id: 'pedro', name: 'Pedro', code: 'ABCD-2345' },
  { id: 'sem-codigo', name: 'Sem Código', code: '' },
  { id: 'curto', name: 'Curto', code: 'ab' },
];

describe('login do eleitor', () => {
  it('ignora caixa, acento e espaços sobrando no nome', () => {
    expect(normName('  JOAO   pedro ')).toBe('joao pedro');
    expect(findVoter(voters, 'joao pedro', 'K7M4-9QDX')?.id).toBe('joao-pedro');
    expect(findVoter(voters, 'João  Pedro', 'K7M4-9QDX')?.id).toBe('joao-pedro');
  });

  it('ignora caixa, hífen e espaço no código', () => {
    expect(normCode('k7m4 9qdx')).toBe('K7M49QDX');
    expect(findVoter(voters, 'João Pedro', 'k7m49qdx')?.id).toBe('joao-pedro');
  });

  it('não confunde Pedro com João Pedro e recusa código de outro eleitor', () => {
    expect(findVoter(voters, 'Pedro', 'K7M4-9QDX')).toBeNull();
    expect(findVoter(voters, 'Pedro', 'ABCD-2345')?.id).toBe('pedro');
  });

  it('eleitor sem código (ou com código curto) nunca entra, nem com código vazio', () => {
    expect(findVoter(voters, 'Sem Código', '')).toBeNull();
    expect(findVoter(voters, 'Sem Código', '      ')).toBeNull();
    expect(findVoter(voters, 'Curto', 'ab')).toBeNull();
  });
});

describe('VOTERS_JSON', () => {
  it('lê uma lista válida e ignora vazio ou inválido', () => {
    expect(votersFromEnv('[{"id":"a","name":"A","code":"123456"}]')).toHaveLength(1);
    expect(votersFromEnv('')).toBeNull();
    expect(votersFromEnv('[]')).toBeNull();
    expect(votersFromEnv('{ruim')).toBeNull();
    expect(votersFromEnv('{"a":1}')).toBeNull();
  });
});
