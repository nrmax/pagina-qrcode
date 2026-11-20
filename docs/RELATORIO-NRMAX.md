# Relatório NRmax — Da ideia ao Supabase

> **Projeto:** NRmax · Consulta de equipamentos por QR Code
> **Repositório:** https://github.com/nrmax/pagina-qrcode (branch `main`)
> **Ambiente:** Antigravity ISE + OpenCode (agente de código)
> **Período:** Novembro de 2026
> **Objetivo deste relatório:** documentar todo o percurso para
> alimentar a skill de criação de novos projetos
> (`.opencode/skills/novo-projeto-fullstack/SKILL.md`).

---

## 1. Objetivo do projeto

Sistema de consulta de equipamentos NRmax com acesso protegido por
**senha individual de 3 dígitos**. Todos os equipamentos utilizam o
**mesmo QR Code**: ao escanear, o usuário informa sua senha e o
servidor identifica o equipamento. O QR não contém senha nem ID.

O sistema tem duas interfaces:

- **Pública:** página de acesso + ficha do equipamento com 3 abas
  (Equipamento, Manutenção, Saúde do Equipamento)
- **Administrativa:** painel com dashboard, lista de equipamentos,
  QR Code único e módulos futuros

---

## 2. Stack e decisões de arquitetura

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | **Next.js 16 (App Router) + TypeScript** | SSR, rotas de API, server-side rendering para o status do laudo em tempo real |
| Estilo | **CSS Modules + design system próprio** (sem Tailwind) | Controle total do visual premium estilo Apple |
| Backend | **API Routes** + Proxy de segurança | Validação de senha e sessão sempre no servidor |
| Banco | **Supabase (PostgreSQL)** | Persistência, RLS, Storage e escala sem servidor próprio |
| Senhas | Tabela separada com RLS negado | Nunca exposta à chave pública |
| Fotos/Documentos | **Supabase Storage** (fora do banco) | Banco guarda só caminho + metadados |
| Dados iniciais | Fictícios com **fallback** | Site nunca quebra enquanto o banco não está pronto |

> ⚠️ **Next.js 16 tem mudanças:** o `middleware.ts` foi renomeado
> para `proxy.ts`. Toda a documentação local em
> `node_modules/next/dist/docs/` foi consultada antes de codar.

---

## 3. Cronologia completa — tudo o que foi feito

### Fase 1 — Fundação e interface visual

1. **Análise do repositório** (vazio) e definição de arquitetura
2. **Base do projeto:** `package.json`, `tsconfig.json`,
   `next.config.ts`, `.gitignore`; `npm install` (0 vulnerabilidades)
3. **Design system** em `globals.css`: tokens de cor, tipografia,
   botões, pills, chips, keyframes e regra de acessibilidade
   (`prefers-reduced-motion`)
4. **Página de acesso** (`/`): 3 dígitos com avanço automático, colar
   código, erro com *shake*, 5 tentativas → bloqueio de 30s
5. **Página do equipamento** (`/equip/[id]`): barra sticky com blur,
   hero, controle segmentado estilo iOS e as 3 abas:
   - **Equipamento:** contador regressivo do laudo (verde/amarelo/
     vermelho) + prazo de alerta configurável, especificações,
     campos personalizados dinâmicos
   - **Manutenção:** linha do tempo + galeria ampliada (← → Esc)
   - **Saúde:** estrutura "Em breve" (sensores vêm depois)
6. **404 elegante**, `README.md` completo, ilustrações SVG de
   demonstração em `public/photos/` (gerador de imagens indisponível)
7. **Testes:** `npm run build` + smoke test (200/200/200/200/404)

### Fase 2 — Refinamentos visuais (solicitações do usuário)

8. **Pulsante dos status** com 3 intensidades via CSS variables:
   | Status | Intensidade | Ciclo |
   |---|---|---|
   | 🟢 Laudo válido | leve | 2,2s |
   | 🟡 Vencimento próximo | média | 1,6s |
   | 🔴 Laudo vencido | alta | 0,9s |
