-- Portal de pesquisa pública de tributação: acesso separado da equipe (não é
-- membro, não é a mesma entidade da aba Clientes). Só enxerga, em modo
-- leitura, os dados de referência de tributação (produtos, NCM, CST,
-- cClassTrib) do próprio escritório. Ativação controlada pelo admin.

create table search_clients (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  name       text not null,
  email      text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index search_clients_user_idx on search_clients(user_id);
create index search_clients_office_idx on search_clients(office_id);

alter table search_clients enable row level security;

-- A equipe (via auth_office_id, já existente) administra a lista.
create policy search_clients_admin_sel on search_clients for select using (office_id = auth_office_id());
create policy search_clients_admin_ins on search_clients for insert with check (office_id = auth_office_id());
create policy search_clients_admin_upd on search_clients for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy search_clients_admin_del on search_clients for delete using (office_id = auth_office_id());

-- O próprio cliente de pesquisa só enxerga a própria linha (para exibir o perfil).
create policy search_clients_self_sel on search_clients for select using (user_id = auth.uid());

-- office_id do cliente de pesquisa autenticado — só quando ativo.
create or replace function search_client_office_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select office_id from search_clients where user_id = auth.uid() and active = true limit 1;
$$;

-- Leitura pública (somente SELECT) dos dados de referência de tributação,
-- restrita ao escritório do cliente autenticado. Não concede insert/update/delete.
create policy produto_rows_portal_sel on produto_rows for select using (office_id = search_client_office_id());
create policy ncm_rows_portal_sel on ncm_rows for select using (office_id = search_client_office_id());
create policy cst_rows_portal_sel on cst_rows for select using (office_id = search_client_office_id());
create policy cclass_rows_portal_sel on cclass_rows for select using (office_id = search_client_office_id());
-- Nome do escritório exibido no layout do portal.
create policy offices_portal_sel on offices for select using (id = search_client_office_id());

-- Dígitos do NCM do produto — permite match exato em lote sem depender da
-- formatação (pontos) usada no cadastro.
alter table produto_rows add column if not exists ncm_digits text;
update produto_rows set ncm_digits = regexp_replace(ncm, '\D', '', 'g') where ncm_digits is null;
create index if not exists produto_rows_ncm_digits_idx on produto_rows(office_id, ncm_digits);
