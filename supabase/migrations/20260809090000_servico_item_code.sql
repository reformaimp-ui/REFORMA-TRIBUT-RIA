-- Código do item da lista de serviços (LC 116/2003), ex.: "01.01" — fica ao lado
-- da descrição do item já existente em servico_rows.item.

alter table servico_rows add column if not exists item_code text not null default '';
create index if not exists servico_rows_item_code_idx on servico_rows(office_id, item_code);
