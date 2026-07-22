import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { canViewTab } from "@/lib/permissions";
import { SettingsForm } from "./settings-form";
import type { SearchClientRow } from "./search-client-panel";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const { member, office } = await getContext();
  if (!canViewTab(member, "configuracoes")) redirect("/dashboard");

  let searchClients: SearchClientRow[] = [];
  if (member.role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase.from("search_clients").select("id,name,email,active").order("created_at");
    searchClients = (data ?? []) as SearchClientRow[];
  }

  return <SettingsForm member={member} office={office} isAdmin={member.role === "admin"} searchClients={searchClients} />;
}
