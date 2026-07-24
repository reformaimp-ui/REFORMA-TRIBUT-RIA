import { getSearchClientContext } from "@/lib/searchClient";
import { PortalSidebar } from "@/components/portal/PortalSidebar";

export default async function PesquisaLayout({ children }: { children: React.ReactNode }) {
  const { office, client } = await getSearchClientContext();

  if (!client.active) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "#fafaf8" }}>
        <div style={{ maxWidth: 380 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Acesso desativado</div>
          <div style={{ fontSize: 13.5, color: "#8a8d98", lineHeight: 1.6 }}>
            Seu acesso à pesquisa de tributação foi desativado por {office.name}. Entre em contato com o escritório para reativar.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <PortalSidebar officeName={office.name} clientName={client.name} aiEnabled={office.ai_search_enabled && client.ai_enabled} />
      <main style={{ flex: 1, overflow: "auto", background: "#fafaf8" }}>{children}</main>
    </div>
  );
}
