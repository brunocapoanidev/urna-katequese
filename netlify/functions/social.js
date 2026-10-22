import { store, data, json, bad, body, handler } from './_lib.js';
import { findVoterByCode } from './_voters.js';

const PROFILES_KEY = 'social/profiles-v2';
const POSTS_KEY = 'social/posts-v2';

const CANDIDATE_META = {
  bruno: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PNK 45',
    avatar: '/candidates/presidentes.png',
    avatarPos: '0%',
    handle: 'brunocapoani',
  },
  pedro: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PC 38',
    avatar: '/candidates/presidentes.png',
    avatarPos: '50%',
    handle: 'pedrogalli',
  },
  pietro: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PRA 10',
    avatar: '/candidates/presidentes.png',
    avatarPos: '100%',
    handle: 'pietrospielmann',
  },
  'joao-pedro': {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 4518',
    avatar: '/candidates/deputados.png',
    avatarPos: '0%',
    handle: 'jpcria',
  },
  gregory: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 4569',
    avatar: '/candidates/deputados.png',
    avatarPos: '50%',
    handle: 'gregory',
  },
  anderson: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 3869',
    avatar: '/candidates/anderson.jpg',
    avatarPos: '50%',
    handle: 'anderson',
  },
  'tiago-darli-muller': {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 3851',
    avatar: '/candidates/tigas-kayo.png',
    avatarPos: '0%',
    avatarSize: '200% 100%',
    handle: 'tigas3851',
  },
  kayo: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 1067',
    avatar: '/candidates/tigas-kayo.png',
    avatarPos: '100%',
    avatarSize: '200% 100%',
    handle: 'kayo',
  },
  diego: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 1069',
    avatar: '/candidates/deputados.png',
    avatarPos: '100%',
    handle: 'diego',
  },
};

function defaultPrimaryProfile(voter) {
  const meta = CANDIDATE_META[voter.id] || {};
  const cleanHandle = meta.handle || voter.id.replace(/[^a-z0-9]/g, '');
  return {
    id: voter.id,
    ownerId: voter.id,
    type: 'primary',
    name: voter.name,
    handle: cleanHandle,
    avatar: meta.avatar || '',
    avatarPos: meta.avatarPos || '50%',
    avatarSize: meta.avatarSize || '',
    banner: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
    bio: '',
    verified: Boolean(meta.verified),
    badgeType: meta.badgeType || (meta.verified ? 'official' : 'none'),
    roleLabel: meta.roleLabel || 'Eleitor(a) JEK',
    following: [],
    createdAt: new Date().toISOString(),
  };
}

async function loadProfiles(realVoters) {
  let stored = await store.get(PROFILES_KEY, { type: 'json' });
  if (!stored || typeof stored !== 'object') {
    stored = {};
  }

  let changed = false;
  for (const oldKey of ['caio', 'thiago-dalri']) {
    if (stored[oldKey]) {
      delete stored[oldKey];
      changed = true;
    }
  }
  if (stored['thiago-venturini']?.roleLabel?.includes('5138')) {
    stored['thiago-venturini'] = defaultPrimaryProfile({ id: 'thiago-venturini', name: 'Thiago Venturini' });
    changed = true;
  }

  for (const v of realVoters) {
    if (!stored[v.id]) {
      stored[v.id] = defaultPrimaryProfile(v);
      changed = true;
    } else if (CANDIDATE_META[v.id]?.verified && !stored[v.id].verified) {
      stored[v.id].verified = true;
      stored[v.id].badgeType = 'official';
      stored[v.id].roleLabel = CANDIDATE_META[v.id].roleLabel;
      stored[v.id].avatar = stored[v.id].avatar || CANDIDATE_META[v.id].avatar;
      stored[v.id].avatarPos = CANDIDATE_META[v.id].avatarPos || '50%';
      stored[v.id].avatarSize = CANDIDATE_META[v.id].avatarSize || '';
      changed = true;
    }
  }

  if (changed) {
    await store.setJSON(PROFILES_KEY, stored);
  }
  return stored;
}

