"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";

export async function addNote(fd: FormData): Promise<string | null> {
  const title = String(fd.get("title") || "").trim();
  if (!title) return null;
  const content = String(fd.get("content") ?? "");
  const { office } = await getContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notes")
    .insert({ office_id: office.id, title, content, sub: "", tags: [], meta: "", paras: [] })
    .select("id")
    .single();
  revalidatePath("/base-conhecimento");
  return data ? (data.id as string) : null;
}

export async function updateNote(fd: FormData) {
  const id = String(fd.get("id") || "");
  const title = String(fd.get("title") || "").trim();
  if (!id || !title) return;
  const content = String(fd.get("content") ?? "");
  const supabase = await createClient();
  await supabase.from("notes").update({ title, content }).eq("id", id);
  revalidatePath("/base-conhecimento");
}

export async function deleteNote(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/base-conhecimento");
}
