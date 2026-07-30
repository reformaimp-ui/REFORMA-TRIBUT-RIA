import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { ACCENT } from "@/lib/design";
import { fetchSearchMetrics } from "./actions";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const KPI_CARD: React.CSSProperties = { background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 6 };

export default async function DadosPesquisaPage() {
  const { member } = await getContext();
  if (member.role !== "admin") redirect("/dashboard");

  const { totals, rows } = await fetchSearchMetrics();

  return (
    <div className="stagger" style={{ padding: "20px 22px", height: "100%", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Dados de Pesquisa</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98" }}>Métricas de uso do portal de Acesso de Pesquisa pelos clientes</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        <div style={KPI_CARD}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em" }}>Pesquisa de produtos</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>{totals.produto}</div>
        </div>
        <div style={KPI_CARD}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em" }}>Pesquisa de serviços</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>{totals.servico}</div>
        </div>
        <div style={KPI_CARD}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em" }}>Pesquisa em lote</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-jetbrains)" }}>{totals.lote}</div>
        </div>
        <div style={KPI_CARD}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8a8d98", textTransform: "uppercase", letterSpacing: ".06em" }}>Uso da IA</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-jetbrains)", color: ACCENT }}>{totals.ia}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Por cliente de pesquisa</div>
        <div style={{ fontSize: 11.5, color: "#8a8d98", marginBottom: 10 }}>Contagens desde o início do registro de métricas (limitado aos 5.000 eventos mais recentes)</div>

        {rows.length === 0 ? (
          <div style={{ background: "#f7f7f4", border: "1px solid #e7e7e3", borderRadius: 12, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#8a8d98" }}>Nenhum cliente de pesquisa cadastrado ainda.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e7e7e3", background: "#f7f7f4" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Cliente</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Status</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Produtos</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Serviços</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Lote</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>IA</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#33363f" }}>Último acesso</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #ececea", background: i % 2 === 1 ? "#fbfbfa" : "transparent" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 10.5, color: "#8a8d98" }}>{r.email}</div>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: r.active ? "#e8f5f0" : "#f4f4f2", color: r.active ? "#0e7a6f" : "#8a8d98",
                        }}
                      >
                        {r.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-jetbrains)" }}>{r.produtos}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-jetbrains)" }}>{r.servicos}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-jetbrains)" }}>{r.lote}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-jetbrains)", color: r.ai_enabled ? ACCENT : "#c2c3c9" }}>{r.ia}</td>
                    <td style={{ padding: "10px 12px", color: "#4b4e58", fontSize: 11 }}>{formatDateTime(r.last_active_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
