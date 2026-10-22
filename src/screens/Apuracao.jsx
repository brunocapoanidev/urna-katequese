import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './apuracao.css';
import {
  apuracaoLeadChangeSound,
  apuracaoTickSound,
  urnaEndSound,
} from '../sound.js';
import { BRAZIL_STATES } from './brazilMapData.js';

const PARTY_COLORS = {
  'bruno-capoani': { color: '#3b82f6', short: 'PNK 45', tag: 'PNK' },
  'pedro-galli': { color: '#ef4444', short: 'PC 38', tag: 'PC' },
  'pietro-spielmann': { color: '#eab308', short: 'PRA 10', tag: 'PRA' },
};

const IVORY_TONES = ['#2a2824', '#4e4b46', '#77736b', '#a39e94', '#cfcac0', '#fafaf9'];

const ZONES = [
  { id: 'norte', name: 'Norte', subtitle: 'Resenha', ufs: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'], sections: [1, 2, 3] },
  { id: 'nordeste', name: 'Nordeste', subtitle: 'Churrasco', ufs: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'PI', 'SE'], sections: [4, 5, 6, 7] },
  { id: 'centro', name: 'Centro-Oeste', subtitle: 'Agro', ufs: ['MT', 'GO', 'MS', 'DF'], sections: [8, 9, 10] },
  { id: 'sudeste', name: 'Sudeste', subtitle: 'Futebol', ufs: ['SP', 'MG', 'RJ', 'ES'], sections: [11, 12, 13, 14] },
  { id: 'sul', name: 'Sul', subtitle: 'Catequese', ufs: ['PR', 'RS', 'SC'], sections: [15, 16, 17] },
  { id: 'exterior', name: 'Exterior', subtitle: 'Madrugada', ufs: ['ZZ'], sections: [18, 19] },
];

const CALLOUT_STATES = [
  { uf: 'RN', anchorX: 548, anchorY: 168, boxY: 146 },
  { uf: 'PB', anchorX: 562, anchorY: 184, boxY: 174 },
  { uf: 'PE', anchorX: 558, anchorY: 198, boxY: 202 },
  { uf: 'AL', anchorX: 545, anchorY: 214, boxY: 230 },
  { uf: 'SE', anchorX: 530, anchorY: 230, boxY: 258 },
  { uf: 'ES', anchorX: 484, anchorY: 368, boxY: 356 },
  { uf: 'RJ', anchorX: 446, anchorY: 412, boxY: 392 },
  { uf: 'ZZ', label: '🌐', anchorX: null, anchorY: null, boxY: 432 },
];

const SECTION_STATES = {
  1: ['AM', 'RR', 'AC'],
  2: ['PA', 'AP'],
  3: ['RO', 'TO'],
  4: ['BA', 'SE'],
  5: ['PE', 'AL'],
  6: ['CE', 'PI', 'MA'],
  7: ['RN', 'PB'],
  8: ['MT'],
  9: ['GO', 'DF'],
  10: ['MS'],
  11: ['SP'],
  12: ['MG'],
  13: ['RJ'],
  14: ['ES'],
  15: ['PR'],
  16: ['SC'],
  17: ['RS'],
  18: ['ZZ'],
  19: ['SP', 'BA', 'MG', 'RS', 'PR', 'PE', 'CE', 'PA', 'GO', 'SC', 'AM', 'MA', 'ES', 'PB', 'RN', 'MT', 'AL', 'PI', 'DF', 'MS', 'SE', 'RO', 'TO', 'AC', 'AP', 'RR', 'RJ', 'ZZ'],
};

const photoStyle = (c, color) => ({
  '--cand-color': color || '#fafaf9',
  ...(c?.photo
    ? {
        backgroundImage: `url(${c.photo})`,
        backgroundPosition: `${c.photoPosition || '50%'} center`,
        backgroundSize: c.photoSize || undefined,
      }
    : {}),
});

