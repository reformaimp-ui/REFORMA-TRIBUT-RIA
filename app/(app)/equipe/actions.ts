"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/lib/data";
import { iniOf, PALETTE } from "@/lib/design";

export type MemberFormState = { error?: string };

async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

/**
 * Convida uma pessoa por e-mail: cria a conta de autenticação (sem senha) via
 * Admin API e envia o e-mail de convite do Supabase com um link para
 * /definir-senha. O registro em `members` já nasce ligado a esse user_id, então
 * o primeiro acesso (getContext) encontra a pessoa certa assim que ela entra.
 */
export async function addMember(_prev: MemberFormState, formData: FormData): Promise<MemberFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const cargo = String(formData.get("cargo") || "").trim();
  const permissao = String(formData.get("permissao") || "membro");
  const color = String(formData.get("color") || PALETTE[0]);
  if (!name) return { error: "Informe o nome da pessoa." };
  if (!email) return { error: "Informe o e-mail para enviar o convite." };

  const { office } = await getContext();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Convites por e-mail não estão configurados neste ambiente (falta a service role key)." };
  }

  const origin = await siteOrigin();
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/definir-senha`,
  });
  if (inviteError || !data.user) {
    const msg = inviteError?.message ?? "";
    return {
      error: msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already been registered")
        ? "Este e-mail já tem uma conta cadastrada."
        : "Não foi possível enviar o convite.",
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
  if (error) return { error: "Convite enviado, mas não foi possível salvar os dados da pessoa." };

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
