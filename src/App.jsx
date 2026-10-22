import { useCallback, useEffect, useState } from 'react';
import { api, savePreviewVote } from './api.js';
import Landing from './landing/Landing.jsx';
import Login from './screens/Login.jsx';
import Urna from './screens/Urna.jsx';
import Done from './screens/Done.jsx';
import PreviewResults from './screens/PreviewResults.jsx';
import Apuracao from './screens/Apuracao.jsx';
import Titulo from './screens/Titulo.jsx';
import Social from './screens/Social.jsx';
import presidents from '../data/presidents.json';
import deputies from '../data/deputies.json';
import election from '../data/election.json';
import { phase } from '../netlify/functions/_schedule.js';

const fallbackConfig = () => ({
  status: phase({ status: 'auto', ...election }),
  opensAt: election.opensAt,
  closesAt: election.closesAt,
  now: Date.now(),
  round: 1,
  seats: 4,
  runoffIds: [],
});

export default function App() {
  const [data, setData] = useState();
  const [skew, setSkew] = useState(0);
  const [token, setToken] = useState();
  const [voterName, setVoterName] = useState('');
  const [prefillCode, setPrefillCode] = useState('');
  const [previewLogin, setPreviewLogin] = useState(false);
  const [wantsLogin, setWantsLogin] = useState(false);
  const [done, setDone] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showApuracao, setShowApuracao] = useState(
    () => window.location.hash === '#apuracao' || window.location.pathname === '/apuracao',
  );
  const [showTitulo, setShowTitulo] = useState(
    () => window.location.hash === '#titulo' || window.location.pathname === '/titulo',
  );
  const [showSocial, setShowSocial] = useState(
    () => window.location.hash === '#social' || window.location.pathname === '/social',
  );

  // Sem servidor (ex.: npm run dev) a urna usa os candidatos e o cronograma dos arquivos locais.
  const load = useCallback(() => {
    api('public')
      .then(d => {
        setSkew(d.config.now - Date.now());
        setData(d);
      })
      .catch(() =>
        setData(prev => prev ?? { presidents, deputies, config: fallbackConfig() }),
      );
  }, []);

  useEffect(load, [load]);

  // Atualiza sozinho no instante em que a votação abre ou encerra, e quando a aba volta ao foco.
  useEffect(() => {
    const c = data?.config;
    const next = c?.status === 'scheduled' ? c.opensAt : c?.status === 'open' ? c.closesAt : null;
    if (!next) return;
    const wait = Math.max(Date.parse(next) - (Date.now() + skew) + 800, 500);
    if (wait > 2 ** 31 - 1) return;
    const timer = setTimeout(load, wait);
    return () => clearTimeout(timer);
  }, [data, skew, load]);

  useEffect(() => {
    const onVisible = () => !document.hidden && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  useEffect(() => {
    const syncFromLocation = () => {
      const h = window.location.hash;
      const p = window.location.pathname;
      setShowApuracao(h === '#apuracao' || p === '/apuracao');
      setShowTitulo(h === '#titulo' || p === '/titulo');
      setShowSocial(h === '#social' || p === '/social');
    };
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  const openApuracao = () => {
    setShowTitulo(false);
    setShowSocial(false);
    setShowApuracao(true);
    window.history.pushState(null, '', '#apuracao');
    window.scrollTo(0, 0);
  };

  const closeApuracao = () => {
    setShowApuracao(false);
    if (window.location.hash === '#apuracao') {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo(0, 0);
  };

  const openTitulo = () => {
    setShowApuracao(false);
    setShowSocial(false);
    setShowTitulo(true);
    window.history.pushState(null, '', '#titulo');
    window.scrollTo(0, 0);
  };

  const closeTitulo = () => {
    setShowTitulo(false);
    if (window.location.hash === '#titulo') {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo(0, 0);
  };

  const openSocial = () => {
    setShowApuracao(false);
    setShowTitulo(false);
    setShowSocial(true);
    window.history.pushState(null, '', '#social');
    window.scrollTo(0, 0);
  };

  const closeSocial = () => {
    setShowSocial(false);
    if (window.location.hash === '#social') {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo(0, 0);
  };

  const home = () => {
    setToken(undefined);
    setVoterName('');
    setPrefillCode('');
    setPreviewLogin(false);
    setWantsLogin(false);
    setDone(false);
    setShowResults(false);
    setShowApuracao(false);
    setShowTitulo(false);
    load();
    window.scrollTo(0, 0);
  };

  const round = data?.config?.round || 1;
  const canVote = (data?.config?.status ?? 'open') === 'open';

  if (!data) return <p className="loading">Carregando…</p>;
  if (showSocial) {
    return (
      <Social
        onBack={closeSocial}
        onGoTitulo={openTitulo}
      />
    );
  }
  if (showApuracao) {
    return (
      <Apuracao
        presidents={data.presidents || presidents}
        deputies={data.deputies || deputies}
        config={data.config}
        turnout={data.turnout}
        realVotes={data.votes}
        onBack={closeApuracao}
      />
    );
  }
  if (showTitulo) {
    return (
      <Titulo
        canVote={canVote}
        onBack={closeTitulo}
        onGoSocial={openSocial}
        onGoVote={codeFromTitle => {
          closeTitulo();
          setPrefillCode(codeFromTitle || '');
          setWantsLogin(true);
          window.scrollTo(0, 0);
        }}
      />
    );
  }
  if (showResults) return <PreviewResults onBack={() => setShowResults(false)} />;
  if (done) {
    return (
      <Done
        voterName={voterName}
        round={round}
        preview={token?.startsWith('preview')}
        previewAdmin={token === 'preview-admin'}
        onResults={() => setShowResults(true)}
        onHome={home}
      />
    );
  }

  if (token) {
    return (
      <Urna
        token={token}
        data={data}
        voterName={voterName}
        onDone={vote => {
          if (vote && token === 'preview-admin') savePreviewVote(vote);
          setDone(true);
        }}
      />
    );
  }

  if (wantsLogin) {
    return (
      <Login
        preview={previewLogin}
        round={round}
        initialCode={prefillCode}
        onLogin={({ token: nextToken, name }) => {
          setToken(nextToken);
          setVoterName(name);
        }}
        onBack={() => {
          setWantsLogin(false);
          setPreviewLogin(false);
        }}
      />
    );
  }

  return (
    <Landing
      presidents={presidents}
      deputies={deputies}
      config={data.config}
      turnout={data.turnout}
      skew={skew}
      onVote={() => {
        setPrefillCode('');
        setWantsLogin(true);
        window.scrollTo(0, 0);
      }}
      onApuracao={openApuracao}
      onTitulo={openTitulo}
      onSocial={openSocial}
      onPreview={() => {
        setPreviewLogin(true);
        setWantsLogin(true);
        setVoterName('Simulação');
        window.scrollTo(0, 0);
      }}
    />
  );
}
