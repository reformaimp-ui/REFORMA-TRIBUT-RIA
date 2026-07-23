-- Ativar/inativar pessoas da equipe sem excluí-las (mesmo padrão de
-- search_clients.active, mas sem alterar auth_office_id() — a checagem
-- fica na aplicação, em lib/data.ts).
alter table members add column if not exists active boolean not null default true;
