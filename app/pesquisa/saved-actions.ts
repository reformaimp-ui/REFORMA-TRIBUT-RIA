"use server";

import { createClient } from "@/lib/supabase/server";
import { getSearchClientContext, getSearchClientIfAny } from "@/lib/searchClient";

export type SavedSearch = {
  id: string;
  kind: "produto" | "servico";
  ref: string;
  code: string;
  title: string;
  subtitle: string | null;
  created_at: string;
};

// ─────────────────────────── Pesquisas salvas ───────────────────────────

export async function listSavedSearches(kind: "produto" | "servico"): Promise<SavedSearch[]> {
  const { client } = await getSearchClientContext();
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_searches")
    .select("id,kind,ref,code,title,subtitle,created_at")
    .eq("search_client_id", client.id)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as SavedSearch[];
}

export async function saveSearch(input: {
  kind: "produto" | "servico";
  ref: string;
  code: string;
  title: string;
  subtitle?: string | null;
}): Promise<{ error?: string; saved?: SavedSearch }> {
  const { office, client } = await getSearchClientContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .upsert(
      {
        office_id: office.id,
        search_client_id: client.id,
        kind: input.kind,
        ref: input.ref,
        code: input.code,
        title: input.title,
        subtitle: input.subtitle ?? null,
      },
      { onConflict: "search_client_id,kind,ref" },
    )
    .select("id,kind,ref,code,title,subtitle,created_at")
    .single();
  if (error) return { error: "Não foi possível salvar. Tente de novo." };
  return { saved: data as SavedSearch };
}

export async function unsaveSearch(ref: string, kind: "produto" | "servico"): Promise<{ error?: string }> {
  const { client } = await getSearchClientContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("search_client_id", client.id)
    .eq("kind", kind)
    .eq("ref", ref);
  if (error) return { error: "Não foi possível remover." };
  return {};
}

// ────────────────────── Conversas do Assistente IA ──────────────────────

export type ConversationSummary = { id: string; title: string; updated_at: string };
export type ConversationDetail = { id: string; title: string; messages: { role: "user" | "assistant"; text: string }[] };

export async function listConversations(): Promise<ConversationSummary[]> {
  const sc = await getSearchClientIfAny();
  if (!sc) return []; // equipe usando a aba interna — não há histórico a mostrar
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_conversations")
    .select("id,title,updated_at")
    .eq("search_client_id", sc.id)
    .order("updated_at", { ascending: false })
    .limit(30);
  return (data ?? []) as ConversationSummary[];
}

export async function getConversation(id: string): Promise<ConversationDetail | null> {
  const sc = await getSearchClientIfAny();
  if (!sc) return null;
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from("ai_conversations")
    .select("id,title")
    .eq("id", id)
    .eq("search_client_id", sc.id)
    .maybeSingle();
  if (!conv) return null;
  const { data: msgs } = await supabase
    .from("ai_messages")
    .select("role,text")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  return { id: conv.id, title: conv.title, messages: (msgs ?? []) as ConversationDetail["messages"] };
}

/**
 * Grava o par pergunta/resposta. Cria a conversa na primeira troca (o título
 * sai da primeira pergunta) e devolve o id para as próximas chamadas.
 * Best-effort: se a gravação falhar, o chat continua funcionando na tela.
 */
export async function appendToConversation(input: {
  conversationId: string | null;
  question: string;
  answer: string;
}): Promise<{ conversationId: string | null }> {
  const sc = await getSearchClientIfAny();
  if (!sc) return { conversationId: null };
  const supabase = await createClient();

  let id = input.conversationId;
  if (!id) {
    const title = input.question.length > 70 ? `${input.question.slice(0, 70).trimEnd()}…` : input.question;
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ office_id: sc.officeId, search_client_id: sc.id, title })
      .select("id")
      .single();
    if (error || !data) return { conversationId: null };
    id = data.id;
  } else {
    await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", id);
  }

  const { error: msgError } = await supabase.from("ai_messages").insert([
    { conversation_id: id, role: "user", text: input.question },
    { conversation_id: id, role: "assistant", text: input.answer },
  ]);
  if (msgError) return { conversationId: input.conversationId };

  return { conversationId: id };
}

export async function deleteConversation(id: string): Promise<{ error?: string }> {
  const sc = await getSearchClientIfAny();
  if (!sc) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("ai_conversations").delete().eq("id", id).eq("search_client_id", sc.id);
  if (error) return { error: "Não foi possível excluir a conversa." };
  return {};
}
