# Votações do Grupo Katequese

Urna privada para a eleição interna do grupo, feita com React/Vite, Netlify Functions e Netlify Blobs. Não é um sistema eleitoral oficial.

## Como funciona

- **/** tela inicial com candidatos, propostas e santinhos, e o caminho para votar.
- **Login do eleitor** (nome + código individual) → **urna** (presidente, depois deputado) → confirmação.
- **/admin** painel da organização: abrir e encerrar a votação, acompanhar a participação e apurar.

A votação nasce **fechada**. Quem abre e encerra é a organização, em `/admin`.

## Estrutura do projeto

```
data/                    candidatos (presidents/deputies) e eleitores de exemplo (voters)
public/candidates/       fotos e santinhos
netlify/functions/
  auth.js                login do eleitor e do admin (devolve token assinado)
  public.js              candidatos + status da votação (aberta/encerrada)
  vote.js                registra o voto (participação separada do voto)
  admin.js               visão geral, abrir/encerrar, apuração
  _lib.js                Blobs, listas, limite de tentativas, wrapper de erros
  _crypto.js             tokens HMAC, comparação segura, hash
  _tally.js              regra de apuração (testada em tests/)
src/
  main.jsx               entrada: "/admin" abre o painel, o resto abre o app
  App.jsx                fluxo do eleitor: início → login → urna → fim
  landing/               tela inicial (candidatos, carrossel de santinhos, como votar)
  screens/               Login, Urna, Done, PreviewResults
  admin/                 painel da organização
  api.js · sound.js      chamadas às Functions · bip da urna
  style.css              estilo do app (a landing tem o próprio landing.css, prefixo `lp-`)
tests/logic.test.js      apuração, tokens e sessões
```

Convenções: a landing e o app compartilham a paleta (azul-marinho `#12213a` e dourado `#f2b705`); os estilos da landing ficam isolados sob `.lp`. Os dados de candidatos são importados direto dos JSON de `data/`.

## Publicar no Netlify (passo a passo)

1. Envie o repositório ao Netlify. O `netlify.toml` já define build, publicação e funções.
2. Em **Site configuration → Environment variables**, crie:
   - `ADMIN_PASSWORD`: senha longa e única do painel.
   - `AUTH_SECRET`: texto aleatório com 32+ caracteres. Sem ele o servidor recusa tudo (de propósito).
   - `VOTERS_JSON` (recomendado): `[{"id":"jean","name":"Jean","code":"..."}, ...]` com **códigos novos e difíceis de adivinhar**. Assim os códigos não ficam no repositório.
3. Publique e abra `/admin` para conferir o painel.
4. No horário combinado (sábado 15h), entre em `/admin` → **Abrir votação**. No fim (domingo 17h) → **Encerrar votação** → **Apurar resultado**.

> Se `VOTERS_JSON` não for definido, valem os eleitores de `data/voters.json`. Se o repositório for público, **esses códigos são públicos**: troque-os antes de publicar ou use `VOTERS_JSON`. As listas são copiadas para o Blobs no primeiro acesso; depois disso, mudar os arquivos em `data/` não altera a urna (a tela inicial lê direto dos arquivos).

## Rodar localmente

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `ADMIN_PASSWORD` e `AUTH_SECRET`.
3. `npx netlify dev --offline` abre tudo (site, Functions e Blobs locais) em http://localhost:8888. Use `/admin` para abrir a votação.
4. `npm run dev` abre só o visual, sem servidor: o login entra em modo de demonstração (use o nome `Teste Catequese 2026` e o código `CATEQUESE-2026-TESTE` para ver também a tela de resultados de teste).
5. `npm test` roda os testes; `npm run build` valida o frontend.

O eleitor de teste (`testOnly`) só funciona localmente; em produção o servidor o recusa e nenhum voto de teste é gravado.

## Conteúdo (candidatos, propostas, imagens)

- `data/presidents.json` e `data/deputies.json`: nome, número, partido, foto, `slogan`, `proposals` e, nos presidentes, a lista `posters` (santinhos exibidos no carrossel).
- Imagens em `public/candidates/`. Prefira JPEG de 200 a 500 KB.
- Deputado se liga ao presidente por `presidentId`.

## Segurança e consistência

- O voto é separado da participação: `participation/<hash>` só registra que o eleitor concluiu, e `votes/<uuid>` não guarda identidade.
- A participação é criada com escrita condicional (`onlyIfNew`) e, além disso, a apuração só conta o voto que a participação do eleitor referencia. Dois envios simultâneos do mesmo eleitor resultam em **um** voto contado.
- Votos parciais ficam como `pending` (aparecem como "Em processamento" no painel). Se persistirem depois do encerramento, o eleitor precisa de apoio da organização. Netlify Blobs não tem transações, então não prometemos antifraude absoluto.
- Sessões assinadas (HMAC) expiram: 15 min para eleitor, 2 h para o painel. Há limite de tentativas de login erradas (8 em 10 min por nome e para o painel).
- A apuração só é liberada com a votação encerrada. Não divulgue resultados enquanto a votação estiver aberta.

## Regras de apuração

Desempate: menor número eleitoral. Presidente: o mais votado. Deputados: os três mais votados, independente de aliança. Votos em branco são contados à parte e não elegem ninguém.

## Pendências e pontos de atenção (para quem continuar)

- **Textos de exemplo:** `slogan` e `proposals` dos presidentes ainda são `[Slogan da campanha]` / `[Proposta N]`. Os santinhos já trazem as propostas desenhadas, então dá para remover esses textos dos cartões ou preenchê-los.
- **Fotos faltando:** Tigas e Kayo (deputados) ainda não têm foto. Defina `photo` e `photoPosition` em `data/deputies.json`. As fotos atuais são recortes de uma imagem com 3 painéis (`photoPosition` 0%, 50% ou 100%).
- **Eleitores:** `data/voters.json` tem os 4 eleitores de exemplo (e o eleitor de teste). **Troque os códigos** ou use `VOTERS_JSON`. Se alguém quiser votar só como eleitor, basta adicionar o nome e um código novo ali.
- **Abertura manual:** a votação (sábado 15h até domingo 17h) é aberta e encerrada à mão em `/admin`. O horário na tela inicial é só informativo (`VOTING_WINDOW` em `src/landing/Landing.jsx`).
- **Listas no Blobs:** candidatos e eleitores são copiados para o Blobs no primeiro acesso. Depois disso, mudar `data/*.json` não muda a urna em produção (a tela inicial muda). Para alterar com a urna já em uso, use a ação `saveList` do `admin` com a votação **encerrada**, ou limpe os Blobs do site.
- **Regra de deputados:** a lista original do grupo dizia "deputado é eleito se o presidente que apoia vencer", mas o combinado foi manter "os 3 mais votados vencem". A apuração atual segue isso (`_tally.js`).
- **Biblioteca de armazenamento:** `@netlify/blobs` precisa ser ≥ 10 (a 9.x não suportava a escrita condicional e o voto falhava com erro 500).
- **Windows:** `npx netlify dev` usa `.netlify/` para os Blobs locais; o `vite.config.js` já o ignora para o Vite não cair com EBUSY.
- **Limite de tentativas:** 8 erros de login em 10 minutos bloqueiam aquele nome por 10 minutos (inclusive com o código certo).
