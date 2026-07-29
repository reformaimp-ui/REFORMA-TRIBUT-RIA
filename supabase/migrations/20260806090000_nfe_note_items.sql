-- Itens (produtos) de cada NF-e/NFC-e importada — usados para agregar
-- "Produtos Comprados"/"Produtos Vendidos" por empresa. Denormaliza
-- office_id/empresa_id/tipo/nat_op da nota-mãe (mesmo padrão do resto do
-- schema) pra agregar direto sem join. FK com cascade: reimportar ou apagar
-- a nota re-sincroniza/apaga os itens automaticamente.

create table nfe_note_items (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  note_id    uuid not null references nfe_notes(id) on delete cascade,
  empresa_id uuid references nfe_empresas(id) on delete set null,
  tipo       text not null check (tipo in ('compra','venda')),
  nome       text not null,
  cfop       text,
  nat_op     text,
  valor      numeric not null,
  created_at timestamptz not null default now()
);
create index nfe_note_items_note_idx on nfe_note_items(note_id);
create index nfe_note_items_empresa_idx on nfe_note_items(office_id, empresa_id, tipo);

do $$
declare t text;
begin
  foreach t in array array['nfe_note_items'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
