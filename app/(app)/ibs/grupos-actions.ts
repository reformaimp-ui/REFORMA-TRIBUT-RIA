"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";
import { codeSearchPatterns } from "@/lib/codeSearch";

export type GroupKind = "produto" | "servico";
export type GroupRow = { id: string; parent_id: string | null; name: string; notes: string | null; position: number };
export type ItemDetails = {
  itemId: string; code: string; descr: string; cst: string; cclass: string;
  aliqIbs: string; aliqCbs: string; redIbs: string; redCbs: string;
};
export type Category = { id: string; name: string; color: string };
export type LinkedItem = ItemDetails & { linkId: string; notes: string | null; categories: Category[] };
export type SearchItem = ItemDetails;

const LINK_TABLE: Record<GroupKind, string> = { produto: "tax_group_produtos", servico: "tax_group_servicos" };
const LINK_ID_COL: Record<GroupKind, string> = { produto: "produto_id", servico: "servico_id" };
const CAT_LINK_TABLE: Record<GroupKind, string> = { produto: "tax_group_produto_categories", servico: "tax_group_servico_categories" };
const CAT_LINK_COL: Record<GroupKind, string> = { produto: "tax_group_produto_id", servico: "tax_group_servico_id" };

async function nextGroupPos(kind: GroupKind, parentId: string | null) {
  const supabase = await createClient();
  let query = supabase.from("tax_groups").select("id", { count: "exact", head: true }).eq("kind", kind);
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { count } = await query;
  return count ?? 0;
}

export async function listGroups(kind: GroupKind): Promise<GroupRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tax_groups")
    .select("id,parent_id,name,notes,position")
    .eq("kind", kind)
    .order("position");
  return (data ?? []) as GroupRow[];
}

export async function createGroup(kind: GroupKind, parentId: string | null, name: string): Promise<{ group?: GroupRow; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Informe um nome." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const position = await nextGroupPos(kind, parentId);
  const { data, error } = await supabase
    .from("tax_groups")
    .insert({ office_id: office.id, kind, parent_id: parentId, name: trimmed, position })
    .select("id,parent_id,name,notes,position")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return { group: data as GroupRow };
}

export async function renameGroup(id: string, name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Informe um nome." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_groups").update({ name: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

export async function updateGroupNotes(id: string, notes: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_groups").update({ notes }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteGroup(id: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_groups").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/ibs");
  return {};
}

type ProdutoJoinRow = {
  id: string; notes: string | null; produto_id: string;
  produto_rows: { ncm: string; descr: string; cst: string | null; cclass: string | null; aliq_ibs: string | null; aliq_cbs: string | null; red_ibs: string | null; red_cbs: string | null } | null;
};
type ServicoJoinRow = { id: string; notes: string | null; servico_id: string; servico_rows: { nbs: string; nbs_descr: string; item: string | null; cclass: string | null } | null };

function produtoDetails(
  itemId: string,
  p: { ncm: string; descr: string; cst: string | null; cclass: string | null; aliq_ibs: string | null; aliq_cbs: string | null; red_ibs: string | null; red_cbs: string | null } | null | undefined,
): ItemDetails {
  return {
    itemId,
    code: p?.ncm ?? "",
    descr: p?.descr ?? "",
    cst: p?.cst || "",
    cclass: p?.cclass || "",
    aliqIbs: p?.aliq_ibs || "",
    aliqCbs: p?.aliq_cbs || "",
    redIbs: p?.red_ibs || "",
    redCbs: p?.red_cbs || "",
  };
}

/** CST e % de redução do serviço seguem o mesmo cClassTrib cadastrado em Tributação dos produtos. */
async function redByCclass(cclassCodes: string[]): Promise<Record<string, { cst: string; red_ibs: string; red_cbs: string }>> {
  if (!cclassCodes.length) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("produto_rows").select("cclass,cst,red_ibs,red_cbs").in("cclass", cclassCodes);
  const map: Record<string, { cst: string; red_ibs: string; red_cbs: string }> = {};
  for (const r of (data ?? []) as { cclass: string; cst: string; red_ibs: string; red_cbs: string }[]) {
    if (!map[r.cclass]) map[r.cclass] = { cst: r.cst, red_ibs: r.red_ibs, red_cbs: r.red_cbs };
  }
  return map;
}

function servicoDetails(
  itemId: string,
  s: { nbs: string; nbs_descr: string; cclass: string | null } | null | undefined,
  ref: { cst: string; red_ibs: string; red_cbs: string } | undefined,
): ItemDetails {
  return {
    itemId,
    code: s?.nbs ?? "",
    descr: s?.nbs_descr ?? "",
    cst: ref?.cst || "",
    cclass: s?.cclass || "",
    aliqIbs: "",
    aliqCbs: "",
    redIbs: ref?.red_ibs || "",
    redCbs: ref?.red_cbs || "",
  };
}

/** Categorias marcadas em cada tributação vinculada, indexadas por linkId — 1 query cobrindo todos os itens. */
async function categoriesByLink(kind: GroupKind, linkIds: string[]): Promise<Record<string, Category[]>> {
  if (!linkIds.length) return {};
  const supabase = await createClient();
  const table = CAT_LINK_TABLE[kind];
  const linkCol = CAT_LINK_COL[kind];
  const { data } = await supabase.from(table).select(`${linkCol},tax_categories(id,name,color)`).in(linkCol, linkIds);
  const map: Record<string, Category[]> = {};
  for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
    const key = r[linkCol] as string;
    const cat = r.tax_categories as Category | null;
    if (!map[key]) map[key] = [];
    if (cat) map[key].push(cat);
  }
  return map;
}

