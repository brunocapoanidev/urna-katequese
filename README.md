# Urna do Grupo de Catequese

Urna privada para eleição interna, feita com React/Vite, Netlify Functions e Netlify Blobs. Não é um sistema eleitoral oficial.

## Rodar e publicar

1. `npm install`
2. Copie `.env.example` para `.env` e defina `ADMIN_PASSWORD` e um `AUTH_SECRET` longo.
3. `npx netlify dev` abre o projeto local, com Functions e Blobs locais. `npm run build` valida o frontend.
4. Envie o repositório ao Netlify, configure as mesmas variáveis em **Site configuration → Environment variables** e publique. O `netlify.toml` já aponta build, publicação e funções. Blobs é criado automaticamente no contexto do site.

Os exemplos de candidatos e eleitores estão em `data/`. Altere-os antes do primeiro acesso: a primeira função os copia para Blobs. Códigos de exemplo devem ser trocados. A rota `/admin` permite abrir/encerrar e apurar; a senha nunca vai ao frontend.

## Segurança e consistência

O voto é separado da participação: `participation/<hash>` só registra que o eleitor concluiu, enquanto `votes/<uuid>` não contém identidade. A participação é criada com `onlyIfNew`, uma escrita condicional atômica que impede dois envios simultâneos de concluírem para o mesmo eleitor. Votos parciais ficam como `pending`, protegendo contra dupla votação em falhas, mas exigem apoio da organização caso uma execução seja interrompida entre a reserva e a escrita do voto. Netlify Blobs não fornece transações; portanto este projeto não promete antifraude absoluto. Não publique resultados enquanto a votação estiver aberta.

Desempate: menor número eleitoral. Deputados: três maiores totais, independente de aliança.
