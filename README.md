# NRmax · Consulta de Equipamentos por QR Code

Sistema de consulta de equipamentos NRmax com acesso protegido por **senha
individual de 3 dígitos**. Todos os equipamentos utilizam o **mesmo QR Code**:
ao escanear, o usuário informa sua senha e o servidor identifica
automaticamente o equipamento correspondente.

> **Status:** etapa 3 de 14 — interface visual com dados fictícios.
> Banco de dados, autenticação real, QR Code e painel administrativo serão
> implementados nas próximas etapas (ver roadmap abaixo).

---

## 🎨 Etapa atual (interface visual)

| Página | Rota | Descrição |
| --- | --- | --- |
| Acesso | `/` | Campo de senha de 3 dígitos, controle de tentativas e bloqueio temporário (simulação) |
| Equipamento | `/equip/[id]` | 3 abas: **Equipamento** (ficha técnica + validade do laudo com contador), **Manutenção** (linha do tempo + galeria ampliada), **Saúde** (estrutura "Em breve") |
| 404 | — | Equipamento não encontrado |

**Senhas de demonstração** (dados fictícios):

| Senha | Equipamento | Status do laudo |
| --- | --- | --- |
| `482` | Compressor de Parafuso VX-75 | 🟢 Válido |
| `137` | Gerador a Diesel GD-500 | 🟡 Próximo do vencimento |
| `905` | Vaso de Pressão TP-2000 | 🔴 Vencido |

> ⚠️ A validação de senha nesta etapa é **simulada no cliente** e serve apenas
> para demonstrar a interface. Ela será substituída por validação real no
> servidor (hash + rate-limit + bloqueio) na etapa de autenticação.

---

## 🚀 Executar o projeto

Pré-requisitos: **Node.js 20+** e npm.

```bash
# 1. Instalar dependências
npm install

# 2. Desenvolvimento (http://localhost:3000)
npm run dev

# 3. Produção (build + servidor)
npm run build
npm start
```

---

## 📁 Estrutura

```
pagina-qrcode/
├── public/photos/            Ilustrações de demonstração (galeria)
├── src/
│   ├── app/
│   │   ├── layout.tsx        Fonte Inter, metadata, idioma pt-BR
│   │   ├── globals.css       Design system (tokens, botões, pills, animações)
│   │   ├── page.tsx          Página de acesso (senha 3 dígitos)
│   │   ├── not-found.tsx     Equipamento não encontrado
│   │   └── equip/[id]/       Página do equipamento (3 abas)
│   ├── components/
│   │   ├── Logo.tsx          Wordmark NRmax
│   │   ├── SegmentedTabs.tsx Controle segmentado estilo iOS
│   │   └── equipamento/
│   │       ├── EquipmentView.tsx   Hero + abas + ficha técnica
│   │       ├── LaudoCard.tsx       Contador regressivo do laudo
│   │       ├── Timeline.tsx        Linha do tempo de manutenção
│   │       ├── Lightbox.tsx        Galeria ampliada (teclado ← → Esc)
│   │       └── HealthTab.tsx       Aba "Em breve" (etapa 12)
│   ├── data/equipamentos.ts  DADOS FICTÍCIOS (substituído pelo BD)
│   └── lib/laudo.ts          Regras de status/contador do laudo
├── tsconfig.json
├── next.config.ts
└── .gitignore                (.env, /uploads, /db nunca são commitados)
```

---

## 🔒 Segurança (planejado — etapas 5 a 7)

- Autenticação administrativa com **hash de senha** (bcrypt/argon2)
- Cookie de sessão **httpOnly**; rotas protegidas por middleware
- Validação de senha de equipamento **somente no servidor**, com rate-limit e
  bloqueio temporário após tentativas excessivas
- Permissões separadas: **admin** (leitura/escrita) vs **cliente** (somente
  leitura, apenas os documentos autorizados)
- Validação de tipo e tamanho de todo arquivo enviado
- **Nenhuma chave ou senha no repositório** — tudo via `.env` (exemplo em
  `.env.example`, criado na etapa de autenticação)

---

## 🗄️ Banco e arquivos (planejado — etapas 4 e 10)

- **Banco:** SQLite persistente (equipamentos, clientes, senhas, campos
  personalizados, manutenções, fotografias em metadados, documentos),
  com camada de acesso isolada para migração futura a PostgreSQL
- **Arquivos:** fotografias e documentos salvos em `/uploads/` (fora do
  banco, fora do versionamento); o banco guarda apenas caminho e metadados
- Todas as tabelas relacionadas por `equipamento_id`

---

## 📋 Roadmap das etapas

1. ✅ Analisar o repositório
2. ✅ Definir a arquitetura
3. ✅ **Interface visual (atual)**
4. ⬜ Banco de dados
5. ⬜ Autenticação (admin + cliente)
6. ⬜ QR Code único
7. ⬜ Identificação do equipamento pela senha (backend)
8. ⬜ Painel administrativo
9. ⬜ Páginas dos equipamentos (dados reais)
10. ⬜ Manutenção e fotografias (upload real)
11. ⬜ Documentos
12. ⬜ Saúde do Equipamento
13. ⬜ Testes de todas as funcionalidades
14. ⬜ Publicação (GitHub + backend + storage)

---

## 📸 Créditos das ilustrações

As imagens da galeria são **ilustrações SVG criadas para demonstração**
(`public/photos/*.svg`). Em produção, as fotografias reais serão enviadas
pelos administradores por meio do painel (etapa 10).
