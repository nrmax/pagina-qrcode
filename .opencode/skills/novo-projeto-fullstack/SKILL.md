---
name: novo-projeto-fullstack
description: Cria novos projetos web full-stack do zero (site, sistema, painel administrativo, MVP) seguindo o método validado no projeto NRmax: processo por etapas com autorização explícita, Next.js 16 + TypeScript + design system próprio estilo Apple, segurança desde o primeiro commit, backup auditado no GitHub e integração com Supabase. Use SEMPRE que o usuário pedir para criar um novo projeto, começar um projeto do zero, "levanta um site/app/sistema", fazer um protótipo completo, integrar um novo projeto ao GitHub/Supabase ou seguir um roteiro de etapas para um projeto novo, mesmo que ele não diga a palavra "skill".
---

# Novo projeto full-stack (método NRmax)

Objetivo: tirar um projeto do zero até funcionando, **sem perder nada
do que já existe, sem vazar segredo e sem surpresa no final**. Responda
sempre em português do Brasil.

Por que esse método: no projeto NRmax (docs/RELATORIO-NRMAX.md) ele
produziu 31 etapas executadas, 0 dados perdidos, 0 segredos no Git e
um sistema com GitHub + Supabase no ar. O usuário deste ambiente valoriza
**controle**: ele autoriza cada etapa e espera um resumo testado antes
de seguir.

## 1. Regras de ouro (nunca quebre)

1. **Uma etapa por vez, com autorização explícita.** Apresente o plano
   da etapa, execute, teste, resuma e **pare**. Não avance sozinho.
2. **Preserve tudo que existe.** Nada de apagar, sobrescrever ou
   "melhorar" o que já funciona sem pedir. Trate arquivos existentes
   como trabalho do usuário.
3. **Teste antes de reportar.** Toda etapa termina com
   `npm run build` + um teste real (rota HTTP, consulta, login).
   Erro encontrado = corrigido dentro da etapa.
4. **Nenhum segredo no Git nem no chat.** Varredura por *valor real*
   (não só por nome de arquivo) antes de todo commit.
5. **Segurança é etapa 1, não etapa futura:** RLS, validação no
   servidor, cookie httpOnly, rate-limit — desde o começo.
6. **O site nunca quebra:** enquanto a fonte real (banco) não está
   pronta, mantenha um *fallback* para dados de demonstração.
7. **Respostas em PT-BR**, com tabelas de status, caminhos de arquivo
   explícitos e pedido de autorização claro ao fim de cada etapa.

## 2. Sequência padrão de etapas

Apresente esta lista ao usuário no início e vá marcando:

| # | Etapa | Entregável |
|---|---|---|
| 1 | Análise do repositório + arquitetura | Plano aprovado |
| 2 | Base do projeto (deps, config, design system) | Build verde |
| 3 | Interface visual com dados fictícios | Site navegável |
| 4 | Backend: auth + proteção de rotas | Login testado |
| 5 | Git: auditoria de segredos + commit + push | Backup no GitHub |
| 6 | Banco de dados (schema proposto ANTES das tabelas) | Tabelas + RLS |
| 7 | Integração de leitura com fallback | Dados reais no site |
| 8 | CRUD + uploads + módulos restantes | Funcionalidades |
| 9 | Testes completos | Checklist verde |
| 10 | Publicação | Site no ar |

Se o usuário já tiver um roteiro próprio (como o NRmax), **siga o
roteiro dele** e use esta lista só como referência.

## 3. Stack padrão

- **Next.js 16 (App Router) + TypeScript** — leia
  `node_modules/next/dist/docs/` antes de codar; este Next tem
  mudanças (ex.: `middleware.ts` → **`proxy.ts`**).
- **CSS Modules + design system próprio** (sem Tailwind): tokens em
  `globals.css` (`--brand`, `--ink`, `--line`, `--r-*`, `--shadow-*`,
  keyframes), classes utilitárias (`.btn`, `.pill`, `.chip`, `.card`),
  um módulo CSS por componente. Visual premium estilo Apple: limpo,
  minimalista, animações suaves, responsivo, com
  `prefers-reduced-motion`.
- **Estrutura:**
  ```
  src/app/            páginas + rotas de API + proxy.ts
  src/components/     componentes (UI por módulo: X.tsx + X.module.css)
  src/lib/            auth.ts, supabase.ts
  src/lib/db/         tipos.ts + repositório (única porta para o banco)
  src/data/           dados de demonstração (fallback)
  supabase/migrations/ SQL versionado
  docs/               relatórios
  ```
