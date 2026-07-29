-- Notas fiscais (NF-e/NFC-e) importadas via XML, para a aba de Análise da
-- reforma tributária: fornecedores e clientes são calculados a partir desta
-- tabela (agregação por emitente/destinatário), sem tabela própria.

create table nfe_notes (
  id                 uuid primary key default gen_random_uuid(),
  office_id          uuid not null references offices(id) on delete cascade,
  tipo               text not null check (tipo in ('compra','venda')),
  mod                text not null check (mod in ('55','65')),
  chave              text not null check (char_length(chave) = 44),
  numero             text,
  serie              text,
  data_emissao       timestamptz,
  natureza_operacao  text,
  emit_documento     text not null,
  emit_nome          text not null,
  emit_fantasia      text,
  emit_uf            text,
  emit_municipio     text,
  dest_documento     text,
  dest_nome          text,
  dest_uf            text,
  dest_municipio     text,
  valor_produtos     numeric,
  valor_desconto     numeric,
  valor_frete        numeric,
  valor_icms         numeric,
  valor_pis          numeric,
  valor_cofins       numeric,
  valor_ibs          numeric,
  valor_cbs          numeric,
  valor_total        numeric not null,
  arquivo_nome       text,
  created_at         timestamptz not null default now(),
  unique (office_id, chave)
);
create index nfe_notes_emit_idx on nfe_notes(office_id, emit_documento) where tipo = 'compra';
create index nfe_notes_dest_idx on nfe_notes(office_id, dest_documento) where tipo = 'venda';

do $$
declare t text;
begin
  foreach t in array array['nfe_notes'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
