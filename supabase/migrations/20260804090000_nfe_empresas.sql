-- Empresas (clientes do módulo de Análise NF-e): cada nota importada é vinculada
-- a uma empresa, para que fornecedores/clientes possam ser vistos por empresa.
-- empresa_id fica nullable em nfe_notes para não quebrar notas já importadas
-- antes desta migration — o app passa a exigir a seleção a partir de agora.

create table nfe_empresas (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  nome       text not null,
  cnpj       text,
  created_at timestamptz not null default now()
);
create unique index nfe_empresas_cnpj_idx on nfe_empresas(office_id, cnpj) where cnpj is not null;

alter table nfe_notes add column empresa_id uuid references nfe_empresas(id) on delete set null;
create index nfe_notes_empresa_idx on nfe_notes(office_id, empresa_id);

do $$
declare t text;
begin
  foreach t in array array['nfe_empresas'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