- **Padrões:** página dinâmica com `export const dynamic =
  "force-dynamic"` quando lê banco/data; erros de hidratação evitados
  calculando `window`/`Date` só em `useEffect`; contadores regressivos
  no cliente com estado inicial do servidor.

## 4. Segurança (checklist obrigatório)

- `.env.local` e `.env*` no `.gitignore`; `.env.example` com
  placeholders **propositalmente inválidos** (falha fechada)
- Sessão: cookie **httpOnly** assinado com HMAC-SHA256 de um
  `SESSION_SECRET` aleatório; comparação em tempo constante
- API de login: rate-limit por IP (5 falhas → 60s) e `Retry-After`
- Proxy (`src/proxy.ts`) protegendo `/admin/*` e `/api/admin/*`
- Supabase: **RLS em todas as tabelas desde a migração 1**; tabela de
  senhas **sem policy** (chave pública lê `[]`); `service_role` só no
  servidor, adicionada pelo próprio usuário no `.env.local` — **nunca
  peça a chave secreta no chat**
- Antes de cada commit: varredura por segredos reais
  (`git grep` pelo valor, não só pelo nome)

## 5. GitHub (backup seguro)

1. `git init` (se preciso) → conferir `.gitignore` → `git add -A`
2. **Auditoria:** `.env.local` ausente do índice? algum valor real de
   senha/chave presente? Só então commitar
3. Mensagem no formato `tipo: descrição`
   (`feat:`, `fix:`, `chore:`, `merge:`)
4. Remote: peça a **URL HTTPS do repo** (não é segredo). Se o repo já
   tiver commits (upload pelo site), **una com
   `git merge origin/main --allow-unrelated-histories`** resolvendo
   conflitos — **nunca force-push** por padrão
5. Confirme `git status -sb` sem ahead/behind após o push
6. Se aparecer segredo em commit antigo: **rotacione a senha**
   (mais rápido e seguro que reescrever histórico)

## 6. Supabase (padrão de integração)

1. **Peça ao usuário, por etapa, só o necessário:** Project URL +
   chave `anon`/`publishable` (podem ser coladas no chat — são
   públicas). Senha do banco, `service_role` e tokens pessoais:
   **nunca**.
2. **Schema antes do SQL:** apresente tabela de tabelas, campos,
   tipos, PK/FK, índices e políticas; só crie depois da aprovação.
3. **Migração em `supabase/migrations/NNN_descricao.sql`** — idempotente
   (`create table if not exists`, `on conflict do nothing`), com RLS,
   índices, buckets do Storage e seed dos dados fictícios. O usuário
   roda no **SQL Editor** (você não tem e não deve ter acesso ao banco).
4. **Código:** `src/lib/supabase.ts` (cliente com chave pública),
   `src/lib/db/tipos.ts` (tipos espelho do SQL),
   `src/lib/db/repositorio.ts` (selects aninhados + mapeamento para o
   modelo da UI + `try/catch` retornando `null`).
5. **Fallback:** página tenta o banco; se `null`, usa
   `src/data/` — log com `console.warn("[db] ...")` para diagnóstico.
6. **Verificação:** teste a REST direto (`curl` com `apikey`), confirme
   que dados sensíveis retornam `[]`, depois confirme nas **logs do
   servidor** que a página consultou sem avisos.

## 7. Teste mínimo de cada etapa

- `npm run build` — 0 erros de TypeScript/compilação
- Rotas: HTTP 200 nas páginas principais, 404 no inexistente
- Auth: sem sessão → redirect; credencial errada → 401; correta →
  200; limite de tentativas → 429; logout → redirect
- Banco: consulta REST + página renderizando + log sem `[db]`
- Hidratação: abrir a página no navegador e conferir o console
  (sem erro de hydration)

## 8. Comunicação

- Responda em **português do Brasil**; frases curtas, tabelas para
  status, caminhos de arquivo sempre completos.
- Ao fim de cada etapa: **o que foi feito · o que foi testado ·
  pendências · pedido de autorização** para a próxima.
- Quando precisar de algo do usuário (URL, credencial, execução de
  SQL), diga: **o que precisa · onde ele encontra · por quê · como
  fornecer com segurança**.
- Erros e limitações: diga na hora, com a correção aplicada.

## 9. Entrega final

Ao concluir o projeto (ou um marco grande), gere um relatório em
`docs/` no padrão de `docs/RELATORIO-NRMAX.md`: objetivo, stack,
cronologia fase a fase, segurança (checklist), testes, estado atual,
roadmap restante e lições aprendidas — é a matéria-prima para
aperfeiçoar esta skill.
