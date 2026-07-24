import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { SearchClientPanel, type SearchClientRow } from "./search-client-panel";

export const dynamic = "force-dynamic";

export default async function AcessoPesquisaPage() {
  const { member, office } = await getContext();
  if (member.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase.from("search_clients").select("id,name,email,active,ai_enabled").order("created_at");
  const searchClients = (data ?? []) as SearchClientRow[];

  return (
    <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Acessos</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginTop: 2 }}>Acesso de pesquisa para clientes</div>
      </div>
      <SearchClientPanel clients={searchClients} officeAiEnabled={office.ai_search_enabled} />
    </div>
  );
}