export async function listGroupItems(kind: GroupKind, groupId: string): Promise<LinkedItem[]> {
  const supabase = await createClient();
  let base: (ItemDetails & { linkId: string; notes: string | null })[];
  if (kind === "produto") {
    const { data } = await supabase
      .from("tax_group_produtos")
      .select("id,notes,produto_id,produto_rows(ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs)")
      .eq("group_id", groupId)
      .order("position");
    base = ((data ?? []) as unknown as ProdutoJoinRow[]).map((r) => ({
      linkId: r.id,
      notes: r.notes,
      ...produtoDetails(r.produto_id, r.produto_rows),
    }));
  } else {
    const { data } = await supabase
      .from("tax_group_servicos")
      .select("id,notes,servico_id,servico_rows(nbs,nbs_descr,item,cclass)")
      .eq("group_id", groupId)
      .order("position");
    const rows = (data ?? []) as unknown as ServicoJoinRow[];
    const refByCclass = await redByCclass(Array.from(new Set(rows.map((r) => r.servico_rows?.cclass).filter((c): c is string => !!c))));
    base = rows.map((r) => ({
      linkId: r.id,
      notes: r.notes,
      ...servicoDetails(r.servico_id, r.servico_rows, r.servico_rows?.cclass ? refByCclass[r.servico_rows.cclass] : undefined),
    }));
  }
  const catMap = await categoriesByLink(kind, base.map((b) => b.linkId));
  return base.map((b) => ({ ...b, categories: catMap[b.linkId] ?? [] }));
}

export async function searchItemsToLink(kind: GroupKind, term: string): Promise<SearchItem[]> {
  const q = term.trim();
  if (!q) return [];
  const supabase = await createClient();
  if (kind === "produto") {
    const { data } = await supabase
      .from("produto_rows")
      .select("id,ncm,descr,cst,cclass,aliq_ibs,aliq_cbs,red_ibs,red_cbs")
      .or(codeSearchPatterns(q, "ncm", "ncm_digits", ["descr", "cst", "cclass"]))
      .order("position")
      .limit(30);
    return (data ?? []).map((r) => produtoDetails(r.id, r));
  }
  const { data } = await supabase
    .from("servico_rows")
    .select("id,nbs,nbs_descr,item,cclass")
    .or(codeSearchPatterns(q, "nbs", "nbs_digits", ["nbs_descr", "item", "cclass"]))
    .order("position")
    .limit(30);
  const rows = data ?? [];
  const refByCclass = await redByCclass(Array.from(new Set(rows.map((r) => r.cclass).filter((c): c is string => !!c))));
  return rows.map((r) => servicoDetails(r.id, r, r.cclass ? refByCclass[r.cclass] : undefined));
}

export async function linkItem(kind: GroupKind, groupId: string, itemId: string): Promise<{ error?: string }> {
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const table = LINK_TABLE[kind];
  const idCol = LINK_ID_COL[kind];
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("group_id", groupId);
  const { error } = await supabase
    .from(table)
    .upsert({ office_id: office.id, group_id: groupId, [idCol]: itemId, position: count ?? 0 }, { onConflict: `group_id,${idCol}`, ignoreDuplicates: true });
  if (error) return { error: error.message };
  return {};
}

export async function unlinkItem(kind: GroupKind, linkId: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from(LINK_TABLE[kind]).delete().eq("id", linkId);
  if (error) return { error: error.message };
  return {};
}

export async function updateLinkNotes(kind: GroupKind, linkId: string, notes: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from(LINK_TABLE[kind]).update({ notes }).eq("id", linkId);
  if (error) return { error: error.message };
  return {};
}

