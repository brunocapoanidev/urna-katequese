import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import './social.css';

const SOCIAL_CODE_KEY = 'jek-social-code-v1';
const SAVED_TITLE_KEY = 'jek-my-title-v1';
const THEME_KEY = 'jek-social-theme-v1';
const ACTIVE_TYPE_KEY = 'jek-social-active-type-v1';

const BANNER_PRESETS = [
  { label: 'Azul JEK', value: 'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)' },
  { label: 'Rubro Urgente', value: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)' },
  { label: 'Ouro Imperial', value: 'linear-gradient(135deg, #d97706 0%, #451a03 100%)' },
  { label: 'Esmeralda', value: 'linear-gradient(135deg, #15803d 0%, #052e16 100%)' },
  { label: 'Violeta', value: 'linear-gradient(135deg, #7e22ce 0%, #1e1b4b 100%)' },
  { label: 'Grafite X', value: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)' },
];

const BADGE_OPTIONS = [
  { id: 'gossip', label: 'Imprensa / Fofoca (Selo Rubro)', color: '#ef4444' },
  { id: 'campaign', label: 'QG de Campanha (Selo Ouro)', color: '#f59e0b' },
  { id: 'meme', label: 'Humor / Memes (Selo Roxo)', color: '#a855f7' },
  { id: 'none', label: 'Sem selo especial', color: '#71767b' },
];

const CAMPAIGN_MEDIA_PRESETS = [
  { label: 'Propostas 45 & 4569', url: '/candidates/bruno-propostas.jpg' },
  { label: 'Santinho Bruno 45 & Gregory', url: '/candidates/bruno-gregory.jpg' },
  { label: 'Santinho Bruno 45 & JP Cria', url: '/candidates/bruno-jpcria.jpg' },
  { label: 'Santinho Pedro Galli 38 & Tigas', url: '/candidates/pedro-galli.jpg' },
  { label: 'Santinho Pietro 10 & Kayo', url: '/candidates/pietro-spielmann.jpg' },
];

const STK_REASONS = [
  'Fake News / Desinformação Eleitoral comprovada pelo Plenário do STK',
  'Ataque às Instituições Democráticas da Katequese e à Urna JEK',
  'Promessa fraudulenta de Churrasco e Auxílio-Carvão sem lastro orçamentário',
  'Abuso de Poder Econômico, Político e Resenha Ilegal no Grupo',
  'Determinação de Ofício no Inquérito das Fake News da Katequese',
];

const Icon = {
  LogoX: ({ size = 28 }) => (
    <img
      src="/logo-kx.jpg"
      alt="Logo KateX"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="kx-logo-img"
    />
  ),
  Home: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-9.5z" />
    </svg>
  ),
  Explore: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Bell: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Flame: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  BadgeCheck: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
    </svg>
  ),
  Sun: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Moon: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  ArrowLeft: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  Search: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Image: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="3" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  ),
  Video: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="15" height="14" x="2" y="5" rx="2" />
      <path d="m17 10 5-3v10l-5-3v-4z" />
    </svg>
  ),
  Poll: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  ),
  Hash: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  ),
  Comment: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Repost: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Quote: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  ),
  Heart: ({ size = 17, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Share: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  ),
  Edit: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  ),
  Trash: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Settings: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Switch: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  ),
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Close: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Logout: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  Gavel: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  ),
};

function getInitialCode() {
  try {
    const savedCode = localStorage.getItem(SOCIAL_CODE_KEY);
    if (savedCode) return savedCode;
    const savedTitle = JSON.parse(localStorage.getItem(SAVED_TITLE_KEY) || 'null');
    return savedTitle?.code || '';
  } catch {
    return '';
  }
}

