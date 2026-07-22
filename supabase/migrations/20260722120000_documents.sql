-- ─────────────────────────── Arquivos (gerenciador de arquivos) ───────────────────────────
-- Pastas, notas de texto e arquivos importados (PDF, planilhas, fotos etc), em árvore.

create table documents (
  id           uuid primary key default gen_random_uuid(),
  office_id    uuid not null references offices(id) on delete cascade,
  parent_id    uuid references documents(id) on delete cascade,
  kind         text not null check (kind in ('folder','text','file')),
  name         text not null,
  content      text,                 -- kind = 'text' (markdown)
  storage_path text,                 -- kind = 'file'
  mime_type    text,
  size_bytes   bigint,
  created_by   uuid references members(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index documents_office_idx on documents(office_id);
create index documents_parent_idx on documents(parent_id);

alter table documents enable row level security;
create policy documents_sel on documents for select using (office_id = auth_office_id());
create policy documents_ins on documents for insert with check (office_id = auth_office_id());
create policy documents_upd on documents for update using (office_id = auth_office_id()) with check (office_id = auth_office_id());
create policy documents_del on documents for delete using (office_id = auth_office_id());

-- ─────────────────────────── Storage: bucket "documents" ───────────────────────────
-- Privado. Caminho dos objetos: "<office_id>/<document_id>-<nome do arquivo>".

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_storage_sel on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth_office_id()::text);
create policy documents_storage_ins on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth_office_id()::text);
create policy documents_storage_upd on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth_office_id()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth_office_id()::text);
create policy documents_storage_del on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth_office_id()::text);
