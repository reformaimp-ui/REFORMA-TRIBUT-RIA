"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";
import { CONSUMIDOR_FINAL_DOC, type PartyAgg } from "@/lib/nfe/aggregate";

function docLabel(doc: string): string {
  return doc === CONSUMIDOR_FINAL_DOC ? "—" : formatCnpjCpf(doc);
}

function partyRows(rows: PartyAgg[]): (string | number)[][] {
  return rows.map((r) => [r.nome || "—", docLabel(r.doc), r.uf || "—", r.count, r.total, r.temIbsCbs ? "Sim" : "Não"]);
}

/**
 * Só faz sentido na página de detalhe de uma empresa (não na listagem) —
 * é aqui que já temos os fornecedores/clientes agregados e prontos.
 */
export function EmpresaExportButton({
  empresaNome,
  empresaCnpj,
  fornecedores,
  clientes,
  totalCompras,
  totalVendas,
}: {
  empresaNome: string;
  empresaCnpj: string | null;
  fornecedores: PartyAgg[];
  clientes: PartyAgg[];
  totalCompras: number;
  totalVendas: number;
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.utils.book_new();

      const resumo = XLSX.utils.aoa_to_sheet([
        ["Empresa", empresaNome],
        ["CNPJ", empresaCnpj ? formatCnpjCpf(empresaCnpj) : "—"],
        ["Notas importadas", fornecedores.reduce((s, f) => s + f.count, 0) + clientes.reduce((s, c) => s + c.count, 0)],
        ["Total comprado (R$)", totalCompras],
        ["Total vendido (R$)", totalVendas],
        ["Fornecedores", fornecedores.length],
        ["Clientes", clientes.length],
      ]);
      XLSX.utils.book_append_sheet(wb, resumo, "Empresa");

      const header = ["Nome", "CNPJ/CPF", "UF", "Notas", "Valor total (R$)", "IBS/CBS"];
      const fornSheet = XLSX.utils.aoa_to_sheet([header, ...partyRows(fornecedores)]);
      XLSX.utils.book_append_sheet(wb, fornSheet, "Fornecedores");

      const cliSheet = XLSX.utils.aoa_to_sheet([header, ...partyRows(clientes)]);
      XLSX.utils.book_append_sheet(wb, cliSheet, "Clientes");

      const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = empresaNome.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      a.download = `analise-${slug || "empresa"}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="hv-light"
      style={{
        marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600,
        color: "#4b4e58", background: "#fff", border: "1.5px solid #e2e2de", borderRadius: 8, padding: "7px 12px",
        cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" style={{ color: ACCENT }}>
        <path d="M8 2v8M8 10l-3-3M8 10l3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {busy ? "Gerando…" : "Baixar XLSX"}
    </button>
  );
}