async function loadPosts() {
  const posts = await store.get(POSTS_KEY, { type: 'json' });
  return Array.isArray(posts) ? posts : [];
}

/** Calcula os Trending Topics exclusivamente a partir das postagens e comentários reais. */
export function computeTrendingTopics(posts) {
  const counts = new Map();
  for (const post of posts) {
    const texts = [post.text, ...(post.comments || []).map(c => c.text)];
    for (const t of texts) {
      const matches = String(t || '').match(/#[a-zA-Z0-9_À-ÿ]+/g) || [];
      for (const rawTag of matches) {
        const key = rawTag.toLowerCase();
        const prev = counts.get(key);
        counts.set(key, {
          tag: prev?.tag || rawTag,
          count: (prev?.count || 0) + 1,
        });
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}

export default handler(async req => {
  const d = await data();
  const realVoters = d.voters.filter(v => !v.testOnly);
  const profilesMap = await loadProfiles(realVoters);
  const posts = await loadPosts();

  if (req.method === 'GET') {
    const url = new URL(req.url);
    const code = url.searchParams.get('code') || '';
    let myAccounts = null;

    if (code) {
      const voter = findVoterByCode(d.voters, code);
      if (voter) {
        const titleRec = voter.testOnly ? { ok: true } : await store.get(`titles/${voter.id}`, { type: 'json' });
        if (titleRec) {
          const primary = profilesMap[voter.id] || defaultPrimaryProfile(voter);
          const secondary = profilesMap[`alt-${voter.id}`] || null;
          myAccounts = { voterId: voter.id, primary, secondary };
        }
      }
    }

    return json({
      profiles: Object.values(profilesMap),
      posts,
      trends: computeTrendingTopics(posts),
      myAccounts,
    });
  }

  if (req.method !== 'POST') return bad('Método inválido', 405);

  const payload = await body(req);
  const { action, code } = payload;

  const voter = findVoterByCode(d.voters, code);
  if (!voter) {
    return bad('Código inválido. Confira o código de 8 caracteres do seu Título.', 401);
  }

  if (!voter.testOnly) {
    const titleRec = await store.get(`titles/${voter.id}`, { type: 'json' });
    if (!titleRec) {
      return bad(
        `Olá, ${voter.name}! Para entrar na Rede Social, você precisa primeiro emitir seu Título Katequista na aba "Meu Título".`,
        403,
      );
    }
  }

  const primaryId = voter.id;
  const secondaryId = `alt-${voter.id}`;

  if (!profilesMap[primaryId]) {
    profilesMap[primaryId] = defaultPrimaryProfile(voter);
    await store.setJSON(PROFILES_KEY, profilesMap);
  }

  if (action === 'auth') {
    return json({
      myAccounts: {
        voterId: voter.id,
        primary: profilesMap[primaryId],
        secondary: profilesMap[secondaryId] || null,
      },
    });
  }

  if (action === 'deleteSecondary') {
    if (profilesMap[secondaryId]) {
      delete profilesMap[secondaryId];
      await store.setJSON(PROFILES_KEY, profilesMap);
    }
    return json({
      ok: true,
      profiles: Object.values(profilesMap),
      myAccounts: {
        voterId: voter.id,
        primary: profilesMap[primaryId],
        secondary: null,
      },
    });
  }

  if (action === 'saveProfile') {
    const isSecondary = payload.profileType === 'secondary';
    const targetId = isSecondary ? secondaryId : primaryId;
    const existing = profilesMap[targetId];

    const rawName = String(payload.name || '').trim().slice(0, 40);
    const rawHandle = String(payload.handle || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 22);
    const rawBio = String(payload.bio || '').trim().slice(0, 180);
    const rawRole = String(payload.roleLabel || '').trim().slice(0, 40);
    const rawAvatar = payload.avatar !== undefined ? String(payload.avatar || '').trim() : existing?.avatar;
    const rawBanner = String(payload.banner || '').trim();
    const allowedBadges = ['none', 'gossip', 'campaign', 'meme'];
    const rawBadge = isSecondary && allowedBadges.includes(payload.badgeType) ? payload.badgeType : 'none';

    if (!rawName || !rawHandle) {
      return bad('Informe um nome de exibição e um @usuario válido.');
    }

    const conflict = Object.values(profilesMap).find(
      p => p.id !== targetId && p.handle.toLowerCase() === rawHandle,
    );
    if (conflict) {
      return bad(`O nome de usuário @${rawHandle} já está em uso.`);
    }

    const meta = !isSecondary ? CANDIDATE_META[voter.id] : null;
    const isCustomAvatar = Boolean(rawAvatar && rawAvatar !== meta?.avatar);

    profilesMap[targetId] = {
      id: targetId,
      ownerId: voter.id,
      type: isSecondary ? 'secondary' : 'primary',
      name: rawName,
      handle: rawHandle,
      bio: rawBio,
      avatar: rawAvatar || '',
      avatarPos: isCustomAvatar ? '50%' : existing?.avatarPos || meta?.avatarPos || '50%',
      avatarSize: isCustomAvatar ? 'cover' : existing?.avatarSize || meta?.avatarSize || '',
      banner:
        rawBanner ||
        existing?.banner ||
        'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
      verified: isSecondary ? false : Boolean(meta?.verified || existing?.verified),
      badgeType: isSecondary ? rawBadge : (meta?.verified ? 'official' : 'none'),
      roleLabel:
        rawRole ||
        existing?.roleLabel ||
        (isSecondary ? 'Página Independente' : 'Eleitor(a) JEK'),
      following: Array.isArray(existing?.following) ? existing.following : [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await store.setJSON(PROFILES_KEY, profilesMap);
    return json({
      ok: true,
      profile: profilesMap[targetId],
      profiles: Object.values(profilesMap),
      myAccounts: {
        voterId: voter.id,
        primary: profilesMap[primaryId],
        secondary: profilesMap[secondaryId] || null,
      },
    });
  }

  const actingId = payload.profileId === secondaryId && profilesMap[secondaryId] ? secondaryId : primaryId;

  if (action === 'toggleFollow') {
    const { targetProfileId } = payload;
    if (!targetProfileId || !profilesMap[targetProfileId]) {
      return bad('Perfil não encontrado.', 404);
    }
    if (targetProfileId === actingId) {
      return bad('Você não pode seguir o próprio perfil.');
    }

    const me = profilesMap[actingId];
    const list = Array.isArray(me.following) ? [...me.following] : [];
    const idx = list.indexOf(targetProfileId);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(targetProfileId);
    me.following = list;

    await store.setJSON(PROFILES_KEY, profilesMap);
    return json({
      ok: true,
      following: list,
      profiles: Object.values(profilesMap),
      myAccounts: {
        voterId: voter.id,
        primary: profilesMap[primaryId],
        secondary: profilesMap[secondaryId] || null,
      },
    });
  }

  if (action === 'createPost') {
    const text = String(payload.text || '').trim().slice(0, 500);
    const mediaUrl = String(payload.mediaUrl || '').trim();
    const mediaKind = payload.mediaKind === 'video' ? 'video' : 'image';
    const quotedPostId = payload.quotedPostId ? String(payload.quotedPostId).trim() : null;

    let poll = null;
    if (Array.isArray(payload.pollOptions)) {
      const cleanOpts = payload.pollOptions
        .map(o => String(o || '').trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 4);
      if (cleanOpts.length >= 2) {
        poll = {
          options: cleanOpts.map((optText, idx) => ({
            id: `opt-${idx + 1}`,
            text: optText,
            votes: [],
          })),
        };
      }
    }

    if (!text && !mediaUrl && !quotedPostId && !poll) {
      return bad('Escreva algo, crie uma enquete ou adicione uma mídia para publicar.');
    }
    if (mediaUrl.length > 600000) return bad('Arquivo muito grande. Escolha uma mídia menor.');

    const newPost = {
      id: crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      authorId: actingId,
      text,
      mediaUrl,
      mediaKind,
      quotedPostId,
      poll,
      createdAt: new Date().toISOString(),
      likes: [],
      reposts: [],
      comments: [],
    };

    const updated = [newPost, ...posts].slice(0, 300);
    await store.setJSON(POSTS_KEY, updated);
    return json({ ok: true, post: newPost, posts: updated, trends: computeTrendingTopics(updated) });
  }

  if (action === 'votePoll') {
    const { postId, optionId } = payload;
    const target = posts.find(p => p.id === postId && p.poll && Array.isArray(p.poll.options));
    if (!target) return bad('Enquete não encontrada.', 404);

    // Cada título de eleitor (voter.id) tem direito a 1 voto por enquete
    for (const opt of target.poll.options) {
      opt.votes = Array.isArray(opt.votes) ? opt.votes.filter(v => v !== voter.id) : [];
      if (opt.id === optionId) {
        opt.votes.push(voter.id);
      }
    }

    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, post: target, posts });
  }

  if (action === 'editPost') {
    const { postId } = payload;
    const text = String(payload.text || '').trim().slice(0, 500);
    if (!text) return bad('O texto da publicação não pode ficar vazio.');
    const target = posts.find(
      p => p.id === postId && (p.authorId === primaryId || p.authorId === secondaryId),
    );
    if (!target) return bad('Publicação não encontrada ou sem permissão para editar.', 403);

    target.text = text;
    target.editedAt = new Date().toISOString();
    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, post: target, posts, trends: computeTrendingTopics(posts) });
  }

  if (action === 'react') {
    const { postId, reaction = 'likes' } = payload;
    const field = ['likes', 'reposts'].includes(reaction) ? reaction : 'likes';
    const target = posts.find(p => p.id === postId);
    if (!target) return bad('Publicação não encontrada.', 404);

    const arr = Array.isArray(target[field]) ? target[field] : [];
    const idx = arr.indexOf(actingId);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(actingId);
    target[field] = arr;

    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, post: target, posts });
  }

  if (action === 'comment') {
    const { postId } = payload;
    const text = String(payload.text || '').trim().slice(0, 350);
    if (!text) return bad('Escreva um comentário.');
    const target = posts.find(p => p.id === postId);
    if (!target) return bad('Publicação não encontrada.', 404);

    target.comments = Array.isArray(target.comments) ? target.comments : [];
    target.comments.push({
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: actingId,
      text,
      createdAt: new Date().toISOString(),
    });

    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, post: target, posts, trends: computeTrendingTopics(posts) });
  }

  if (action === 'deleteComment') {
    const { postId, commentId } = payload;
    const target = posts.find(p => p.id === postId);
    if (!target || !Array.isArray(target.comments)) return bad('Comentário não encontrado.', 404);
    const idx = target.comments.findIndex(
      c => c.id === commentId && (c.authorId === primaryId || c.authorId === secondaryId),
    );
    if (idx === -1) return bad('Sem permissão para excluir este comentário.', 403);
    target.comments.splice(idx, 1);
    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, posts, trends: computeTrendingTopics(posts) });
  }

  if (action === 'deletePost') {
    const { postId } = payload;
    const idx = posts.findIndex(
      p => p.id === postId && (p.authorId === primaryId || p.authorId === secondaryId),
    );
    if (idx === -1) return bad('Você só pode excluir suas próprias publicações.', 403);
    posts.splice(idx, 1);
    await store.setJSON(POSTS_KEY, updatedPostsAfterDelete(posts));
    return json({ ok: true, posts, trends: computeTrendingTopics(posts) });
  }

  return bad('Ação inválida.');
});

function updatedPostsAfterDelete(posts) {
  return posts;
}
