-- Corrige a chave de unicidade de produto_rows: um NCM pode ter várias
-- tributações (CST/cClassTrib diferentes) — a duplicidade real é
-- (office_id, ncm, cst, cclass), não (office_id, ncm) sozinho.

drop index if exists produto_rows_unique;

-- Dedup pela chave correta (não deveria remover nada em uso normal —
-- só protege contra alguma duplicata exata que tenha entrado nos testes).
delete from produto_rows a using produto_rows b
  where a.ctid < b.ctid
    and a.office_id = b.office_id
    and a.ncm = b.ncm
    and coalesce(a.cst, '') = coalesce(b.cst, '')
    and coalesce(a.cclass, '') = coalesce(b.cclass, '');

create unique index if not exists produto_rows_unique
  on produto_rows(office_id, ncm, cst, cclass);

-- Índice de apoio para "todas as tributações de um NCM" (usado pela tela/consulta).
create index if not exists produto_rows_ncm_idx on produto_rows(office_id, ncm);
