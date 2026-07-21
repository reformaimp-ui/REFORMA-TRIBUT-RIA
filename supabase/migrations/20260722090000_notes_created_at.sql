-- Corrige a Base de conhecimento: a tabela notes nunca teve created_at,
-- mas o app consulta e ordena por essa coluna — a query falhava em silêncio
-- (data ?? []) e escondia notas já salvas.

alter table notes add column if not exists created_at timestamptz not null default now();
