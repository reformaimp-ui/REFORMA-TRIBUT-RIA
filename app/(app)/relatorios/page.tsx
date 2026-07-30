import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { canViewTab } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function RelatóriosPage() {
  const { member } = await getContext();
  if (member.role !== "admin") redirect("/dashboard");

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Central Admin</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 20 }}>
          Ferramentas de análise e exportação de dados para administradores
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {/* Card: Exportar Relatórios */}
        <a
          href="/relatorios/exportar"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 20,
            background: "#fff",
            border: "1.5px solid #e7e7e3",
            borderRadius: 12,
            cursor: "pointer",
            textDecoration: "none",
            color: "inherit",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#4653d6";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(70, 83, 214, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e7e7e3";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: 24 }}>📊</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Exportar Relatórios</div>
            <div style={{ fontSize: 12, color: "#8a8d98", lineHeight: 1.5 }}>
              Exporte dados de tributação (IBS/CBS) com filtros avançados por CST, cClassTrib, alíquotas e reduções
            </div>
          </div>
        </a>

        {/* Card: Dados de Pesquisa */}
        <a
          href="/relatorios/pesquisa"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 20,
            background: "#fff",
            border: "1.5px solid #e7e7e3",
            borderRadius: 12,
            cursor: "pointer",
            textDecoration: "none",
            color: "inherit",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#4653d6";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(70, 83, 214, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e7e7e3";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: 24 }}>🔍</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Dados de Pesquisa</div>
            <div style={{ fontSize: 12, color: "#8a8d98", lineHeight: 1.5 }}>
              Métricas de uso do portal de Acesso de Pesquisa: buscas de produtos, serviços, lote e IA por cliente
            </div>
          </div>
        </a>

        {/* Card: Auditoria */}
        <a
          href="/relatorios/auditoria"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 20,
            background: "#fff",
            border: "1.5px solid #e7e7e3",
            borderRadius: 12,
            cursor: "pointer",
            textDecoration: "none",
            color: "inherit",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#4653d6";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(70, 83, 214, 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e7e7e3";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div style={{ fontSize: 24 }}>📋</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Auditoria</div>
            <div style={{ fontSize: 12, color: "#8a8d98", lineHeight: 1.5 }}>
              Log de ações: criações, edições e exclusões de dados com timestamp e usuário responsável
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
