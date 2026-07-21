-- Reforma 2033 — RPCs de criação de escritório + seed de dados de referência.

-- Semeia dados nacionais de referência num escritório recém-criado.
-- Não semeia clientes/tarefas (dados operacionais do próprio escritório).
create or replace function seed_office_defaults(p_office uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_flow uuid;
begin
  -- CSTs (Informe Técnico 2025.002 — principais códigos)
  insert into cst_rows (office_id, code, descr, position) values
    (p_office,'000','Tributação integral — regime regular, sem redução ou benefício',0),
    (p_office,'101','Contribuinte do regime regular — operação onerosa com direito a crédito',1),
    (p_office,'200','Alíquota zero',2),
    (p_office,'210','Alíquota reduzida',3),
    (p_office,'400','Imunidade',4),
    (p_office,'410','Não incidência',5),
    (p_office,'500','Suspensão',6),
    (p_office,'550','Diferimento',7),
    (p_office,'620','Tributação monofásica — combustíveis',8),
    (p_office,'800','Tributação pelo Imposto Seletivo',9),
    (p_office,'820','Tributação em documento específico',10),
    (p_office,'900','Outras hipóteses não especificadas',11);

  -- cClassTrib (3 primeiros dígitos coincidem com o CST)
  insert into cclass_rows (office_id, code, descr, position) values
    (p_office,'000001','Tributação integral — operação padrão, sem benefício',0),
    (p_office,'101001','Operação onerosa com direito a crédito integral',1),
    (p_office,'200001','Cesta básica nacional — alíquota zero',2),
    (p_office,'200002','Produtos hortícolas, frutas e carnes in natura — alíquota zero',3),
    (p_office,'210001','Medicamentos registrados na Anvisa — redução de 60%',4),
    (p_office,'210002','Dispositivos médicos (Anexo XII da LC 214/2025) — redução de 60%',5),
    (p_office,'400001','Imunidade constitucional — livros, jornais e periódicos',6),
    (p_office,'550001','Diferimento — óleo diesel e biodiesel',7),
    (p_office,'620001','Monofásico — gasolina e etanol',8),
    (p_office,'800001','Imposto Seletivo — cigarros e produtos fumígenos',9),
    (p_office,'900001','Outras situações não especificadas nas demais classificações',10);

  -- Produtos (exemplos de referência do período de transição)
  insert into produto_rows (office_id, ncm, descr, cst, cclass, aliq_ibs, aliq_cbs, red_ibs, red_cbs, position) values
    (p_office,'1006.30.11','Arroz beneficiado, polido','200','200001','17,7%','8,8%','100%','100%',0),
    (p_office,'0201.10.00','Carne bovina in natura, resfriada','200','200002','17,7%','8,8%','100%','100%',1),
    (p_office,'3004.90.99','Medicamento de uso humano','210','210001','17,7%','8,8%','60%','60%',2),
    (p_office,'9018.90.99','Dispositivo médico (Anexo XII)','210','210002','17,7%','8,8%','60%','60%',3),
    (p_office,'2710.12.59','Gasolina C','620','620001','17,7%','8,8%','0%','0%',4),
    (p_office,'8517.12.31','Smartphone','000','000001','17,7%','8,8%','0%','0%',5),
    (p_office,'4901.10.00','Livro didático','400','400001','0%','0%','—','—',6),
    (p_office,'2402.20.00','Cigarros contendo tabaco','800','800001','17,7%','8,8%','0%','0%',7);

  -- Prazos / mudanças da reforma
  insert into changes (office_id, month, severity, title, description, date, badge) values
    (p_office,'2026-07','informativo','CNPJ alfanumérico','', '01/07/2026','SISTEMAS'),
    (p_office,'2026-08','critico','Obrigatoriedade dos campos de IBS e CBS nas NFs','Todos os documentos eletrônicos deverão incluir a alíquota teste de 1% (0,1% de IBS e 0,9% de CBS).','03/08/2026','SISTEMAS'),
    (p_office,'2026-08','importante','NFS-e com destaque de IBS e CBS','', '03/08/2026','NFS'),
    (p_office,'2026-09','critico','NFS-e e Simples Nacional: obrigatoriedade de emissão através do Emissor Nacional','ME e EPP optantes pelo Simples Nacional deverão usar obrigatoriamente o Emissor Nacional a partir de 01/09/2026.','01/09/2026','SISTEMAS'),
    (p_office,'2026-09','critico','Escolha das empresas do Simples Nacional','Cálculo de IBS e CBS por dentro ou por fora do Simples?','01/09/2026',''),
    (p_office,'2027-01','importante','PIS e COFINS serão formalmente extintas — recolhimento da CBS','A partir de 1º de janeiro de 2027, as contribuições para o PIS e a COFINS serão formalmente extintas, passando a ter o recolhimento da CBS em alíquota cheia.','01/01/2027','SISTEMAS'),
    (p_office,'2027-01','informativo','Imposto Seletivo entra em vigor','IS passa a incidir sobre bens e serviços prejudiciais à saúde e ao meio ambiente.','01/01/2027',''),
    (p_office,'2029-01','importante','Início da transição do ICMS/ISS para o IBS','Redução gradual das alíquotas de ICMS e ISS, compensada pelo aumento do IBS, até 2032.','01/01/2029','');

  -- Eventos / prazos de calendário (exemplos)
  insert into events (office_id, date, title, tipo, detail) values
    (p_office,'2026-07-10','EFD ICMS/IPI — jun/26','acessoria','Escrituração fiscal digital (SP)'),
    (p_office,'2026-07-14','EFD-Contribuições — jun/26','acessoria','PIS/Cofins — todos os clientes do Lucro Real'),
    (p_office,'2026-07-15','DCTFWeb — jun/26','acessoria','Transmissão até 15º dia útil'),
    (p_office,'2026-07-20','DAS — Simples Nacional','pagamento','Clientes do Simples'),
    (p_office,'2026-07-20','DIRBI — jun/26','acessoria','Declaração de incentivos e benefícios fiscais'),
    (p_office,'2026-07-24','Auditoria do destaque CBS 0,9% + IBS 0,1%','reforma','Conferência do ano-teste — dispensa de recolhimento exige destaque correto'),
    (p_office,'2026-07-25','PIS/Cofins — recolhimento','pagamento','Competência jun/26'),
    (p_office,'2026-07-28','Comitê interno da reforma','interno','Reunião mensal — status de adequação por cliente'),
    (p_office,'2026-07-31','Adesão ao piloto de split payment','reforma','Janela de habilitação'),
    (p_office,'2026-08-14','EFD-Contribuições — jul/26','acessoria','PIS/Cofins'),
    (p_office,'2026-08-20','DAS — Simples Nacional','pagamento','Competência jul/26'),
    (p_office,'2026-08-31','Relatório trimestral de adequação','interno','Enviar a todos os clientes');

  -- Notas / legislação
  insert into notes (office_id, title, sub, tags, meta, paras, position) values
    (p_office,'LC 214/2025 — regulamentação do IBS, CBS e IS','Lei complementar · sancionada em 16/01/2025',
      array['Legislação','CBS/IBS'],'Atualizado em 02 jul 2026 · Equipe',
      to_jsonb(array[
        'A LC 214/2025 institui o IBS (Imposto sobre Bens e Serviços), a CBS (Contribuição sobre Bens e Serviços) e o Imposto Seletivo, regulamentando a reforma aprovada pela EC 132/2023.',
        'Em 2026, ano-teste, a CBS é destacada à alíquota de 0,9% e o IBS a 0,1% nos documentos fiscais. O recolhimento é dispensado para quem cumprir as obrigações acessórias — ou seja, o destaque correto na NF-e é o que garante a dispensa.',
        'Pontos de atenção para a carteira: regimes específicos (combustíveis, saúde, educação), cesta básica nacional com alíquota zero e o cashback para famílias de baixa renda.',
        'A partir de 2027 a CBS passa à alíquota cheia, PIS e Cofins são extintos e o Imposto Seletivo entra em vigor sobre bens prejudiciais à saúde e ao meio ambiente.']),0),
    (p_office,'EC 132/2023 — a emenda da reforma','Emenda constitucional · dez/2023',
      array['Legislação'],'Atualizado em 12 mai 2026 · Equipe',
      to_jsonb(array[
        'A EC 132/2023 cria o IVA dual brasileiro: CBS federal substituindo PIS/Cofins, e IBS compartilhado entre estados e municípios substituindo ICMS e ISS.',
        'Princípios centrais: não cumulatividade plena, tributação no destino, legislação uniforme e devolução personalizada (cashback).',
        'A transição do ICMS/ISS para o IBS ocorre de 2029 a 2032, com redução gradual das alíquotas antigas, até a vigência integral do novo sistema em 2033.']),1),
    (p_office,'PLP 108/2024 — Comitê Gestor do IBS','Projeto de lei complementar · em tramitação',
      array['Legislação','IBS'],'Atualizado em 20 jun 2026 · Equipe',
      to_jsonb(array[
        'O PLP 108/2024 disciplina o Comitê Gestor do IBS (CG-IBS), responsável por arrecadar, compensar e distribuir a receita do IBS entre estados e municípios, além do contencioso administrativo.',
        'Também trata do ITCMD (progressividade obrigatória) e de regras de transição da distribuição da arrecadação.',
        'Impacto prático: o CG-IBS será o interlocutor da apuração assistida do IBS — acompanhar a regulamentação dos processos de restituição e compensação.']),2),
    (p_office,'NT NF-e 2025.002 — campos CBS/IBS/IS','Nota técnica · layout de documento fiscal',
      array['Operacional','NF-e'],'Atualizado em 08 jul 2026 · Equipe',
      to_jsonb(array[
        'A nota técnica define os novos grupos de tributação da NF-e/NFC-e: cClassTrib (código de classificação tributária), grupos de CBS, IBS (UF e município) e IS, com campos de base de cálculo, alíquota e valor.',
        'Erros comuns na carteira: cClassTrib incompatível com o CST, ausência de destaque em operações com alíquota zero e arredondamento divergente entre ERP e SEFAZ.',
        'Checklist: validar de-para NCM → cClassTrib, atualizar o layout no ERP e monitorar rejeições específicas dos novos grupos.']),3),
    (p_office,'Split payment — como funciona','Nota interna · mecanismo de recolhimento',
      array['Conceito','Pagamentos'],'Atualizado em 30 jun 2026 · Equipe',
      to_jsonb(array[
        'No split payment, o valor do tributo é segregado no momento da liquidação financeira: o meio de pagamento direciona a parcela de CBS/IBS diretamente ao fisco, e o líquido ao fornecedor.',
        'O modelo reduz inadimplência e fraude, mas exige conciliação fina entre documentos fiscais, recebíveis e extratos — o crédito do adquirente fica condicionado ao recolhimento efetivo.',
        'Pilotos estão previstos ao longo da transição; clientes com alto volume de cartão (varejo) devem ser priorizados na preparação.']),4),
    (p_office,'Cesta básica nacional — alíquota zero','Nota interna · regimes favorecidos',
      array['Conceito'],'Atualizado em 15 jun 2026 · Equipe',
      to_jsonb(array[
        'A LC 214/2025 define a cesta básica nacional com alíquota zero de CBS e IBS, e uma lista complementar com redução de 60%.',
        'Para os clientes de varejo alimentar, o enquadramento correto por NCM é decisivo: itens fora da lista tributam integralmente.',
        'Ação na carteira: revisar o cadastro de produtos contra as listas dos Anexos I e VII.']),5);

  -- Fluxo modelo de apuração
  insert into flows (office_id, name) values (p_office,'Fluxo de apuração — CBS / IBS / IS') returning id into v_flow;
  insert into flow_nodes (office_id, flow_id, node_key, x, y, title, descr, color) values
    (p_office,v_flow,'n1',40,60,'Emissão da NF-e','Destaque de CBS 0,9% + IBS 0,1% com cClassTrib correto','#4653d6'),
    (p_office,v_flow,'n2',320,60,'Validação cadastral','De-para NCM → CST → cClassTrib; rejeições SEFAZ','#4653d6'),
    (p_office,v_flow,'n3',600,60,'Apuração assistida','Pré-apuração RFB / CG-IBS a partir dos documentos fiscais','#0e7a6f'),
    (p_office,v_flow,'n4',880,20,'Split payment','Segregação do tributo na liquidação financeira','#b3512e'),
    (p_office,v_flow,'n5',880,170,'Compensação de créditos','Créditos de CBS/IBS condicionados ao recolhimento efetivo','#0e7a6f'),
    (p_office,v_flow,'n6',1160,170,'Recolhimento do saldo','Saldo devedor após compensações, por competência','#b3512e'),
    (p_office,v_flow,'n7',1160,20,'Distribuição da receita','CG-IBS reparte o IBS entre estados e municípios','#5b5f6b');
  insert into flow_edges (office_id, flow_id, source_key, target_key) values
    (p_office,v_flow,'n1','n2'),(p_office,v_flow,'n2','n3'),(p_office,v_flow,'n3','n4'),
    (p_office,v_flow,'n3','n5'),(p_office,v_flow,'n5','n6'),(p_office,v_flow,'n4','n7'),
    (p_office,v_flow,'n6','n7');
end $$;

-- Cria escritório + membro admin ligado ao usuário autenticado, e semeia defaults.
create or replace function create_office_with_admin(
  p_office_name text,
  p_cnpj text default null,
  p_responsavel text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_office uuid;
  v_uid uuid := auth.uid();
  v_email text;
  v_name text;
  v_ini text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Já pertence a um escritório? Retorna o existente (idempotente).
  select office_id into v_office from members where user_id = v_uid limit 1;
  if v_office is not null then
    return v_office;
  end if;

  select email into v_email from auth.users where id = v_uid;
  v_name := coalesce(nullif(trim(p_responsavel), ''), split_part(coalesce(v_email, 'Você'), '@', 1));
  v_ini := upper(left(split_part(v_name, ' ', 1), 1) || coalesce(left(nullif(split_part(v_name, ' ', 2), ''), 1), ''));
  if v_ini = '' then v_ini := '??'; end if;

  insert into offices (name, cnpj) values (p_office_name, p_cnpj) returning id into v_office;
  insert into members (office_id, user_id, name, email, ini, color, cargo, role)
    values (v_office, v_uid, v_name, v_email, v_ini, '#4653d6', 'Sócio(a)-fundador(a)', 'admin');

  perform seed_office_defaults(v_office);
  return v_office;
end $$;

-- Liga automaticamente um membro pré-cadastrado (convidado) à conta quando ela é criada.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update members set user_id = new.id
    where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

revoke all on function create_office_with_admin(text, text, text) from anon;
grant execute on function create_office_with_admin(text, text, text) to authenticated;
