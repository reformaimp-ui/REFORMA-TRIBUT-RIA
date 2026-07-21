"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
