import { store, data, json, bad, body, handler, safeEqual } from './_lib.js';
import { findVoterByCode, normCode } from './_voters.js';

const PROFILES_KEY = 'social/profiles-v2';
const POSTS_KEY = 'social/posts-v2';

const STK_PRIMARY_ID = 'stk-ministro';
const STK_SECONDARY_ID = 'stk-corte';

function isStkCode(rawCode) {
  const c = normCode(rawCode);
  if (!c || c.length < 6) return false;
  const envCode = process.env.STK_CODE ? normCode(process.env.STK_CODE) : '';
  if (envCode && safeEqual(c, envCode)) return true;
  return ['S9T4K8JX', 'STKSUPREMO', 'STK2026JUIZ', 'STKJUIZ2026'].some(valid => safeEqual(c, valid));
}

function defaultStkMinistroProfile() {
  return {
    id: STK_PRIMARY_ID,
    ownerId: 'stk-supremo',
    type: 'primary',
    name: 'Min. Alexandre de Katequese',
    handle: 'ministro_stk',
    avatar: '/logo-kx.jpg',
    avatarPos: '50%',
    avatarSize: 'cover',
    banner: 'linear-gradient(135deg, #b45309 0%, #451a03 55%, #09090b 100%)',
    bio: '⚖️ Ministro Relator do Superior Tribunal Katequesense (STK). Guardião da Constituição da Resenha e relator do Inquérito das Fake News.',
    verified: true,
    badgeType: 'stk',
    roleLabel: 'Ministro Relator · STK',
    following: [],
    createdAt: new Date().toISOString(),
  };
}

function defaultStkCorteProfile() {
  return {
    id: STK_SECONDARY_ID,
    ownerId: 'stk-supremo',
    type: 'secondary',
    name: 'STK — Superior Tribunal Katequesense',
    handle: 'stk_oficial',
    avatar: '/logo-kx.jpg',
    avatarPos: '50%',
    avatarSize: 'cover',
    banner: 'linear-gradient(135deg, #d97706 0%, #78350f 50%, #09090b 100%)',
    bio: '⚖️ Perfil Institucional da Suprema Corte Eleitoral do Grupo Katequese. Decisões monocráticas, intimações e combate à desinformação.',
    verified: true,
    badgeType: 'stk',
    roleLabel: 'Corte Suprema · JEK',
    following: [],
    createdAt: new Date().toISOString(),
  };
}

