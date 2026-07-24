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

  const { data: sc } = await supabase
    .from("search_clients")
    .select("id,office_id,name,email,active,ai_enabled")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!sc) redirect("/login");

  const { data: office } = await supabase
    .from("offices")
    .select("id,name,accent,ai_search_enabled")
    .eq("id", sc.office_id)
    .single();
  if (!office) redirect("/login");

  return {
    userId: user.id,
    office: office as SearchClientOffice,
    client: { id: sc.id, name: sc.name, email: sc.email, active: sc.active, ai_enabled: sc.ai_enabled },
  };
});
