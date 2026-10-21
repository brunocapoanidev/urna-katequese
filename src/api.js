/** Chama uma Netlify Function. Sem `body` faz GET; com `body` faz POST. */
export async function api(path, body, token) {
  const res = await fetch(`/.netlify/functions/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* resposta que não é JSON (ex.: servidor sem Functions) */
  }
  if (!res.ok || data === null) {
    const error = new Error(data?.error || 'Não foi possível falar com o servidor. Tente novamente.');
    error.status = data === null ? 0 : res.status;
    throw error;
  }
  return data;
}

// Votos de demonstração do modo local (npm run dev), guardados só nesta aba.
const KEY = 'urna-preview-votes';
export const readPreviewVotes = () => {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};
export const savePreviewVote = vote => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...readPreviewVotes(), vote]));
  } catch {
    /* modo privado: a demonstração só não guarda o voto */
  }
};
export const clearPreviewVotes = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignorar */
  }
};
