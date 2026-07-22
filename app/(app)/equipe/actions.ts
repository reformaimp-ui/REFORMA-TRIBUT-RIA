"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/lib/data";
import { iniOf, PALETTE } from "@/lib/design";

export type MemberFormState = { error?: string };

/**
 * Convida uma pessoa: cria a conta de autenticação (sem senha, sem e-mail
 * automático — evita depender da configuração de Redirect URL do Supabase,
 * que varia por ambiente). O acesso real acontece em /primeiro-acesso: a
 * pessoa informa o e-mail, recebe um código por e-mail (prova que é dela) e
 * define a senha. O registro em `members` já nasce ligado a esse user_id.
 */
export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const cargo = String(formData.get("cargo") || "").trim();
  const permissao = String(formData.get("permissao") || "membro");
  const color = String(formData.get("color") || PALETTE[0]);
  if (!name) return { error: "Informe o nome da pessoa." };
  if (!email) return { error: "Informe o e-mail da pessoa." };

  const { office, member: caller } = await getContext();
  if (caller.role !== "admin") return { error: "Apenas administradores podem convidar pessoas." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Convite de acesso não está configurado neste ambiente (falta a service role key)." };
  }

  const { data, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (createError || !data.user) {
    const msg = createError?.message ?? "";
    return {
      error: msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")
        ? "Este e-mail já tem uma conta cadastrada."
        : "Não foi possível convidar a pessoa.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").insert({
    office_id: office.id,
    user_id: data.user.id,
    name,
    email,
    ini: iniOf(name),
    color,
    cargo: cargo || "Membro da equipe",
    role: permissao === "admin" ? "admin" : "membro",
  });
  if (error) return { error: "Conta criada, mas não foi possível salvar os dados da pessoa." };

  revalidatePath("/equipe");
  redirect("/equipe");
}

export async function removeMember(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { member: caller } = await getContext();
  if (caller.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("members").delete().eq("id", id);
  revalidatePath("/equipe");
}

export type PermissionsFormState = { error?: string };

export async function updateMemberPermissions(_prev: PermissionsFormState, formData: FormData): Promise<PermissionsFormState> {
  const id = String(formData.get("id") || "");
  if (!id) return { error: "ID inválido." };
  const { member: caller } = await getContext();
  if (caller.role !== "admin") return { error: "Apenas administradores podem alterar permissões." };

  let permissions: unknown;
  try {
    permissions = JSON.parse(String(formData.get("permissions") || "{}"));
  } catch {
    return { error: "Permissões inválidas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ permissions }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/equipe");
  return {};
}
