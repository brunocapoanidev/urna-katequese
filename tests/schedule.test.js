import { describe, it, expect } from 'vitest';
import { phase, checkSchedule } from '../netlify/functions/_schedule.js';

const opensAt = '2026-10-24T15:00:00-03:00';
const closesAt = '2026-10-25T17:00:00-03:00';
const at = iso => Date.parse(iso);
const auto = { status: 'auto', opensAt, closesAt };

describe('fase da votação', () => {
  it('antes do horário está agendada, dentro está aberta, depois está encerrada', () => {
    expect(phase(auto, at('2026-10-24T14:59:59-03:00'))).toBe('scheduled');
    expect(phase(auto, at('2026-10-24T15:00:00-03:00'))).toBe('open');
    expect(phase(auto, at('2026-10-25T16:59:59-03:00'))).toBe('open');
    expect(phase(auto, at('2026-10-25T17:00:00-03:00'))).toBe('closed');
  });

  it('decisão manual vale acima do horário', () => {
    const before = at('2026-10-20T10:00:00-03:00');
    expect(phase({ ...auto, status: 'open' }, before)).toBe('open');
    expect(phase({ ...auto, status: 'closed' }, at('2026-10-24T20:00:00-03:00'))).toBe('closed');
  });

  it('sem horário de abertura, no automático, fica fechada', () => {
    expect(phase({ status: 'auto' }, Date.now())).toBe('closed');
  });

  it('sem horário de encerramento, abre e continua aberta', () => {
    expect(phase({ status: 'auto', opensAt }, at('2026-11-30T00:00:00-03:00'))).toBe('open');
  });
});

describe('validação do horário', () => {
  it('aceita datas válidas e normaliza para UTC', () => {
    expect(checkSchedule({ opensAt, closesAt })).toEqual({
      opensAt: '2026-10-24T18:00:00.000Z',
      closesAt: '2026-10-25T20:00:00.000Z',
    });
  });

  it('recusa data inválida e encerramento antes da abertura', () => {
    expect(checkSchedule({ opensAt: 'amanhã', closesAt }).error).toBeTruthy();
    expect(checkSchedule({ opensAt: closesAt, closesAt: opensAt }).error).toBeTruthy();
    expect(checkSchedule({ opensAt, closesAt: opensAt }).error).toBeTruthy();
  });
});
