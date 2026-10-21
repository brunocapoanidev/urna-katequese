import { useCallback, useEffect, useState } from 'react';
import { api, savePreviewVote } from './api.js';
import Landing from './landing/Landing.jsx';
import Login from './screens/Login.jsx';
import Urna from './screens/Urna.jsx';
import Done from './screens/Done.jsx';
import PreviewResults from './screens/PreviewResults.jsx';
import presidents from '../data/presidents.json';
import deputies from '../data/deputies.json';

export default function App() {
  const [data, setData] = useState();
  const [skew, setSkew] = useState(0);
  const [token, setToken] = useState();
  const [wantsLogin, setWantsLogin] = useState(false);
  const [done, setDone] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sem servidor (ex.: npm run dev) a urna usa os candidatos dos arquivos locais.
  const load = useCallback(() => {
    api('public')
      .then(d => {
        setSkew(d.config.now - Date.now());
        setData(d);
      })
      .catch(() => setData(prev => prev ?? { presidents, deputies }));
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

  const home = () => {
    setToken(undefined);
    setWantsLogin(false);
    setDone(false);
    setShowResults(false);
    window.scrollTo(0, 0);
  };

  if (!data) return <p className="loading">Carregando…</p>;
  if (showResults) return <PreviewResults onBack={() => setShowResults(false)} />;
  if (done) return <Done previewAdmin={token === 'preview-admin'} onResults={() => setShowResults(true)} onHome={home} />;

  if (token) {
    return (
      <Urna
        token={token}
        data={data}
        onDone={vote => {
          if (vote && token === 'preview-admin') savePreviewVote(vote);
          setDone(true);
        }}
      />
    );
  }

  if (wantsLogin) return <Login onLogin={setToken} onBack={() => setWantsLogin(false)} />;

  return (
    <Landing
      presidents={presidents}
      deputies={deputies}
      config={data.config}
      skew={skew}
      onVote={() => {
        setWantsLogin(true);
        window.scrollTo(0, 0);
      }}
    />
  );
}
