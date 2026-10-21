import { useEffect, useState } from 'react';
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
  const [token, setToken] = useState();
  const [wantsLogin, setWantsLogin] = useState(false);
  const [done, setDone] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Sem servidor (ex.: npm run dev) a urna usa os candidatos dos arquivos locais.
  useEffect(() => {
    api('public').then(setData).catch(() => setData({ presidents, deputies }));
  }, []);

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
      status={data.config?.status}
      onVote={() => {
        setWantsLogin(true);
        window.scrollTo(0, 0);
      }}
    />
  );
}
