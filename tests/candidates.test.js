import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import deputies from '../data/deputies.json';

describe('catálogo de deputados', () => {
  it('inclui Anderson na chapa de Pedro Galli com o número 3869', () => {
    const anderson = deputies.find(candidate => candidate.id === 'anderson');

    expect(anderson).toMatchObject({
      id: 'anderson',
      name: 'Anderson',
      number: '3869',
      presidentId: 'pedro-galli',
      photo: '/candidates/anderson.jpg',
    });
  });

  it('mantém números e ids únicos para impedir ambiguidade na urna', () => {
    const ids = deputies.map(candidate => candidate.id);
    const numbers = deputies.map(candidate => candidate.number);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('mantém a foto de cada deputado disponível no catálogo público', () => {
    for (const deputy of deputies) {
      expect(deputy.photo).toMatch(/^\/candidates\/[a-z0-9-]+\.(?:jpg|png)$/);
      expect(existsSync(resolve('public', deputy.photo.slice(1)))).toBe(true);
    }
  });
});
