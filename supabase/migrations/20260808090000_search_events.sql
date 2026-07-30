-- ─────────────────────────── Dados de Pesquisa ───────────────────────────
-- Métricas de uso do portal de pesquisa (app/pesquisa/): total de buscas de
-- produtos, serviços, lote e uso da IA por cliente de pesquisa. Diferente da
-- Auditoria, buscas são SELECTs — não há linha criada/alterada para um
-- trigger observar — então essas 4 ações (3 buscas + IA) gravam o evento
-- explicitamente ao serem chamadas.

create table search_events (
  id                uuid primary key default gen_random_uuid(),
  office_id         uuid not null references offices(id) on delete cascade,
  search_client_id  uuid references search_clients(id) on delete set null,
  kind              text not null check (kind in ('produto','servico','lote','ia')),
  term              text,
  result_count      int,
  tokens_in         int,   -- só kind = 'ia'
  tokens_out        int,   -- só kind = 'ia'
  created_at        timestamptz not null default now()
);
create index search_events_office_idx on search_events(office_id, created_at desc);
create index search_events_client_idx on search_events(search_client_id);

alter table search_events enable row level security;
-- Quem grava é o próprio cliente de pesquisa autenticado (mesmo escopo de
-- search_client_office_id() usado nas policies de leitura de produto_rows etc).
create policy search_events_ins on search_events for insert with check (office_id = search_client_office_id());
-- Quem lê é a equipe (dashboard admin) — mesmo padrão de auth_office_id().
create policy search_events_sel on search_events for select using (office_id = auth_office_id());

-- Última atividade do cliente de pesquisa no portal (proxy simples de "acesso").
alter table search_clients add column if not exists last_active_at timestamptz;
