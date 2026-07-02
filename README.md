# Vaga Certa — site

Plataforma de vagas conectando profissionais de beleza, idiomas e outras
áreas de curso com escolas que estão contratando.

Este é agora um site de verdade, com banco de dados próprio (Supabase) e
hospedagem no Netlify. Siga o passo a passo abaixo — leva uns 20-30 minutos
na primeira vez, e depois disso é só usar.

---

## Parte 1 — Criar o banco de dados (Supabase)

1. Acesse **https://supabase.com** e crie uma conta gratuita (pode entrar com o Google).
2. Clique em **New project**. Dê um nome (ex.: `vaga-certa`), crie uma senha
   de banco de dados (guarde em local seguro, mas você não vai precisar
   dela no dia a dia) e escolha uma região perto do Brasil (`South America (São Paulo)`
   se aparecer, ou a mais próxima disponível).
3. Espere o projeto ser criado (1-2 minutos).
4. No menu lateral, clique em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` (está nesta mesma pasta), copie
   **todo o conteúdo** e cole na caixa de texto do SQL Editor.
6. Clique em **Run** (ou Ctrl+Enter). Deve aparecer "Success" — isso cria
   todas as tabelas e já deixa os códigos de acesso iniciais cadastrados.
7. No menu lateral, clique em **Storage** → **Create a new bucket**.
   - Nome: `avatars` → marque **Public bucket** → Create.
   - Crie outro: nome `curriculos` → marque **Public bucket** → Create.
8. Ainda no Supabase, vá em **Project Settings** (ícone de engrenagem) → **API**.
   Você vai precisar de duas informações desta página:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa)
   - Mais abaixo nessa mesma página, em "Project API keys", existe também
     a **service_role key** — copie ela também, você vai precisar dela na Parte 3.
     ⚠️ Essa chave é secreta — nunca cole ela no `index.html`, só no Netlify (Parte 3).

---

## Parte 2 — Colar as chaves no site

1. Abra o arquivo `index.html` num editor de texto (pode ser o Bloco de Notas, VS Code, etc.).
2. Procure por estas duas linhas, perto do topo do `<script>`:
   ```js
   const SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE';
   const SUPABASE_ANON_KEY = 'COLE_AQUI_A_ANON_KEY_DO_SEU_PROJETO_SUPABASE';
   ```
3. Substitua pelos valores que você copiou no passo 8 da Parte 1 (Project URL e anon public key).
   Essas duas informações **podem ficar visíveis no código** — não são secretas,
   foram feitas para isso (a segurança real vem das regras que já configuramos no banco).
4. Salve o arquivo.

---

## Parte 3 — Publicar no Netlify

1. Acesse **https://netlify.com** e crie uma conta gratuita.
2. A forma mais simples de publicar:
   - Clique em **Add new site** → **Deploy manually**.
   - Arraste a **pasta inteira** `vaga-certa-site` (com o `index.html`, a pasta
     `netlify` e o `package.json` dentro) para a área de upload.
   - Netlify vai te dar um link tipo `https://nome-aleatorio.netlify.app` — esse já é o site funcionando.
   - *(Forma melhor pro dia a dia: subir esses arquivos pra um repositório no
     GitHub e conectar o Netlify a esse repositório — assim, toda vez que o
     código for atualizado, o Netlify publica automaticamente. Mas pra
     começar, o arrastar-e-soltar já funciona.)*
3. Agora configure as variáveis secretas: no painel do site no Netlify, vá em
   **Site configuration** → **Environment variables** → **Add a variable**, e
   crie estas três:
   - `ANTHROPIC_API_KEY` → sua chave da API da Anthropic (veja abaixo onde conseguir)
   - `SUPABASE_URL` → a mesma Project URL da Parte 1
   - `SUPABASE_SERVICE_ROLE_KEY` → a service_role key da Parte 1 (a secreta)
4. Depois de adicionar as variáveis, vá em **Deploys** e clique em
   **Trigger deploy** → **Deploy site** pra garantir que elas sejam aplicadas.

### Onde conseguir a chave da Anthropic (`ANTHROPIC_API_KEY`)
Acesse **https://console.anthropic.com**, crie uma conta (ou entre na sua),
vá em **API Keys** → **Create Key**. Essa conta funciona com cobrança por
uso (bem barato para o volume de um app como esse) — diferente da sua
assinatura do Claude.ai, que é separada.

---

## Parte 4 — Testar

1. Abra o link do seu site (`https://seu-site.netlify.app`).
2. Teste o cadastro de um profissional e de uma escola.
3. Teste o botão "✨ Melhorar com IA" e a "🤖 Busca de candidatos por IA" —
   se a chave da Anthropic estiver certa, deve funcionar normalmente agora.
4. Teste o acesso administrativo com o código `vagas2026`.
5. Peça pra alguém de fora (um amigo, um número diferente) abrir o mesmo
   link e confirme que ela vê os mesmos cadastros que você fez — esse é o
   teste de que os dados estão realmente compartilhados.

---

## Códigos de acesso já cadastrados

| Tipo | Códigos |
|---|---|
| Administrador | `vagas2026`, `admin-2026-02` a `admin-2026-05` |
| Candidato | `candidato-2026-01` a `candidato-2026-05` |
| Escola | `escola-2026-01` a `escola-2026-05` |

Você pode adicionar, listar e remover códigos diretamente pelo painel
administrativo do site (aba que aparece ao entrar com um código de admin).

---

## Domínio próprio (opcional)

No painel do Netlify, em **Domain management**, você pode adicionar um
domínio próprio (ex.: `vagacerta.com.br`) caso compre um — o Netlify te
guia o passo a passo de configuração de DNS.

---

## Limitações e próximos passos recomendados

- **Sem autenticação de verdade**: hoje qualquer pessoa com um código de
  escola/candidato consegue criar quantos cadastros quiser com aquele
  código. Pra um negócio maior, o ideal é evoluir pra contas de verdade
  (e-mail + senha) usando o **Supabase Auth** — posso te ajudar a montar
  isso quando fizer sentido.
- **Arquivos públicos**: os buckets de fotos e currículos estão marcados
  como públicos (qualquer um com o link exato vê o arquivo, mas o link é
  longo e aleatório). Pra mais privacidade no currículo, dá pra trocar
  pra bucket privado com link temporário — outra melhoria futura.
- **Backup**: o Supabase free tier não faz backup automático constante.
  Recomendo, de tempos em tempos, exportar as tabelas (Table Editor →
  cada tabela → Export → CSV) como uma cópia de segurança extra.
