"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { canDo } from "@/lib/permissions";

const BUCKET = "documents";

export async function createFolder(fd: FormData) {
  const name = String(fd.get("name") || "").trim();
  if (!name) return;
  const parentId = String(fd.get("parentId") || "") || null;
  const { office, member } = await getContext();
  if (!canDo(member, "arquivos", "create")) return;
  const supabase = await createClient();
  await supabase
    .from("documents")
    .insert({ office_id: office.id, parent_id: parentId, kind: "folder", name, created_by: member.id });
  revalidatePath("/arquivos");
}

export async function createTextDoc(fd: FormData): Promise<string | null> {
  const name = String(fd.get("name") || "").trim() || "Novo arquivo de texto";
  const parentId = String(fd.get("parentId") || "") || null;
  const { office, member } = await getContext();
  if (!canDo(member, "arquivos", "create")) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .insert({ office_id: office.id, parent_id: parentId, kind: "text", name, content: "", created_by: member.id })
    .select("id")
    .single();
  revalidatePath("/arquivos");
  return data ? (data.id as string) : null;
}

export async function updateTextDoc(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const content = String(fd.get("content") ?? "");
  const { member } = await getContext();
  if (!canDo(member, "arquivos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("documents").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/arquivos");
}

export async function renameDocument(fd: FormData) {
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") || "").trim();
  if (!id || !name) return;
  const { member } = await getContext();
  if (!canDo(member, "arquivos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("documents").update({ name }).eq("id", id);
  revalidatePath("/arquivos");
}

export async function moveDocument(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const parentId = String(fd.get("parentId") || "") || null;
  const { member } = await getContext();
  if (!canDo(member, "arquivos", "edit")) return;
  const supabase = await createClient();
  await supabase.from("documents").update({ parent_id: parentId }).eq("id", id);
  revalidatePath("/arquivos");
}

export async function uploadFile(fd: FormData): Promise<string | null> {
  const file = fd.get("file") as File | null;
  if (!file || !file.size) return "Selecione um arquivo.";
  const parentId = String(fd.get("parentId") || "") || null;
  const { office, member } = await getContext();
  if (!canDo(member, "arquivos", "create")) return "Sem permissão para enviar arquivos.";
  const supabase = await createClient();
  const docId = crypto.randomUUID();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${office.id}/${docId}-${safeName}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) return upErr.message;
  const { error: insErr } = await supabase.from("documents").insert({
    id: docId,
    office_id: office.id,
    parent_id: parentId,
    kind: "file",
    name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
    created_by: member.id,
  });
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    return insErr.message;
  }
  revalidatePath("/arquivos");
  return null;
}

export async function deleteDocument(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const { member } = await getContext();
  if (!canDo(member, "arquivos", "delete")) return;
  const supabase = await createClient();

  // Percorre a subárvore nível a nível para juntar os storage_path dos
  // arquivos antes de apagar as linhas (o cascade cuida do banco, não do storage).
  const paths: string[] = [];
  let frontier = [id];
  while (frontier.length) {
    const { data: rows } = await supabase.from("documents").select("id,kind,storage_path").in("id", frontier);
    for (const r of rows ?? []) {
      if (r.kind === "file" && r.storage_path) paths.push(r.storage_path as string);
    }
    const { data: children } = await supabase.from("documents").select("id").in("parent_id", frontier);
    frontier = (children ?? []).map((c) => c.id as string);
  }
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath("/arquivos");
}

export async function getFileUrl(id: string): Promise<string | null> {
  await getContext();
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  if (!doc?.storage_path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path as string, 300);
  if (error) return null;
  return data.signedUrl;
}
