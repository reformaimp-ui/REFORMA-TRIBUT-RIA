export const TABLE_LABELS: Record<string, string> = {
  members: "Equipe",
  clients: "Clientes",
  tasks: "Tarefas",
  subtasks: "Subtarefas",
  comments: "Comentários",
  changes: "Prazos (mudanças)",
  events: "Eventos",
  flows: "Fluxos",
  cst_rows: "CST",
  cclass_rows: "cClassTrib",
  produto_rows: "Produtos (IBS/CBS)",
  servico_rows: "Serviços (IBS/CBS)",
  notes: "Base de conhecimento",
  documents: "Arquivos",
  nfe_empresas: "Empresas (Análise)",
  search_clients: "Acesso de pesquisa",
  prazo_months: "Prazos (meses)",
};

export const ACTION_LABELS: Record<string, string> = {
  create: "Criou",
  update: "Editou",
  delete: "Excluiu",
};

export type AuditLogRow = {
  id: string;
  actor_member_id: string | null;
  actor_name: string | null;
  table_name: string;
  record_id: string | null;
  action: "create" | "update" | "delete";
  summary: string | null;
  changed_fields: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
};

export type AuditFilters = {
  memberId: string[];
  table: string[];
  action: string[];
  dateFrom: string;
  dateTo: string;
};
