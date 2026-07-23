-- Tributação dos serviços (aba IBS e CBS) — mesma lógica de produto_rows, mas
-- chaveada por NBS (Nomenclatura Brasileira de Serviços) em vez de NCM.

create table servico_rows (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references offices(id) on delete cascade,
  item        text not null default '',
  nbs         text not null,
  nbs_digits  text,
  nbs_descr   text not null default '',
  indop       text,
  local_ibs   text,
  cclass      text,
  cclass_nome text,
  position    int not null default 0
);
create index servico_office_idx on servico_rows(office_id);
create unique index servico_rows_unique on servico_rows(office_id, nbs, cclass);
create index servico_rows_nbs_idx on servico_rows(office_id, nbs);
create index servico_rows_nbs_digits_idx on servico_rows(office_id, nbs_digits);

alter table servico_rows enable row level security;
create policy servico_rows_sel on servico_rows for select using (office_id = auth_office_id());
create policy servico_rows_ins on servico_rows for insert with check (office_id = auth_office_id());
create policy servico_rows_upd on servico_rows for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy servico_rows_del on servico_rows for delete using (office_id = auth_office_id());