const fmtPct = (n, decimals = 2) =>
  Number(n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArcWedge(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)}`,
    'Z',
  ].join(' ');
}

function ParliamentHemicycle({ rankedDeps, seats = 4 }) {
  const winners = rankedDeps.slice(0, seats);
  const gap = 3;
  const sliceAngle = (180 - gap * (seats - 1)) / seats;

  return (
    <div className="ap-hemicycle-wrap">
      <svg className="ap-hemicycle-svg" viewBox="0 0 260 142" aria-label="Hemiciclo das 4 cadeiras de Deputado">
        {Array.from({ length: seats }, (_, i) => {
          const dep = winners[i];
          const hasVotes = dep && dep.votes > 0;
          const start = i * (sliceAngle + gap);
          const end = start + sliceAngle;
          const d = describeArcWedge(130, 128, 114, 62, start, end);
          const mid = polarToCartesian(130, 128, 88, (start + end) / 2);
          return (
            <g key={i}>
              <path
                d={d}
                fill={hasVotes ? dep.color : '#262420'}
                fillOpacity={hasVotes ? 0.92 : 0.6}
                stroke="#0f0e0d"
                strokeWidth="1.5"
              />
              {hasVotes && (
                <text
                  x={mid.x}
                  y={mid.y + 4}
                  textAnchor="middle"
                  fill="#fafaf9"
                  fontSize="10"
                  fontWeight="800"
                >
                  {dep.number}
                </text>
              )}
            </g>
          );
        })}
        <text x="130" y="108" textAnchor="middle" className="ap-hemicycle-num">
          {seats}
        </text>
        <text x="130" y="125" textAnchor="middle" className="ap-hemicycle-sub">
          cadeiras
        </text>
      </svg>
    </div>
  );
}

function normalizeRealBallots(votes = []) {
  return votes.map((v, idx) => {
    const sectionNum = (idx % 19) + 1;
    const zone = ZONES.find(z => z.sections.includes(sectionNum)) || ZONES[0];
    const min = String(idx + 1).padStart(2, '0');
    return {
      section: sectionNum,
      zoneId: zone.id,
      zoneName: zone.name,
      time: `17h${min}`,
      president: v.president,
      deputy: v.deputy,
    };
  });
}

export default function Apuracao({ presidents = [], deputies = [], config, turnout, realVotes, onBack }) {
  const [tab, setTab] = useState('president');
  const [mapMode, setMapMode] = useState('resultado'); // 'resultado' | 'vantagem' | 'apurado' | 'candidato'
  const [focusCandId, setFocusCandId] = useState(() => presidents[0]?.id || 'bruno-capoani');
  const simRound = config?.round || 1;
  const simRunoffPair = config?.round === 2 && config?.runoffIds?.length === 2 ? config.runoffIds : null;
  const ballots = useMemo(
    () => (Array.isArray(realVotes) && realVotes.length > 0 ? normalizeRealBallots(realVotes) : []),
    [realVotes],
  );
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(() => Boolean(realVotes?.length));
  const [speed, setSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hoveredUf, setHoveredUf] = useState(null);
  const [selectedUf, setSelectedUf] = useState(null);
  const [viradaBanner, setViradaBanner] = useState('');
  const prevLeaderRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (ballots.length > 0 && step === 0) {
      setPlaying(true);
    }
  }, [ballots.length, step]);

  const activePresidents = useMemo(() => {
    if (simRound === 2 && simRunoffPair?.length === 2) {
      return presidents.filter(p => simRunoffPair.includes(p.id));
    }
    return presidents;
  }, [presidents, simRound, simRunoffPair]);

  const totalSections = Math.max(ballots.length, turnout?.total || 19);

  useEffect(() => {
    if (!playing) return;
    if (step >= ballots.length) {
      setPlaying(false);
      if (ballots.length > 0 && soundEnabled) urnaEndSound();
      return;
    }
    const baseDelay = speed === 2 ? 460 : 960;
    const jitter = Math.floor(Math.random() * 240);
    timerRef.current = setTimeout(() => {
      setStep(s => Math.min(ballots.length, s + 1));
    }, baseDelay + jitter);
    return () => clearTimeout(timerRef.current);
  }, [playing, step, ballots.length, speed, soundEnabled]);

  const countedBallots = useMemo(() => ballots.slice(0, step), [ballots, step]);
  const pctCounted = totalSections > 0 ? (countedBallots.length / totalSections) * 100 : 0;

  const stats = useMemo(() => {
    const presCounts = new Map(activePresidents.map(p => [p.id, 0]));
    const depCounts = new Map(deputies.map(d => [d.id, 0]));
    let blankPres = 0;
    let nullPres = 0;
    let blankDep = 0;
    let nullDep = 0;

    for (const b of countedBallots) {
      if (b.president === 'blank') blankPres++;
      else if (b.president === 'null') nullPres++;
      else if (presCounts.has(b.president)) presCounts.set(b.president, presCounts.get(b.president) + 1);

      if (b.deputy === 'blank') blankDep++;
      else if (b.deputy === 'null') nullDep++;
      else if (depCounts.has(b.deputy)) depCounts.set(b.deputy, depCounts.get(b.deputy) + 1);
    }

    const validPres = [...presCounts.values()].reduce((a, b) => a + b, 0);
    const validDep = [...depCounts.values()].reduce((a, b) => a + b, 0);

    const rankedPres = [...activePresidents]
      .map(p => {
        const votes = presCounts.get(p.id) || 0;
        const pct = validPres > 0 ? (votes / validPres) * 100 : 0;
        return {
          ...p,
          votes,
          pct,
          color: PARTY_COLORS[p.id]?.color || '#fafaf9',
          shortParty: PARTY_COLORS[p.id]?.short || p.number,
          tag: PARTY_COLORS[p.id]?.tag || p.number,
        };
      })
      .sort((a, b) => b.votes - a.votes || Number(a.number) - Number(b.number));

    const rankedDeps = [...deputies]
      .map(d => {
        const votes = depCounts.get(d.id) || 0;
        const pct = validDep > 0 ? (votes / validDep) * 100 : 0;
        const presColor = PARTY_COLORS[d.presidentId]?.color || '#fafaf9';
        const presTag = PARTY_COLORS[d.presidentId]?.short || d.number;
        const partyTag = PARTY_COLORS[d.presidentId]?.tag || d.number;
        return { ...d, votes, pct, color: presColor, shortParty: presTag, tag: partyTag };
      })
      .sort((a, b) => b.votes - a.votes || Number(a.number) - Number(b.number));

    return {
      rankedPres,
      rankedDeps,
      validPres,
      validDep,
      blankNullPres: blankPres + nullPres,
      blankNullDep: blankDep + nullDep,
    };
  }, [countedBallots, activePresidents, deputies]);

  // Detecta virada de liderança e toca tick de lote
  useEffect(() => {
    if (step === 0) return;
    const currentLeader =
      stats.validPres > 0 && stats.rankedPres[0]?.votes > (stats.rankedPres[1]?.votes || 0)
        ? stats.rankedPres[0]
        : null;

    if (currentLeader && prevLeaderRef.current && prevLeaderRef.current !== currentLeader.id) {
      setViradaBanner(`⚡ VIRADA! ${currentLeader.name.split(' ')[0]} assume a liderança!`);
      if (soundEnabled && playing) apuracaoLeadChangeSound();
    } else if (soundEnabled && playing && step < ballots.length) {
      apuracaoTickSound();
    }
    if (currentLeader) prevLeaderRef.current = currentLeader.id;
  }, [step, stats.validPres, stats.rankedPres, soundEnabled, playing, ballots.length]);

  const historyPoints = useMemo(() => {
    const series = new Map(activePresidents.map(p => [p.id, []]));
    const running = new Map(activePresidents.map(p => [p.id, 0]));
    let validTotal = 0;

    for (let i = 0; i < step; i++) {
      const pick = ballots[i]?.president;
      if (running.has(pick)) {
        running.set(pick, running.get(pick) + 1);
        validTotal++;
      }
      const xPct = ((i + 1) / totalSections) * 100;
      for (const p of activePresidents) {
        const v = running.get(p.id) || 0;
        const yPct = validTotal > 0 ? (v / validTotal) * 100 : 0;
        series.get(p.id).push({ x: xPct, y: yPct });
      }
    }
    return series;
  }, [ballots, step, activePresidents, totalSections]);

  const zoneStats = useMemo(() => {
    return ZONES.map(z => {
      const zoneBallots = countedBallots.filter(b => b.zoneId === z.id);
      const counts = new Map(activePresidents.map(p => [p.id, 0]));
      let valid = 0;
      for (const b of zoneBallots) {
        if (counts.has(b.president)) {
          counts.set(b.president, counts.get(b.president) + 1);
          valid++;
        }
      }
      const ordered = [...activePresidents]
        .map(p => ({
          ...p,
          votes: counts.get(p.id) || 0,
          pct: valid > 0 ? ((counts.get(p.id) || 0) / valid) * 100 : 0,
          color: PARTY_COLORS[p.id]?.color || '#fafaf9',
          tag: PARTY_COLORS[p.id]?.tag || p.number,
        }))
        .sort((a, b) => b.votes - a.votes || Number(a.number) - Number(b.number));

      const leader = valid > 0 ? ordered[0] : null;
      const pctZone = (zoneBallots.length / z.sections.length) * 100;
      const remaining = Math.max(0, z.sections.length - zoneBallots.length);

      return {
        ...z,
        counted: zoneBallots.length,
        total: z.sections.length,
        pctZone,
        remaining,
        leader,
      };
    });
  }, [countedBallots, activePresidents]);

  const stateStatsMap = useMemo(() => {
    const map = new Map();
    const allUfs = [...BRAZIL_STATES.map(s => ({ uf: s.uf, region: s.region })), { uf: 'ZZ', region: 'exterior' }];

    for (const { uf, region } of allUfs) {
      const counts = new Map(activePresidents.map(p => [p.id, 0]));
      let valid = 0;
      let totalPossibleSections = 0;
      let countedSectionsInUf = 0;

      for (let sec = 1; sec <= totalSections; sec++) {
        const directUfs = SECTION_STATES[sec] || [];
        const zone = ZONES.find(z => z.sections.includes(sec));
        if (directUfs.includes(uf) || zone?.id === region) {
          totalPossibleSections++;
          if (sec <= step) countedSectionsInUf++;
        }
      }

      for (const b of countedBallots) {
        const directUfs = SECTION_STATES[b.section] || [];
        const isDirect = directUfs.includes(uf);
        const isSameRegion = b.zoneId === region;

        if (isDirect || isSameRegion) {
          const pickPres =
            tab === 'deputies'
              ? deputies.find(d => d.id === b.deputy)?.presidentId
              : b.president;
          if (counts.has(pickPres)) {
            const weight = isDirect ? 2 : 1;
            counts.set(pickPres, counts.get(pickPres) + weight);
            valid += weight;
          }
        }
      }

      const ordered = [...activePresidents]
        .map(p => ({
          ...p,
          votes: counts.get(p.id) || 0,
          pct: valid > 0 ? ((counts.get(p.id) || 0) / valid) * 100 : 0,
          color: PARTY_COLORS[p.id]?.color || '#fafaf9',
          tag: PARTY_COLORS[p.id]?.tag || p.number,
        }))
        .sort((a, b) => b.votes - a.votes || Number(a.number) - Number(b.number));

      const leader = valid > 0 ? ordered[0] : null;
      const runnerUp = valid > 0 ? ordered[1] : null;
      const margin = leader && runnerUp ? leader.pct - runnerUp.pct : 0;
      const apuradoPct = totalPossibleSections > 0 ? (countedSectionsInUf / totalPossibleSections) * 100 : 0;

      map.set(uf, {
        uf,
        region,
        valid,
        ordered,
        leader,
        pct: leader ? leader.pct : 0,
        margin,
        apuradoPct,
      });
    }
    return map;
  }, [countedBallots, activePresidents, deputies, tab, step, totalSections]);

  const feedItems = useMemo(() => {
    const items = [];
    const running = new Map(activePresidents.map(p => [p.id, 0]));
    let valid = 0;

    for (let i = 0; i < step; i++) {
      const b = ballots[i];
      if (running.has(b.president)) {
        running.set(b.president, running.get(b.president) + 1);
        valid++;
      }
      const snap = [...activePresidents]
        .map(p => ({
          name: p.name.split(' ')[0],
          pct: valid > 0 ? ((running.get(p.id) || 0) / valid) * 100 : 0,
        }))
        .sort((a, b) => b.pct - a.pct);

      items.unshift({
        id: b.section,
        time: b.time,
        title: `+1 seção apurada: ${b.zoneName} (Urna #${String(b.section).padStart(2, '0')})`,
        summary: snap.map(s => `${s.name} ${fmtPct(s.pct, 1)}%`).join(' · '),
      });
    }
    return items;
  }, [ballots, step, activePresidents]);

  const top1 = stats.rankedPres[0];
  const top2 = stats.rankedPres[1];
  const others = stats.rankedPres.slice(2);
  const remainingVotes = Math.max(0, totalSections - countedBallots.length);
  const diffVotes = (top1?.votes || 0) - (top2?.votes || 0);
  const diffPts = (top1?.pct || 0) - (top2?.pct || 0);

  // Cálculo de definição matemática antes de 100%
  const mathStatus = useMemo(() => {
    if (!top1 || !top2 || stats.validPres === 0) return null;
    const maxPossibleValid = stats.validPres + remainingVotes;
    if (simRound === 2) {
      if (top1.votes > top2.votes + remainingVotes) {
        return { type: 'elected', label: `✓ ${top1.name.split(' ')[0]} matematicamente eleito no 2º turno!` };
      }
      return null;
    }
    // 1º turno: verifica se top1 já tem mais de 50% mesmo que todos os votos restantes sejam válidos para outros
    if (top1.votes > maxPossibleValid / 2) {
      return { type: 'elected', label: `✓ ${top1.name.split(' ')[0]} matematicamente eleito em 1º turno!` };
    }
    // Verifica se nem vencendo todas as urnas restantes o líder passa de 50%
    if (top1.votes + remainingVotes <= maxPossibleValid / 2 && remainingVotes < totalSections) {
      return { type: 'runoff', label: '⚡ 2º turno matematicamente confirmado!' };
    }
    return null;
  }, [top1, top2, stats.validPres, remainingVotes, simRound, totalSections]);

  const isFinishedRunoff =
    simRound === 1 &&
    countedBallots.length === totalSections &&
    stats.validPres > 0 &&
    top1 &&
    top2 &&
    top1.votes <= stats.validPres / 2;

  const headline = useMemo(() => {
    if (tab === 'deputies') {
      const electedNames = stats.rankedDeps
        .slice(0, 4)
        .filter(d => d.votes > 0)
        .map(d => d.name.split(' ')[0]);
      if (electedNames.length === 0) return 'Aguardando abertura das urnas para Deputado';
      return `${electedNames.join(', ')} lideram as 4 vagas`;
    }
    if (countedBallots.length === 0) return 'Aguardando abertura da 1ª urna eletrônica';
    if (countedBallots.length === totalSections && stats.validPres > 0) {
      if (simRound === 2 || top1.votes > stats.validPres / 2) {
        return `${top1.name} é eleito Presidente (${simRound}º turno)`;
      }
      return `${top1.name} e ${top2.name} vão ao 2º turno`;
    }
    if (diffVotes === 0 && stats.validPres > 0) {
      return `${top1.name} e ${top2.name} empatam na liderança`;
    }
    return `${top1.name} lidera por ${diffVotes} ${diffVotes === 1 ? 'voto' : 'votos'}`;
  }, [tab, stats.rankedDeps, countedBallots.length, totalSections, stats.validPres, simRound, top1, top2, diffVotes]);

  const currentClock = countedBallots[countedBallots.length - 1]?.time || '17h00';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Calcula cor e opacidade de cada UF segundo o modo ativo (`resultado`, `vantagem`, `apurado`, `candidato`)
  const getStateVisual = useCallback(
    uf => {
      const info = stateStatsMap.get(uf);
      if (!info) return { fill: '#23211e', opacity: 0.65, displayPct: 0 };

      if (mapMode === 'apurado') {
        const toneIdx = Math.min(5, Math.floor((info.apuradoPct / 100) * 5));
        return {
          fill: IVORY_TONES[toneIdx],
          opacity: 0.95,
          displayPct: info.apuradoPct,
          dotColor: '#fafaf9',
        };
      }

      if (mapMode === 'candidato') {
        const candEntry = info.ordered.find(c => c.id === focusCandId);
        const pct = candEntry?.pct || 0;
        const color = PARTY_COLORS[focusCandId]?.color || '#3b82f6';
        const opacity = info.valid === 0 ? 0.25 : Math.max(0.28, Math.min(0.96, pct / 75));
        return { fill: color, opacity, displayPct: pct, dotColor: color };
      }

      const leader = info.leader;
      if (!leader) return { fill: '#23211e', opacity: 0.65, displayPct: 0, dotColor: '#78756e' };

      if (mapMode === 'vantagem') {
        const m = info.margin;
        const opacity = m >= 45 ? 0.98 : m >= 25 ? 0.82 : m >= 10 ? 0.64 : 0.45;
        return { fill: leader.color, opacity, displayPct: info.pct, dotColor: leader.color };
      }

      // Modo padrão: 'resultado'
      const opacity = info.margin > 30 ? 0.94 : info.margin > 15 ? 0.82 : 0.7;
      return { fill: leader.color, opacity, displayPct: info.pct, dotColor: leader.color };
    },
    [stateStatsMap, mapMode, focusCandId],
  );

  // Contagem de estados liderados por cada partido
  const stateLeadCounts = useMemo(() => {
    const counts = new Map(activePresidents.map(p => [p.id, 0]));
    for (const st of BRAZIL_STATES) {
      const leader = stateStatsMap.get(st.uf)?.leader;
      if (leader && counts.has(leader.id)) {
        counts.set(leader.id, counts.get(leader.id) + 1);
      }
    }
    return counts;
  }, [stateStatsMap, activePresidents]);

  // Cadeiras por partido entre os 4 deputados eleitos
  const deputyPartySeats = useMemo(() => {
    const counts = new Map(presidents.map(p => [p.id, 0]));
    stats.rankedDeps
      .slice(0, 4)
      .filter(d => d.votes > 0)
      .forEach(d => {
        counts.set(d.presidentId, (counts.get(d.presidentId) || 0) + 1);
      });
    return counts;
  }, [stats.rankedDeps, presidents]);

  const activeUfCode = selectedUf || hoveredUf;
  const activeUfInfo = activeUfCode ? stateStatsMap.get(activeUfCode) : null;

  return (
    <div className="ap-root">
      <header className="ap-top">
        <div className="ap-top-in">
          <div className="ap-brand-group">
            <button type="button" className="ap-back-btn" onClick={onBack}>
              ← Voltar ao site
            </button>
            <div className="ap-brand-title">
              <strong>Apuração 2026</strong>
              <span>by JEK · {simRound}º Turno</span>
            </div>
          </div>

          <nav className="ap-tabs" aria-label="Cargos em apuração">
            <button
              type="button"
              className={`ap-tab${tab === 'president' ? ' is-active' : ''}`}
              onClick={() => setTab('president')}
            >
              Presidente
            </button>
            <button
              type="button"
              className={`ap-tab${tab === 'deputies' ? ' is-active' : ''}`}
              onClick={() => setTab('deputies')}
            >
              Deputados (4 vagas)
            </button>
          </nav>

          <div className="ap-top-right">
            <span className="ap-status-indicator ap-tn">
              <i className={`ap-dot${playing ? ' is-live' : step >= totalSections ? ' is-done' : ''}`} />
              Atualizado às {currentClock} · <b>{fmtPct(pctCounted, 1)}%</b> das seções
            </span>

            {ballots.length > 0 && (
              <button
                type="button"
                className="ap-ghost-btn"
                onClick={() => setSpeed(s => (s === 1 ? 2 : 1))}
              >
                {speed}x
              </button>
            )}

            <button
              type="button"
              className="ap-ghost-btn"
              onClick={() => setSoundEnabled(v => !v)}
              title="Ativar ou silenciar som da apuração"
            >
              {soundEnabled ? '🔊 Som' : '🔇 Mudo'}
            </button>

            <button type="button" className="ap-ghost-btn" onClick={toggleFullscreen}>
              ⛶ Tela cheia
            </button>
          </div>
        </div>
      </header>

      <main className="ap-grid">
        {/* COLUNA ESQUERDA: alterna entre Disputa Presidencial e Hemiciclo de 4 Deputados */}
        <section className="ap-col">
          {tab === 'deputies' ? (
            <article className="ap-card">
              <div className="ap-kicker ap-tn">
                <span>Deputados · 4 de 6 eleitos · {fmtPct(pctCounted, 1)}% das seções</span>
              </div>

              <h1 className="ap-headline">{headline}</h1>

              {/* Barra de bancada por partido + Hemiciclo Semicircular igual ao seuimposto.com */}
              <div className="ap-party-seats-row ap-tn">
                {presidents.map(p => {
                  const info = PARTY_COLORS[p.id];
                  const sCount = deputyPartySeats.get(p.id) || 0;
                  return (
                    <span key={p.id} className="ap-party-seat-pill">
                      <i style={{ backgroundColor: info?.color }} />
                      <b>{info?.tag}</b> {sCount} {sCount === 1 ? 'vaga' : 'vagas'}
                    </span>
                  );
                })}
              </div>

              <ParliamentHemicycle rankedDeps={stats.rankedDeps} seats={4} />

              <div className="ap-dep-ranking-list ap-tn">
                {stats.rankedDeps.map((dep, idx) => {
                  const isElected = idx < 4 && dep.votes > 0;
                  return (
                    <div key={dep.id} className={`ap-dep-rank-row${isElected ? ' is-elected' : ''}`}>
                      <div className="ap-other-left">
                        <div className="ap-avatar-sm" style={photoStyle(dep, dep.color)} />
                        <div className="ap-other-info">
                          <strong>
                            {idx + 1}º · {dep.name}
                          </strong>
                          <span>
                            {dep.number} · {dep.shortParty}
                          </span>
                        </div>
                      </div>
                      <div className="ap-other-right">
                        <span className={`ap-dep-seat-tag${isElected ? ' is-elected' : ''}`}>
                          {isElected ? `ELEITO #${idx + 1}` : 'SUPLENTE'}
                        </span>
                        <strong>
                          {dep.votes}v ({fmtPct(dep.pct, 1)}%)
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="ap-card-metrics ap-tn">
                <div>
                  <span>Votos válidos</span>
                  <strong>{stats.validDep}</strong>
                </div>
                <div>
                  <span>Cadeiras em jogo</span>
                  <strong>4 de 6</strong>
                </div>
                <div>
                  <span>Brancos e nulos</span>
                  <strong>
                    {countedBallots.length > 0
                      ? `${fmtPct((stats.blankNullDep / countedBallots.length) * 100, 1)}%`
                      : '0,0%'}
                  </strong>
                </div>
              </div>
            </article>
          ) : (
            <article className="ap-card">
              <div className="ap-kicker ap-tn">
                <span>
                  Presidente · {simRound}º Turno · {fmtPct(pctCounted, 1)}% das seções
                </span>
              </div>

              <h1 className="ap-headline">{headline}</h1>

              {viradaBanner && <div className="ap-virada-alert">{viradaBanner}</div>}

              {mathStatus && (
                <div className={`ap-math-badge is-${mathStatus.type}`}>{mathStatus.label}</div>
              )}

              {top1 && top2 && (
                <>
                  <div className="ap-duel">
                    <div className="ap-duel-side">
                      <div className="ap-cand-chip">
                        <div className="ap-avatar" style={photoStyle(top1, top1.color)} />
                        <div className="ap-cand-meta">
                          <strong>{top1.name}</strong>
                          <span>{top1.shortParty}</span>
                        </div>
                      </div>
                      <div className="ap-big-pct ap-tn">
                        {fmtPct(top1.pct, 2)}
                        <sup>%</sup>
                      </div>
                      <div className="ap-vote-sub ap-tn">{top1.votes} votos</div>
                    </div>

                    <div className="ap-duel-side is-right">
                      <div className="ap-cand-chip">
                        <div className="ap-avatar" style={photoStyle(top2, top2.color)} />
                        <div className="ap-cand-meta">
                          <strong>{top2.name}</strong>
                          <span>{top2.shortParty}</span>
                        </div>
                      </div>
                      <div className="ap-big-pct ap-tn">
                        {fmtPct(top2.pct, 2)}
                        <sup>%</sup>
                      </div>
                      <div className="ap-vote-sub ap-tn">{top2.votes} votos</div>
                    </div>
                  </div>

                  <div className="ap-half-wrap">
                    <div className="ap-half-marker-row">
                      <span>50% ({simRound}º turno)</span>
                    </div>
                    <div className="ap-half-track">
                      <div
                        className="ap-half-fill-left"
                        style={{
                          width: `${Math.min(100, top1.pct)}%`,
                          backgroundColor: top1.color,
                        }}
                      />
                      <div
                        className="ap-half-fill-right"
                        style={{
                          width: `${Math.min(100, top2.pct)}%`,
                          backgroundColor: top2.color,
                        }}
                      />
                    </div>
                    <div className="ap-half-captions ap-tn">
                      <span>
                        {top1.pct > 50
                          ? 'passou de 50%'
                          : `faltam ${fmtPct(Math.max(0, 50.1 - top1.pct), 1)} pontos`}
                      </span>
                      <span>
                        {top2.pct > 50
                          ? 'passou de 50%'
                          : `faltam ${fmtPct(Math.max(0, 50.1 - top2.pct), 1)} pontos`}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="ap-stat-rows ap-tn">
                <div className="ap-stat-line">
                  <span>Vantagem</span>
                  <strong>
                    {fmtPct(diffPts, 2)} pontos ({diffVotes} {diffVotes === 1 ? 'voto' : 'votos'})
                  </strong>
                </div>
                <div className="ap-stat-line">
                  <span>Por apurar</span>
                  <strong>
                    {remainingVotes} {remainingVotes === 1 ? 'urna eleitoral' : 'urnas eleitorais'}
                  </strong>
                </div>
              </div>

              {others.length > 0 && (
                <div className="ap-other-list">
                  {others.map(cand => (
                    <div key={cand.id} className="ap-other-row">
                      <div className="ap-other-left">
                        <div className="ap-avatar-sm" style={photoStyle(cand, cand.color)} />
                        <div className="ap-other-info">
                          <strong>{cand.name}</strong>
                          <span>{cand.shortParty}</span>
                        </div>
                      </div>
                      <div className="ap-other-right ap-tn">
                        <strong>{fmtPct(cand.pct, 1)}%</strong>
                        <small>{cand.votes} votos</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="ap-card-metrics ap-tn">
                <div>
                  <span>Votos válidos</span>
                  <strong>{stats.validPres}</strong>
                </div>
                <div>
                  <span>Seções apuradas</span>
                  <strong>
                    {countedBallots.length}/{totalSections}
                  </strong>
                </div>
                <div>
                  <span>Brancos e nulos</span>
                  <strong>
                    {countedBallots.length > 0
                      ? `${fmtPct((stats.blankNullPres / countedBallots.length) * 100, 1)}%`
                      : '0,0%'}
                  </strong>
                </div>
              </div>
            </article>
          )}

          {/* Card Inferior Esquerdo: Ao longo da apuração */}
          <article className="ap-card">
            <div className="ap-chart-head">
              <h3>Ao longo da apuração</h3>
              <div className="ap-chart-legend">
                {stats.rankedPres.map(p => (
                  <span key={p.id}>
                    <i style={{ backgroundColor: p.color }} />
                    {p.name.split(' ')[0]}
                  </span>
                ))}
              </div>
            </div>

            <svg className="ap-chart-svg" viewBox="0 0 320 130" preserveAspectRatio="none">
              {[20, 40, 60, 80].map(pct => {
                const y = 110 - (pct / 100) * 95;
                return (
                  <g key={pct}>
                    <line x1="28" y1={y} x2="312" y2={y} stroke="rgba(250,250,249,0.07)" strokeWidth="1" />
                    <text x="2" y={y + 3} fill="#78756e" fontSize="9">
                      {pct}%
                    </text>
                  </g>
                );
              })}
              <line
                x1="28"
                y1={110 - 0.5 * 95}
                x2="312"
                y2={110 - 0.5 * 95}
                stroke="rgba(250,250,249,0.22)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {activePresidents.map(p => {
                const pts = historyPoints.get(p.id) || [];
                if (pts.length === 0) return null;
                const color = PARTY_COLORS[p.id]?.color || '#fff';
                const d = pts
                  .map((pt, idx) => {
                    const x = 28 + (pt.x / 100) * 284;
                    const y = 110 - (Math.min(100, pt.y) / 100) * 95;
                    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(' ');
                const last = pts[pts.length - 1];
                const lastX = 28 + (last.x / 100) * 284;
                const lastY = 110 - (Math.min(100, last.y) / 100) * 95;

                return (
                  <g key={p.id}>
                    <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx={lastX} cy={lastY} r="3.8" fill={color} />
                  </g>
                );
              })}

              <text x="28" y="126" fill="#78756e" fontSize="9">
                0% das seções
              </text>
              <text x="155" y="126" fill="#78756e" fontSize="9">
                50%
              </text>
              <text x="285" y="126" fill="#78756e" fontSize="9">
                100%
              </text>
            </svg>
          </article>
        </section>

        {/* COLUNA CENTRAL: 4 Modos do Mapa + 27 Estados + 19 Urnas + Timeline */}
        <section className="ap-col">
          <article className="ap-card ap-center-card">
            <div className="ap-center-head">
              <div className="ap-subpills" role="tablist" aria-label="Modos de leitura do mapa">
                <button
                  type="button"
                  className={`ap-subpill${mapMode === 'resultado' ? ' is-active' : ''}`}
                  onClick={() => setMapMode('resultado')}
                >
                  Estados
                </button>
                <button
                  type="button"
                  className={`ap-subpill${mapMode === 'vantagem' ? ' is-active' : ''}`}
                  onClick={() => setMapMode('vantagem')}
                >
                  Vantagem
                </button>
                <button
                  type="button"
                  className={`ap-subpill${mapMode === 'apurado' ? ' is-active' : ''}`}
                  onClick={() => setMapMode('apurado')}
                >
                  Apurado
                </button>
                <button
                  type="button"
                  className={`ap-subpill${mapMode === 'candidato' ? ' is-active' : ''}`}
                  onClick={() => setMapMode('candidato')}
                >
                  Candidato
                </button>
              </div>

              <div className="ap-map-legend ap-tn">
                {mapMode === 'candidato' ? (
                  <div className="ap-cand-filter-pills">
                    {activePresidents.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`ap-cand-filter-btn${focusCandId === p.id ? ' is-active' : ''}`}
                        onClick={() => setFocusCandId(p.id)}
                      >
                        <i style={{ backgroundColor: PARTY_COLORS[p.id]?.color }} />
                        {p.name.split(' ')[0]} ({p.number})
                      </button>
                    ))}
                  </div>
                ) : mapMode === 'apurado' ? (
                  <span className="ap-scale-legend">
                    {IVORY_TONES.slice(1).map((c, idx) => (
                      <i key={idx} style={{ backgroundColor: c }} />
                    ))}
                    <small>0% → 100% apurado</small>
                  </span>
                ) : (
                  <>
                    {stats.rankedPres.map(p => (
                      <span key={p.id}>
                        <i style={{ backgroundColor: p.color }} />
                        <b>{p.tag}</b> {stateLeadCounts.get(p.id) || 0}
                      </span>
                    ))}
                    <span className="ap-scale-legend">
                      <i style={{ backgroundColor: top1?.color || '#3b82f6', opacity: 0.42 }} />
                      <i style={{ backgroundColor: top1?.color || '#3b82f6', opacity: 0.65 }} />
                      <i style={{ backgroundColor: top1?.color || '#3b82f6', opacity: 0.84 }} />
                      <i style={{ backgroundColor: top1?.color || '#3b82f6', opacity: 1 }} />
                      <small>até 10 · 25 · 45 · + pts</small>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="ap-map-stage">
              <div className="ap-brazil-wrap">
                {/* Card de Raio-X por UF (ao clicar ou passar o mouse em um estado) */}
                {activeUfInfo && (
                  <div className="ap-uf-inspector ap-tn">
                    <div className="ap-uf-inspector-head">
                      <strong>
                        {activeUfCode === 'ZZ' ? '🌐 Exterior' : `Estado: ${activeUfCode}`}
                      </strong>
                      <span>{fmtPct(activeUfInfo.apuradoPct, 0)}% apurado</span>
                      {selectedUf && (
                        <button
                          type="button"
                          className="ap-uf-close"
                          onClick={() => setSelectedUf(null)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="ap-uf-inspector-rows">
                      {activeUfInfo.ordered.map(c => (
                        <div key={c.id} className="ap-uf-inspector-row">
                          <span>
                            <i style={{ backgroundColor: c.color }} />
                            {c.name.split(' ')[0]} ({c.tag})
                          </span>
                          <b>{fmtPct(c.pct, 1)}%</b>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <svg
                  className="ap-brazil-svg"
                  viewBox="-8 -8 692 582"
                  role="img"
                  aria-label="Mapa de apuração por estado"
                >
                  {BRAZIL_STATES.map(st => {
                    const vis = getStateVisual(st.uf);
                    const isSelected = selectedUf === st.uf;
                    return (
                      <path
                        key={st.uf}
                        d={st.d}
                        fill={vis.fill}
                        fillOpacity={vis.opacity}
                        className={`ap-state-shape${isSelected ? ' is-selected' : ''}`}
                        onMouseEnter={() => setHoveredUf(st.uf)}
                        onMouseLeave={() => setHoveredUf(null)}
                        onClick={() => setSelectedUf(prev => (prev === st.uf ? null : st.uf))}
                      />
                    );
                  })}

                  {CALLOUT_STATES.map(c => {
                    const vis = getStateVisual(c.uf);
                    const info = stateStatsMap.get(c.uf);
                    const hasData = info?.valid > 0 || mapMode === 'apurado';
                    const boxX = 592;
                    const boxW = 78;
                    const boxH = 22;
                    const midY = c.boxY + boxH / 2;

                    return (
                      <g
                        key={c.uf}
                        className="ap-callout-group"
                        onMouseEnter={() => setHoveredUf(c.uf)}
                        onMouseLeave={() => setHoveredUf(null)}
                        onClick={() => setSelectedUf(prev => (prev === c.uf ? null : c.uf))}
                      >
                        {c.anchorX !== null && (
                          <polyline
                            points={`${c.anchorX},${c.anchorY} ${boxX - 12},${midY} ${boxX},${midY}`}
                            fill="none"
                            stroke="rgba(250, 250, 249, 0.28)"
                            strokeWidth="1.1"
                          />
                        )}
                        <rect
                          x={boxX}
                          y={c.boxY}
                          width={boxW}
                          height={boxH}
                          rx="5"
                          fill={vis.fill}
                          fillOpacity={hasData ? 0.9 : 0.72}
                          stroke={selectedUf === c.uf ? '#fafaf9' : 'rgba(250, 250, 249, 0.18)'}
                          strokeWidth={selectedUf === c.uf ? '1.8' : '1'}
                        />
                        <text x={boxX + 10} y={c.boxY + 14.5} className="ap-callout-uf">
                          {c.label || c.uf}
                        </text>
                        <text x={boxX + boxW - 8} y={c.boxY + 14.5} className="ap-callout-pct">
                          {hasData ? `${fmtPct(vis.displayPct, 0)}%` : '0%'}
                        </text>
                      </g>
                    );
                  })}

                  {[...BRAZIL_STATES.filter(s => s.labelX !== null), { uf: 'DF', labelX: 382, labelY: 304 }].map(st => {
                    const vis = getStateVisual(st.uf);
                    const info = stateStatsMap.get(st.uf);
                    const showPct = info?.valid > 0 || mapMode === 'apurado';
                    return (
                      <g key={`lbl-${st.uf}`} className="ap-map-label-group">
                        <text x={st.labelX} y={st.labelY - 2} className="ap-state-label">
                          {st.uf}
                        </text>
                        {showPct && (
                          <g>
                            <circle
                              cx={st.labelX - 13}
                              cy={st.labelY + 8.5}
                              r="2.6"
                              fill={vis.dotColor}
                              stroke="#0f0e0d"
                              strokeWidth="0.8"
                            />
                            <text x={st.labelX + 3} y={st.labelY + 11.5} className="ap-state-sub">
                              {fmtPct(vis.displayPct, 0)}%
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* As 19 Seções / Urnas Individuais acendendo voto a voto */}
              <div className="ap-secoes-strip">
                <div className="ap-secoes-head ap-tn">
                  <span>Chegada das 19 Urnas Eleitorais (clique em um estado no mapa para inspecionar)</span>
                  <strong>{countedBallots.length} de {totalSections} urnas abertas</strong>
                </div>

                <div className="ap-urnas-grid">
                  {Array.from({ length: totalSections }, (_, idx) => {
                    const b = idx < step ? ballots[idx] : null;
                    const cand = b && presidents.find(p => p.id === b.president);
                    const color = cand ? PARTY_COLORS[cand.id]?.color : b ? '#52525b' : undefined;
                    return (
                      <div
                        key={idx}
                        className={`ap-urna-cell ap-tn${b ? ' is-counted' : ''}`}
                        style={
                          b
                            ? {
                                borderColor: color,
                                backgroundColor: `${color}22`,
                              }
                            : undefined
                        }
                      >
                        <div className="ap-urna-cell-top">
                          <span>#{String(idx + 1).padStart(2, '0')}</span>
                          <span>{b ? b.time : '—'}</span>
                        </div>
                        <strong>
                          {!b
                            ? 'Aguardando'
                            : cand
                              ? `${cand.number} · ${cand.name.split(' ')[0]}`
                              : b.president === 'blank'
                                ? 'Branco'
                                : 'Nulo'}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="ap-timeline ap-tn">
              <button
                type="button"
                className="ap-ghost-btn"
                onClick={() => {
                  if (step >= ballots.length) setStep(0);
                  setPlaying(p => !p);
                }}
              >
                {playing ? '⏸ Pausar' : step >= ballots.length ? '↺ Rever contagem' : '▶ Continuar'}
              </button>

              <span className="ap-time-clock">{currentClock}:10</span>

              <div className="ap-scrubber-wrap">
                <input
                  type="range"
                  min="0"
                  max={ballots.length}
                  value={step}
                  onChange={e => {
                    setPlaying(false);
                    setStep(Number(e.target.value));
                  }}
                  className="ap-scrubber"
                  aria-label="Linha do tempo da apuração"
                />
                <div className="ap-scrubber-ticks">
                  <span>17h00 (Início)</span>
                  <span>17h05</span>
                  <span>17h10</span>
                  <span>17h15</span>
                  <span>17h19 (100%)</span>
                </div>
              </div>

              <span className="ap-viewers">● 19 katequistas acompanhando</span>
            </div>
          </article>
        </section>

        {/* COLUNA DIREITA: Por Região & Últimas Atualizações */}
        <section className="ap-col ap-col-right">
          <article className="ap-card">
            <div className="ap-side-head">
              <h3>Por região</h3>
              <span>Quem lidera para presidente</span>
            </div>

            <div className="ap-region-list ap-tn">
              {zoneStats.map(z => (
                <div key={z.id} className="ap-region-item">
                  <div className="ap-region-top">
                    <span className="ap-region-name">
                      {z.name} <small style={{ color: '#78756e', fontWeight: 400 }}>· {z.subtitle}</small>
                    </span>
                    {z.leader ? (
                      <span className="ap-region-leader">
                        <span className="ap-region-avatar" style={photoStyle(z.leader, z.leader.color)} />
                        <b style={{ color: z.leader.color }}>{z.leader.tag}</b>
                        <strong>{fmtPct(z.leader.pct, 1)}%</strong>
                      </span>
                    ) : (
                      <span className="ap-region-leader" style={{ color: '#78756e' }}>
                        Aguardando urnas
                      </span>
                    )}
                  </div>
                  <div className="ap-region-sub">
                    <span>
                      {fmtPct(z.pctZone, 0)}% ·{' '}
                      {z.remaining === 0 ? 'seções totalizadas' : `faltam ${z.remaining} urna(s)`}
                    </span>
                    <div className="ap-region-mini-bar">
                      <i
                        style={{
                          width: `${z.pctZone}%`,
                          backgroundColor: z.leader?.color || '#78756e',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="ap-card">
            <div className="ap-side-head">
              <h3>Últimas atualizações</h3>
              <span>Lotes do TSE/JEK</span>
            </div>

            <div className="ap-feed-list ap-tn">
              {feedItems.length === 0 ? (
                <p style={{ color: '#78756e', fontSize: 12 }}>
                  Aguardando o encerramento oficial da votação e a abertura da 1ª urna eletrônica pela JEK.
                </p>
              ) : (
                feedItems.map(item => (
                  <div key={item.id} className="ap-feed-item">
                    <span className="ap-feed-time">{item.time}</span>
                    <span className="ap-feed-ring" aria-hidden="true" />
                    <div className="ap-feed-copy">
                      <strong>{item.title}</strong>
                      <span>{item.summary}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
