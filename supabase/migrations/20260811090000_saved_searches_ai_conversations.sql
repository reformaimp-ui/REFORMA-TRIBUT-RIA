-- ─────────── Salvos do portal de pesquisa + histórico do Assistente IA ───────────
-- Duas coisas que o cliente de pesquisa passa a guardar:
--   1. saved_searches    — resultados que ele marcou explicitamente ("favoritar")
--   2. ai_conversations  — as conversas com o assistente, gravadas sozinhas,
--      para poder reabrir e continuar de onde parou
-- Em ambos, quem escreve é só o próprio cliente; a equipe do escritório lê
-- (suporte), mesmo padrão de leitura de search_events.

-- id do cliente de pesquisa autenticado (complementa search_client_office_id()).
create or replace function auth_search_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from search_clients where user_id = auth.uid() and active = true limit 1;
$$;

-- ─────────────────────────── Pesquisas salvas ───────────────────────────
-- Guarda só a identificação do resultado (código + rótulos), nunca as
-- alíquotas: abrir um salvo refaz a busca pelo código, então o cliente
-- sempre vê a tributação vigente, e não um retrato do dia em que salvou.
create table saved_searches (
  id                uuid primary key default gen_random_uuid(),
  office_id         uuid not null references offices(id) on delete cascade,
  search_client_id  uuid not null references search_clients(id) on delete cascade,
  kind              text not null check (kind in ('produto','servico')),
  ref               text not null,  -- chave estável do resultado (ncm|cst|cclass)
  code              text not null,  -- NCM ou NBS, como exibido
  title             text not null,
  subtitle          text,
  note              text,
  created_at        timestamptz not null default now()
);
create unique index saved_searches_uniq on saved_searches(search_client_id, kind, ref);
create index saved_searches_client_idx on saved_searches(search_client_id, created_at desc);
create index saved_searches_office_idx on saved_searches(office_id, created_at desc);

alter table saved_searches enable row level security;

create policy saved_searches_self_sel on saved_searches for select using (search_client_id = auth_search_client_id());
create policy saved_searches_self_ins on saved_searches for insert with check (
  search_client_id = auth_search_client_id() and office_id = search_client_office_id()
);
create policy saved_searches_self_upd on saved_searches for update
  using (search_client_id = auth_search_client_id()) with check (search_client_id = auth_search_client_id());
create policy saved_searches_self_del on saved_searches for delete using (search_client_id = auth_search_client_id());
-- Equipe do escritório: leitura para suporte.
create policy saved_searches_office_sel on saved_searches for select using (office_id = auth_office_id());

-- ────────────────────── Conversas do Assistente IA ──────────────────────
create table ai_conversations (
  id                uuid primary key default gen_random_uuid(),
  office_id         uuid not null references offices(id) on delete cascade,
  search_client_id  uuid not null references search_clients(id) on delete cascade,
  title             text not null default 'Nova conversa',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index ai_conversations_client_idx on ai_conversations(search_client_id, updated_at desc);
create index ai_conversations_office_idx on ai_conversations(office_id, updated_at desc);

create table ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references ai_conversations(id) on delete cascade,
  role             text not null check (role in ('user','assistant')),
  text             text not null,
  created_at       timestamptz not null default now()
);
create index ai_messages_conv_idx on ai_messages(conversation_id, created_at);

alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;

create policy ai_conversations_self_sel on ai_conversations for select using (search_client_id = auth_search_client_id());
create policy ai_conversations_self_ins on ai_conversations for insert with check (
  search_client_id = auth_search_client_id() and office_id = search_client_office_id()
);
create policy ai_conversations_self_upd on ai_conversations for update
  using (search_client_id = auth_search_client_id()) with check (search_client_id = auth_search_client_id());
create policy ai_conversations_self_del on ai_conversations for delete using (search_client_id = auth_search_client_id());
create policy ai_conversations_office_sel on ai_conversations for select using (office_id = auth_office_id());

-- Mensagens herdam o acesso da conversa.
create policy ai_messages_self_sel on ai_messages for select using (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.search_client_id = auth_search_client_id())
);
create policy ai_messages_self_ins on ai_messages for insert with check (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.search_client_id = auth_search_client_id())
);
create policy ai_messages_self_del on ai_messages for delete using (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.search_client_id = auth_search_client_id())
);
create policy ai_messages_office_sel on ai_messages for select using (
  exists (select 1 from ai_conversations c where c.id = conversation_id and c.office_id = auth_office_id())
);
