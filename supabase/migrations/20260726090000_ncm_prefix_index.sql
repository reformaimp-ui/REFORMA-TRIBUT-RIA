-- Acelera buscas por prefixo em code_digits (getNcmChildren, searchNcm, getNcmTree)
-- via text_pattern_ops, que permite ao Postgres usar índice para "LIKE 'x%'"
-- independente da collation do banco (o índice único padrão não acelera isso).
create index if not exists ncm_rows_digits_prefix_idx on ncm_rows(office_id, code_digits text_pattern_ops);
