-- Permissões granulares por membro: quais abas ele vê e o que pode
-- criar/editar/excluir. Ausência de chave = permitido (retrocompatível com
-- membros existentes). Admins sempre têm acesso total, independente do valor.
alter table members add column if not exists permissions jsonb not null default '{}'::jsonb;