9. **Cores vivas** nos selos (`#34c759`, `#ffd60a`, `#ff3b30`)
10. **Correção de bug visual:** ponto branco cobrindo o texto →
    separado em `::before` (ponto contido) + `::after` (anel que
    expande e **desvanece por opacidade**)

### Fase 3 — Painel administrativo (etapa adiantada)

11. **Login de 6 dígitos** com validação **real no servidor**
12. **`src/lib/auth.ts`:** sessão = cookie httpOnly assinado com
    **HMAC-SHA256** (não forjável sem o `SESSION_SECRET`);
    comparação em tempo constante
13. **`src/proxy.ts`** (Next 16): protege `/admin/*` e
    `/api/admin/*` — redireciona para login ou responde 401
14. **`POST /api/admin/login`:** rate-limit (5 falhas → bloqueio de
    60s com `Retry-After`), falha fechada se faltar configuração
15. **Shell do painel:** barra lateral (desktop) / topo (mobile),
    itens futuros marcados "em breve", botão Sair
16. **Dashboard:** estatísticas, tabela de equipamentos e **QR Code
    único** gerado na hora (aponta só para a raiz, sem senha/ID)
17. **Testes:** 10 cenários — redirect sem sessão, 401 errada,
    200 correta com cookie httpOnly, redirect reverso, bloqueio 429,
    logout — todos ✅

### Fase 4 — Git e GitHub

18. **Auditoria de segurança pré-commit:** encontrada a **senha real
    do admin em 2 arquivos** (`.env.example` e comentário da API) →
    substituídas por placeholders e commit corrigido (`--amend`)
19. **Repositório local criado** (`git init`), 52 arquivos, **nenhum
    segredo** (`.env.local` excluído pelo `.gitignore`)
20. **Conexão ao GitHub:** merge com `--allow-unrelated-histories`
    do upload original feito pelo site (`242e6c0`) — **nada apagado**,
    histórico dos dois preservado
21. **Push** com branch alinhada (`master` → `main`)
22. **Rotação de senha** do admin (opção escolhida pelo usuário):
    a senha vazada no histórico perdeu a validade

### Fase 5 — Integração Supabase

23. **Credenciais recebidas** (Project URL + chave `publishable`) e
    **testadas** antes de usar (REST respondeu corretamente)
24. **Proposta de schema apresentada antes de criar qualquer tabela**
    (conforme regra do usuário)
25. **Migração `001_esquema_inicial.sql`** — 8 tabelas:
    `clientes`, `responsaveis`, `equipamentos`, `equipamentos_senhas`,
    `manutencoes`, `fotos`, `documentos`, `campos_tecnicos`
    - Chaves estrangeiras com `ON DELETE CASCADE`
    - `CHECK` em status/tipos, índices em busca e relações
    - **RLS habilitado em todas as tabelas**
    - Buckets `fotos` e `documentos` no Storage
    - Seed com os 3 equipamentos de demonstração
26. **Camada de dados criada:**
    - `src/lib/supabase.ts` — cliente único (chave pública)
    - `src/lib/db/tipos.ts` — tipos espelho do SQL
    - `src/lib/db/equipamentos.ts` — repositório com selects
      aninhados, mapeamento para o modelo da UI e tratamento de erros
27. **Páginas ligadas ao banco com fallback** — `/equip/[id]` e
    `/admin` leem do Supabase e caem nos dados fictícios se falhar
28. **Bug de hidratação corrigido** no dashboard
    (`window.location.origin` no SSR)
29. **SQL executado pelo usuário** no SQL Editor (eu nunca tive
    acesso ao banco)
30. **Verificação final:**
    - 3 equipamentos, 6 manutenções, 7 fotos lidos via API ✅
    - `equipamentos_senhas` → `[]` para a chave pública (**RLS
      protegendo as senhas**) ✅
    - Páginas lendo do banco sem nenhum aviso de erro ✅
31. **Commit + push** (`570a7c1`), local = remoto

---

## 4. Segurança — checklist aplicado

- [x] **Nenhum segredo no Git** — `.env.local` no `.gitignore`;
      `.env.example` com placeholders propositalmente inválidos
