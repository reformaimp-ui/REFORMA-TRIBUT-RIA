-- Vínculo entre CST e cClassTrib (um CST pode ter vários cClassTrib associados).
create table cst_cclass_links (
  id        uuid primary key default gen_random_uuid(),
  office_id uuid not null references offices(id) on delete cascade,
  cst       text not null,
  cclass    text not null,
  position  int not null default 0
);
create index cst_cclass_links_office_idx on cst_cclass_links(office_id);
create unique index cst_cclass_links_unique on cst_cclass_links(office_id, cst, cclass);

alter table cst_cclass_links enable row level security;
create policy cst_cclass_links_sel on cst_cclass_links for select using (office_id = auth_office_id());
create policy cst_cclass_links_ins on cst_cclass_links for insert with check (office_id = auth_office_id());
create policy cst_cclass_links_upd on cst_cclass_links for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy cst_cclass_links_del on cst_cclass_links for delete using (office_id = auth_office_id());
