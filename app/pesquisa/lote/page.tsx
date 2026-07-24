import { BatchPanel } from "./batch-panel";

export const dynamic = "force-dynamic";

export default function PesquisaLotePage() {
  return (
    <div style={{ padding: "40px 40px 60px", width: "100%" }}>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.01em" }}>Pesquisa em lote</div>
      <div style={{ fontSize: 13.5, color: "#8a8d98", marginTop: 6, marginBottom: 28 }}>
        Cole vários códigos NCM (um por linha) para ver a tributação de todos de uma vez.
      </div>
      <BatchPanel />
    </div>
  );
}
