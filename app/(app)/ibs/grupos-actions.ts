"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";

export type GroupKind = "produto" | "servico";
export type GroupRow = { id: string; parent_id: string | null; name: string; notes: string | null; position: number };
export type LinkedItem = { linkId: string; itemId: string; notes: string | null; label: string; sub: string };
export type SearchItem = { itemId: string; label: string; sub: string };

const LINK_TABLE: Record<GroupKind, string> = { produto: "tax_group_produtos", servico: "tax_group_servicos" };
const LINK_ID_COL: Record<GroupKind, string> = { produto: "produto_id", servico: "servico_id" };

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

type ProdutoJoinRow = { id: string; notes: string | null; produto_id: string; produto_rows: { ncm: string; descr: string; cst: string | null; cclass: string | null } | null };
type ServicoJoinRow = { id: string; notes: string | null; servico_id: string; servico_rows: { nbs: string; nbs_descr: string; item: string | null; cclass: string | null } | null };

export async function listGroupItems(kind: GroupKind, groupId: string): Promise<LinkedItem[]> {
  const supabase = await createClient();
  if (kind === "produto") {
    const { data } = await supabase
      .from("tax_group_produtos")
      .select("id,notes,produto_id,produto_rows(ncm,descr,cst,cclass)")
      .eq("group_id", groupId)
      .order("position");
    return ((data ?? []) as unknown as ProdutoJoinRow[]).map((r) => ({
      linkId: r.id,
      itemId: r.produto_id,
      notes: r.notes,
      label: `${r.produto_rows?.ncm ?? ""} — ${r.produto_rows?.descr ?? ""}`,
      sub: `CST ${r.produto_rows?.cst || "—"} · cClassTrib ${r.produto_rows?.cclass || "—"}`,
    }));
  }
  const { data } = await supabase
    .from("tax_group_servicos")
    .select("id,notes,servico_id,servico_rows(nbs,nbs_descr,item,cclass)")
    .eq("group_id", groupId)
    .order("position");
  return ((data ?? []) as unknown as ServicoJoinRow[]).map((r) => ({
    linkId: r.id,
    itemId: r.servico_id,
    notes: r.notes,
    label: `NBS ${r.servico_rows?.nbs ?? ""} — ${r.servico_rows?.nbs_descr ?? ""}`,
    sub: r.servico_rows?.item || `cClassTrib ${r.servico_rows?.cclass || "—"}`,
  }));
}

export async function searchItemsToLink(kind: GroupKind, term: string): Promise<SearchItem[]> {
  const q = term.trim();
  if (!q) return [];
  const like = `%${q}%`;
  const supabase = await createClient();
  if (kind === "produto") {
    const { data } = await supabase
      .from("produto_rows")
      .select("id,ncm,descr,cst,cclass")
      .or(`ncm.ilike.${like},descr.ilike.${like},cst.ilike.${like},cclass.ilike.${like}`)
      .order("position")
      .limit(30);
    return (data ?? []).map((r) => ({ itemId: r.id, label: `${r.ncm} — ${r.descr}`, sub: `CST ${r.cst || "—"} · cClassTrib ${r.cclass || "—"}` }));
  }
  const { data } = await supabase
    .from("servico_rows")
    .select("id,nbs,nbs_descr,item,cclass")
    .or(`nbs.ilike.${like},nbs_descr.ilike.${like},item.ilike.${like},cclass.ilike.${like}`)
    .order("position")
    .limit(30);
  return (data ?? []).map((r) => ({ itemId: r.id, label: `NBS ${r.nbs} — ${r.nbs_descr}`, sub: r.item || `cClassTrib ${r.cclass || "—"}` }));
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
