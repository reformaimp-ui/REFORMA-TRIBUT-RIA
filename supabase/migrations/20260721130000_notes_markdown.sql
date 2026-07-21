-- Base de conhecimento: notas em markdown criadas pelo usuário.
-- Remove as notas semeadas (mock) e tira notas do seed de novos escritórios.

alter table notes add column if not exists content text not null default '';

delete from notes;

create or replace function seed_office_defaults(p_office uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Marcos reais da reforma tributária (aba Prazos)
  insert into changes (office_id, month, severity, title, description, date, badge) values
    (p_office,'2026-07','informativo','CNPJ alfanumérico','', '01/07/2026','SISTEMAS'),
    (p_office,'2026-08','critico','Obrigatoriedade dos campos de IBS e CBS nas NFs','Todos os documentos eletrônicos deverão incluir a alíquota teste de 1% (0,1% de IBS e 0,9% de CBS).','03/08/2026','SISTEMAS'),
    (p_office,'2026-08','importante','NFS-e com destaque de IBS e CBS','', '03/08/2026','NFS'),
    (p_office,'2026-09','critico','NFS-e e Simples Nacional: obrigatoriedade de emissão através do Emissor Nacional','ME e EPP optantes pelo Simples Nacional deverão usar obrigatoriamente o Emissor Nacional a partir de 01/09/2026.','01/09/2026','SISTEMAS'),
    (p_office,'2026-09','critico','Escolha das empresas do Simples Nacional','Cálculo de IBS e CBS por dentro ou por fora do Simples?','01/09/2026',''),
    (p_office,'2027-01','importante','PIS e COFINS serão formalmente extintas — recolhimento da CBS','A partir de 1º de janeiro de 2027, as contribuições para o PIS e a COFINS serão formalmente extintas, passando a ter o recolhimento da CBS em alíquota cheia.','01/01/2027','SISTEMAS'),
    (p_office,'2027-01','informativo','Imposto Seletivo entra em vigor','IS passa a incidir sobre bens e serviços prejudiciais à saúde e ao meio ambiente.','01/01/2027',''),
    (p_office,'2029-01','importante','Início da transição do ICMS/ISS para o IBS','Redução gradual das alíquotas de ICMS e ISS, compensada pelo aumento do IBS, até 2032.','01/01/2029','');
end $$;
