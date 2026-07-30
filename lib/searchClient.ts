import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SearchClient = { id: string; name: string; email: string; active: boolean; ai_enabled: boolean };
export type SearchClientOffice = { id: string; name: string; accent: string; ai_search_enabled: boolean };
export type SearchClientContext = {
  userId: string;
  office: SearchClientOffice;
  client: SearchClient;
};

/**
 * Contexto do cliente de pesquisa (portal público de tributação) — conta
 * separada de `members`, então não usa getContext(). Cacheado por request
 * como getContext(), para layout + página não repetirem a consulta.
 */
export const getSearchClientContext = cache(async (): Promise<SearchClientContext> => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) redirect("/login");

  // Embute offices na mesma consulta (join via FK) em vez de 2 round-trips
  // sequenciais — a troca de aba no portal depende dessa consulta a cada
  // navegação, então cada round-trip a menos conta para a percepção de velocidade.
  const { data: sc } = await supabase
    .from("search_clients")
    .select("id,office_id,name,email,active,ai_enabled,offices(id,name,accent,ai_search_enabled)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sc) redirect("/login");

  const office = sc.offices as unknown as SearchClientOffice | null;
  if (!office) redirect("/login");

  // Best-effort: marca o acesso para a métrica "último acesso" em Dados de
  // Pesquisa — não bloqueia nem falha o contexto se a escrita não completar.
  void supabase.from("search_clients").update({ last_active_at: new Date().toISOString() }).eq("id", sc.id);

  return {
    userId: user.id,
    office,
    client: { id: sc.id, name: sc.name, email: sc.email, active: sc.active, ai_enabled: sc.ai_enabled },
  };
});

/**
 * Igual a getSearchClientContext(), mas nunca redireciona — retorna null
 * quando o usuário autenticado não é um cliente de pesquisa. Usado por
 * askTaxAssistant(), que é chamado tanto pelo portal de pesquisa quanto pela
 * aba interna "Assistente IA" (equipe), para saber se deve logar o uso em
 * search_events sem arriscar redirecionar um membro da equipe para /login.
 */
export async function getSearchClientIfAny(): Promise<{ id: string; officeId: string } | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data: sc } = await supabase.from("search_clients").select("id,office_id").eq("user_id", user.id).maybeSingle();
  if (!sc) return null;
  return { id: sc.id, officeId: sc.office_id };
}
