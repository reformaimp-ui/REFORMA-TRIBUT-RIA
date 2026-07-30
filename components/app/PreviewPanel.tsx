"use client";

import { useEffect, useState } from "react";
import { ACCENT } from "@/lib/design";
import { fetchFilteredData, downloadExportXlsx, buildExportSheets, type FilterState } from "@/app/(app)/relatorios/exportar/actions";

export function PreviewPanel({ filters }: { filters: FilterState }) {
  const [data, setData] = useState<{ produtos: any[]; servicos: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFilteredData(filters)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Erro ao carregar dados");
        setLoading(false);
      });
  }, [filters]);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const buf = await downloadExportXlsx(filters);
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const now = new Date().toISOString().slice(0, 10);
      a.download = `relatorios-${now}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e7e3",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
        }}
      >
        <div style={{ fontSize: 12, color: "#8a8d98" }}>Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e7e7e3",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 300,
        }}
      >
        <div style={{ fontSize: 12, color: "#d32f2f" }}>Erro: {error}</div>
      </div>
    );
  }

  if (!data || (data.produtos.length === 0 && data.servicos.length === 0)) {
    return (
      <div
        style={{
          background: "#f7f7f4",
          border: "1px solid #e7e7e3",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 300,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 12, color: "#8a8d98", textAlign: "center" }}>
          Nenhum dado encontrado para os filtros selecionados.
        </div>
      </div>
    );
  }

  const totalRows = data.produtos.length + data.servicos.length;
  const previewRows = Math.min(20, totalRows);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#fff", border: "1px solid #e7e7e3", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid #e7e7e3", background: "#f7f7f4" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4b4e58" }}>
            Preview ({previewRows} de {totalRows} registros)
          </div>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {data.produtos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", marginBottom: 8 }}>
                Produtos (NCM) — {data.produtos.length} registros
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e7e7e3" }}>
                    <th style={{ textAlign: "left", padding: 8, fontWeight: 600, color: "#33363f" }}>NCM</th>
                    <th style={{ textAlign: "left", padding: 8, fontWeight: 600, color: "#33363f" }}>Descrição</th>
                    <th style={{ textAlign: "center", padding: 8, fontWeight: 600, color: "#33363f" }}>CST</th>
                    <th style={{ textAlign: "center", padding: 8, fontWeight: 600, color: "#33363f" }}>Alíq. IBS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.produtos.slice(0, 10).map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #ececea", background: i % 2 === 1 ? "#f7f7f5" : "transparent" }}>
                      <td style={{ padding: 8 }}>{p.ncm}</td>
                      <td style={{ padding: 8 }}>{p.descr || "—"}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>{p.cst || "—"}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>{p.aliq_ibs || "—"}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.produtos.length > 10 && (
                <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 8 }}>+ {data.produtos.length - 10} produtos não exibidos</div>
              )}
            </div>
          )}

          {data.servicos.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8a8d98", marginBottom: 8 }}>
                Serviços (NBS) — {data.servicos.length} registros
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e7e7e3" }}>
                    <th style={{ textAlign: "left", padding: 8, fontWeight: 600, color: "#33363f" }}>NBS</th>
                    <th style={{ textAlign: "left", padding: 8, fontWeight: 600, color: "#33363f" }}>Descrição</th>
                    <th style={{ textAlign: "center", padding: 8, fontWeight: 600, color: "#33363f" }}>Item</th>
                  </tr>
                </thead>
                <tbody>
                  {data.servicos.slice(0, 10).map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #ececea", background: i % 2 === 1 ? "#f7f7f5" : "transparent" }}>
                      <td style={{ padding: 8 }}>{s.nbs}</td>
                      <td style={{ padding: 8 }}>{s.nbs_descr || "—"}</td>
                      <td style={{ padding: 8, textAlign: "center" }}>{s.item || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.servicos.length > 10 && (
                <div style={{ fontSize: 11, color: "#8a8d98", marginTop: 8 }}>+ {data.servicos.length - 10} serviços não exibidos</div>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="hv-light"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "#fff",
          background: ACCENT,
          border: "none",
          borderRadius: 8,
          padding: "10px 16px",
          cursor: exporting ? "wait" : "pointer",
          opacity: exporting ? 0.7 : 1,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" style={{ color: "#fff" }}>
          <path d="M8 2v8M8 10l-3-3M8 10l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {exporting ? "Gerando…" : "Exportar XLSX"}
      </button>
    </div>
  );
}