// ─────────────────────────── Categorias ───────────────────────────

export async function listCategories(kind: GroupKind): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tax_categories").select("id,name,color").eq("kind", kind).order("position");
  return (data ?? []) as Category[];
}

async function nextCategoryPos(kind: GroupKind) {
  const supabase = await createClient();
  const { count } = await supabase.from("tax_categories").select("id", { count: "exact", head: true }).eq("kind", kind);
  return count ?? 0;
}

export async function createCategory(kind: GroupKind, name: string, color: string): Promise<{ category?: Category; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Informe um nome." };
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const position = await nextCategoryPos(kind);
  const { data, error } = await supabase
    .from("tax_categories")
    .insert({ office_id: office.id, kind, name: trimmed, color, position })
    .select("id,name,color")
    .single();
  if (error) return { error: error.message.includes("duplicate") ? "Já existe uma categoria com esse nome." : error.message };
  return { category: data as Category };
}

export async function renameCategory(id: string, name: string): Promise<{ error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Informe um nome." };
  const { member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_categories").update({ name: trimmed }).eq("id", id);
  if (error) return { error: error.message.includes("duplicate") ? "Já existe uma categoria com esse nome." : error.message };
  return {};
}

export async function updateCategoryColor(id: string, color: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_categories").update({ color }).eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const { error } = await supabase.from("tax_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  return {};
}

export async function addCategoryToLink(kind: GroupKind, linkId: string, categoryId: string): Promise<{ error?: string }> {
  const { office, member } = await getContext();
  if (!canDo(member, "ibs", "create")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const table = CAT_LINK_TABLE[kind];
  const linkCol = CAT_LINK_COL[kind];
  const { error } = await supabase
    .from(table)
    .upsert({ office_id: office.id, [linkCol]: linkId, category_id: categoryId }, { onConflict: `${linkCol},category_id`, ignoreDuplicates: true });
  if (error) return { error: error.message };
  return {};
}

export async function removeCategoryFromLink(kind: GroupKind, linkId: string, categoryId: string): Promise<{ error?: string }> {
  const { member } = await getContext();
  if (!canDo(member, "ibs", "delete")) return { error: "Você não tem permissão para isso." };
  const supabase = await createClient();
  const table = CAT_LINK_TABLE[kind];
  const linkCol = CAT_LINK_COL[kind];
  const { error } = await supabase.from(table).delete().eq(linkCol, linkId).eq("category_id", categoryId);
  if (error) return { error: error.message };
  return {};
}

export type ExportNode = { id: string; name: string; notes: string | null; items: LinkedItem[]; children: ExportNode[] };
export type GroupExportData = { officeName: string; generatedAt: string; kind: GroupKind; root: ExportNode };

/** Remove da árvore os subgrupos que não têm nenhuma tributação, direta ou em descendentes. */
function pruneEmpty(node: ExportNode): ExportNode | null {
  const children = node.children.map(pruneEmpty).filter((c): c is ExportNode => c !== null);
  if (!node.items.length && !children.length) return null;
  return { ...node, children };
}

/**
 * Monta a árvore completa (grupo + todos os subgrupos) com as tributações
 * vinculadas em cada nível — usado para exportar o ramo inteiro em PDF, não
 * só o nó selecionado.
 */
export async function getGroupExportData(kind: GroupKind, groupId: string): Promise<GroupExportData> {
  const { office } = await getContext();
  const supabase = await createClient();
  const { data } = await supabase.from("tax_groups").select("id,parent_id,name,notes,position").eq("kind", kind).order("position");
  const groups = (data ?? []) as GroupRow[];
  const childrenOf = new Map<string, GroupRow[]>();
  for (const g of groups) {
    if (!g.parent_id) continue;
    if (!childrenOf.has(g.parent_id)) childrenOf.set(g.parent_id, []);
    childrenOf.get(g.parent_id)!.push(g);
  }
  const rootGroup = groups.find((g) => g.id === groupId);
  if (!rootGroup) throw new Error("Grupo não encontrado.");

  async function buildNode(g: GroupRow): Promise<ExportNode> {
    const [items, children] = await Promise.all([
      listGroupItems(kind, g.id),
      Promise.all((childrenOf.get(g.id) ?? []).map(buildNode)),
    ]);
    return { id: g.id, name: g.name, notes: g.notes, items, children };
  }

  const root = await buildNode(rootGroup);
  const prunedChildren = root.children.map(pruneEmpty).filter((c): c is ExportNode => c !== null);
  return { officeName: office.name, generatedAt: new Date().toISOString(), kind, root: { ...root, children: prunedChildren } };
}
