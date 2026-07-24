"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getContext } from "@/lib/data";

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

  revalidatePath("/acessos/pesquisa");
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
  revalidatePath("/acessos/pesquisa");
}

export async function removeSearchClient(fd: FormData) {
  const id = String(fd.get("id") || "");
  if (!id) return;
  const { member } = await getContext();
  if (member.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("search_clients").delete().eq("id", id);
  revalidatePath("/acessos/pesquisa");
}

/** Liga/desliga o Assistente IA para um cliente de pesquisa específico. */
export async function toggleSearchClientAi(fd: FormData) {
  const id = String(fd.get("id") || "");
  const aiEnabled = fd.get("aiEnabled") === "true";
  if (!id) return;
  const { member } = await getContext();
  if (member.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("search_clients").update({ ai_enabled: !aiEnabled }).eq("id", id);
  revalidatePath("/acessos/pesquisa");
}

/** Liga/desliga o Assistente IA para todo o escritório (chave-geral do portal). */
export async function toggleOfficeAi(fd: FormData) {
  const aiEnabled = fd.get("aiEnabled") === "true";
  const { member, office } = await getContext();
  if (member.role !== "admin") return;
  const supabase = await createClient();
  await supabase.from("offices").update({ ai_search_enabled: !aiEnabled }).eq("id", office.id);
  revalidatePath("/acessos/pesquisa");
}
