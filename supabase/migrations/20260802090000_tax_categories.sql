-- Categorias (multi-tag, com cor) para as tributações vinculadas aos grupos
-- de IBS/CBS. Lista única por tipo (produto/serviço), compartilhada entre
-- todos os grupos e subgrupos daquele tipo — uma tributação vinculada pode
-- ter várias categorias ao mesmo tempo.

create table tax_categories (
  id         uuid primary key default gen_random_uuid(),
  office_id  uuid not null references offices(id) on delete cascade,
  kind       text not null check (kind in ('produto','servico')),
  name       text not null,
  color      text not null default '#4653d6',
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index tax_categories_office_idx on tax_categories(office_id, kind);
create unique index tax_categories_unique on tax_categories(office_id, kind, name);

create table tax_group_produto_categories (
  tax_group_produto_id uuid not null references tax_group_produtos(id) on delete cascade,
  category_id           uuid not null references tax_categories(id) on delete cascade,
  office_id              uuid not null references offices(id) on delete cascade,
  primary key (tax_group_produto_id, category_id)
);
create index tax_group_produto_categories_cat_idx on tax_group_produto_categories(category_id);

create table tax_group_servico_categories (
  tax_group_servico_id uuid not null references tax_group_servicos(id) on delete cascade,
  category_id            uuid not null references tax_categories(id) on delete cascade,
  office_id               uuid not null references offices(id) on delete cascade,
  primary key (tax_group_servico_id, category_id)
);
create index tax_group_servico_categories_cat_idx on tax_group_servico_categories(category_id);

do $$
declare t text;
begin
  foreach t in array array['tax_categories','tax_group_produto_categories','tax_group_servico_categories'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (office_id = auth_office_id())', t||'_sel', t);
    execute format('create policy %I on %I for insert with check (office_id = auth_office_id())', t||'_ins', t);
    execute format('create policy %I on %I for update using (office_id = auth_office_id()) with check (office_id = auth_office_id())', t||'_upd', t);
    execute format('create policy %I on %I for delete using (office_id = auth_office_id())', t||'_del', t);
  end loop;
end $$;
