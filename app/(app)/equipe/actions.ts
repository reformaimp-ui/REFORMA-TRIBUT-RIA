"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getContext } from "@/lib/data";
import { iniOf, PALETTE } from "@/lib/design";

export type MemberFormState = { error?: string };

export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const cargo = String(formData.get("cargo") || "").trim();
  const permissao = String(formData.get("permissao") || "membro");
  const color = String(formData.get("color") || PALETTE[0]);
  if (!name) return { error: "Informe o nome da pessoa." };

  const { office } = await getContext();
  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    office_id: office.id,
    name,
    email: email || null,
    ini: iniOf(name),
    color,
    cargo: cargo || "Membro da equipe",
    role: permissao === "admin" ? "admin" : "membro",
  });
  if (error) return { error: "Não foi possível convidar a pessoa." };

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function removeMember(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("members").delete().eq("id", id);
  revalidatePath("/equipe");
}
