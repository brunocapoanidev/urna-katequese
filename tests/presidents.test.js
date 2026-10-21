import { describe, expect, it } from 'vitest';
import presidents from '../data/presidents.json';
import deputies from '../data/deputies.json';
import { formatDeputyLine } from '../src/landing/PartyProposals.jsx';

describe('propostas dos partidos', () => {
  it('publica as cinco propostas do Partido Cuiudo', () => {
    const pedro = presidents.find(candidate => candidate.id === 'pedro-galli');

    expect(pedro.proposals).toHaveLength(5);
    expect(pedro.proposals.map(proposal => proposal.title)).toEqual([
      'Reforma Administrativa dos encontros',
      'Programa Rolê Aleatório',
      'Ministério do churrasco e da cerveja',
      'Auxílio Camel',
      'Projeto transporte',
    ]);
    expect(pedro.proposals[0]).toEqual({
      title: 'Reforma Administrativa dos encontros',
      text: 'Fim da burocracia para organizar encontros. Criação de um calendário oficial de festas. Tigas e anderson, como Deputado Grupal, fiscalizará o cumprimento das promessas e cobrará os membros que só aparecem quando tem comida.',
    });
  });

  it('mantém cada proposta pronta para renderização responsiva', () => {
    for (const president of presidents) {
      for (const proposal of president.proposals || []) {
        expect(proposal.title.trim()).not.toBe('');
        expect(proposal.text.trim()).not.toBe('');
      }
    }
  });

  it('identifica os deputados da chapa de Pedro Galli', () => {
    expect(formatDeputyLine(deputies, 'pedro-galli')).toBe('Tigas (5138) e Anderson (3869)');
  });

  it('publica as cinco propostas do Partido Nacional da Katequese', () => {
    const bruno = presidents.find(candidate => candidate.id === 'bruno-capoani');

    expect(bruno).toMatchObject({
      slogan: 'Compromisso com a galera, resultado na prática.',
    });
    expect(bruno.proposals.map(proposal => proposal.title)).toEqual([
      'Programa de Organização e Integração',
      'Programa Novas Experiências',
      'Projeto Confraternização Garantida',
      'Programa de Benefícios nos Eventos',
      'Programa Mobilidade para Todos',
    ]);
    expect(bruno.proposals[0].text).toBe('Facilitar a organização dos encontros e estabelecer um calendário de eventos para o grupo. A proposta é diminuir a enrolação, definir datas com antecedência e garantir que os compromissos assumidos sejam cumpridos.');
  });
});
