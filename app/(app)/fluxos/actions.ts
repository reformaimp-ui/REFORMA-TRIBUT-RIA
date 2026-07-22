"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";

export async function createFlow() {
  const { office, member } = await getContext();
  if (!canDo(member, "fluxos", "create")) redirect("/fluxos");
  const supabase = await createClient();
  const { data } = await supabase.from("flows").insert({ office_id: office.id, name: "Novo fluxo" }).select("id").single();
  revalidatePath("/fluxos");
  if (data) redirect(`/fluxos/${data.id}`);
  redirect("/fluxos");
}

export async function deleteFlow(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "delete")) return;
  const supabase = await createClient();
  await supabase.from("flows").delete().eq("id", id);
  revalidatePath("/fluxos");
}

export async function renameFlow(fd: FormData) {
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") || "").trim() || "Fluxo sem nome";
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("flows").update({ name }).eq("id", id);
  revalidatePath(`/fluxos/${id}`);
}

export async function addNode(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const nodeKey = String(fd.get("nodeKey") || "");
  const x = Number(fd.get("x") || 80);
  const y = Number(fd.get("y") || 80);
  if (!flowId || !nodeKey) return;
  const { office, member } = await getContext();
  if (!canDo(member, "fluxos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("flow_nodes").insert({ office_id: office.id, flow_id: flowId, node_key: nodeKey, x, y, title: "Nova etapa", descr: "Descreva esta etapa do fluxo", color: "#5b5f6b" });
  revalidatePath(`/fluxos/${flowId}`);
}

export async function moveNode(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const nodeKey = String(fd.get("nodeKey") || "");
  const x = Number(fd.get("x"));
  const y = Number(fd.get("y"));
  if (!flowId || !nodeKey) return;
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("flow_nodes").update({ x, y }).eq("flow_id", flowId).eq("node_key", nodeKey);
}

export async function updateNode(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const nodeKey = String(fd.get("nodeKey") || "");
  const title = String(fd.get("title") || "");
  const descr = String(fd.get("descr") || "");
  const color = String(fd.get("color") || "#5b5f6b");
  if (!flowId || !nodeKey) return;
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("flow_nodes").update({ title, descr, color }).eq("flow_id", flowId).eq("node_key", nodeKey);
  revalidatePath(`/fluxos/${flowId}`);
}

export async function deleteNode(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const nodeKey = String(fd.get("nodeKey") || "");
  if (!flowId || !nodeKey) return;
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "delete")) return;
  const supabase = await createClient();
  await supabase.from("flow_edges").delete().eq("flow_id", flowId).or(`source_key.eq.${nodeKey},target_key.eq.${nodeKey}`);
  await supabase.from("flow_nodes").delete().eq("flow_id", flowId).eq("node_key", nodeKey);
  revalidatePath(`/fluxos/${flowId}`);
}

export async function addEdge(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const source = String(fd.get("source") || "");
  const target = String(fd.get("target") || "");
  if (!flowId || !source || !target || source === target) return;
  const { office, member } = await getContext();
  if (!canDo(member, "fluxos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("flow_edges").insert({ office_id: office.id, flow_id: flowId, source_key: source, target_key: target }).select();
  revalidatePath(`/fluxos/${flowId}`);
}

export async function deleteEdge(fd: FormData) {
  const flowId = String(fd.get("flowId") || "");
  const source = String(fd.get("source") || "");
  const target = String(fd.get("target") || "");
  const { member } = await getContext();
  if (!canDo(member, "fluxos", "delete")) return;
  const supabase = await createClient();
  await supabase.from("flow_edges").delete().eq("flow_id", flowId).eq("source_key", source).eq("target_key", target);
  revalidatePath(`/fluxos/${flowId}`);
}
