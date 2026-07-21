-- Remove CSTs e cClassTrib do seed de novos escritórios (tabelas começam vazias;
-- o escritório cadastra os próprios códigos) e apaga os já semeados.

delete from cst_rows;
delete from cclass_rows;

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

  -- Base de conhecimento: legislação real da reforma
  insert into notes (office_id, title, sub, tags, meta, paras, position) values
    (p_office,'LC 214/2025 — regulamentação do IBS, CBS e IS','Lei complementar · sancionada em 16/01/2025',
      array['Legislação','CBS/IBS'],'Referência legislativa',
      to_jsonb(array[
        'A LC 214/2025 institui o IBS (Imposto sobre Bens e Serviços), a CBS (Contribuição sobre Bens e Serviços) e o Imposto Seletivo, regulamentando a reforma aprovada pela EC 132/2023.',
        'Em 2026, ano-teste, a CBS é destacada à alíquota de 0,9% e o IBS a 0,1% nos documentos fiscais. O recolhimento é dispensado para quem cumprir as obrigações acessórias — ou seja, o destaque correto na NF-e é o que garante a dispensa.',
        'Pontos de atenção: regimes específicos (combustíveis, saúde, educação), cesta básica nacional com alíquota zero e o cashback para famílias de baixa renda.',
        'A partir de 2027 a CBS passa à alíquota cheia, PIS e Cofins são extintos e o Imposto Seletivo entra em vigor sobre bens prejudiciais à saúde e ao meio ambiente.']),0),
    (p_office,'EC 132/2023 — a emenda da reforma','Emenda constitucional · dez/2023',
      array['Legislação'],'Referência legislativa',
      to_jsonb(array[
        'A EC 132/2023 cria o IVA dual brasileiro: CBS federal substituindo PIS/Cofins, e IBS compartilhado entre estados e municípios substituindo ICMS e ISS.',
        'Princípios centrais: não cumulatividade plena, tributação no destino, legislação uniforme e devolução personalizada (cashback).',
        'A transição do ICMS/ISS para o IBS ocorre de 2029 a 2032, com redução gradual das alíquotas antigas, até a vigência integral do novo sistema em 2033.']),1),
    (p_office,'PLP 108/2024 — Comitê Gestor do IBS','Projeto de lei complementar · em tramitação',
      array['Legislação','IBS'],'Referência legislativa',
      to_jsonb(array[
        'O PLP 108/2024 disciplina o Comitê Gestor do IBS (CG-IBS), responsável por arrecadar, compensar e distribuir a receita do IBS entre estados e municípios, além do contencioso administrativo.',
        'Também trata do ITCMD (progressividade obrigatória) e de regras de transição da distribuição da arrecadação.',
        'Impacto prático: o CG-IBS será o interlocutor da apuração assistida do IBS — acompanhar a regulamentação dos processos de restituição e compensação.']),2),
    (p_office,'NT NF-e 2025.002 — campos CBS/IBS/IS','Nota técnica · layout de documento fiscal',
      array['Operacional','NF-e'],'Referência técnica',
      to_jsonb(array[
        'A nota técnica define os novos grupos de tributação da NF-e/NFC-e: cClassTrib (código de classificação tributária), grupos de CBS, IBS (UF e município) e IS, com campos de base de cálculo, alíquota e valor.',
        'Erros comuns: cClassTrib incompatível com o CST, ausência de destaque em operações com alíquota zero e arredondamento divergente entre ERP e SEFAZ.',
        'Checklist: validar de-para NCM → cClassTrib, atualizar o layout no ERP e monitorar rejeições específicas dos novos grupos.']),3),
    (p_office,'Split payment — como funciona','Mecanismo de recolhimento',
      array['Conceito','Pagamentos'],'Referência conceitual',
      to_jsonb(array[
        'No split payment, o valor do tributo é segregado no momento da liquidação financeira: o meio de pagamento direciona a parcela de CBS/IBS diretamente ao fisco, e o líquido ao fornecedor.',
        'O modelo reduz inadimplência e fraude, mas exige conciliação fina entre documentos fiscais, recebíveis e extratos — o crédito do adquirente fica condicionado ao recolhimento efetivo.',
        'Pilotos estão previstos ao longo da transição; clientes com alto volume de cartão (varejo) devem ser priorizados na preparação.']),4),
    (p_office,'Cesta básica nacional — alíquota zero','Regimes favorecidos',
      array['Conceito'],'Referência conceitual',
      to_jsonb(array[
        'A LC 214/2025 define a cesta básica nacional com alíquota zero de CBS e IBS, e uma lista complementar com redução de 60%.',
        'Para clientes de varejo alimentar, o enquadramento correto por NCM é decisivo: itens fora da lista tributam integralmente.',
        'Ação recomendada: revisar o cadastro de produtos dos clientes contra as listas dos Anexos I e VII.']),5);
end $$;
