-- Escala da aba IBS/CBS: idempotência de importações + índices de busca/paginação.
-- Objetivo: suportar importação e consulta de 10k+ linhas em produto_rows.

-- ─────────── Deduplicação antes de criar índices únicos ───────────
-- Mantém a linha de maior ctid (mais recente) por chave.

delete from produto_rows a using produto_rows b
  where a.ctid < b.ctid and a.office_id = b.office_id and a.ncm = b.ncm;

delete from cst_rows a using cst_rows b
  where a.ctid < b.ctid and a.office_id = b.office_id and a.code = b.code;

delete from cclass_rows a using cclass_rows b
  where a.ctid < b.ctid and a.office_id = b.office_id and a.code = b.code;

-- ─────────── Índices únicos → habilitam upsert idempotente ───────────

create unique index if not exists produto_rows_unique on produto_rows(office_id, ncm);
create unique index if not exists cst_rows_unique     on cst_rows(office_id, code);
create unique index if not exists cclass_rows_unique  on cclass_rows(office_id, code);

-- ─────────── Índices de apoio à busca/paginação em escala ───────────
-- Ordenação estável por office + position (paginação por range).
create index if not exists produto_rows_office_pos_idx on produto_rows(office_id, position);
-- Busca textual por NCM (prefixo) e descrição (ILIKE) sem varrer a tabela toda.
create extension if not exists pg_trgm;
create index if not exists produto_rows_ncm_trgm   on produto_rows using gin (ncm gin_trgm_ops);
create index if not exists produto_rows_descr_trgm on produto_rows using gin (descr gin_trgm_ops);
