-- Árvore de NCM: base oficial de capítulos/posições/subposições/itens, com
-- hierarquia derivada por prefixo de dígitos (o formato da tabela oficial mistura
-- códigos com "." em posições variáveis — normalizamos para dígitos puros e
-- reconstituímos a árvore por prefixo, sem depender de nível fixo).

create table ncm_rows (
  id          uuid primary key default gen_random_uuid(),
  office_id   uuid not null references offices(id) on delete cascade,
  code        text not null,              -- código como na tabela oficial, ex: "0102.21.10"
  code_digits text not null,              -- só dígitos, ex: "01022110" — chave de hierarquia/busca
  descr       text not null default '',
  position    int not null default 0
);
create unique index ncm_rows_unique on ncm_rows(office_id, code_digits);
create index ncm_rows_office_idx on ncm_rows(office_id);
create index ncm_rows_descr_trgm on ncm_rows using gin (descr gin_trgm_ops);

alter table ncm_rows enable row level security;
create policy ncm_rows_sel on ncm_rows for select using (office_id = auth_office_id());
create policy ncm_rows_ins on ncm_rows for insert with check (office_id = auth_office_id());
create policy ncm_rows_upd on ncm_rows for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy ncm_rows_del on ncm_rows for delete using (office_id = auth_office_id());
