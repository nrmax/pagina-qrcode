-- ============================================================
-- NRmax · Migração 001 — Esquema inicial (Supabase/PostgreSQL)
-- Execute o arquivo INTEIRO no SQL Editor do Supabase.
-- Idempotente: pode ser reexecutado sem quebrar nada.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CLIENTES
-- ------------------------------------------------------------
create table if not exists public.clientes (
  id          text primary key,
  nome        text not null,
  cnpj_cpf    text,
  endereco    text,
  telefone    text,
  email       text,
  observacoes text,
  criado_em   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. RESPONSÁVEIS
-- ------------------------------------------------------------
create table if not exists public.responsaveis (
  id          text primary key,
  nome        text not null,
  cargo       text,
  email       text,
  telefone    text,
  cliente_id  text references public.clientes (id) on delete set null,
  criado_em   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. EQUIPAMENTOS (núcleo do sistema)
-- ------------------------------------------------------------
create table if not exists public.equipamentos (
  id                 text primary key,
  codigo             text unique,
  nome               text not null,
  tipo               text,
  fabricante         text,
  modelo             text,
  ano_fabricacao     integer,
  numero_serie       text,
  local_instalacao   text,
  data_instalacao    date,
  status             text not null default 'ativo'
                       check (status in ('ativo', 'manutencao', 'inativo', 'desativado')),
  potencia           text,
  tensao             text,
  capacidade         text,
  foto_hero          text,
  laudo_numero       text,
  laudo_emitido_em   date,
  laudo_vencimento_em date,
  laudo_alerta_dias  integer not null default 30,
  observacoes        text,
  cliente_id         text references public.clientes (id) on delete set null,
  responsavel_id     text references public.responsaveis (id) on delete set null,
  criado_em          timestamptz not null default now(),
  atualizado_em      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. SENHAS DE ACESSO (3 dígitos)
--    Tabela separada de propósito: o RLS nega leitura para a
--    chave pública — a senha nunca sai do servidor.
-- ------------------------------------------------------------
create table if not exists public.equipamentos_senhas (
  equipamento_id text primary key
                   references public.equipamentos (id) on delete cascade,
  senha          text not null,
  atualizado_em  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. MANUTENÇÕES
-- ------------------------------------------------------------
create table if not exists public.manutencoes (
  id                 text primary key,
  equipamento_id     text not null
                       references public.equipamentos (id) on delete cascade,
  tipo               text not null default 'preventiva'
                       check (tipo in ('preventiva', 'corretiva', 'preditiva', 'inspecao')),
  data               date not null,
  servico            text not null,
  descricao          text,
  diagnostico        text,
  solucao            text,
  pecas              jsonb not null default '[]'::jsonb,
  responsavel        text,
  status             text not null default 'concluida'
                       check (status in ('pendente', 'em_andamento', 'concluida')),
  proxima_manutencao date,
  criado_em          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. FOTOS (arquivos no Supabase Storage — aqui só os metadados)
-- ------------------------------------------------------------
create table if not exists public.fotos (
  id             text primary key,
  equipamento_id text not null
                   references public.equipamentos (id) on delete cascade,
  manutencao_id  text references public.manutencoes (id) on delete cascade,
  storage_path   text not null,
  legenda        text,
  alt            text,
  tipo           text not null default 'manutencao'
                   check (tipo in ('equipamento', 'instalacao', 'manutencao', 'antes_depois')),
  data_envio     date not null default current_date
);

-- ------------------------------------------------------------
-- 7. DOCUMENTOS (manuais, projetos, ARTs, laudos, relatórios…)
-- ------------------------------------------------------------
create table if not exists public.documentos (
  id             text primary key,
  equipamento_id text references public.equipamentos (id) on delete cascade,
  cliente_id     text references public.clientes (id) on delete cascade,
  manutencao_id  text references public.manutencoes (id) on delete cascade,
  nome           text not null,
  tipo           text not null default 'outro'
                   check (tipo in ('manual', 'projeto', 'art', 'laudo',
                                   'relatorio', 'certificado', 'outro')),
  storage_path   text not null,
  data_upload    date not null default current_date,
  check (equipamento_id is not null
      or cliente_id is not null
      or manutencao_id is not null)
);

-- ------------------------------------------------------------
-- 8. CAMPOS TÉCNICOS PERSONALIZADOS
--    Estrutura relacional (não JSONB): consultas, tipagem e
--    ordenação seguras; a ficha renderiza dinamicamente.
-- ------------------------------------------------------------
create table if not exists public.campos_tecnicos (
  id             text primary key,
  equipamento_id text not null
                   references public.equipamentos (id) on delete cascade,
  chave          text not null,
  valor          text not null,
  unidade        text,
  grupo          text not null default 'personalizado',
  ordem          integer not null default 0,
  unique (equipamento_id, chave)
);

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------
create index if not exists idx_equipamentos_cliente    on public.equipamentos (cliente_id);
create index if not exists idx_equipamentos_status     on public.equipamentos (status);
create index if not exists idx_equipamentos_serie      on public.equipamentos (numero_serie);
create index if not exists idx_senhas_senha            on public.equipamentos_senhas (senha);
create index if not exists idx_responsaveis_cliente    on public.responsaveis (cliente_id);
create index if not exists idx_manutencoes_equip       on public.manutencoes (equipamento_id, data desc);
create index if not exists idx_fotos_equip             on public.fotos (equipamento_id);
create index if not exists idx_fotos_manut             on public.fotos (manutencao_id);
create index if not exists idx_campos_equip            on public.campos_tecnicos (equipamento_id, ordem);
create index if not exists idx_documentos_equip        on public.documentos (equipamento_id);

-- ------------------------------------------------------------
-- RLS — Row Level Security
--    Todas as tabelas protegidas. A chave pública (anon) tem
--    APENAS leitura do conteúdo público. Escrita e leitura de
--    senhas acontecem somente no servidor (service_role), nas
--    etapas de CRUD e validação de senha.
-- ------------------------------------------------------------
alter table public.clientes          enable row level security;
alter table public.responsaveis      enable row level security;
alter table public.equipamentos      enable row level security;
alter table public.equipamentos_senhas enable row level security;
alter table public.manutencoes       enable row level security;
alter table public.fotos             enable row level security;
alter table public.documentos        enable row level security;
alter table public.campos_tecnicos   enable row level security;

-- Leitura pública (conteúdo das fichas)
drop policy if exists leitura_publica on public.clientes;
drop policy if exists leitura_publica on public.responsaveis;
drop policy if exists leitura_publica on public.equipamentos;
drop policy if exists leitura_publica on public.manutencoes;
drop policy if exists leitura_publica on public.fotos;
drop policy if exists leitura_publica on public.documentos;
drop policy if exists leitura_publica on public.campos_tecnicos;

create policy leitura_publica on public.clientes        for select using (true);
create policy leitura_publica on public.responsaveis    for select using (true);
create policy leitura_publica on public.equipamentos    for select using (true);
create policy leitura_publica on public.manutencoes     for select using (true);
create policy leitura_publica on public.fotos           for select using (true);
create policy leitura_publica on public.documentos      for select using (true);
create policy leitura_publica on public.campos_tecnicos for select using (true);

-- equipamentos_senhas: SEM policy de select → negado para anon.

-- ------------------------------------------------------------
-- STORAGE — buckets de fotos e documentos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true), ('documentos', 'documentos', true)
on conflict (id) do nothing;

drop policy if exists leitura_publica_storage on storage.objects;
create policy leitura_publica_storage on storage.objects
  for select using (bucket_id in ('fotos', 'documentos'));

-- ============================================================
-- SEED — dados de demonstração migrados do módulo fictício
-- (idempotente: `on conflict do nothing`)
-- ============================================================

-- Clientes
insert into public.clientes (id, nome, endereco, telefone, email) values
  ('cliente-001', 'Indústria Metalúrgica Vale Norte', 'Rod. Industrial, km 42 — Pólo Tecnológico, Ipatinga/MG', '(31) 3220-1450', 'contato@valenorte.com.br'),
  ('cliente-002', 'Centro Logístico Serra Azul',      'Av. do Porto, 1.850 — Distrito Logístico, Cubatão/SP',   '(13) 3377-2080', 'manutencao@serraazul.com.br'),
  ('cliente-003', 'Cooperativa Agroindustrial Campo Verde', 'Estrada do Campo, km 7 — Zona Rural, Rio Verde/GO', '(64) 3562-9010', 'contato@campoverde.coop.br')
on conflict (id) do nothing;

-- Responsáveis
insert into public.responsaveis (id, nome, cargo, email, telefone, cliente_id) values
  ('resp-001', 'Eng.ª Marina Duarte', 'NRmax Serviços Técnicos', 'marina.duarte@nrmax.com.br', '(31) 99812-4477', null),
  ('resp-002', 'Eng. Rafael Lima',    'NRmax Serviços Técnicos', 'rafael.lima@nrmax.com.br',  '(31) 99640-2231', null)
on conflict (id) do nothing;

-- Equipamentos
insert into public.equipamentos (
  id, codigo, nome, tipo, fabricante, modelo, ano_fabricacao, numero_serie,
  local_instalacao, status, potencia, tensao, capacidade, foto_hero,
  laudo_numero, laudo_emitido_em, laudo_vencimento_em, laudo_alerta_dias,
  cliente_id, responsavel_id
) values
  ('eq-001', 'EQ-001', 'Compressor de Parafuso', 'Compressor de parafuso', 'AeroForge', 'VX-75', 2021, 'AF-VX75-2104873',
   'Rod. Industrial, km 42 — Pólo Tecnológico, Ipatinga/MG', 'ativo',
   '75 kW', '380 V / 60 Hz', '13 m³/min @ 8 bar', '/photos/manutencao-01.svg',
   'LT-2026-0412', '2026-08-31', '2027-08-31', 45, 'cliente-001', 'resp-001'),
  ('eq-002', 'EQ-002', 'Gerador a Diesel', 'Gerador', 'Voltrax', 'GD-500', 2019, 'VT-GD500-1907742',
   'Av. do Porto, 1.850 — Distrito Logístico, Cubatão/SP', 'ativo',
   '500 kVA', '380 V / 60 Hz', '500 kVA contínuo', '/photos/manutencao-04.svg',
   'LT-2025-0918', '2025-12-20', '2026-12-20', 30, 'cliente-002', 'resp-002'),
  ('eq-003', 'EQ-003', 'Vaso de Pressão Horizontal', 'Vaso de pressão', 'Ferrax', 'TP-2000', 2017, 'FX-TP2000-1703315',
   'Estrada do Campo, km 7 — Zona Rural, Rio Verde/GO', 'ativo',
   '—', '—', '2.000 L @ 10 bar', '/photos/manutencao-01.svg',
   'LT-2025-0271', '2025-11-05', '2026-11-05', 60, 'cliente-003', 'resp-001')
on conflict (id) do nothing;

-- Senhas de acesso (visíveis apenas no servidor)
insert into public.equipamentos_senhas (equipamento_id, senha) values
  ('eq-001', '482'),
  ('eq-002', '137'),
  ('eq-003', '905')
on conflict (equipamento_id) do nothing;

-- Campos técnicos personalizados
insert into public.campos_tecnicos (id, equipamento_id, chave, valor, ordem) values
  ('ct-001', 'eq-001', 'Pressão de trabalho',      '8 bar',                    1),
  ('ct-002', 'eq-001', 'Tipo de óleo',              'Sintético ISO VG 46',      2),
  ('ct-003', 'eq-001', 'Horas de operação',         '11.480 h',                 3),
  ('ct-004', 'eq-001', 'Nível de ruído',            '68 dB(A) @ 1 m',           4),
  ('ct-005', 'eq-002', 'Autonomia',                 '18 h @ 75% de carga',      1),
  ('ct-006', 'eq-002', 'Tanque',                    '900 L',                    2),
  ('ct-007', 'eq-002', 'Horas de operação',         '3.260 h',                  3),
  ('ct-008', 'eq-002', 'Nível de ruído',            '72 dB(A) @ 7 m',           4),
  ('ct-009', 'eq-003', 'Volume útil',               '2.000 L',                  1),
  ('ct-010', 'eq-003', 'Pressão máxima de trabalho','10 bar',                   2),
  ('ct-011', 'eq-003', 'Corpo',                     'Aço carbono ASTM A516 Gr. 70', 3),
  ('ct-012', 'eq-003', 'Inspeção interna',          'A cada 2 anos',            4)
on conflict (id) do nothing;

-- Manutenções
insert into public.manutencoes (
  id, equipamento_id, tipo, data, servico, descricao, pecas, responsavel, status
) values
  ('m-010', 'eq-001', 'preventiva', '2026-09-18', 'Revisão geral de 4.000 horas',
   'Troca completa dos elementos filtrantes, óleo sintético e verificação da correia de acionamento. Teste de pressão de corte e conferência da válvula de segurança.',
   '["Filtro de óleo", "Filtro de ar", "Óleo sintético ISO VG 46"]', 'Marina Duarte — Eng.ª Mecânica', 'concluida'),
  ('m-009', 'eq-001', 'preventiva', '2026-05-04', 'Inspeção elétrica e testes de comutação',
   'Termografia do painel, aperto de barramentos e teste dos contadores de horas. Corrigido afrouxamento no terminal do contator principal.',
   '["Contator 100 A", "Terminal barramento"]', 'Rafael Lima — Técnico de Manutenção', 'concluida'),
  ('m-008', 'eq-001', 'preventiva', '2026-01-27', 'Troca do separador de óleo',
   'Substituição programada do separador de óleo com medição de queda de pressão antes e após a troca. Valores dentro do especificado.',
   '["Separador de óleo"]', 'Marina Duarte — Eng.ª Mecânica', 'concluida'),
  ('m-007', 'eq-002', 'preventiva', '2026-08-12', 'Manutenção preventiva de 250 horas',
   'Troca de óleo e filtros, teste de carga em bancada e conferência do sistema de refrigeração. Bateria substituída por baixa retenção.',
   '["Óleo 15W-40", "Filtro de combustível", "Bateria 135 Ah"]', 'Rafael Lima — Técnico de Manutenção', 'concluida'),
  ('m-006', 'eq-002', 'inspecao', '2026-02-09', 'Teste de carga e calibração',
   'Aplicação de carga em 25%, 50%, 75% e 100% com registro de tensão e frequência. Regulagem do governador ajustada.',
   '[]', 'Marina Duarte — Eng.ª Mecânica', 'concluida'),
  ('m-005', 'eq-003', 'inspecao', '2026-06-30', 'Inspeção interna e teste hidrostático',
   'Inspeção interna com endoscopia, medição de espessura ultrassônica e teste hidrostático a 1,5× a pressão de trabalho. Sem indicação de corrosão relevante.',
   '["Junção de vedação da tampa"]', 'Marina Duarte — Eng.ª Mecânica', 'concluida')
on conflict (id) do nothing;

-- Fotos das manutenções (hoje: ilustrações locais; depois: Storage)
insert into public.fotos (id, equipamento_id, manutencao_id, storage_path, legenda, alt, tipo) values
  ('f-001', 'eq-001', 'm-010', '/photos/manutencao-03.svg', 'Elementos filtrantes substituídos',   'Ilustração dos filtros e peças substituídos na revisão', 'manutencao'),
  ('f-002', 'eq-001', 'm-010', '/photos/manutencao-02.svg', 'Inspeção com registro em campo',      'Ilustração de técnico registrando a inspeção em tablet', 'manutencao'),
  ('f-003', 'eq-001', 'm-009', '/photos/manutencao-04.svg', 'Conferência do painel elétrico',      'Ilustração de painel elétrico sendo inspecionado', 'manutencao'),
  ('f-004', 'eq-001', 'm-008', '/photos/manutencao-01.svg', 'Unidade após a substituição',         'Ilustração da sala de compressores após a manutenção', 'manutencao'),
  ('f-005', 'eq-002', 'm-007', '/photos/manutencao-02.svg', 'Registro da manutenção preventiva',   'Ilustração de técnico realizando manutenção preventiva', 'manutencao'),
  ('f-006', 'eq-002', 'm-007', '/photos/manutencao-03.svg', 'Peças substituídas',                  'Ilustração das peças substituídas na preventiva', 'manutencao'),
  ('f-007', 'eq-003', 'm-005', '/photos/manutencao-01.svg', 'Vaso após inspeção e teste',          'Ilustração do equipamento após inspeção', 'manutencao')
on conflict (id) do nothing;

-- ============================================================
-- Fim da migração 001
-- ============================================================
