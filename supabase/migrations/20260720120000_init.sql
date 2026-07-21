-- Reforma 2033 — schema inicial (multi-tenant por escritório, isolado por RLS)
-- Toda tabela carrega office_id (desnormalizado) para RLS trivial e rápida.

create extension if not exists pgcrypto;

-- ─────────────────────────── Tenant + pessoas ───────────────────────────

create table offices (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  cnpj       text,
  accent     text not null default '#4653d6',
  created_at timestamptz not null default now()
);

-- Membros = pessoas atribuíveis. user_id liga à conta auth quando ela existe.
create table members (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null,
  email      text,
  ini        text not null default '??',
  color      text not null default '#4653d6',
  cargo      text,
  role       text not null default 'membro' check (role in ('admin','membro')),
  created_at timestamptz not null default now()
);
create index members_office_idx on members(office_id);
create index members_user_idx on members(user_id);

-- ─────────────────────────── Fluxos ───────────────────────────

create table flows (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);
create index flows_office_idx on flows(office_id);

create table flow_nodes (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  flow_id    uuid not null references flows(id) on delete cascade,
  node_key   text not null,
  x          double precision not null default 0,
  y          double precision not null default 0,
  title      text not null default 'Nova etapa',
  descr      text not null default '',
  color      text not null default '#5b5f6b',
  unique (flow_id, node_key)
);
create index flow_nodes_flow_idx on flow_nodes(flow_id);

create table flow_edges (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  flow_id    uuid not null references flows(id) on delete cascade,
  source_key text not null,
  target_key text not null,
  unique (flow_id, source_key, target_key)
);
create index flow_edges_flow_idx on flow_edges(flow_id);

-- ─────────────────────────── Clientes ───────────────────────────

create table clients (
  id             uuid primary key default gen_random_uuid(),
  office_id      uuid not null references offices(id) on delete cascade,
  name           text not null,
  setor          text,
  regime         text not null default 'Simples Nacional',
  resp_member_id uuid references members(id) on delete set null,
  pct            int not null default 0,
  status         text not null default 'Em dia',
  ini            text not null default '??',
  color          text not null default '#4653d6',
  created_at     timestamptz not null default now()
);
create index clients_office_idx on clients(office_id);

-- ─────────────────────────── Tarefas ───────────────────────────

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references offices(id) on delete cascade,
  title       text not null,
  description text,
  category    text not null default 'Fiscal',
  start_date  date,
  due_date    date,
  rec         boolean not null default false,
  rec_label   text default 'mensal',
  flow_id     uuid references flows(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index tasks_office_idx on tasks(office_id);

create table subtasks (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  title      text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index subtasks_task_idx on subtasks(task_id);

create table task_people (
  office_id uuid not null references offices(id) on delete cascade,
  task_id   uuid not null references tasks(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  primary key (task_id, member_id)
);

create table task_clients (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  task_id   uuid not null references tasks(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  unique (task_id, client_id)
);
create index task_clients_task_idx on task_clients(task_id);
create index task_clients_client_idx on task_clients(client_id);

-- Presença = subtarefa concluída para aquele cliente. pct = concluídas / total.
create table subtask_completions (
  office_id      uuid not null references offices(id) on delete cascade,
  task_client_id uuid not null references task_clients(id) on delete cascade,
  subtask_id     uuid not null references subtasks(id) on delete cascade,
  primary key (task_client_id, subtask_id)
);

create table comments (
  id               uuid primary key default gen_random_uuid(),
  office_id        uuid not null references offices(id) on delete cascade,
  task_id          uuid not null references tasks(id) on delete cascade,
  author_member_id uuid references members(id) on delete set null,
  text             text not null,
  created_at       timestamptz not null default now()
);
create index comments_task_idx on comments(task_id);

-- ─────────────────────────── Prazos / calendário ───────────────────────────

create table changes (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references offices(id) on delete cascade,
  month       text not null,                       -- 'YYYY-MM'
  severity    text not null default 'informativo', -- informativo | importante | critico
  title       text not null,
  description text,
  date        text,                                -- 'DD/MM/YYYY' (exibição)
  badge       text,
  created_at  timestamptz not null default now()
);
create index changes_office_idx on changes(office_id);

create table events (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  date       date not null,
  title      text not null,
  tipo       text not null default 'acessoria',    -- acessoria | pagamento | reforma | interno
  detail     text,
  created_at timestamptz not null default now()
);
create index events_office_idx on events(office_id);

-- ─────────────────────────── Referência IBS/CBS ───────────────────────────

create table cst_rows (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  code      text not null,
  descr     text not null default '',
  position  int not null default 0
);
create index cst_office_idx on cst_rows(office_id);

create table cclass_rows (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  code      text not null,
  descr     text not null default '',
  position  int not null default 0
);
create index cclass_office_idx on cclass_rows(office_id);

create table produto_rows (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  ncm       text not null,
  descr     text not null default '',
  cst       text,
  cclass    text,
  aliq_ibs  text,
  aliq_cbs  text,
  red_ibs   text,
  red_cbs   text,
  position  int not null default 0
);
create index produto_office_idx on produto_rows(office_id);

-- ─────────────────────────── Base de conhecimento ───────────────────────────

create table notes (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  title     text not null,
  sub       text,
  tags      text[] not null default '{}',
  meta      text,
  paras     jsonb not null default '[]',
  position  int not null default 0
);
create index notes_office_idx on notes(office_id);

-- ─────────────────────────── RLS ───────────────────────────

-- office do usuário atual. SECURITY DEFINER → não recorre nas policies de members.
create or replace function auth_office_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select office_id from members where user_id = auth.uid() limit 1;
$$;

-- offices: leitura/edição só do próprio tenant (criação via RPC security definer).
alter table offices enable row level security;
create policy offices_sel on offices for select using (id = auth_office_id());
create policy offices_upd on offices for update using (id = auth_office_id()) with check (id = auth_office_id());

-- Demais tabelas: policy padrão office_id = auth_office_id().
do $$
declare t text;
begin
  foreach t in array array[
    'members','clients','tasks','subtasks','task_people','task_clients',
    'subtask_completions','comments','changes','events','flows',
    'flow_nodes','flow_edges','cst_rows','cclass_rows','produto_rows','notes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
