"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/lib/data";
import { iniOf } from "@/lib/design";

export type SettingsState = { error?: string; success?: string };

export async function updateName(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const name = String(fd.get("name") || "").trim();
  if (!name) return { error: "Informe seu nome." };
  const { member } = await getContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ name, ini: iniOf(name) })
    .eq("id", member.id);
  if (error) return { error: "Não foi possível salvar o nome." };
  revalidatePath("/", "layout");
  return { success: "Nome atualizado." };
}

export async function updateAvatarUrl(url: string): Promise<SettingsState> {
  const { member } = await getContext();
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ avatar_url: url }).eq("id", member.id);
  if (error) return { error: "Não foi possível salvar a foto." };
  revalidatePath("/", "layout");
  return { success: "Foto atualizada." };
}

export async function changePassword(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const currentPassword = String(fd.get("currentPassword") || "");
  const newPassword = String(fd.get("newPassword") || "");
  const confirmPassword = String(fd.get("confirmPassword") || "");

  if (!currentPassword || !newPassword) return { error: "Preencha a senha atual e a nova senha." };
  if (newPassword.length < 6) return { error: "A nova senha deve ter ao menos 6 caracteres." };
  if (newPassword !== confirmPassword) return { error: "A confirmação não coincide com a nova senha." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Sessão inválida." };

  // Verifica a senha atual antes de trocar.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: "Senha atual incorreta." };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: "Não foi possível trocar a senha." };

  return { success: "Senha alterada com sucesso." };
}

// ─────────────────────── Portal de pesquisa (clientes) ───────────────────────

export type SearchClientState = { error?: string };

/**
 * Cria um acesso de pesquisa pública para um cliente do escritório — conta
 * separada da equipe, sem senha nem e-mail automático (mesmo padrão do
 * convite de membro): a pessoa usa /primeiro-acesso com esse e-mail.
 * app_metadata.portal marca a conta para o middleware rotear para /pesquisa.
 */
export async function addSearchClient(_prev: SearchClientState, fd: FormData): Promise<SearchClientState> {
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim();
  if (!name) return { error: "Informe o nome do cliente." };
  if (!email) return { error: "Informe o e-mail do cliente." };

  const { office, member } = await getContext();
  if (member.role !== "admin") return { error: "Apenas administradores podem criar acessos de pesquisa." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Recurso não configurado neste ambiente (falta a service role key)." };
  }

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { portal: true },
  });
  if (createError || !data.user) {
    const msg = createError?.message ?? "";
    return {
      error: msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")
        ? "Este e-mail já tem uma conta cadastrada."
        : "Não foi possível criar o acesso.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("search_clients").insert({ office_id: office.id, user_id: data.user.id, name, email });
  if (error) return { error: "Conta criada, mas não foi possível salvar o registro." };

  revalidatePath("/configuracoes");
  return {};
}

export async function toggleSearchClient(fd: FormData) {
  const id = String(fd.get("id") || "");
  const active = fd.get("active") === "true";
  if (!id) return;
  const { member } = await getContext();
  if (member.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("search_clients").update({ active: !active }).eq("id", id);
  revalidatePath("/configuracoes");
}

export async function removeSearchClient(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const { member } = await getContext();
  if (member.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("search_clients").delete().eq("id", id);
  revalidatePath("/configuracoes");
}
