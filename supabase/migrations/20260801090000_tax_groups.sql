-- Grupos e subgrupos de tributação IBS/CBS: organização livre por escritório
-- para segregar tributações de produtos (NCM) e de serviços (NBS) em
-- categorias definidas pelo usuário (ex: "Produtor Rural" > "Soja"). Árvores
-- separadas por tipo, profundidade ilimitada via parent_id, e uma mesma
-- tributação pode estar vinculada a vários grupos ao mesmo tempo.

create table tax_groups (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  kind       text not null check (kind in ('produto','servico')),
  parent_id  uuid references tax_groups(id) on delete cascade,
  name       text not null,
  notes      text,
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index tax_groups_office_idx on tax_groups(office_id, kind);
create index tax_groups_parent_idx on tax_groups(parent_id);

create table tax_group_produtos (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  group_id   uuid not null references tax_groups(id) on delete cascade,
  produto_id uuid not null references produto_rows(id) on delete cascade,
  notes      text,
  position   int not null default 0,
  unique (group_id, produto_id)
);
create index tax_group_produtos_group_idx on tax_group_produtos(group_id);
create index tax_group_produtos_produto_idx on tax_group_produtos(produto_id);

create table tax_group_servicos (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  group_id   uuid not null references tax_groups(id) on delete cascade,
  servico_id uuid not null references servico_rows(id) on delete cascade,
  notes      text,
  position   int not null default 0,
  unique (group_id, servico_id)
);
create index tax_group_servicos_group_idx on tax_group_servicos(group_id);
create index tax_group_servicos_servico_idx on tax_group_servicos(servico_id);

do $$
declare t text;
begin
  foreach t in array array['tax_groups','tax_group_produtos','tax_group_servicos'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
