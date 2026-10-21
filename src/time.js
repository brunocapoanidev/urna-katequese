const ZONE = 'America/Sao_Paulo';

/** "sábado, 24/10, 15:00" */
export const when = iso =>
  new Date(iso).toLocaleString('pt-BR', { timeZone: ZONE, weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** "sáb., 24/10 15:00" */
export const whenShort = iso =>
  new Date(iso)
    .toLocaleString('pt-BR', { timeZone: ZONE, weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    .replace(',', '');
