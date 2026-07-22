/**
 * Permissões granulares por membro. Admins sempre têm acesso total — as
 * restrições abaixo só valem para role "membro". Ausência de uma chave
 * (aba ou ação) significa PERMITIDO, para retrocompatibilidade com membros
 * já existentes que nunca tiveram permissions configuradas.
 */

export type TabKey =
  | "dashboard"
  | "tarefas"
  | "prazos"
  | "fluxos"
  | "clientes"
  | "equipe"
  | "ibs"
  | "base-conhecimento"
  | "arquivos"
  | "configuracoes";

export type ActionTab = "tarefas" | "prazos" | "fluxos" | "clientes" | "ibs" | "base-conhecimento" | "arquivos";
export type Action = "create" | "edit" | "delete";

export type Permissions = {
  tabs?: Partial<Record<TabKey, boolean>>;
  actions?: Partial<Record<ActionTab, Partial<Record<Action, boolean>>>>;
};

export const TAB_ORDER: TabKey[] = [
  "dashboard", "tarefas", "prazos", "fluxos", "clientes", "equipe", "ibs", "base-conhecimento", "arquivos", "configuracoes",
];

export const TAB_LABELS: Record<TabKey, string> = {
  dashboard: "Visão geral",
  tarefas: "Tarefas",
  prazos: "Prazos",
  fluxos: "Fluxos",
  clientes: "Clientes",
  equipe: "Equipe",
  ibs: "IBS e CBS",
  "base-conhecimento": "Base de conhecimento",
  arquivos: "Arquivos",
  configuracoes: "Configurações",
};

export const ACTION_TABS: ActionTab[] = ["tarefas", "prazos", "fluxos", "clientes", "ibs", "base-conhecimento", "arquivos"];

export const ACTION_LABELS: Record<Action, string> = { create: "Criar", edit: "Editar", delete: "Excluir" };

type PermMember = { role: string; permissions?: Permissions | null };

/** Dashboard é sempre visível — não faz sentido esconder a visão geral. */
export function canViewTab(member: PermMember, tab: TabKey): boolean {
  if (member.role === "admin") return true;
  if (tab === "dashboard") return true;
  return member.permissions?.tabs?.[tab] !== false;
}

export function canDo(member: PermMember, tab: ActionTab, action: Action): boolean {
  if (member.role === "admin") return true;
  return member.permissions?.actions?.[tab]?.[action] !== false;
}
