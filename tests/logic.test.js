import { describe, it, expect, beforeAll } from 'vitest';
import { tally } from '../netlify/functions/_tally.js';
import { token, verify, safeEqual, digest } from '../netlify/functions/_crypto.js';

const presidents = [
  { id: 'a', name: 'A', number: '45' },
  { id: 'b', name: 'B', number: '38' },
  { id: 'c', name: 'C', number: '10' },
];
const deputies = [
  { id: 'd1', name: 'D1', number: '4518' },
  { id: 'd2', name: 'D2', number: '5138' },
  { id: 'd3', name: 'D3', number: '4569' },
  { id: 'd4', name: 'D4', number: '1067' },
  { id: 'd5', name: 'D5', number: '1069' },
];
const vote = (president, deputy) => ({ president, deputy });

describe('apuração', () => {
  it('o presidente mais votado vence', () => {
    const r = tally([vote('a', 'd1'), vote('a', 'd2'), vote('b', 'd1')], presidents, deputies);
    expect(r.winner).toBe('a');
    expect(r.presidents.map(p => p.votes)).toEqual([2, 1, 0]);
  });

  it('desempate usa o menor número eleitoral', () => {
    const r = tally([vote('a', 'd1'), vote('c', 'd2')], presidents, deputies);
    expect(r.winner).toBe('c');
    expect(r.ties.president).toBe(true);
  });

  it('elege os três deputados mais votados, independente do presidente', () => {
    const votes = [
      vote('a', 'd1'), vote('a', 'd1'), vote('a', 'd1'),
      vote('b', 'd2'), vote('b', 'd2'),
      vote('c', 'd3'), vote('c', 'd4'), vote('c', 'd5'),
    ];
    const r = tally(votes, presidents, deputies, 3);
    expect(r.elected).toEqual(['d1', 'd2', 'd4']);
    expect(r.ties.deputies).toBe(true);
  });

  it('branco é contado à parte e não elege ninguém', () => {
    const r = tally([vote('blank', 'blank'), vote('blank', 'd1')], presidents, deputies);
    expect(r.blank).toEqual({ president: 2, deputy: 1 });
    expect(r.winner).toBeNull();
    expect(r.elected).toEqual(['d1']);
  });

  it('sem votos não há vencedor', () => {
    const r = tally([], presidents, deputies);
    expect(r.winner).toBeNull();
    expect(r.elected).toEqual([]);
  });
});

describe('sessão e tokens', () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
  });

  it('aceita um token válido para o papel certo', async () => {
    const t = await token({ role: 'voter', voterId: 'jean' });
    expect((await verify(`Bearer ${t}`, 'voter')).voterId).toBe('jean');
  });

  it('recusa papel errado, token adulterado e token expirado', async () => {
    const t = await token({ role: 'voter', voterId: 'jean' });
    expect(await verify(`Bearer ${t}`, 'admin')).toBeNull();
    const [raw, sig] = t.split('.');
    const forged = btoa(JSON.stringify({ role: 'admin', exp: Date.now() + 1e6 }));
    expect(await verify(`Bearer ${forged}.${sig}`, 'admin')).toBeNull();
    expect(await verify(`Bearer ${raw}.${'0'.repeat(sig.length)}`, 'voter')).toBeNull();
    expect(await verify(`Bearer ${await token({ role: 'voter' }, -1)}`, 'voter')).toBeNull();
    expect(await verify('', 'voter')).toBeNull();
  });

  it('sem AUTH_SECRET fora do ambiente local, não assina nada', async () => {
    const saved = process.env.AUTH_SECRET;
    delete process.env.AUTH_SECRET;
    await expect(token({ role: 'admin' })).rejects.toThrow(/AUTH_SECRET/);
    process.env.AUTH_SECRET = saved;
  });

  it('safeEqual compara textos e o hash é estável', async () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(await digest('jean')).toBe(await digest('jean'));
  });
});

describe('empates sem votos', () => {
  it('zero a zero não conta como empate', () => {
    const r = tally([vote('a', 'd1')], presidents, deputies, 3);
    expect(r.ties.deputies).toBe(false);
  });
});