function timeAgo(iso) {
  const diff = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function compressImageFile(file, maxSize = 720, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AccountBadge({ profile }) {
  if (!profile) return null;
  const type = profile.badgeType === 'stk' ? 'stk' : profile.verified ? 'official' : profile.badgeType || 'none';
  if (type === 'none') return null;

  const badgeConfig = {
    stk: { color: '#fbbf24', label: 'Jurisdição Suprema · Superior Tribunal Katequesense (STK)' },
    official: { color: '#1d9bf0', label: 'Conta Oficial de Candidato · JEK 2026' },
    gossip: { color: '#ef4444', label: 'Portal / Página de Fofoca & Bastidores' },
    campaign: { color: '#f59e0b', label: 'QG / Página de Campanha' },
    meme: { color: '#a855f7', label: 'Página de Humor & Memes' },
  }[type] || { color: '#1d9bf0', label: 'Conta Verificada' };

  return (
    <span className="kx-verified" title={badgeConfig.label} aria-label={badgeConfig.label}>
      <svg viewBox="0 0 22 22" width="17" height="17" fill={badgeConfig.color}>
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
      </svg>
    </span>
  );
}

function ProfileAvatar({ profile, size = 'md', onClick }) {
  const hasImg = Boolean(profile?.avatar);
  const style = hasImg
    ? {
        backgroundImage: `url(${profile.avatar})`,
        backgroundPosition: `${profile.avatarPos || '50%'} center`,
        backgroundSize: profile.avatarSize || 'cover',
      }
    : undefined;
  const initials = (profile?.name || 'JK').slice(0, 2).toUpperCase();

  return (
    <div
      className={`kx-avatar kx-avatar-${size}${onClick ? ' is-clickable' : ''}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {!hasImg && <span>{initials}</span>}
    </div>
  );
}

function FormattedPostText({ text, onSelectHashtag, onSelectHandle }) {
  if (!text) return null;
  const parts = String(text || '').split(/(#[a-zA-Z0-9_À-ÿ]+|@[a-zA-Z0-9_]+)/g);
  return (
    <p className="kx-post-text">
      {parts.map((part, idx) => {
        if (part.startsWith('#')) {
          return (
            <button
              key={idx}
              type="button"
              className="kx-inline-tag"
              onClick={e => {
                e.stopPropagation();
                onSelectHashtag(part);
              }}
            >
              {part}
            </button>
          );
        }
        if (part.startsWith('@')) {
          return (
            <button
              key={idx}
              type="button"
              className="kx-inline-tag"
              onClick={e => {
                e.stopPropagation();
                onSelectHandle(part.slice(1));
              }}
            >
              {part}
            </button>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </p>
  );
}

export default function Social({ onBack, onGoTitulo }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [code, setCode] = useState(getInitialCode);
  const [loginInput, setLoginInput] = useState(getInitialCode);
  const [loginError, setLoginError] = useState('');
  const [myAccounts, setMyAccounts] = useState(null);
  const [activeType, setActiveType] = useState(() => localStorage.getItem(ACTIVE_TYPE_KEY) || 'primary');
  const [profiles, setProfiles] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'explore' | 'notifications' | 'profile'
  const [feedTab, setFeedTab] = useState('forYou'); // 'forYou' | 'officials' | 'hot'
  const [profileSubTab, setProfileSubTab] = useState('posts'); // 'posts' | 'reposts' | 'media'
  const [searchTag, setSearchTag] = useState('');
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [followModal, setFollowModal] = useState(null); // { profileId, mode: 'following' | 'followers' }
  const [stkModalPost, setStkModalPost] = useState(null);
  const [stkMode, setStkMode] = useState('remove'); // 'remove' | 'flag'
  const [stkReason, setStkReason] = useState(STK_REASONS[0]);
  const [stkMinisterName, setStkMinisterName] = useState('');
  const [stkFilter, setStkFilter] = useState('all'); // 'all' | 'removed' | 'flagged'
  const [editingProfileType, setEditingProfileType] = useState(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [postText, setPostText] = useState('');
  const [postMedia, setPostMedia] = useState('');
  const [postMediaKind, setPostMediaKind] = useState('image');
  const [quotedPostId, setQuotedPostId] = useState(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const sentinelRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const composerRef = useRef(null);

  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formBadgeType, setFormBadgeType] = useState('gossip');
  const [formAvatar, setFormAvatar] = useState('');
  const [formBanner, setFormBanner] = useState(BANNER_PRESETS[0].value);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_TYPE_KEY, activeType);
  }, [activeType]);

  const showNotice = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const loadFeed = useCallback(
    (authCode = code) => {
      const q = authCode ? `?code=${encodeURIComponent(authCode)}` : '';
      fetch(`/.netlify/functions/social${q}`)
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d.profiles)) setProfiles(d.profiles);
          if (Array.isArray(d.posts)) setPosts(d.posts);
          if (Array.isArray(d.trends)) setTrends(d.trends);
          if (d.myAccounts) setMyAccounts(d.myAccounts);
        })
        .catch(() => {});
    },
    [code],
  );

  useEffect(() => {
    loadFeed(code);
    const timer = setInterval(() => !document.hidden && loadFeed(code), 5000);
    return () => clearInterval(timer);
  }, [code, loadFeed]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount(c => c + 10);
        }
      },
      { rootMargin: '240px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [posts.length, viewMode, viewingProfileId, feedTab]);

  const profilesMap = useMemo(() => {
    const m = new Map();
    profiles.forEach(p => m.set(p.id, p));
    if (myAccounts?.primary) m.set(myAccounts.primary.id, myAccounts.primary);
    if (myAccounts?.secondary) m.set(myAccounts.secondary.id, myAccounts.secondary);
    return m;
  }, [profiles, myAccounts]);

  const postsMap = useMemo(() => {
    const m = new Map();
    posts.forEach(p => m.set(p.id, p));
    return m;
  }, [posts]);

  const activeProfile = useMemo(() => {
    if (!myAccounts) return null;
    if (activeType === 'secondary' && myAccounts.secondary) return myAccounts.secondary;
    return myAccounts.primary;
  }, [myAccounts, activeType]);

  // Mapa de Seguidores (quem segue cada perfil) e quem o perfil ativo segue
  const followersOfMap = useMemo(() => {
    const m = new Map();
    for (const p of profilesMap.values()) {
      m.set(p.id, []);
    }
    for (const p of profilesMap.values()) {
      for (const targetId of p.following || []) {
        if (!m.has(targetId)) m.set(targetId, []);
        m.get(targetId).push(p);
      }
    }
    return m;
  }, [profilesMap]);

  const myFollowingSet = useMemo(
    () => new Set(activeProfile?.following || []),
    [activeProfile],
  );

  async function handleToggleFollow(targetProfileId, e) {
    if (e) e.stopPropagation();
    if (!activeProfile || targetProfileId === activeProfile.id) return;
    try {
      const res = await api('social', {
        action: 'toggleFollow',
        code,
        profileId: activeProfile.id,
        targetProfileId,
      });
      if (Array.isArray(res.profiles)) setProfiles(res.profiles);
      if (res.myAccounts) setMyAccounts(res.myAccounts);
    } catch (err) {
      showNotice(err.message);
    }
  }

  // Central de Notificações (Menções, Respostas, Citações, Republicações e Curtidas)
  const notifications = useMemo(() => {
    if (!myAccounts) return [];
    const myIds = new Set([myAccounts.primary.id, myAccounts.secondary?.id].filter(Boolean));
    const myHandles = [
      myAccounts.primary.handle?.toLowerCase(),
      myAccounts.secondary?.handle?.toLowerCase(),
    ].filter(Boolean);

    const items = [];

    for (const post of posts) {
      const isMyPost = myIds.has(post.authorId);
      const postAuthor = profilesMap.get(post.authorId);

      // Menções ao @ do usuário em posts de terceiros
      if (!isMyPost && post.text) {
        const lower = post.text.toLowerCase();
        if (myHandles.some(h => lower.includes(`@${h}`))) {
          items.push({
            id: `men-${post.id}`,
            type: 'mention',
            actor: postAuthor,
            text: `mencionou você: "${post.text.slice(0, 90)}"`,
            createdAt: post.createdAt,
            postId: post.id,
          });
        }
      }

      // Quote post citando um post meu
      if (!isMyPost && post.quotedPostId) {
        const qPost = postsMap.get(post.quotedPostId);
        if (qPost && myIds.has(qPost.authorId)) {
          items.push({
            id: `quo-${post.id}`,
            type: 'quote',
            actor: postAuthor,
            text: `citou sua publicação: "${post.text.slice(0, 90)}"`,
            createdAt: post.createdAt,
            postId: post.id,
          });
        }
      }

      // Comentários em posts meus (ou menções nos comentários)
      for (const c of post.comments || []) {
        const cAuthor = profilesMap.get(c.authorId);
        if (!myIds.has(c.authorId)) {
          const cLower = String(c.text || '').toLowerCase();
          if (isMyPost) {
            items.push({
              id: `com-${c.id}`,
              type: 'comment',
              actor: cAuthor,
              text: `respondeu sua publicação: "${c.text.slice(0, 90)}"`,
              createdAt: c.createdAt,
              postId: post.id,
            });
          } else if (myHandles.some(h => cLower.includes(`@${h}`))) {
            items.push({
              id: `cmen-${c.id}`,
              type: 'mention',
              actor: cAuthor,
              text: `mencionou você em um comentário: "${c.text.slice(0, 90)}"`,
              createdAt: c.createdAt,
              postId: post.id,
            });
          }
        }
      }

      // Curtidas e Republicações nos meus posts
      if (isMyPost) {
        for (const repId of post.reposts || []) {
          if (!myIds.has(repId)) {
            items.push({
              id: `rep-${post.id}-${repId}`,
              type: 'repost',
              actor: profilesMap.get(repId),
              text: `republicou sua publicação: "${(post.text || 'Mídia').slice(0, 70)}"`,
              createdAt: post.createdAt,
              postId: post.id,
            });
          }
        }
        for (const likeId of post.likes || []) {
          if (!myIds.has(likeId)) {
            items.push({
              id: `lik-${post.id}-${likeId}`,
              type: 'like',
              actor: profilesMap.get(likeId),
              text: `curtiu sua publicação: "${(post.text || 'Mídia').slice(0, 70)}"`,
              createdAt: post.createdAt,
              postId: post.id,
            });
          }
        }
      }
    }

    // Notificações de novos seguidores
    for (const p of profilesMap.values()) {
      if (!myIds.has(p.id)) {
        for (const fId of p.following || []) {
          if (myIds.has(fId)) {
            const targetAcc = profilesMap.get(fId);
            items.push({
              id: `fol-${p.id}-${fId}`,
              type: 'follow',
              actor: p,
              text: `começou a seguir @${targetAcc?.handle || fId}`,
              createdAt: p.createdAt || new Date().toISOString(),
              profileId: p.id,
            });
          }
        }
      }
    }

    return items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [posts, myAccounts, profilesMap, postsMap]);

  function openUserProfile(profileId) {
    setViewingProfileId(profileId);
    setProfileSubTab('posts');
    setViewMode('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true);
    setLoginError('');
    try {
      const res = await api('social', { action: 'auth', code: loginInput });
      localStorage.setItem(SOCIAL_CODE_KEY, loginInput.trim());
      setCode(loginInput.trim());
      setMyAccounts(res.myAccounts);
      loadFeed(loginInput.trim());
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleLogoutAccount() {
    localStorage.removeItem(SOCIAL_CODE_KEY);
    setMyAccounts(null);
    setCode('');
    setLoginInput('');
    setViewingProfileId(null);
    setViewMode('feed');
  }

  function openProfileEditor(type) {
    const target = type === 'secondary' ? myAccounts?.secondary : myAccounts?.primary;
    setEditingProfileType(type);
    setFormName(target?.name || '');
    setFormHandle(target?.handle || '');
    setFormBio(target?.bio || '');
    setFormRole(target?.roleLabel || (type === 'secondary' ? 'Portal de Fofocas & Bastidores' : 'Eleitor(a) JEK'));
    setFormBadgeType(target?.badgeType && target.badgeType !== 'none' ? target.badgeType : 'gossip');
    setFormAvatar(target?.avatar || '');
    setFormBanner(target?.banner || BANNER_PRESETS[type === 'secondary' ? 1 : 0].value);
    setFormError('');
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const res = await api('social', {
        action: 'saveProfile',
        code,
        profileType: editingProfileType,
        name: formName,
        handle: formHandle,
        bio: formBio,
        roleLabel: formRole,
        badgeType: formBadgeType,
        avatar: formAvatar,
        banner: formBanner,
      });
      if (Array.isArray(res.profiles)) setProfiles(res.profiles);
      setMyAccounts(res.myAccounts);
      setActiveType(editingProfileType);
      setEditingProfileType(null);
      showNotice('Perfil atualizado!');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish(e) {
    e.preventDefault();
    const validPollOpts = showPollCreator
      ? pollOptions.map(o => o.trim()).filter(Boolean)
      : [];
    if (
      !activeProfile ||
      (!postText.trim() && !postMedia.trim() && !quotedPostId && validPollOpts.length < 2)
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await api('social', {
        action: 'createPost',
        code,
        profileId: activeProfile.id,
        text: postText,
        mediaUrl: postMedia,
        mediaKind: postMediaKind,
        quotedPostId,
        pollOptions: validPollOpts.length >= 2 ? validPollOpts : undefined,
      });
      setPosts(res.posts);
      setTrends(res.trends);
      setPostText('');
      setPostMedia('');
      setQuotedPostId(null);
      setShowPollCreator(false);
      setPollOptions(['', '']);
      setShowMediaPicker(false);
      showNotice('Publicação enviada!');
    } catch (err) {
      showNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVotePoll(postId, optionId) {
    try {
      const res = await api('social', {
        action: 'votePoll',
        code,
        postId,
        optionId,
      });
      setPosts(res.posts);
    } catch (err) {
      showNotice(err.message);
    }
  }

  function handleStartQuote(postId) {
    setQuotedPostId(postId);
    setViewMode('feed');
    setViewingProfileId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => composerRef.current?.focus(), 120);
  }

  async function handleSaveEditedPost(e, postId) {
    e.preventDefault();
    if (!editingPostText.trim()) return;
    setBusy(true);
    try {
      const res = await api('social', {
        action: 'editPost',
        code,
        postId,
        text: editingPostText,
      });
      setPosts(res.posts);
      setTrends(res.trends);
      setEditingPostId(null);
      setEditingPostText('');
      showNotice('Publicação atualizada!');
    } catch (err) {
      showNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReact(postId, reaction) {
    if (!activeProfile) return;
    try {
      const res = await api('social', {
        action: 'react',
        code,
        profileId: activeProfile.id,
        postId,
        reaction,
      });
      setPosts(res.posts);
    } catch (err) {
      showNotice(err.message);
    }
  }

  async function handleAddComment(e, postId) {
    e.preventDefault();
    if (!activeProfile || !commentDraft.trim()) return;
    setBusy(true);
    try {
      const res = await api('social', {
        action: 'comment',
        code,
        profileId: activeProfile.id,
        postId,
        text: commentDraft,
      });
      setPosts(res.posts);
      setTrends(res.trends);
      setCommentDraft('');
    } catch (err) {
      showNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteComment(postId, commentId) {
    try {
      const res = await api('social', {
        action: 'deleteComment',
        code,
        postId,
        commentId,
      });
      setPosts(res.posts);
      setTrends(res.trends);
    } catch (err) {
      showNotice(err.message);
    }
  }

  async function handleDeletePost(postId) {
    try {
      const res = await api('social', {
        action: 'deletePost',
        code,
        postId,
      });
      setPosts(res.posts);
      setTrends(res.trends);
      showNotice('Publicação excluída.');
    } catch (err) {
      showNotice(err.message);
    }
  }

  function openStkModal(post) {
    setStkModalPost(post);
    setStkMode(post.stkAction?.status === 'flagged' ? 'flag' : 'remove');
    setStkReason(post.stkAction?.reason || STK_REASONS[0]);
    setStkMinisterName(post.stkAction?.ministerName || myAccounts?.primary?.name || 'Ministro Relator');
  }

  async function handleStkModerate(e) {
    e.preventDefault();
    if (!stkModalPost) return;
    setBusy(true);
    try {
      const res = await api('social', {
        action: 'stkModerate',
        code,
        postId: stkModalPost.id,
        mode: stkMode,
        reason: stkReason,
        ministerName: stkMinisterName,
      });
      setPosts(res.posts);
      setTrends(res.trends);
      setStkModalPost(null);
      showNotice(
        stkMode === 'remove'
          ? '⚖️ Publicação removida por ordem do STK!'
          : '⚖️ Publicação marcada com alerta do STK!',
      );
    } catch (err) {
      showNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStkRestore(postId) {
    setBusy(true);
    try {
      const res = await api('social', {
        action: 'stkModerate',
        code,
        postId,
        mode: 'restore',
      });
      setPosts(res.posts);
      setTrends(res.trends);
      if (stkModalPost?.id === postId) setStkModalPost(null);
      showNotice('⚖️ Publicação devolvida / restaurada pelo STK!');
    } catch (err) {
      showNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUploadImage(e, targetSetter) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setPostMediaKind('image');
      targetSetter(dataUrl);
    } catch {
      showNotice('Não foi possível carregar a imagem.');
    }
  }

  function handleUploadVideo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 450 * 1024) {
      showNotice('Para vídeos maiores que 450KB, use a opção Link de Vídeo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setPostMediaKind('video');
      setPostMedia(String(ev.target?.result || ''));
    };
    reader.readAsDataURL(file);
  }

  function handleSelectHandle(handleText) {
    const match = [...profilesMap.values()].find(
      p => p.handle?.toLowerCase() === handleText.toLowerCase(),
    );
    if (match) {
      openUserProfile(match.id);
    }
  }

  function sharePostOnWhatsApp(post, author) {
    const msg = `*@${author?.handle || 'eleitor'} (${author?.name || 'Eleitor'}) no KateX:*\n\n"${post.text}"`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  }

  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (viewMode === 'profile' && viewingProfileId) {
      if (profileSubTab === 'reposts') {
        return list.filter(
          p =>
            (p.reposts || []).includes(viewingProfileId) ||
            (p.authorId === viewingProfileId && p.quotedPostId),
        );
      }
      if (profileSubTab === 'media') {
        return list.filter(p => p.authorId === viewingProfileId && Boolean(p.mediaUrl));
      }
      return list.filter(p => p.authorId === viewingProfileId);
    }

    if (searchTag.trim()) {
      const q = searchTag.trim().toLowerCase();
      list = list.filter(p => {
        const author = profilesMap.get(p.authorId);
        return (
          String(p.text || '').toLowerCase().includes(q) ||
          author?.name?.toLowerCase().includes(q) ||
          author?.handle?.toLowerCase().includes(q)
        );
      });
    }

    if (feedTab === 'following') {
      list = list.filter(
        p =>
          myFollowingSet.has(p.authorId) ||
          (p.reposts || []).some(repId => myFollowingSet.has(repId)),
      );
    } else if (feedTab === 'officials') {
      list = list.filter(p => profilesMap.get(p.authorId)?.verified);
    } else if (feedTab === 'hot') {
      list.sort((a, b) => {
        const scoreA =
          (a.likes?.length || 0) +
          (a.reposts?.length || 0) * 2 +
          (a.comments?.length || 0) * 2;
        const scoreB =
          (b.likes?.length || 0) +
          (b.reposts?.length || 0) * 2 +
          (b.comments?.length || 0) * 2;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [posts, viewMode, viewingProfileId, profileSubTab, searchTag, feedTab, profilesMap, myFollowingSet]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const viewingProfile = viewingProfileId ? profilesMap.get(viewingProfileId) : null;
  const quotedPostObj = quotedPostId ? postsMap.get(quotedPostId) : null;

  const verifiedCandidates = useMemo(
    () => [...profilesMap.values()].filter(p => p.verified),
    [profilesMap],
  );
  const secondaryPages = useMemo(
    () => [...profilesMap.values()].filter(p => p.type === 'secondary'),
    [profilesMap],
  );
  const regularVoters = useMemo(
    () => [...profilesMap.values()].filter(p => p.type === 'primary' && !p.verified),
    [profilesMap],
  );
  const stkModeratedPosts = useMemo(
    () => posts.filter(p => Boolean(p.stkAction)),
    [posts],
  );

  if (!myAccounts) {
    return (
      <div className={`kx-root kx-${theme}`}>
        <main className="kx-login-screen">
          <div className="kx-login-card">
            <div className="kx-login-head">
              <div className="kx-logo-mark">
                <Icon.LogoX size={28} />
              </div>
              <button type="button" className="kx-top-back" onClick={onBack}>
                <Icon.ArrowLeft size={15} />
                <span>Voltar ao site</span>
              </button>
            </div>
            <span className="kx-kicker">Rede Social Oficial · Eleições JEK 2026</span>
            <h1>Acontecendo agora na Katequese</h1>
            <p>
              Para acessar e publicar na Rede Social, você precisa ter emitido seu{' '}
              <b>Título Katequista</b>. Digite abaixo o seu <b>código único de 8 caracteres</b>:
            </p>

            <form onSubmit={handleLogin} className="kx-login-form">
              <label>
                Código Único do seu Título JEK
                <input
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="Ex.: XXXX-XXXX"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                  required
                />
              </label>
              {loginError && <p className="kx-error" role="alert">{loginError}</p>}
              <button type="submit" className="kx-btn-primary" disabled={busy}>
                {busy ? 'Verificando Título...' : 'Entrar na Rede Social'}
              </button>
            </form>

            <div className="kx-login-footer">
              <span>Ainda não emitiu seu Título Katequista?</span>
              <button type="button" className="kx-link-btn" onClick={onGoTitulo}>
                Emitir meu Título JEK primeiro →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const canSubmitPost =
    Boolean(postText.trim()) ||
    Boolean(postMedia.trim()) ||
    Boolean(quotedPostId) ||
    (showPollCreator && pollOptions.filter(o => o.trim()).length >= 2);

  return (
    <div className={`kx-root kx-${theme}`}>
      {toast && <div className="kx-toast" role="status">{toast}</div>}

      {/* Modal de Despacho Judicial do STK (Superior Tribunal Katequesense) */}
      {stkModalPost && myAccounts?.isStk && (
        <div className="kx-modal-backdrop" onClick={() => setStkModalPost(null)}>
          <form
            className="kx-modal kx-stk-modal"
            onClick={e => e.stopPropagation()}
            onSubmit={handleStkModerate}
          >
            <header className="kx-modal-head">
              <div>
                <span className="kx-kicker" style={{ color: '#fbbf24' }}>
                  ⚖️ Jurisdição Suprema · Superior Tribunal Katequesense
                </span>
                <h3>Despacho Judicial sobre Publicação</h3>
              </div>
              <button type="button" className="kx-icon-btn" onClick={() => setStkModalPost(null)}>
                <Icon.Close size={18} />
              </button>
            </header>

            <div className="kx-quoted-card">
              <div className="kx-quoted-head">
                <strong>{profilesMap.get(stkModalPost.authorId)?.name}</strong>
                <span className="kx-handle">
                  @{profilesMap.get(stkModalPost.authorId)?.handle}
                </span>
              </div>
              <p>{stkModalPost.text || '(Publicação com mídia / enquete)'}</p>
            </div>

            <div className="kx-field">
              <span>Tipo de Decisão do STK</span>
              <div className="kx-badge-selector">
                <button
                  type="button"
                  className={`kx-badge-opt${stkMode === 'remove' ? ' is-active' : ''}`}
                  onClick={() => setStkMode('remove')}
                >
                  <i style={{ backgroundColor: '#ef4444' }} />
                  <span>Remover Publicação (Tarja Judicial)</span>
                </button>
                <button
                  type="button"
                  className={`kx-badge-opt${stkMode === 'flag' ? ' is-active' : ''}`}
                  onClick={() => setStkMode('flag')}
                >
                  <i style={{ backgroundColor: '#fbbf24' }} />
                  <span>Marcar Publicação (Alerta do STK)</span>
                </button>
              </div>
            </div>

            <label className="kx-field">
              <span>Nome do Ministro Relator (Ex.mo)</span>
              <input
                value={stkMinisterName}
                onChange={e => setStkMinisterName(e.target.value)}
                placeholder="Ex.: Min. Alexandre de Katequese"
                maxLength={50}
                required
              />
            </label>

            <div className="kx-field">
              <span>Motivos Pré-definidos do Código Eleitoral Katequista (clique para usar)</span>
              <div className="kx-preset-chips">
                {STK_REASONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setStkReason(r)}
                    style={
                      stkReason === r
                        ? { borderColor: '#fbbf24', color: '#fbbf24' }
                        : undefined
                    }
                  >
                    ⚖️ {r.slice(0, 42)}…
                  </button>
                ))}
              </div>
            </div>

            <label className="kx-field">
              <span>Fundamentação / Motivo da Decisão (aparecerá no aviso oficial)</span>
              <textarea
                rows={3}
                value={stkReason}
                onChange={e => setStkReason(e.target.value)}
                placeholder="Descreva o motivo da remoção ou alerta pelo STK..."
                maxLength={240}
                required
              />
            </label>

            <div className="kx-modal-actions" style={{ justifyContent: 'space-between' }}>
              {stkModalPost.stkAction ? (
                <button
                  type="button"
                  className="kx-btn-outline"
                  onClick={() => handleStkRestore(stkModalPost.id)}
                  disabled={busy}
                >
                  ↩️ Devolver / Restaurar Postagem
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="kx-btn-ghost"
                  onClick={() => setStkModalPost(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="kx-btn-primary kx-stk-submit" disabled={busy}>
                  {busy
                    ? 'Assinando...'
                    : stkMode === 'remove'
                      ? '⚖️ Ordenar Remoção pelo STK'
                      : '⚖️ Aplicar Alerta do STK'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Lista de Seguindo / Seguidores */}
      {followModal && (
        <div className="kx-modal-backdrop" onClick={() => setFollowModal(null)}>
          <div className="kx-modal" onClick={e => e.stopPropagation()}>
            <header className="kx-modal-head">
              <div>
                <span className="kx-kicker">
                  @{profilesMap.get(followModal.profileId)?.handle}
                </span>
                <h3>
                  {followModal.mode === 'following' ? 'Seguindo' : 'Seguidores'}
                </h3>
              </div>
              <button type="button" className="kx-icon-btn" onClick={() => setFollowModal(null)}>
                <Icon.Close size={18} />
              </button>
            </header>

            <div className="kx-feed-tabs" style={{ position: 'static' }}>
              <button
                type="button"
                className={`kx-feed-tab${followModal.mode === 'following' ? ' is-active' : ''}`}
                onClick={() => setFollowModal({ ...followModal, mode: 'following' })}
              >
                <span>
                  Seguindo ({(profilesMap.get(followModal.profileId)?.following || []).length})
                </span>
              </button>
              <button
                type="button"
                className={`kx-feed-tab${followModal.mode === 'followers' ? ' is-active' : ''}`}
                onClick={() => setFollowModal({ ...followModal, mode: 'followers' })}
              >
                <span>
                  Seguidores ({(followersOfMap.get(followModal.profileId) || []).length})
                </span>
              </button>
            </div>

            <div className="kx-follow-modal-list">
              {(() => {
                const targetProf = profilesMap.get(followModal.profileId);
                const list =
                  followModal.mode === 'following'
                    ? (targetProf?.following || [])
                        .map(id => profilesMap.get(id))
                        .filter(Boolean)
                    : followersOfMap.get(followModal.profileId) || [];

                if (list.length === 0) {
                  return (
                    <p className="kx-widget-empty" style={{ textAlign: 'center', padding: 24 }}>
                      {followModal.mode === 'following'
                        ? 'Este perfil ainda não segue ninguém.'
                        : 'Este perfil ainda não possui seguidores.'}
                    </p>
                  );
                }

                return list.map(u => {
                  const isMe = u.id === activeProfile?.id;
                  const iFollow = myFollowingSet.has(u.id);
                  return (
                    <div
                      key={u.id}
                      className="kx-who-item"
                      onClick={() => {
                        setFollowModal(null);
                        openUserProfile(u.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <ProfileAvatar profile={u} size="md" />
                      <div className="kx-who-meta" style={{ flex: 1 }}>
                        <strong>
                          {u.name}
                          <AccountBadge profile={u} />
                        </strong>
                        <span>@{u.handle}</span>
                        {u.roleLabel && <small>{u.roleLabel}</small>}
                      </div>
                      {!isMe && (
                        <button
                          type="button"
                          className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                          onClick={e => handleToggleFollow(u.id, e)}
                        >
                          {iFollow ? 'Seguindo' : 'Seguir'}
                        </button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição / Criação de Perfil */}
      {editingProfileType && (
        <div className="kx-modal-backdrop" onClick={() => setEditingProfileType(null)}>
          <form
            className="kx-modal"
            onClick={e => e.stopPropagation()}
            onSubmit={handleSaveProfile}
          >
            <header className="kx-modal-head">
              <div>
                <span className="kx-kicker">
                  {editingProfileType === 'secondary'
                    ? '2ª Conta Livre (Fofoca / QG / Memes)'
                    : 'Perfil Principal (Vinculado ao Título JEK)'}
                </span>
                <h3>
                  {editingProfileType === 'secondary' && !myAccounts.secondary
                    ? 'Criar sua 2ª Conta'
                    : 'Editar Perfil'}
                </h3>
              </div>
              <button type="button" className="kx-icon-btn" onClick={() => setEditingProfileType(null)}>
                <Icon.Close size={18} />
              </button>
            </header>

            <div className="kx-modal-banner-preview" style={{ background: formBanner }}>
              <div className="kx-modal-avatar-wrap">
                <ProfileAvatar
                  profile={{ name: formName || 'JK', avatar: formAvatar }}
                  size="lg"
                />
                <label className="kx-upload-pill">
                  <Icon.Image size={15} />
                  <span>Enviar Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => handleUploadImage(e, setFormAvatar)}
                  />
                </label>
              </div>
            </div>

            <div className="kx-banner-picker">
              <span>Cor da Capa:</span>
              <div className="kx-banner-swatches">
                {BANNER_PRESETS.map(b => (
                  <button
                    key={b.label}
                    type="button"
                    className={`kx-swatch${formBanner === b.value ? ' is-active' : ''}`}
                    style={{ background: b.value }}
                    onClick={() => setFormBanner(b.value)}
                    title={b.label}
                  />
                ))}
              </div>
            </div>

            <label className="kx-field">
              <span>Nome de Exibição</span>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Ex.: Choquei da Katequese ou QG do 45"
                maxLength={40}
                required
              />
            </label>

            <label className="kx-field">
              <span>Nome de usuário (@handle)</span>
              <input
                value={formHandle}
                onChange={e => setFormHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="Ex.: choqueikatequese"
                maxLength={22}
                required
              />
            </label>

            {editingProfileType === 'secondary' && (
              <div className="kx-field">
                <span>Selo Especial da 2ª Conta</span>
                <div className="kx-badge-selector">
                  {BADGE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`kx-badge-opt${formBadgeType === opt.id ? ' is-active' : ''}`}
                      onClick={() => setFormBadgeType(opt.id)}
                    >
                      <i style={{ backgroundColor: opt.color }} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="kx-field">
              <span>Categoria / Rótulo do Perfil</span>
              <input
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                placeholder="Ex.: Portal de Fofocas · Apoio Chapa 38"
                maxLength={40}
              />
            </label>

            <label className="kx-field">
              <span>Bio</span>
              <textarea
                rows={3}
                value={formBio}
                onChange={e => setFormBio(e.target.value)}
                placeholder="Escreva a bio do seu perfil..."
                maxLength={180}
              />
            </label>

            {formError && <p className="kx-error">{formError}</p>}

            <div className="kx-modal-actions">
              <button type="button" className="kx-btn-ghost" onClick={() => setEditingProfileType(null)}>
                Cancelar
              </button>
              <button type="submit" className="kx-btn-primary" disabled={busy}>
                {busy ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kx-shell">
        {/* COLUNA ESQUERDA */}
        <aside className="kx-left-rail">
          <div className="kx-rail-top">
            <div className="kx-brand-row">
              <button
                type="button"
                className="kx-logo-btn"
                onClick={() => {
                  setViewMode('feed');
                  setViewingProfileId(null);
                  setSearchTag('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="kx-logo-mark">
                  <Icon.LogoX size={28} />
                </span>
                <div className="kx-logo-text">
                  <strong>KATEX</strong>
                  <small>Rede Oficial JEK</small>
                </div>
              </button>
            </div>

            <nav className="kx-nav">
              <button
                type="button"
                className={`kx-nav-item${viewMode === 'feed' && !searchTag ? ' is-active' : ''}`}
                onClick={() => {
                  setViewMode('feed');
                  setViewingProfileId(null);
                  setSearchTag('');
                }}
              >
                <span className="kx-nav-icon"><Icon.Home /></span>
                <span>Página Inicial</span>
              </button>

              <button
                type="button"
                className={`kx-nav-item${viewMode === 'explore' ? ' is-active' : ''}`}
                onClick={() => {
                  setViewMode('explore');
                  setViewingProfileId(null);
                }}
              >
                <span className="kx-nav-icon"><Icon.Explore /></span>
                <span>Explorar & Trends</span>
              </button>

              <button
                type="button"
                className={`kx-nav-item${viewMode === 'notifications' ? ' is-active' : ''}`}
                onClick={() => {
                  setViewMode('notifications');
                  setViewingProfileId(null);
                }}
              >
                <span className="kx-nav-icon"><Icon.Bell /></span>
                <span>Notificações</span>
                {notifications.length > 0 && (
                  <span className="kx-notif-pill">{notifications.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`kx-nav-item${viewMode === 'profile' && viewingProfileId === activeProfile?.id ? ' is-active' : ''}`}
                onClick={() => openUserProfile(activeProfile?.id)}
              >
                <span className="kx-nav-icon"><Icon.User /></span>
                <span>Meu Perfil</span>
              </button>

              {myAccounts.isStk && (
                <button
                  type="button"
                  className={`kx-nav-item kx-nav-stk${viewMode === 'stk' ? ' is-active' : ''}`}
                  onClick={() => {
                    setViewMode('stk');
                    setViewingProfileId(null);
                  }}
                >
                  <span className="kx-nav-icon"><Icon.Gavel /></span>
                  <span>Plenário STK</span>
                  {stkModeratedPosts.length > 0 && (
                    <span className="kx-notif-pill" style={{ background: '#d97706' }}>
                      {stkModeratedPosts.length}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                className="kx-nav-item"
                onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
              >
                <span className="kx-nav-icon">{theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}</span>
                <span>Modo {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
              </button>

              <button type="button" className="kx-nav-item" onClick={onBack}>
                <span className="kx-nav-icon"><Icon.ArrowLeft /></span>
                <span>Voltar às Eleições</span>
              </button>

              <button type="button" className="kx-nav-item" onClick={handleLogoutAccount}>
                <span className="kx-nav-icon"><Icon.Logout /></span>
                <span>Trocar Código</span>
              </button>
            </nav>
          </div>

          {/* Caixa de Dupla Conta */}
          <div className="kx-accounts-box">
            <span className="kx-accounts-title">Suas Contas (2 Perfis)</span>

            <div
              className={`kx-account-pill${activeType === 'primary' ? ' is-active' : ''}`}
              onClick={() => setActiveType('primary')}
              role="button"
              tabIndex={0}
            >
              <ProfileAvatar profile={myAccounts.primary} size="sm" />
              <div className="kx-account-meta">
                <strong>
                  {myAccounts.primary.name}
                  <AccountBadge profile={myAccounts.primary} />
                </strong>
                <span>@{myAccounts.primary.handle} · Principal</span>
              </div>
              <button
                type="button"
                className="kx-mini-edit"
                onClick={e => {
                  e.stopPropagation();
                  openProfileEditor('primary');
                }}
                title="Editar Perfil Principal"
              >
                <Icon.Settings size={15} />
              </button>
            </div>

            {myAccounts.secondary ? (
              <div
                className={`kx-account-pill${activeType === 'secondary' ? ' is-active' : ''}`}
                onClick={() => setActiveType('secondary')}
                role="button"
                tabIndex={0}
              >
                <ProfileAvatar profile={myAccounts.secondary} size="sm" />
                <div className="kx-account-meta">
                  <strong>
                    {myAccounts.secondary.name}
                    <AccountBadge profile={myAccounts.secondary} />
                  </strong>
                  <span>@{myAccounts.secondary.handle} · 2ª Conta</span>
                </div>
                <button
                  type="button"
                  className="kx-mini-edit"
                  onClick={e => {
                    e.stopPropagation();
                    openProfileEditor('secondary');
                  }}
                  title="Editar 2ª Conta"
                >
                  <Icon.Settings size={15} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="kx-create-alt-btn"
                onClick={() => openProfileEditor('secondary')}
              >
                <Icon.Plus size={14} />
                <span>Criar 2ª Conta (Página Livre)</span>
              </button>
            )}
          </div>
        </aside>

        {/* COLUNA CENTRAL */}
        <main className="kx-center-col">
          <div className="kx-mobile-top">
            <button type="button" className="kx-icon-btn" onClick={onBack} title="Voltar às eleições">
              <Icon.ArrowLeft size={18} />
            </button>
            <div className="kx-mobile-brand">
              <Icon.LogoX size={22} />
              <strong>KATEX</strong>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {myAccounts.isStk && (
                <button
                  type="button"
                  className="kx-icon-btn"
                  style={{ color: '#fbbf24' }}
                  onClick={() => {
                    setViewMode('stk');
                    setViewingProfileId(null);
                  }}
                  title="Plenário do STK"
                >
                  <Icon.Gavel size={18} />
                </button>
              )}
              <button
                type="button"
                className="kx-icon-btn"
                onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
                title="Alternar tema"
              >
                {theme === 'dark' ? <Icon.Sun size={18} /> : <Icon.Moon size={18} />}
              </button>
            </div>
          </div>

          {/* MODO ESPECIAL: PLENÁRIO DO STK (Gestão de Postagens Removidas e Marcadas) */}
          {viewMode === 'stk' && myAccounts.isStk && (
            <section className="kx-stk-plenario">
              <header className="kx-profile-top-bar">
                <div>
                  <h2>⚖️ Plenário do Superior Tribunal Katequesense</h2>
                  <small>
                    Jurisdição Suprema · Gerencie as postagens removidas ou marcadas pelo STK
                  </small>
                </div>
              </header>

              <div className="kx-stk-accounts-bar">
                <div>
                  <span className="kx-kicker" style={{ color: '#fbbf24' }}>
                    Perfis da Magistratura (Clique para configurar)
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      className="kx-btn-outline"
                      onClick={() => openProfileEditor('primary')}
                    >
                      ⚙️ Perfil Pessoal: {myAccounts.primary.name} (@{myAccounts.primary.handle})
                    </button>
                    <button
                      type="button"
                      className="kx-btn-outline"
                      onClick={() => openProfileEditor('secondary')}
                    >
                      ⚙️ Perfil da Corte: {myAccounts.secondary?.name} (@
                      {myAccounts.secondary?.handle})
                    </button>
                  </div>
                </div>
              </div>

              <div className="kx-feed-tabs" style={{ position: 'static' }}>
                <button
                  type="button"
                  className={`kx-feed-tab${stkFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setStkFilter('all')}
                >
                  <span>Todos os Autos ({stkModeratedPosts.length})</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${stkFilter === 'removed' ? ' is-active' : ''}`}
                  onClick={() => setStkFilter('removed')}
                >
                  <span>
                    Removidas (
                    {stkModeratedPosts.filter(p => p.stkAction?.status === 'removed').length})
                  </span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${stkFilter === 'flagged' ? ' is-active' : ''}`}
                  onClick={() => setStkFilter('flagged')}
                >
                  <span>
                    Marcadas (
                    {stkModeratedPosts.filter(p => p.stkAction?.status === 'flagged').length})
                  </span>
                </button>
              </div>

              <div className="kx-feed">
                {(() => {
                  const list = stkModeratedPosts.filter(p =>
                    stkFilter === 'all' ? true : p.stkAction?.status === stkFilter,
                  );
                  if (list.length === 0) {
                    return (
                      <div className="kx-empty-feed">
                        <div className="kx-empty-icon" style={{ color: '#fbbf24' }}>
                          <Icon.Gavel size={26} />
                        </div>
                        <h3>Nenhum processo nos autos desta aba</h3>
                        <p>
                          Vá ao Feed e clique no ícone do martelo (<b>⚖️ STK</b>) em qualquer
                          publicação para marcar com aviso ou remover por ordem judicial!
                        </p>
                      </div>
                    );
                  }
                  return list.map(p => {
                    const pAuthor = profilesMap.get(p.authorId);
                    const isRemoved = p.stkAction?.status === 'removed';
                    return (
                      <article key={p.id} className="kx-post">
                        <div className="kx-post-row">
                          <ProfileAvatar
                            profile={pAuthor}
                            size="md"
                            onClick={() => openUserProfile(p.authorId)}
                          />
                          <div className="kx-post-body">
                            <header className="kx-post-head">
                              <strong>{pAuthor?.name || p.authorId}</strong>
                              <span className="kx-handle">@{pAuthor?.handle || p.authorId}</span>
                              <span className="kx-dot">·</span>
                              <time className="kx-time">{timeAgo(p.createdAt)}</time>
                              <span
                                className="kx-post-role"
                                style={{
                                  background: isRemoved
                                    ? 'rgba(239,68,68,0.2)'
                                    : 'rgba(245,158,11,0.2)',
                                  color: isRemoved ? '#f87171' : '#fbbf24',
                                }}
                              >
                                {isRemoved ? '🚫 REMOVIDA PELO STK' : '⚠️ MARCADA PELO STK'}
                              </span>
                            </header>

                            <div className="kx-stk-secret-box">
                              <small>Conteúdo original nos autos do STK:</small>
                              <p>{p.text || '(Mídia / Enquete)'}</p>
                            </div>

                            <div
                              className={
                                isRemoved ? 'kx-stk-removed-banner' : 'kx-stk-flagged-banner'
                              }
                            >
                              <strong>
                                {isRemoved
                                  ? '⚖️ ORDEM JUDICIAL DE REMOÇÃO'
                                  : '⚠️ AVISO OFICIAL DO STK'}
                              </strong>
                              <p>
                                {isRemoved
                                  ? `Removida pelo STK por ordem do Ex.mo ${p.stkAction.ministerName}, pelo motivo: ${p.stkAction.reason}`
                                  : `O STK está marcando esta publicação por ordem do Ex.mo ${p.stkAction.ministerName}, pelo motivo: ${p.stkAction.reason}`}
                              </p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                              <button
                                type="button"
                                className="kx-btn-outline"
                                onClick={() => handleStkRestore(p.id)}
                                disabled={busy}
                              >
                                ↩️ Devolver / Restaurar ao Feed
                              </button>
                              <button
                                type="button"
                                className="kx-btn-outline"
                                onClick={() => openStkModal(p)}
                              >
                                ⚖️ Alterar Despacho / Motivo
                              </button>
                              <button
                                type="button"
                                className="kx-btn-outline"
                                style={{ color: '#f4212e', borderColor: 'rgba(244,33,46,0.4)' }}
                                onClick={() => handleDeletePost(p.id)}
                              >
                                Excluir Definitivamente
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  });
                })()}
              </div>
            </section>
          )}

          {/* MODO 1: EXPLORAR & TRENDING TOPICS (Funciona no Mobile e no Desktop!) */}
          {viewMode === 'explore' && (
            <section className="kx-explore-view">
              <div className="kx-explore-head">
                <div className="kx-search-box">
                  <Icon.Search />
                  <input
                    value={searchTag}
                    onChange={e => setSearchTag(e.target.value)}
                    placeholder="Buscar publicações, @usuarios ou #hashtags..."
                  />
                  {searchTag && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTag('');
                      }}
                    >
                      <Icon.Close size={14} />
                    </button>
                  )}
                </div>
                {searchTag && (
                  <button
                    type="button"
                    className="kx-btn-primary"
                    style={{ marginTop: 10, width: '100%' }}
                    onClick={() => setViewMode('feed')}
                  >
                    Ver publicações com &ldquo;{searchTag}&rdquo; no Feed →
                  </button>
                )}
              </div>

              <div className="kx-explore-block">
                <h3>Trending Topics · O que está em alta</h3>
                {trends.length === 0 ? (
                  <p className="kx-widget-empty">
                    Nenhuma #hashtag publicada ainda. Use <b>#hashtags</b> nos seus posts para inaugurar o ranking!
                  </p>
                ) : (
                  <div className="kx-trends-list">
                    {trends.map((t, idx) => (
                      <button
                        key={t.tag}
                        type="button"
                        className="kx-trend-item"
                        onClick={() => {
                          setSearchTag(t.tag);
                          setViewMode('feed');
                        }}
                      >
                        <small>{idx + 1} · Política Katequista · Em Alta</small>
                        <strong>{t.tag}</strong>
                        <span>
                          {t.count} {t.count === 1 ? 'publicação' : 'publicações'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {secondaryPages.length > 0 && (
                <div className="kx-explore-block">
                  <h3>Páginas Independentes, Fofoca & QGs ({secondaryPages.length})</h3>
                  <div className="kx-who-list">
                    {secondaryPages.map(pg => {
                      const isMe = pg.id === activeProfile?.id;
                      const iFollow = myFollowingSet.has(pg.id);
                      return (
                        <div
                          key={pg.id}
                          className="kx-who-item"
                          onClick={() => openUserProfile(pg.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <ProfileAvatar profile={pg} size="md" />
                          <div className="kx-who-meta" style={{ flex: 1 }}>
                            <strong>
                              {pg.name}
                              <AccountBadge profile={pg} />
                            </strong>
                            <span>@{pg.handle}</span>
                            <small>{pg.roleLabel}</small>
                          </div>
                          {!isMe && (
                            <button
                              type="button"
                              className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                              onClick={e => handleToggleFollow(pg.id, e)}
                            >
                              {iFollow ? 'Seguindo' : 'Seguir'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="kx-explore-block">
                <h3>Candidatos Oficiais Verificados ({verifiedCandidates.length})</h3>
                <div className="kx-who-list">
                  {verifiedCandidates.map(cand => {
                    const isMe = cand.id === activeProfile?.id;
                    const iFollow = myFollowingSet.has(cand.id);
                    return (
                      <div
                        key={cand.id}
                        className="kx-who-item"
                        onClick={() => openUserProfile(cand.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <ProfileAvatar profile={cand} size="md" />
                        <div className="kx-who-meta" style={{ flex: 1 }}>
                          <strong>
                            {cand.name}
                            <AccountBadge profile={cand} />
                          </strong>
                          <span>@{cand.handle}</span>
                          <small>{cand.roleLabel}</small>
                        </div>
                        {!isMe && (
                          <button
                            type="button"
                            className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                            onClick={e => handleToggleFollow(cand.id, e)}
                          >
                            {iFollow ? 'Seguindo' : 'Seguir'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="kx-explore-block">
                <h3>Eleitores do Grupo ({regularVoters.length})</h3>
                <div className="kx-who-list">
                  {regularVoters.map(v => {
                    const isMe = v.id === activeProfile?.id;
                    const iFollow = myFollowingSet.has(v.id);
                    return (
                      <div
                        key={v.id}
                        className="kx-who-item"
                        onClick={() => openUserProfile(v.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <ProfileAvatar profile={v} size="sm" />
                        <div className="kx-who-meta" style={{ flex: 1 }}>
                          <strong>{v.name}</strong>
                          <span>@{v.handle}</span>
                        </div>
                        {!isMe && (
                          <button
                            type="button"
                            className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                            onClick={e => handleToggleFollow(v.id, e)}
                          >
                            {iFollow ? 'Seguindo' : 'Seguir'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* MODO 2: CENTRAL DE NOTIFICAÇÕES */}
          {viewMode === 'notifications' && (
            <section className="kx-notifications-view">
              <header className="kx-profile-top-bar">
                <h2>Notificações e Menções</h2>
                <small>{notifications.length} interações recebidas</small>
              </header>

              {notifications.length === 0 ? (
                <div className="kx-empty-feed">
                  <div className="kx-empty-icon">
                    <Icon.Bell size={26} />
                  </div>
                  <h3>Nenhuma notificação ainda</h3>
                  <p>
                    Quando alguém mencionar <b>@{myAccounts.primary.handle}</b>
                    {myAccounts.secondary ? ` ou @${myAccounts.secondary.handle}` : ''}, comentar,
                    citar ou curtir suas publicações, aparecerá aqui!
                  </p>
                </div>
              ) : (
                <div className="kx-notif-list">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="kx-notif-item"
                      onClick={() => {
                        setViewMode('feed');
                        setOpenCommentsPostId(n.postId);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <ProfileAvatar profile={n.actor} size="sm" />
                      <div className="kx-notif-body">
                        <div>
                          <strong>{n.actor?.name || 'Eleitor'}</strong>
                          <AccountBadge profile={n.actor} />{' '}
                          <span className="kx-handle">@{n.actor?.handle}</span> ·{' '}
                          <time className="kx-time">{timeAgo(n.createdAt)}</time>
                        </div>
                        <p>{n.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* MODO 3: PERFIL DO USUÁRIO (COM ABAS PUBLICAÇÕES | REPUBLICAÇÕES | MÍDIA) */}
          {viewMode === 'profile' && viewingProfile && (
            <section className="kx-profile-header">
              <div className="kx-profile-top-bar">
                <button
                  type="button"
                  className="kx-icon-btn"
                  onClick={() => {
                    setViewingProfileId(null);
                    setViewMode('feed');
                  }}
                >
                  <Icon.ArrowLeft size={18} />
                </button>
                <div>
                  <h2>
                    {viewingProfile.name}
                    <AccountBadge profile={viewingProfile} />
                  </h2>
                  <small>@{viewingProfile.handle}</small>
                </div>
              </div>

              <div
                className="kx-profile-banner"
                style={{
                  background:
                    viewingProfile.banner ||
                    'linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%)',
                }}
              />

              <div className="kx-profile-body">
                <div className="kx-profile-avatar-row">
                  <ProfileAvatar profile={viewingProfile} size="xl" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(viewingProfile.id === myAccounts.primary.id ||
                      viewingProfile.id === myAccounts.secondary?.id) && (
                      <button
                        type="button"
                        className="kx-btn-outline"
                        onClick={() =>
                          openProfileEditor(
                            viewingProfile.type === 'secondary' ? 'secondary' : 'primary',
                          )
                        }
                      >
                        Editar perfil
                      </button>
                    )}
                    {viewingProfile.id !== activeProfile?.id && (
                      <button
                        type="button"
                        className={`kx-follow-btn kx-follow-btn-lg${
                          myFollowingSet.has(viewingProfile.id) ? ' is-following' : ''
                        }`}
                        onClick={e => handleToggleFollow(viewingProfile.id, e)}
                      >
                        {myFollowingSet.has(viewingProfile.id) ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="kx-profile-names">
                  <h3>
                    {viewingProfile.name}
                    <AccountBadge profile={viewingProfile} />
                  </h3>
                  <span className="kx-handle">@{viewingProfile.handle}</span>
                  {viewingProfile.roleLabel && (
                    <span className="kx-role-pill">{viewingProfile.roleLabel}</span>
                  )}
                </div>

                {viewingProfile.bio ? (
                  <p className="kx-profile-bio">{viewingProfile.bio}</p>
                ) : (
                  <p className="kx-profile-bio" style={{ opacity: 0.55 }}>
                    Sem bio definida ainda.
                  </p>
                )}

                <div className="kx-follow-counters">
                  <button
                    type="button"
                    className="kx-follow-stat"
                    onClick={() =>
                      setFollowModal({ profileId: viewingProfile.id, mode: 'following' })
                    }
                  >
                    <strong>{(viewingProfile.following || []).length}</strong>{' '}
                    <span>Seguindo</span>
                  </button>
                  <button
                    type="button"
                    className="kx-follow-stat"
                    onClick={() =>
                      setFollowModal({ profileId: viewingProfile.id, mode: 'followers' })
                    }
                  >
                    <strong>{(followersOfMap.get(viewingProfile.id) || []).length}</strong>{' '}
                    <span>Seguidores</span>
                  </button>
                </div>
              </div>

              <div className="kx-feed-tabs">
                <button
                  type="button"
                  className={`kx-feed-tab${profileSubTab === 'posts' ? ' is-active' : ''}`}
                  onClick={() => setProfileSubTab('posts')}
                >
                  <span>Publicações</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${profileSubTab === 'reposts' ? ' is-active' : ''}`}
                  onClick={() => setProfileSubTab('reposts')}
                >
                  <span>Republicações</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${profileSubTab === 'media' ? ' is-active' : ''}`}
                  onClick={() => setProfileSubTab('media')}
                >
                  <span>Mídia</span>
                </button>
              </div>
            </section>
          )}

          {/* MODO 4: FEED PRINCIPAL + COMPOSER */}
          {viewMode === 'feed' && (
            <>
              <header className="kx-feed-tabs kx-feed-tabs-4">
                <button
                  type="button"
                  className={`kx-feed-tab${feedTab === 'forYou' ? ' is-active' : ''}`}
                  onClick={() => setFeedTab('forYou')}
                >
                  <span>Para você</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${feedTab === 'following' ? ' is-active' : ''}`}
                  onClick={() => setFeedTab('following')}
                >
                  <span>Seguindo ({myFollowingSet.size})</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${feedTab === 'officials' ? ' is-active' : ''}`}
                  onClick={() => setFeedTab('officials')}
                >
                  <span>Candidatos</span>
                </button>
                <button
                  type="button"
                  className={`kx-feed-tab${feedTab === 'hot' ? ' is-active' : ''}`}
                  onClick={() => setFeedTab('hot')}
                >
                  <span>Em Alta</span>
                </button>
              </header>

              {searchTag && (
                <div className="kx-active-filter">
                  <span>
                    Filtrando por: <b>{searchTag}</b>
                  </span>
                  <button type="button" onClick={() => setSearchTag('')}>
                    Limpar filtro
                  </button>
                </div>
              )}

              {/* Composer Real com suporte a Enquete e Citação (Quote Post) */}
              <form className="kx-composer" onSubmit={handlePublish}>
                <ProfileAvatar
                  profile={activeProfile}
                  size="md"
                  onClick={() => openUserProfile(activeProfile.id)}
                />
                <div className="kx-composer-main">
                  <div className="kx-composer-as">
                    <span>
                      Publicando como <b>{activeProfile.name}</b> (@{activeProfile.handle})
                    </span>
                    {myAccounts.secondary ? (
                      <button
                        type="button"
                        className="kx-switch-inline"
                        onClick={() =>
                          setActiveType(t => (t === 'primary' ? 'secondary' : 'primary'))
                        }
                      >
                        <Icon.Switch size={13} />
                        <span>
                          Usar @
                          {activeType === 'primary'
                            ? myAccounts.secondary.handle
                            : myAccounts.primary.handle}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="kx-switch-inline"
                        onClick={() => openProfileEditor('secondary')}
                      >
                        <Icon.Plus size={13} />
                        <span>Criar 2ª Conta</span>
                      </button>
                    )}
                  </div>

                  <textarea
                    ref={composerRef}
                    rows={3}
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                    placeholder="O que está acontecendo?! Publique textos, enquetes, fotos e #hashtags..."
                    maxLength={500}
                  />

                  {/* Prévia de Citação (Quote Post) */}
                  {quotedPostObj && (
                    <div className="kx-quoted-card">
                      <div className="kx-quoted-head">
                        <strong>{profilesMap.get(quotedPostObj.authorId)?.name}</strong>
                        <span className="kx-handle">
                          @{profilesMap.get(quotedPostObj.authorId)?.handle}
                        </span>
                        <button
                          type="button"
                          className="kx-icon-action"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => setQuotedPostId(null)}
                          title="Remover citação"
                        >
                          <Icon.Close size={14} />
                        </button>
                      </div>
                      <p>{quotedPostObj.text}</p>
                    </div>
                  )}

                  {/* Criador de Enquete */}
                  {showPollCreator && (
                    <div className="kx-poll-builder">
                      <div className="kx-poll-builder-head">
                        <strong>Enquete Eleitoral (2 a 4 opções)</strong>
                        <button
                          type="button"
                          className="kx-icon-action"
                          onClick={() => setShowPollCreator(false)}
                        >
                          <Icon.Close size={14} />
                        </button>
                      </div>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="kx-poll-opt-input">
                          <input
                            value={opt}
                            onChange={e => {
                              const next = [...pollOptions];
                              next[idx] = e.target.value;
                              setPollOptions(next);
                            }}
                            placeholder={`Opção ${idx + 1}`}
                            maxLength={60}
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              className="kx-icon-action"
                              onClick={() =>
                                setPollOptions(pollOptions.filter((_, i) => i !== idx))
                              }
                            >
                              <Icon.Close size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
                        <button
                          type="button"
                          className="kx-add-poll-opt"
                          onClick={() => setPollOptions([...pollOptions, ''])}
                        >
                          <Icon.Plus size={13} /> Adicionar opção
                        </button>
                      )}
                    </div>
                  )}

                  {postMedia && (
                    <div className="kx-composer-preview">
                      {postMediaKind === 'video' || /\.(mp4|webm|ogg)$/i.test(postMedia) ? (
                        <video src={postMedia} controls playsInline />
                      ) : (
                        <img src={postMedia} alt="Prévia da mídia" />
                      )}
                      <button
                        type="button"
                        className="kx-remove-media"
                        onClick={() => setPostMedia('')}
                      >
                        <Icon.Close size={14} />
                      </button>
                    </div>
                  )}

                  {showMediaPicker && (
                    <div className="kx-media-drawer">
                      <label className="kx-field">
                        <span>Cole a URL de uma imagem, GIF ou vídeo (.mp4):</span>
                        <input
                          value={postMedia}
                          onChange={e => {
                            const val = e.target.value;
                            setPostMedia(val);
                            setPostMediaKind(/\.(mp4|webm|ogg)$/i.test(val) ? 'video' : 'image');
                          }}
                          placeholder="https://..."
                        />
                      </label>
                      <div className="kx-preset-posters">
                        <span>Ou selecione um santinho de campanha:</span>
                        <div className="kx-preset-chips">
                          {CAMPAIGN_MEDIA_PRESETS.map(item => (
                            <button
                              key={item.url}
                              type="button"
                              onClick={() => {
                                setPostMediaKind('image');
                                setPostMedia(item.url);
                                setShowMediaPicker(false);
                              }}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="kx-composer-bar">
                    <div className="kx-composer-tools">
                      <button
                        type="button"
                        className="kx-tool-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Enviar imagem do aparelho"
                      >
                        <Icon.Image size={18} />
                        <span>Imagem</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={e => handleUploadImage(e, setPostMedia)}
                      />

                      <button
                        type="button"
                        className="kx-tool-btn"
                        onClick={() => videoInputRef.current?.click()}
                        title="Enviar vídeo curto"
                      >
                        <Icon.Video size={18} />
                        <span>Vídeo</span>
                      </button>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm"
                        hidden
                        onChange={handleUploadVideo}
                      />

                      <button
                        type="button"
                        className="kx-tool-btn"
                        onClick={() => setShowPollCreator(s => !s)}
                        title="Criar enquete de votação"
                      >
                        <Icon.Poll size={18} />
                        <span>Enquete</span>
                      </button>

                      <button
                        type="button"
                        className="kx-tool-btn"
                        onClick={() => setShowMediaPicker(s => !s)}
                        title="Link externo ou santinho"
                      >
                        <Icon.Share size={16} />
                        <span>Santinho</span>
                      </button>

                      <button
                        type="button"
                        className="kx-tool-btn"
                        onClick={() => setPostText(t => `${t} #`.trimStart())}
                        title="Adicionar Hashtag"
                      >
                        <Icon.Hash size={17} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="kx-post-btn"
                      disabled={busy || !canSubmitPost}
                    >
                      Postar
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* Lista de Publicações (Exibida no modo Feed ou no modo Perfil) */}
          {(viewMode === 'feed' || viewMode === 'profile') && (
            <div className="kx-feed">
              {visiblePosts.length === 0 ? (
                <div className="kx-empty-feed">
                  <div className="kx-empty-icon">
                    <Icon.LogoX size={28} />
                  </div>
                  <h3>Nenhuma publicação encontrada</h3>
                  <p>
                    {viewMode === 'profile'
                      ? 'Este perfil ainda não possui publicações nesta aba.'
                      : 'Faça a primeira publicação acima ou crie sua 2ª conta para movimentar a eleição!'}
                  </p>
                </div>
              ) : (
                visiblePosts.map(post => {
                  const author = profilesMap.get(post.authorId) || {
                    id: post.authorId,
                    name: post.authorId,
                    handle: post.authorId,
                  };
                  const isLiked = (post.likes || []).includes(activeProfile?.id);
                  const isReposted = (post.reposts || []).includes(activeProfile?.id);
                  const isOwner =
                    post.authorId === myAccounts.primary.id ||
                    (myAccounts.secondary && post.authorId === myAccounts.secondary.id);
                  const isCommentsOpen = openCommentsPostId === post.id;
                  const isEditing = editingPostId === post.id;

                  const lastReposterId = post.reposts?.[post.reposts.length - 1];
                  const lastReposter = lastReposterId ? profilesMap.get(lastReposterId) : null;
                  const embeddedQuote = post.quotedPostId ? postsMap.get(post.quotedPostId) : null;
                  const embeddedAuthor = embeddedQuote
                    ? profilesMap.get(embeddedQuote.authorId)
                    : null;

                  const totalPollVotes = post.poll?.options
                    ? post.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0)
                    : 0;

                  const recentComments = (post.comments || []).slice(-2);

                  return (
                    <article key={post.id} className="kx-post">
                      {lastReposter && (
                        <div className="kx-repost-banner">
                          <Icon.Repost size={13} />
                          <span>{lastReposter.name} republicou</span>
                        </div>
                      )}

                      <div className="kx-post-row">
                        <ProfileAvatar
                          profile={author}
                          size="md"
                          onClick={() => openUserProfile(author.id)}
                        />

                        <div className="kx-post-body">
                          <header className="kx-post-head">
                            <button
                              type="button"
                              className="kx-author-btn"
                              onClick={() => openUserProfile(author.id)}
                            >
                              <strong>{author.name}</strong>
                              <AccountBadge profile={author} />
                              <span className="kx-handle">@{author.handle}</span>
                            </button>
                            <span className="kx-dot">·</span>
                            <time className="kx-time">
                              {timeAgo(post.createdAt)}
                              {post.editedAt ? ' (editado)' : ''}
                            </time>
                            {author.roleLabel && (
                              <span className="kx-post-role">{author.roleLabel}</span>
                            )}

                            {(isOwner || myAccounts.isStk) && (
                              <div className="kx-owner-actions">
                                {myAccounts.isStk && (
                                  <button
                                    type="button"
                                    className="kx-stk-gavel-btn"
                                    onClick={() => openStkModal(post)}
                                    title="Poder Absoluto do STK: Marcar ou Remover Publicação"
                                  >
                                    <Icon.Gavel size={14} />
                                    <span>STK</span>
                                  </button>
                                )}
                                {isOwner && (
                                  <button
                                    type="button"
                                    className="kx-icon-action"
                                    onClick={() => {
                                      setEditingPostId(post.id);
                                      setEditingPostText(post.text || '');
                                    }}
                                    title="Editar publicação"
                                  >
                                    <Icon.Edit size={14} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="kx-icon-action is-danger"
                                  onClick={() => handleDeletePost(post.id)}
                                  title="Excluir publicação"
                                >
                                  <Icon.Trash size={14} />
                                </button>
                              </div>
                            )}
                          </header>

                          {/* Caso 1: Publicação Removida por Ordem do STK */}
                          {post.stkAction?.status === 'removed' ? (
                            <div className="kx-stk-removed-wrap">
                              <div className="kx-stk-removed-banner">
                                <strong>⚖️ DECISÃO OFICIAL · SUPERIOR TRIBUNAL KATEQUESENSE</strong>
                                <p>
                                  Removida pelo STK por ordem do Ex.mo{' '}
                                  <b>{post.stkAction.ministerName}</b>, pelo motivo:{' '}
                                  <b>{post.stkAction.reason}</b>
                                </p>
                              </div>

                              {myAccounts.isStk && (
                                <div className="kx-stk-secret-box">
                                  <small>
                                    👁️ Conteúdo retido (visível apenas para o Ministro do STK):
                                  </small>
                                  <p>{post.text || '(Publicação com mídia / enquete)'}</p>
                                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <button
                                      type="button"
                                      className="kx-switch-inline"
                                      onClick={() => handleStkRestore(post.id)}
                                    >
                                      ↩️ Devolver Postagem
                                    </button>
                                    <button
                                      type="button"
                                      className="kx-switch-inline"
                                      onClick={() => openStkModal(post)}
                                    >
                                      ⚖️ Gerenciar Despacho
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {isEditing ? (
                                <form
                                  className="kx-edit-post-form"
                                  onSubmit={e => handleSaveEditedPost(e, post.id)}
                                >
                                  <textarea
                                    rows={3}
                                    value={editingPostText}
                                    onChange={e => setEditingPostText(e.target.value)}
                                    maxLength={500}
                                    required
                                  />
                                  <div className="kx-edit-post-btns">
                                    <button
                                      type="button"
                                      className="kx-btn-ghost"
                                      onClick={() => setEditingPostId(null)}
                                    >
                                      Cancelar
                                    </button>
                                    <button type="submit" className="kx-post-btn" disabled={busy}>
                                      Salvar
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <FormattedPostText
                                  text={post.text}
                                  onSelectHashtag={tag => {
                                    setViewMode('feed');
                                    setViewingProfileId(null);
                                    setSearchTag(tag);
                                  }}
                                  onSelectHandle={handleSelectHandle}
                                />
                              )}

                              {/* Caso 2: Publicação Marcada com Aviso pelo STK */}
                              {post.stkAction?.status === 'flagged' && (
                                <div className="kx-stk-flagged-banner">
                                  <strong>
                                    ⚠️ AVISO OFICIAL DO SUPERIOR TRIBUNAL KATEQUESENSE (STK)
                                  </strong>
                                  <p>
                                    O STK está marcando esta publicação por ordem do Ex.mo{' '}
                                    <b>{post.stkAction.ministerName}</b>, pelo motivo:{' '}
                                    <b>{post.stkAction.reason}</b>
                                  </p>
                                  {myAccounts.isStk && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                      <button
                                        type="button"
                                        className="kx-switch-inline"
                                        onClick={() => handleStkRestore(post.id)}
                                      >
                                        ↩️ Retirar Marcação
                                      </button>
                                      <button
                                        type="button"
                                        className="kx-switch-inline"
                                        onClick={() => openStkModal(post)}
                                      >
                                        ⚖️ Editar / Converter em Remoção
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Enquete Ao Vivo no Post */}
                              {post.poll?.options && (
                                <div className="kx-poll-box">
                                  {post.poll.options.map(opt => {
                                    const votesCount = opt.votes?.length || 0;
                                    const pct =
                                      totalPollVotes > 0
                                        ? Math.round((votesCount / totalPollVotes) * 100)
                                        : 0;
                                    const iVoted =
                                      (opt.votes || []).includes(myAccounts.voterId) ||
                                      (opt.votes || []).includes(activeProfile?.id);
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        className={`kx-poll-option${iVoted ? ' is-voted' : ''}`}
                                        onClick={() => handleVotePoll(post.id, opt.id)}
                                      >
                                        <i
                                          className="kx-poll-bar"
                                          style={{ width: `${pct}%` }}
                                        />
                                        <span className="kx-poll-opt-text">
                                          {opt.text} {iVoted && '✓'}
                                        </span>
                                        <strong className="kx-poll-opt-pct">
                                          {pct}% ({votesCount})
                                        </strong>
                                      </button>
                                    );
                                  })}
                                  <small className="kx-poll-total">
                                    {totalPollVotes} {totalPollVotes === 1 ? 'voto' : 'votos'} na enquete · Clique para votar
                                  </small>
                                </div>
                              )}

                              {post.mediaUrl && (
                                <div className="kx-post-media">
                                  {post.mediaKind === 'video' || /\.(mp4|webm|ogg)$/i.test(post.mediaUrl) ? (
                                    <video src={post.mediaUrl} controls playsInline />
                                  ) : (
                                    <img src={post.mediaUrl} alt="Mídia da publicação" loading="lazy" />
                                  )}
                                </div>
                              )}

                              {/* Card de Publicação Citada (Quote Post) */}
                              {embeddedQuote && (
                                <div
                                  className="kx-quoted-card is-clickable"
                                  onClick={() => openUserProfile(embeddedQuote.authorId)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="kx-quoted-head">
                                    <strong>{embeddedAuthor?.name || embeddedQuote.authorId}</strong>
                                    <AccountBadge profile={embeddedAuthor} />
                                    <span className="kx-handle">
                                      @{embeddedAuthor?.handle || embeddedQuote.authorId}
                                    </span>
                                    <span className="kx-dot">·</span>
                                    <time className="kx-time">{timeAgo(embeddedQuote.createdAt)}</time>
                                  </div>
                                  <p>
                                    {embeddedQuote.stkAction?.status === 'removed'
                                      ? `Removida pelo STK por ordem do Ex.mo ${embeddedQuote.stkAction.ministerName}, pelo motivo: ${embeddedQuote.stkAction.reason}`
                                      : embeddedQuote.text}
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          <footer className="kx-post-actions">
                            <button
                              type="button"
                              className={`kx-act-btn${isCommentsOpen ? ' is-comment' : ''}`}
                              onClick={() =>
                                setOpenCommentsPostId(prev => (prev === post.id ? null : post.id))
                              }
                              title="Comentar / Responder"
                            >
                              <Icon.Comment />
                              <small>{post.comments?.length || 0}</small>
                            </button>

                            <button
                              type="button"
                              className={`kx-act-btn${isReposted ? ' is-repost' : ''}`}
                              onClick={() => handleReact(post.id, 'reposts')}
                              title="Republicar"
                            >
                              <Icon.Repost />
                              <small>{post.reposts?.length || 0}</small>
                            </button>

                            <button
                              type="button"
                              className="kx-act-btn"
                              onClick={() => handleStartQuote(post.id)}
                              title="Citar publicação (comentar em cima)"
                            >
                              <Icon.Quote />
                            </button>

                            <button
                              type="button"
                              className={`kx-act-btn${isLiked ? ' is-like' : ''}`}
                              onClick={() => handleReact(post.id, 'likes')}
                              title="Curtir"
                            >
                              <Icon.Heart filled={isLiked} />
                              <small>{post.likes?.length || 0}</small>
                            </button>

                            <button
                              type="button"
                              className="kx-act-btn"
                              onClick={() => sharePostOnWhatsApp(post, author)}
                              title="Compartilhar"
                            >
                              <Icon.Share />
                            </button>
                          </footer>

                          {/* Prévia automática das últimas respostas quando fechado */}
                          {!isCommentsOpen && recentComments.length > 0 && (
                            <div
                              className="kx-inline-replies-preview"
                              onClick={() => setOpenCommentsPostId(post.id)}
                              role="button"
                              tabIndex={0}
                            >
                              {recentComments.map(rc => {
                                const rcAuthor = profilesMap.get(rc.authorId);
                                return (
                                  <div key={rc.id} className="kx-inline-reply-line">
                                    <strong>@{rcAuthor?.handle || rc.authorId}:</strong>{' '}
                                    <span>{rc.text}</span>
                                  </div>
                                );
                              })}
                              {post.comments.length > 2 && (
                                <small>Ver todas as {post.comments.length} respostas…</small>
                              )}
                            </div>
                          )}

                          {isCommentsOpen && (
                            <div className="kx-comments-section">
                              <form
                                className="kx-comment-form"
                                onSubmit={e => handleAddComment(e, post.id)}
                              >
                                <ProfileAvatar profile={activeProfile} size="sm" />
                                <input
                                  value={commentDraft}
                                  onChange={e => setCommentDraft(e.target.value)}
                                  placeholder={`Responder como @${activeProfile.handle}...`}
                                  maxLength={350}
                                  required
                                />
                                <button type="submit" disabled={busy}>
                                  Responder
                                </button>
                              </form>

                              <div className="kx-comments-list">
                                {(post.comments || []).map(c => {
                                  const cAuthor = profilesMap.get(c.authorId) || {
                                    id: c.authorId,
                                    name: c.authorId,
                                    handle: c.authorId,
                                  };
                                  const canDeleteComment =
                                    c.authorId === myAccounts.primary.id ||
                                    (myAccounts.secondary &&
                                      c.authorId === myAccounts.secondary.id);
                                  return (
                                    <div key={c.id} className="kx-comment-item">
                                      <ProfileAvatar
                                        profile={cAuthor}
                                        size="sm"
                                        onClick={() => openUserProfile(cAuthor.id)}
                                      />
                                      <div className="kx-comment-content">
                                        <div className="kx-comment-head">
                                          <strong
                                            onClick={() => openUserProfile(cAuthor.id)}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            {cAuthor.name}
                                          </strong>
                                          <AccountBadge profile={cAuthor} />
                                          <span className="kx-handle">@{cAuthor.handle}</span>
                                          <span className="kx-dot">·</span>
                                          <time className="kx-time">{timeAgo(c.createdAt)}</time>
                                          {canDeleteComment && (
                                            <button
                                              type="button"
                                              className="kx-icon-action is-danger"
                                              style={{ marginLeft: 'auto' }}
                                              onClick={() => handleDeleteComment(post.id, c.id)}
                                              title="Excluir comentário"
                                            >
                                              <Icon.Trash size={13} />
                                            </button>
                                          )}
                                        </div>
                                        <p>{c.text}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}

              <div ref={sentinelRef} className="kx-sentinel">
                {visiblePosts.length > 0 &&
                  (visibleCount < filteredPosts.length
                    ? 'Carregando mais publicações…'
                    : 'Fim da linha do tempo · Sincronizado ao vivo')}
              </div>
            </div>
          )}
        </main>

        {/* COLUNA DIREITA: Busca + Trending Topics + Páginas + Candidatos */}
        <aside className="kx-right-rail">
          <div className="kx-search-box">
            <Icon.Search />
            <input
              value={searchTag}
              onChange={e => {
                setSearchTag(e.target.value);
                if (viewMode !== 'feed') setViewMode('feed');
              }}
              placeholder="Buscar publicações, @usuarios ou #hashtags"
            />
            {searchTag && (
              <button type="button" onClick={() => setSearchTag('')}>
                <Icon.Close size={14} />
              </button>
            )}
          </div>

          <section className="kx-widget">
            <h3>Trending Topics</h3>
            <div className="kx-trends-list">
              {trends.length === 0 ? (
                <p className="kx-widget-empty">
                  Use <b>#hashtags</b> nas suas publicações para criar os tópicos em alta do grupo!
                </p>
              ) : (
                trends.map((t, idx) => (
                  <button
                    key={t.tag}
                    type="button"
                    className="kx-trend-item"
                    onClick={() => {
                      setViewMode('feed');
                      setViewingProfileId(null);
                      setSearchTag(t.tag);
                    }}
                  >
                    <small>{idx + 1} · Assunto do Momento</small>
                    <strong>{t.tag}</strong>
                    <span>
                      {t.count} {t.count === 1 ? 'menção' : 'menções'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          {secondaryPages.length > 0 && (
            <section className="kx-widget">
              <h3>Páginas & 2ªs Contas</h3>
              <div className="kx-who-list">
                {secondaryPages.map(pg => {
                  const isMe = pg.id === activeProfile?.id;
                  const iFollow = myFollowingSet.has(pg.id);
                  return (
                    <div
                      key={pg.id}
                      className="kx-who-item"
                      onClick={() => openUserProfile(pg.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <ProfileAvatar profile={pg} size="sm" />
                      <div className="kx-who-meta" style={{ flex: 1 }}>
                        <strong>
                          {pg.name}
                          <AccountBadge profile={pg} />
                        </strong>
                        <span>@{pg.handle}</span>
                        <small>{pg.roleLabel}</small>
                      </div>
                      {!isMe && (
                        <button
                          type="button"
                          className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                          onClick={e => handleToggleFollow(pg.id, e)}
                        >
                          {iFollow ? 'Seguindo' : 'Seguir'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="kx-widget">
            <h3>Candidatos Oficiais</h3>
            <div className="kx-who-list">
              {verifiedCandidates.map(cand => {
                const isMe = cand.id === activeProfile?.id;
                const iFollow = myFollowingSet.has(cand.id);
                return (
                  <div
                    key={cand.id}
                    className="kx-who-item"
                    onClick={() => openUserProfile(cand.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <ProfileAvatar profile={cand} size="sm" />
                    <div className="kx-who-meta" style={{ flex: 1 }}>
                      <strong>
                        {cand.name}
                        <AccountBadge profile={cand} />
                      </strong>
                      <span>@{cand.handle}</span>
                      <small>{cand.roleLabel}</small>
                    </div>
                    {!isMe && (
                      <button
                        type="button"
                        className={`kx-follow-btn${iFollow ? ' is-following' : ''}`}
                        onClick={e => handleToggleFollow(cand.id, e)}
                      >
                        {iFollow ? 'Seguindo' : 'Seguir'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {/* Barra Inferior Mobile com 5 Abas (Início | Explorar | Notificações | Alternar | Perfil) */}
      <nav className="kx-mobile-bottom">
        <button
          type="button"
          className={viewMode === 'feed' ? 'is-active' : ''}
          onClick={() => {
            setViewMode('feed');
            setViewingProfileId(null);
            setSearchTag('');
          }}
        >
          <Icon.Home size={19} />
          <span>Início</span>
        </button>

        <button
          type="button"
          className={viewMode === 'explore' ? 'is-active' : ''}
          onClick={() => {
            setViewMode('explore');
            setViewingProfileId(null);
          }}
        >
          <Icon.Explore size={19} />
          <span>Explorar</span>
        </button>

        <button
          type="button"
          className={viewMode === 'notifications' ? 'is-active' : ''}
          onClick={() => {
            setViewMode('notifications');
            setViewingProfileId(null);
          }}
        >
          <Icon.Bell size={19} />
          <span>Alertas{notifications.length > 0 ? ` (${notifications.length})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (myAccounts.secondary) {
              const next = activeType === 'primary' ? 'secondary' : 'primary';
              setActiveType(next);
              showNotice(
                `Conta ativa: @${
                  next === 'secondary' ? myAccounts.secondary.handle : myAccounts.primary.handle
                }`,
              );
            } else {
              openProfileEditor('secondary');
            }
          }}
        >
          <Icon.Switch size={19} />
          <span>{myAccounts.secondary ? 'Alternar' : '+ 2ª Conta'}</span>
        </button>

        <button
          type="button"
          className={viewMode === 'profile' ? 'is-active' : ''}
          onClick={() => openUserProfile(activeProfile.id)}
        >
          <Icon.User size={19} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}
