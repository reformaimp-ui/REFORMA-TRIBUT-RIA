import { redirect } from "next/navigation";
import { getSearchClientContext } from "@/lib/searchClient";
import { TaxAiChat } from "@/components/ai/TaxAiChat";

export const dynamic = "force-dynamic";

export default async function PesquisaAssistentePage() {
  const { office, client } = await getSearchClientContext();
  if (!office.ai_search_enabled || !client.ai_enabled) redirect("/pesquisa");

  return (
    <div style={{ padding: "40px 40px 60px", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.01em" }}>Assistente IA</div>
      <div style={{ fontSize: 13.5, color: "#8a8d98", marginTop: 6, marginBottom: 28 }}>
        Descreva o produto ou serviço para descobrir o NCM ou NBS provável e a tributação estimada de IBS e CBS.
      </div>
      <TaxAiChat />
    </div>
  );
}
