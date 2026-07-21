-- Prazos: conteúdo em markdown por mudança + meses persistidos (grupos podem existir vazios)

alter table changes add column if not exists content text not null default '';

create table if not exists prazo_months (
  office_id uuid not null references offices(id) on delete cascade,
  month     text not null, -- 'YYYY-MM'
  primary key (office_id, month)
);

alter table prazo_months enable row level security;
create policy prazo_months_sel on prazo_months for select using (office_id = auth_office_id());
create policy prazo_months_ins on prazo_months for insert with check (office_id = auth_office_id());
create policy prazo_months_upd on prazo_months for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy prazo_months_del on prazo_months for delete using (office_id = auth_office_id());
