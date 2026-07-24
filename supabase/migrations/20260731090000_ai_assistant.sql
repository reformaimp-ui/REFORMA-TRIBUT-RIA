-- Assistente de IA (Claude) para classificação de NCM/NBS e tributação
-- estimada. Controle de acesso em dois níveis: escritório (chave-geral) e
-- cliente de pesquisa individual (mesmo padrão de search_clients.active).
alter table offices add column if not exists ai_search_enabled boolean not null default true;
alter table search_clients add column if not exists ai_enabled boolean not null default true;