const CANDIDATE_META = {
  bruno: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PNK 45',
    avatar: '/candidates/presidentes.png',
    avatarPos: '0%',
    avatarSize: '300% 100%',
    handle: 'brunocapoani',
  },
  pedro: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PC 38',
    avatar: '/candidates/presidentes.png',
    avatarPos: '50%',
    avatarSize: '300% 100%',
    handle: 'pedrogalli',
  },
  pietro: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Presidente · PRA 10',
    avatar: '/candidates/presidentes.png',
    avatarPos: '100%',
    avatarSize: '300% 100%',
    handle: 'pietrospielmann',
  },
  'joao-pedro': {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 4518',
    avatar: '/candidates/deputados.png',
    avatarPos: '0%',
    avatarSize: '300% 100%',
    handle: 'jpcria',
  },
  gregory: {
    verified: true,
    badgeType: 'official',
    roleLabel: 'Candidato a Deputado · 4569',
    avatar: '/candidates/deputados.png',
    avatarPos: '50%',
    avatarSize: '300% 100%',
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
    avatarSize: '300% 100%',
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

  if (!stored[STK_PRIMARY_ID]) {
    stored[STK_PRIMARY_ID] = defaultStkMinistroProfile();
    changed = true;
  }
  if (!stored[STK_SECONDARY_ID]) {
    stored[STK_SECONDARY_ID] = defaultStkCorteProfile();
    changed = true;
  }

  for (const v of realVoters) {
    const meta = CANDIDATE_META[v.id];
    if (!stored[v.id]) {
      stored[v.id] = defaultPrimaryProfile(v);
      changed = true;
    } else if (meta) {
      if (meta.verified && !stored[v.id].verified) {
        stored[v.id].verified = true;
        stored[v.id].badgeType = 'official';
        stored[v.id].roleLabel = meta.roleLabel;
        changed = true;
      }
      if (
        (!stored[v.id].avatar || stored[v.id].avatar === meta.avatar) &&
        stored[v.id].avatarSize !== (meta.avatarSize || '')
      ) {
        stored[v.id].avatar = meta.avatar;
        stored[v.id].avatarPos = meta.avatarPos || '50%';
        stored[v.id].avatarSize = meta.avatarSize || '';
        changed = true;
      }
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

/** Oculta o conteúdo original das postagens removidas pelo STK para usuários comuns, mantendo visível para o próprio STK. */
function serializePostsForViewer(posts, viewerIsStk) {
  if (viewerIsStk) return posts;
  return posts.map(p => {
    if (p.stkAction?.status === 'removed') {
      return {
        ...p,
        text: '',
        mediaUrl: '',
        poll: null,
      };
    }
    return p;
  });
}

/** Calcula os Trending Topics exclusivamente a partir das postagens ativas (não removidas pelo STK). */
export function computeTrendingTopics(posts) {
  const counts = new Map();
  for (const post of posts) {
    if (post.stkAction?.status === 'removed') continue;
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
    const viewerIsStk = isStkCode(code);
    let myAccounts = null;

    if (viewerIsStk) {
      myAccounts = {
        voterId: 'stk-supremo',
        isStk: true,
        primary: profilesMap[STK_PRIMARY_ID],
        secondary: profilesMap[STK_SECONDARY_ID],
      };
    } else if (code) {
      const voter = findVoterByCode(d.voters, code);
      if (voter) {
        const titleRec = voter.testOnly ? { ok: true } : await store.get(`titles/${voter.id}`, { type: 'json' });
        if (titleRec) {
          const primary = profilesMap[voter.id] || defaultPrimaryProfile(voter);
          const secondary = profilesMap[`alt-${voter.id}`] || null;
          myAccounts = { voterId: voter.id, isStk: false, primary, secondary };
        }
      }
    }

    return json({
      profiles: Object.values(profilesMap),
      posts: serializePostsForViewer(posts, viewerIsStk),
      trends: computeTrendingTopics(posts),
      myAccounts,
    });
  }

  if (req.method !== 'POST') return bad('Método inválido', 405);

  const payload = await body(req);
  const { action, code } = payload;

  const isStk = isStkCode(code);
  const voter = isStk ? { id: 'stk-supremo', name: 'Ministro do STK', testOnly: true } : findVoterByCode(d.voters, code);

  if (!voter) {
    return bad('Código inválido. Confira o código de 8 caracteres do seu Título ou credencial do STK.', 401);
  }

  if (!isStk && !voter.testOnly) {
    const titleRec = await store.get(`titles/${voter.id}`, { type: 'json' });
    if (!titleRec) {
      return bad(
        `Olá, ${voter.name}! Para entrar na Rede Social, você precisa primeiro emitir seu Título Katequista na aba "Meu Título".`,
        403,
      );
    }
  }

  const primaryId = isStk ? STK_PRIMARY_ID : voter.id;
  const secondaryId = isStk ? STK_SECONDARY_ID : `alt-${voter.id}`;

  if (!profilesMap[primaryId]) {
    profilesMap[primaryId] = isStk ? defaultStkMinistroProfile() : defaultPrimaryProfile(voter);
    await store.setJSON(PROFILES_KEY, profilesMap);
  }

  const buildAccountsResponse = () => ({
    voterId: voter.id,
    isStk,
    primary: profilesMap[primaryId],
    secondary: profilesMap[secondaryId] || null,
  });

  if (action === 'auth') {
    return json({
      myAccounts: buildAccountsResponse(),
      posts: serializePostsForViewer(posts, isStk),
    });
  }

  // Ação Exclusiva do STK: Poder Absoluto de Marcar, Remover ou Devolver qualquer postagem
  if (action === 'stkModerate') {
    if (!isStk) {
      return bad('Acesso negado: apenas o Superior Tribunal Katequesense (STK) possui jurisdição para este ato.', 403);
    }
    const { postId, mode, reason, ministerName } = payload;
    const target = posts.find(p => p.id === postId);
    if (!target) return bad('Publicação não encontrada nos autos.', 404);

    if (mode === 'restore') {
      delete target.stkAction;
    } else if (mode === 'flag' || mode === 'remove') {
      const cleanReason = String(reason || '').trim().slice(0, 240) || 'Determinação de Ofício do Plenário do STK';
      const cleanMinister =
        String(ministerName || '').trim().slice(0, 50) ||
        profilesMap[STK_PRIMARY_ID]?.name ||
        'Ministro Relator';
      target.stkAction = {
        status: mode === 'remove' ? 'removed' : 'flagged',
        ministerName: cleanMinister,
        reason: cleanReason,
        updatedAt: new Date().toISOString(),
      };
    } else {
      return bad('Modalidade de despacho judicial inválida.');
    }

    await store.setJSON(POSTS_KEY, posts);
    return json({
      ok: true,
      post: target,
      posts: serializePostsForViewer(posts, true),
      trends: computeTrendingTopics(posts),
    });
  }

  if (action === 'deleteSecondary' && !isStk) {
    if (profilesMap[secondaryId]) {
      delete profilesMap[secondaryId];
      await store.setJSON(PROFILES_KEY, profilesMap);
    }
    return json({
      ok: true,
      profiles: Object.values(profilesMap),
      myAccounts: buildAccountsResponse(),
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
    const allowedBadges = ['none', 'gossip', 'campaign', 'meme', 'stk'];
    const rawBadge = isStk
      ? 'stk'
      : isSecondary && allowedBadges.includes(payload.badgeType)
        ? payload.badgeType
        : 'none';

    if (!rawName || !rawHandle) {
      return bad('Informe um nome de exibição e um @usuario válido.');
    }

    const conflict = Object.values(profilesMap).find(
      p => p.id !== targetId && p.handle.toLowerCase() === rawHandle,
    );
    if (conflict) {
      return bad(`O nome de usuário @${rawHandle} já está em uso.`);
    }

    const meta = !isStk && !isSecondary ? CANDIDATE_META[voter.id] : null;
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
      verified: isStk ? true : isSecondary ? false : Boolean(meta?.verified || existing?.verified),
      badgeType: isStk ? 'stk' : isSecondary ? rawBadge : (meta?.verified ? 'official' : 'none'),
      roleLabel:
        rawRole ||
        existing?.roleLabel ||
        (isStk
          ? isSecondary
            ? 'Corte Suprema · JEK'
            : 'Ministro Relator · STK'
          : isSecondary
            ? 'Página Independente'
            : 'Eleitor(a) JEK'),
      following: Array.isArray(existing?.following) ? existing.following : [],
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    await store.setJSON(PROFILES_KEY, profilesMap);
    return json({
      ok: true,
      profile: profilesMap[targetId],
      profiles: Object.values(profilesMap),
      myAccounts: buildAccountsResponse(),
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
      myAccounts: buildAccountsResponse(),
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
    return json({
      ok: true,
      post: newPost,
      posts: serializePostsForViewer(updated, isStk),
      trends: computeTrendingTopics(updated),
    });
  }

  if (action === 'votePoll') {
    const { postId, optionId } = payload;
    const target = posts.find(p => p.id === postId && p.poll && Array.isArray(p.poll.options));
    if (!target) return bad('Enquete não encontrada.', 404);

    for (const opt of target.poll.options) {
      opt.votes = Array.isArray(opt.votes) ? opt.votes.filter(v => v !== actingId && v !== voter.id) : [];
      if (opt.id === optionId) {
        opt.votes.push(actingId);
      }
    }

    await store.setJSON(POSTS_KEY, posts);
    return json({ ok: true, post: target, posts: serializePostsForViewer(posts, isStk) });
  }

  if (action === 'editPost') {
    const { postId } = payload;
    const text = String(payload.text || '').trim().slice(0, 500);
    if (!text) return bad('O texto da publicação não pode ficar vazio.');
    const target = posts.find(
      p => p.id === postId && (isStk || p.authorId === primaryId || p.authorId === secondaryId),
    );
    if (!target) return bad('Publicação não encontrada ou sem permissão para editar.', 403);

    target.text = text;
    target.editedAt = new Date().toISOString();
    await store.setJSON(POSTS_KEY, posts);
    return json({
      ok: true,
      post: target,
      posts: serializePostsForViewer(posts, isStk),
      trends: computeTrendingTopics(posts),
    });
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
    return json({ ok: true, post: target, posts: serializePostsForViewer(posts, isStk) });
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
    return json({
      ok: true,
      post: target,
      posts: serializePostsForViewer(posts, isStk),
      trends: computeTrendingTopics(posts),
    });
  }

  if (action === 'deleteComment') {
    const { postId, commentId } = payload;
    const target = posts.find(p => p.id === postId);
    if (!target || !Array.isArray(target.comments)) return bad('Comentário não encontrado.', 404);
    const idx = target.comments.findIndex(
      c => c.id === commentId && (isStk || c.authorId === primaryId || c.authorId === secondaryId),
    );
    if (idx === -1) return bad('Sem permissão para excluir este comentário.', 403);
    target.comments.splice(idx, 1);
    await store.setJSON(POSTS_KEY, posts);
    return json({
      ok: true,
      posts: serializePostsForViewer(posts, isStk),
      trends: computeTrendingTopics(posts),
    });
  }

  if (action === 'deletePost') {
    const { postId } = payload;
    const idx = posts.findIndex(
      p => p.id === postId && (isStk || p.authorId === primaryId || p.authorId === secondaryId),
    );
    if (idx === -1) return bad('Você só pode excluir suas próprias publicações.', 403);
    posts.splice(idx, 1);
    await store.setJSON(POSTS_KEY, posts);
    return json({
      ok: true,
      posts: serializePostsForViewer(posts, isStk),
      trends: computeTrendingTopics(posts),
    });
  }

  return bad('Ação inválida.');
});
