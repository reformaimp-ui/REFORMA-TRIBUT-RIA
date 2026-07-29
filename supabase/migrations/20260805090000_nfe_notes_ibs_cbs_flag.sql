-- Sinaliza se a nota traz o bloco <IBSCBS> em algum item — usado para marcar
-- fornecedores/clientes que já emitem com IBS/CBS destacado na NF-e.
alter table nfe_notes add column tem_ibs_cbs boolean not null default false;
