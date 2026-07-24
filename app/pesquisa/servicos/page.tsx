import { getSearchClientContext } from "@/lib/searchClient";
import { ServicoSearchPanel } from "./search-panel";

export const dynamic = "force-dynamic";

export default async function PesquisaServicosPage() {
  const { client } = await getSearchClientContext();
  return (
    <div className="stagger" style={{ padding: "40px 40px 60px", width: "100%" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.01em" }}>Olá, {client.name.split(" ")[0]}</div>
      <div style={{ fontSize: 13.5, color: "#8a8d98", marginTop: 6, marginBottom: 28 }}>
        Pesquise pelo NBS, pela descrição NBS ou pela descrição do item para ver a tributação do IBS e do CBS do serviço.
      </div>
      <ServicoSearchPanel />
    </div>
  );
}
