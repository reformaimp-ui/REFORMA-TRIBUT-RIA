"use client";

import { useState } from "react";
import { ACCENT } from "@/lib/design";
import { formatCnpjCpf } from "@/lib/nfe/parseNfe";
import { CONSUMIDOR_FINAL_DOC, type PartyAgg, type ProductAgg } from "@/lib/nfe/aggregate";
import { buildBrandedWorkbook, type BrandedSheetSpec, type TableColumn } from "@/lib/xlsxTemplate";

function docLabel(doc: string): string {
  return doc === CONSUMIDOR_FINAL_DOC ? "—" : formatCnpjCpf(doc);
}

const PARTY_COLUMNS: TableColumn[] = [
  { header: "Nome", key: "nome", width: 34 },
  { header: "CNPJ/CPF", key: "doc", width: 20 },
  { header: "UF", key: "uf", width: 8, align: "center" },
  { header: "Notas", key: "notas", width: 9, align: "right" },
  { header: "Valor total (R$)", key: "valor", width: 16, numFmt: "#,##0.00", align: "right" },
  { header: "IBS/CBS", key: "ibscbs", width: 10, align: "center" },
];

const PRODUCT_COLUMNS: TableColumn[] = [
  { header: "Produto", key: "nome", width: 40 },
  { header: "CFOP", key: "cfop", width: 10, align: "center" },
  { header: "Natureza da operação", key: "natOp", width: 24 },
  { header: "Quantidade", key: "count", width: 12, align: "right" },
  { header: "Valor total (R$)", key: "valor", width: 16, numFmt: "#,##0.00", align: "right" },
];

function partyRows(rows: PartyAgg[]): Record<string, string | number>[] {
  return rows.map((r) => ({
    nome: r.nome || "—",
    doc: docLabel(r.doc),
    uf: r.uf || "—",
    notas: r.count,
    valor: r.total,
    ibscbs: r.temIbsCbs ? "Sim" : "Não",
  }));
}

function productRows(rows: ProductAgg[]): Record<string, string | number>[] {
  return rows.map((r) => ({
    nome: r.nome || "—",
    cfop: r.cfop || "—",
    natOp: r.natOp || "—",
    count: r.count,
    valor: r.total,
  }));
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
  produtosComprados,
  produtosVendidos,
}: {
  empresaNome: string;
  empresaCnpj: string | null;
  fornecedores: PartyAgg[];
  clientes: PartyAgg[];
  totalCompras: number;
  totalVendas: number;
  produtosComprados: ProductAgg[];
  produtosVendidos: ProductAgg[];
}) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const cnpjLabel = empresaCnpj ? formatCnpjCpf(empresaCnpj) : "—";
      const totalProdutosComprados = produtosComprados.reduce((s, p) => s + p.total, 0);
      const totalProdutosVendidos = produtosVendidos.reduce((s, p) => s + p.total, 0);

      const sheets: BrandedSheetSpec[] = [
        {
          sheetName: "Fornecedores",
          summary: [
            { label: "Empresa", value: empresaNome },
            { label: "CNPJ", value: cnpjLabel },
            { label: "Fornecedores", value: fornecedores.length },
            { label: "Total comprado (R$)", value: totalCompras, numFmt: "#,##0.00" },
          ],
          columns: PARTY_COLUMNS,
          rows: partyRows(fornecedores),
        },
        {
          sheetName: "Clientes",
          summary: [
            { label: "Empresa", value: empresaNome },
            { label: "CNPJ", value: cnpjLabel },
            { label: "Clientes", value: clientes.length },
            { label: "Total vendido (R$)", value: totalVendas, numFmt: "#,##0.00" },
          ],
          columns: PARTY_COLUMNS,
          rows: partyRows(clientes),
        },
        {
          sheetName: "Produtos Comprados",
          summary: [
            { label: "Empresa", value: empresaNome },
            { label: "CNPJ", value: cnpjLabel },
            { label: "Produtos", value: produtosComprados.length },
            { label: "Total comprado (R$)", value: totalProdutosComprados, numFmt: "#,##0.00" },
          ],
          columns: PRODUCT_COLUMNS,
          rows: productRows(produtosComprados),
        },
        {
          sheetName: "Produtos Vendidos",
          summary: [
            { label: "Empresa", value: empresaNome },
            { label: "CNPJ", value: cnpjLabel },
            { label: "Produtos", value: produtosVendidos.length },
            { label: "Total vendido (R$)", value: totalProdutosVendidos, numFmt: "#,##0.00" },
          ],
          columns: PRODUCT_COLUMNS,
          rows: productRows(produtosVendidos),
        },
      ];

      const buf = await buildBrandedWorkbook(sheets);
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
