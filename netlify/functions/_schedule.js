const parse = iso => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/**
 * Estado efetivo da votação: 'scheduled' (ainda não abriu), 'open' ou 'closed'.
 * config.status: 'auto' segue o horário (opensAt/closesAt); 'open' e 'closed' são
 * decisões manuais da organização e valem acima do horário.
 */
export function phase(config, now = Date.now()) {
  if (config.status === 'open') return 'open';
  if (config.status === 'closed') return 'closed';
  const opens = parse(config.opensAt);
  const closes = parse(config.closesAt);
  if (opens === null) return 'closed';
  if (now < opens) return 'scheduled';
  if (closes !== null && now >= closes) return 'closed';
  return 'open';
}

export const fmt = iso =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Valida o horário vindo do painel. Devolve { opensAt, closesAt } ou { error }. */
export function checkSchedule({ opensAt, closesAt }) {
  const norm = v => (v ? parse(v) : null);
  const o = norm(opensAt);
  const c = norm(closesAt);
  if ((opensAt && o === null) || (closesAt && c === null)) return { error: 'Data ou horário inválido.' };
  if (o !== null && c !== null && c <= o) return { error: 'O encerramento precisa ser depois da abertura.' };
  return { opensAt: o === null ? null : new Date(o).toISOString(), closesAt: c === null ? null : new Date(c).toISOString() };
}