- [x] **Auditoria de segredos antes de cada commit** (varredura por
      valor real, não só por nome de arquivo)
- [x] **Senha do admin rotacionada** após aparecer no histórico
- [x] **Validação de senha só no servidor**, comparação em tempo
      constante, rate-limit com bloqueio
- [x] **Sessão:** cookie httpOnly assinado com HMAC-SHA256
- [x] **Proxy protege** todas as rotas administrativas
- [x] **RLS em todas as tabelas** — tabela de senhas sem policy
      (chave pública lê `[]`)
- [x] **Chave `service_role` nunca usada** no frontend (nem pedida;
      será adicionada pelo próprio usuário no servidor, quando o
      CRUD precisar de escrita)
- [x] **QR Code sem senha nem ID** — identificação só no servidor

---

## 5. Testes executados (todos ✅)

| Fase | Teste | Resultado |
|---|---|---|
| Interface | `npm run build` (TS + rotas + CSS) | 0 erros |
| Interface | Rotas `/`, `/equip/eq-00{1,2,3}`, 404 | 200/200/200/200/404 |
| Admin | Redirect sem sessão → login | 307 |
| Admin | Senha errada / correta | 401 / 200 + cookie |
| Admin | 5 falhas → bloqueio | 429 + Retry-After |
| Admin | Login logado → redirect; logout → redirect | 307 / 307 |
| Supabase | REST: equipamentos/manutenções/fotos | linhas retornando |
| Supabase | REST: tabela de senhas (anon) | `[]` (negado) |
| Supabase | Páginas lendo do banco (sem avisos de erro) | 200 reais |
| Visual | Erro de hidratação no dashboard | corrigido |

---

## 6. Estado atual

- **Código:** GitHub `nrmax/pagina-qrcode` · branch `main` ·
  commit `570a7c1` (local = remoto)
- **Banco:** Supabase live com 8 tabelas, RLS, buckets e seed
- **Servidor:** `npm run dev` em `http://localhost:3000`
- **Senhas:** admin (6 dígitos, valor real **só** no `.env.local` —
  ver `.env.example` para o formato); equipamentos `482` / `137` /
  `905` (demonstração)
- **GitHub Pages:** configurado mas **inutilizável** (não roda
  Next.js) — recomendação: desativar até a etapa de publicação

---

## 7. Roadmap restante

| # | Etapa | Status |
|---|---|---|
| 1–3 | Análise, arquitetura, interface visual | ✅ |
| — | Painel administrativo (estrutura + login) | ✅ adiantada |
| — | Git/GitHub com auditoria de segredos | ✅ |
| — | Integração Supabase (leitura) | ✅ |
| 4 | **CRUD no painel** (escrita — exige `service_role` no servidor) | ⬜ |
| 5 | **Validação de senha pela API** (QR → banco, com rate-limit) | ⬜ |
| 6 | **Upload de fotos reais** no Storage | ⬜ |
| 7 | **Documentos** (manuais, ARTs, laudos) | ⬜ |
| 8 | **Saúde do Equipamento** (sensores/telemetria) | ⬜ |
| 9 | **Testes completos** | ⬜ |
| 10 | **Publicação** (Vercel/servidor Node — não Pages) | ⬜ |

---

## 8. Lições que viraram padrão (base da skill)

1. **Processo em etapas com autorização explícita** entre cada uma
2. **Testar cada etapa** antes de avançar (build + smoke test)
3. **Auditoria de segredos antes de todo commit**; backup no GitHub
   antes de mudanças grandes
4. **Fallback de dados:** o site nunca quebra — demonstração → banco
5. **Consultar a documentação local** antes de codar (Next 16 avisou
   sobre `proxy.ts`)
6. **RLS desde o dia 1** — segurança não é etapa futura
7. **Schema proposto e aprovado antes da primeira tabela**
8. **Banco acessível só pela camada de repositório** — páginas nunca
   falam com o Supabase diretamente
9. **Comunicação em PT-BR** com resumos em tabelas e pedidos de
   autorização claros
